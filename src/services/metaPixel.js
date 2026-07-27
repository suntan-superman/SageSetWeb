import { getToken as getAppCheckToken } from 'firebase/app-check';
import { appCheck, auth } from '../config/firebase.js';
import { trackWorksideEvent } from './worksideAnalytics.js';

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const CAPI_ENDPOINT = (
  import.meta.env.VITE_META_CAPI_ENDPOINT ||
  'https://us-central1-greencheck-d3d88.cloudfunctions.net/sendMetaConversion'
).replace(/\/$/, '');
const PIXEL_DEBUG_KEY = '__SAGESET_META_PIXEL_EVENTS__';
const CONSENT_STORAGE_KEY = 'sageset.marketingConsent.v1';
const META_REQUEST_TIMEOUT_MS = 4_000;
const CONFIGURED_TEST_EVENT_CODE = import.meta.env.VITE_META_TEST_EVENT_CODE || 'TEST50341';

let initialized = false;
let lastPageViewPath = '';
const firedDedupeKeys = new Map();

export function isMetaPixelEnabled() {
  return Boolean(PIXEL_ID);
}

export function getMetaMarketingConsent(consent) {
  if (typeof consent === 'function') return Boolean(consent());
  if (typeof consent === 'boolean') return consent;
  if (typeof window === 'undefined') return false;
  if (window.navigator?.globalPrivacyControl === true) return false;
  let stored = null;
  try {
    stored = window.localStorage?.getItem(CONSENT_STORAGE_KEY);
  } catch {
    stored = null;
  }
  if (stored === 'denied') return false;
  if (stored === 'granted') return true;

  // Preserve the site's existing configured-Pixel behavior until a consent
  // banner is introduced. Explicit opt-out and GPC always win, and the exact
  // same decision gates both the Pixel and its CAPI copy.
  return true;
}

export function setMetaMarketingConsent(granted) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied');
  } catch {
    // Storage may be unavailable in hardened/private browsing contexts.
  }
}

export function createMetaEventId(prefix = 'evt') {
  const normalizedPrefix = String(prefix || 'evt').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'evt';
  return `${normalizedPrefix}_${createUuidV4()}`;
}

function createUuidV4() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random values are unavailable.');
  if (typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export function initMetaPixel(consent) {
  if (!PIXEL_ID || initialized || typeof window === 'undefined' || !getMetaMarketingConsent(consent)) return;

  /* eslint-disable */
  !(function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  recordPixelDebugEvent('init', PIXEL_ID);
  initialized = true;
}

export function trackPageView({ consent } = {}) {
  if (!getMetaMarketingConsent(consent)) return;
  initMetaPixel(consent);
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (currentPath === lastPageViewPath) return;
  lastPageViewPath = currentPath;
  const parameters = getPixelEventParameters({});
  const eventOptions = getPixelEventOptions();
  window.fbq('track', 'PageView', parameters, eventOptions);
  recordPixelDebugEvent('track', 'PageView', parameters, eventOptions);
}

export function trackEvent(name, parameters = {}, options = {}) {
  if (name === 'ViewContent') {
    return trackMetaEvent({
      eventName: name,
      pixelParameters: parameters,
      consent: options.consent,
      dedupeKey: options.dedupeKey,
      serverPayload: options.serverPayload,
    });
  }
  if (!getMetaMarketingConsent(options.consent)) return;
  initMetaPixel(options.consent);
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const eventParameters = getPixelEventParameters(parameters);
  const eventOptions = getPixelEventOptions();
  window.fbq('track', name, eventParameters, eventOptions);
  recordPixelDebugEvent('track', name, eventParameters, eventOptions);
}

export function trackCustomEvent(name, parameters = {}, options = {}) {
  if (!getMetaMarketingConsent(options.consent)) return;
  initMetaPixel(options.consent);
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const eventParameters = getPixelEventParameters(parameters);
  const eventOptions = getPixelEventOptions();
  window.fbq('trackCustom', name, eventParameters, eventOptions);
  recordPixelDebugEvent('trackCustom', name, eventParameters, eventOptions);
}

export function trackMetaEvent({
  eventName,
  eventId,
  pixelParameters = {},
  serverPayload = {},
  consent,
  dedupeKey,
}) {
  if (eventName !== 'ViewContent') return { sent: false, reason: 'event_not_enabled' };
  if (!PIXEL_ID) return { sent: false, reason: 'pixel_disabled' };
  if (!getMetaMarketingConsent(consent)) return { sent: false, reason: 'consent_denied' };
  const now = Date.now();
  if (dedupeKey && now - Number(firedDedupeKeys.get(dedupeKey) || 0) < 2_000) {
    return { sent: false, reason: 'duplicate_suppressed' };
  }
  if (dedupeKey) {
    firedDedupeKeys.set(dedupeKey, now);
    if (firedDedupeKeys.size > 100) {
      for (const [key, firedAt] of firedDedupeKeys) {
        if (now - firedAt >= 2_000) firedDedupeKeys.delete(key);
      }
    }
  }

  initMetaPixel(consent);
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    if (dedupeKey) firedDedupeKeys.delete(dedupeKey);
    return { sent: false, reason: 'pixel_unavailable' };
  }

  let sharedEventId;
  try {
    sharedEventId = /^vc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId || '') ?
      eventId :
      createMetaEventId('vc');
  } catch {
    if (dedupeKey) firedDedupeKeys.delete(dedupeKey);
    return { sent: false, reason: 'secure_random_unavailable' };
  }
  const eventParameters = getPixelEventParameters({
    content_name: safeText(pixelParameters.content_name, 200, 'SageSet'),
    content_category: safeText(pixelParameters.content_category, 100, 'fitness_software'),
  });
  const eventOptions = {
    ...getPixelEventOptions(),
    eventID: sharedEventId,
  };
  window.fbq('track', eventName, eventParameters, eventOptions);
  recordPixelDebugEvent('track', eventName, eventParameters, eventOptions);

  const worksideEventId = sharedEventId.slice(3);
  void trackWorksideEvent('meta_browser_event', {
    metaEventId: sharedEventId,
    metaEventName: eventName,
    deliveryStatus: 'pixel_sent',
  }, { eventId: worksideEventId });

  const capiPromise = sendMetaConversion({
    eventName,
    eventId: sharedEventId,
    eventTime: Number.isInteger(serverPayload.eventTime) ?
      serverPayload.eventTime :
      Math.floor(Date.now() / 1000),
    eventSourceUrl: serverPayload.eventSourceUrl || safePageUrl(),
    pixelParameters: {
      content_name: eventParameters.content_name,
      content_category: eventParameters.content_category,
    },
    userData: readMetaCookies(),
  });
  return { sent: true, eventId: sharedEventId, capiPromise };
}

