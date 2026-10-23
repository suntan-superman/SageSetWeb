// Workside Analytics browser contract v1. Keep this aligned with
// Workside-Analytics-Dashboard/packages/analytics-client.
import { getToken as getAppCheckToken } from 'firebase/app-check';
import { appCheck, auth } from '../config/firebase.js';
import { getAdvertisingAttributionSnapshot } from './advertisingAttribution.js';
import { isAnalyticsAllowed, readConsentPreferences } from './consentPreferences.js';
import { runtimeEnvironment } from '../config/runtimeEnvironment.js';

const ENDPOINT = (runtimeEnvironment.isStaging ?
  runtimeEnvironment.workside.endpoint :
  (import.meta.env.VITE_WORKSIDE_ANALYTICS_URL || 'https://workside-analytics-staging.web.app')).replace(/\/$/, '');
const ENVIRONMENT = runtimeEnvironment.isStaging ?
  runtimeEnvironment.workside.environment :
  (import.meta.env.VITE_WORKSIDE_ANALYTICS_ENVIRONMENT || 'staging');
const SESSION_KEY = 'sageset.analytics.session.v1';
const QUEUE_KEY = 'sageset.analytics.queue.v1';
const MAX_QUEUE_SIZE = 100;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const browserLocation = globalThis.window?.location;
const IS_LOCAL_DEVELOPMENT =
  browserLocation?.hostname === 'localhost' || browserLocation?.hostname === '127.0.0.1';
const IS_META_RELEASE_CHECK =
  new URLSearchParams(browserLocation?.search || '').get('release_check') === 'meta';

const createId = () => crypto.randomUUID();
const safeParse = (value, fallback) => {
  try { return JSON.parse(value ?? '') ?? fallback; }
  catch { return fallback; }
};
const safePage = () => browserLocation ? `${browserLocation.origin}${browserLocation.pathname}` : '';

function getStableId(storage, key) {
  let value = storage.getItem(key);
  if (!value) {
    value = createId();
    storage.setItem(key, value);
  }
  return value;
}

const localStore = globalThis.window?.localStorage;
const sessionStore = globalThis.window?.sessionStorage;
const sessionId = sessionStore ? getStableId(sessionStore, SESSION_KEY) : null;

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
  const consent = readConsentPreferences();
  if (!isAnalyticsAllowed(consent)) {
    return { suppressed: true, reason: 'analytics_consent_not_granted' };
  }
  const attribution = getAdvertisingAttributionSnapshot({ storage: localStore, consent });
  const event = {
    eventId: options.eventId || createId(),
    eventName,
    productId: 'sageset',
    occurredAt: options.occurredAt || new Date().toISOString(),
    anonymousId: attribution.anonymousId,
    userId: auth.currentUser?.uid || null,
    sessionId,
    platform: 'web',
    environment: ENVIRONMENT,
    source: 'web',
    page: options.page || safePage(),
    screen: null,
    properties,
    attribution: {
      firstTouch: attribution.firstTouch,
      latestTouch: attribution.latestTouch,
      consent: attribution.consent,
    },
    appVersion: import.meta.env.VITE_APP_VERSION || null,
    schemaVersion: 2,
  };
  // Local release checks should validate the site without polluting staging
  // analytics or depending on a cross-origin collector. Production behavior is
  // unchanged, including queued retry delivery.
  if (IS_LOCAL_DEVELOPMENT || IS_META_RELEASE_CHECK) {
    return {
      suppressed: true,
      reason: IS_LOCAL_DEVELOPMENT ? 'local_development' : 'meta_release_check',
      eventId: event.eventId,
    };
  }
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
  if (IS_LOCAL_DEVELOPMENT || IS_META_RELEASE_CHECK) {
    return { sent: 0, remaining: 0, suppressed: true };
  }
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
