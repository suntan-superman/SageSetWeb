// Workside Analytics browser contract v1. Keep this aligned with
// Workside-Analytics-Dashboard/packages/analytics-client.
import { getToken as getAppCheckToken } from 'firebase/app-check';
import { appCheck, auth } from '../config/firebase.js';

const ENDPOINT = (import.meta.env.VITE_WORKSIDE_ANALYTICS_URL || 'https://workside-analytics-staging.web.app').replace(/\/$/, '');
const ENVIRONMENT = import.meta.env.VITE_WORKSIDE_ANALYTICS_ENVIRONMENT || 'staging';
const VISITOR_KEY = 'sageset.analytics.visitor.v1';
const SESSION_KEY = 'sageset.analytics.session.v1';
const ATTRIBUTION_KEY = 'sageset.analytics.attribution.v1';
const QUEUE_KEY = 'sageset.analytics.queue.v1';
const MAX_QUEUE_SIZE = 100;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const createId = () => crypto.randomUUID();
const safeParse = (value, fallback) => {
  try { return JSON.parse(value ?? '') ?? fallback; }
  catch { return fallback; }
};
const safePage = () => `${window.location.origin}${window.location.pathname}`;

function getStableId(storage, key) {
  let value = storage.getItem(key);
  if (!value) {
    value = createId();
    storage.setItem(key, value);
  }
  return value;
}

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const incoming = {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmContent: params.get('utm_content'),
    utmTerm: params.get('utm_term'),
    metaClickId: params.get('fbclid'),
    referrer: document.referrer || null,
    landingPage: safePage(),
  };
  const compact = Object.fromEntries(Object.entries(incoming).filter(([, value]) => value));
  const hasCampaign = Object.keys(compact).some((key) => key.startsWith('utm') || key === 'metaClickId');
  const existing = safeParse(localStorage.getItem(ATTRIBUTION_KEY), {});
  const next = {
    firstTouch: existing.firstTouch || (hasCampaign ? compact : null),
    latestTouch: hasCampaign ? compact : existing.latestTouch || null,
  };
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  return next;
}

const visitorId = getStableId(localStorage, VISITOR_KEY);
const sessionId = getStableId(sessionStorage, SESSION_KEY);
const attribution = captureAttribution();

function readQueue() {
  const now = Date.now();
  const parsed = safeParse(localStorage.getItem(QUEUE_KEY), []);
  return Array.isArray(parsed) ? parsed.filter((item) => item?.event?.eventId && now - item.createdAt <= MAX_AGE_MS) : [];
}

function writeQueue(queue) {
  const unique = [...new Map(queue.map((item) => [item.event.eventId, item])).values()].slice(-MAX_QUEUE_SIZE);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(unique));
}

async function send(event) {
  const token = await auth.currentUser?.getIdToken();
  let appCheckToken = null;
  if (!token && appCheck) {
    try {
      appCheckToken = (await getAppCheckToken(appCheck, false)).token;
    } catch {
      appCheckToken = null;
    }
  }
  const response = await fetch(`${ENDPOINT}/api/events`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {}),
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error(`analytics_http_${response.status}`);
  return response.json();
}

export async function trackWorksideEvent(eventName, properties = {}, options = {}) {
  const event = {
    eventId: options.eventId || createId(),
    eventName,
    productId: 'sageset',
    occurredAt: options.occurredAt || new Date().toISOString(),
    anonymousId: visitorId,
    userId: auth.currentUser?.uid || null,
    sessionId,
    platform: 'web',
    environment: ENVIRONMENT,
    source: 'web',
    page: options.page || safePage(),
    screen: null,
    properties,
    attribution: attribution.latestTouch || attribution.firstTouch || {},
    appVersion: import.meta.env.VITE_APP_VERSION || null,
    schemaVersion: 1,
  };
  try {
    return await send(event);
  } catch {
    const queue = readQueue();
    queue.push({ event, attempts: 0, createdAt: Date.now(), nextAttemptAt: Date.now() + 1000 });
    writeQueue(queue);
    return { queued: true, eventId: event.eventId };
  }
}

export async function flushWorksideEvents() {
  if (!auth.currentUser && !appCheck) return { sent: 0, remaining: readQueue().length };
  const now = Date.now();
  const remaining = [];
  let sent = 0;
  for (const item of readQueue()) {
    if (item.nextAttemptAt > now) {
      remaining.push(item);
      continue;
    }
    try {
      await send(item.event);
      sent += 1;
    } catch {
      const attempts = Number(item.attempts || 0) + 1;
      if (attempts < MAX_ATTEMPTS) remaining.push({ ...item, attempts, nextAttemptAt: now + Math.min(60_000, 1000 * (2 ** attempts)) });
    }
  }
  writeQueue(remaining);
  return { sent, remaining: remaining.length };
}