async function sendMetaConversion(payload) {
  if (!appCheck) {
    safeDevelopmentDiagnostic('CAPI skipped because Firebase App Check is not configured.');
    return { sent: false, reason: 'app_check_unavailable' };
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), META_REQUEST_TIMEOUT_MS);
  try {
    const [appCheckResult, authToken] = await Promise.all([
      getAppCheckToken(appCheck, false),
      auth.currentUser ? auth.currentUser.getIdToken().catch(() => null) : Promise.resolve(null),
    ]);
    const response = await fetch(CAPI_ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': appCheckResult.token,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      safeDevelopmentDiagnostic(`CAPI delivery returned HTTP ${response.status}.`);
      return { sent: false, status: response.status };
    }
    return { sent: true, status: response.status };
  } catch (error) {
    safeDevelopmentDiagnostic(`CAPI delivery did not complete (${error?.name || 'request_error'}).`);
    return { sent: false, reason: error?.name === 'AbortError' ? 'timeout' : 'request_error' };
  } finally {
    window.clearTimeout(timeout);
  }
}

function safePageUrl() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

function safeText(value, maximum, fallback) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized.slice(0, maximum) : fallback;
}

function readMetaCookies() {
  if (typeof document === 'undefined') return {};
  const cookies = Object.fromEntries(document.cookie.split(';').map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [part.trim(), ''];
    const rawValue = part.slice(separator + 1).trim();
    try {
      return [part.slice(0, separator).trim(), decodeURIComponent(rawValue)];
    } catch {
      return [part.slice(0, separator).trim(), ''];
    }
  }));
  return {
    ...(isValidMetaCookie(cookies._fbp, 'fbp') ? { fbp: cookies._fbp } : {}),
    ...(isValidMetaCookie(cookies._fbc, 'fbc') ? { fbc: cookies._fbc } : {}),
  };
}

function isValidMetaCookie(value, type) {
  if (typeof value !== 'string' || value.length > 500) return false;
  return type === 'fbp' ?
    /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/.test(value) :
    /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/.test(value);
}

function getPixelEventParameters(parameters = {}) {
  const testEventCode = getDevelopmentTestEventCode();
  return testEventCode ? { ...parameters, test_event_code: testEventCode } : parameters;
}

function getPixelEventOptions() {
  const testEventCode = getDevelopmentTestEventCode();
  return testEventCode ? { test_event_code: testEventCode } : {};
}

function getDevelopmentTestEventCode() {
  if (CONFIGURED_TEST_EVENT_CODE) return CONFIGURED_TEST_EVENT_CODE;
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('test_event_code') || '';
}

function safeDevelopmentDiagnostic(message) {
  if (import.meta.env.DEV) console.debug(`[Meta] ${message}`);
}

function recordPixelDebugEvent(kind, name, parameters = {}, options = undefined) {
  if (typeof window === 'undefined') return;
  window[PIXEL_DEBUG_KEY] = window[PIXEL_DEBUG_KEY] || [];
  window[PIXEL_DEBUG_KEY].push({
    kind,
    name,
    parameters,
    options,
    timestamp: new Date().toISOString(),
  });
  window[PIXEL_DEBUG_KEY] = window[PIXEL_DEBUG_KEY].slice(-50);
}
