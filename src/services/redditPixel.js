import { isAdvertisingAllowed, readConsentPreferences } from './consentPreferences.js';
import { runtimeEnvironment } from '../config/runtimeEnvironment.js';

const REDDIT_SCRIPT_ORIGIN = 'https://www.redditstatic.com';
const REDDIT_SCRIPT_PATH = '/ads/pixel.js';
const DEBUG_KEY = '__SAGESET_REDDIT_PIXEL_EVENTS__';
const CONVERSION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const PUBLIC_MARKETING_PATHS = new Set([
  '/', '/signup', '/login', '/fitness-ai-coach', '/workout-plans', '/weight-loss',
  '/muscle-building', '/nutrition', '/fitness-challenges', '/features', '/pricing',
  '/download', '/ar-squats', '/testimonials', '/before-after', '/faq',
  '/supported-devices', '/blog', '/privacy', '/terms', '/support', '/contact',
]);

let initializedPixelId = '';
let lastPageView = '';

function configuration(value) {
  return value || runtimeEnvironment.reddit || { enabled: false, pixelId: '', testMode: false };
}

function allowedConsent(consent) {
  return isAdvertisingAllowed(consent || readConsentPreferences());
}

export function isApprovedRedditPixelPath(pathname = globalThis.window?.location?.pathname || '') {
  return PUBLIC_MARKETING_PATHS.has(pathname);
}

export function isRedditPixelEnabled(value) {
  const config = configuration(value);
  return config.enabled === true && /^[A-Za-z0-9_-]{5,100}$/.test(config.pixelId || '');
}

export function createRedditConversionId(prefix = 'reddit') {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random values are unavailable.');
  const normalized = String(prefix || 'reddit').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'reddit';
  if (typeof cryptoApi.randomUUID === 'function') return `${normalized}:${cryptoApi.randomUUID()}`;
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${normalized}:${hex}`;
}

export function initRedditPixel({ consent, pathname, config } = {}) {
  const resolved = configuration(config);
  if (!isRedditPixelEnabled(resolved) || !allowedConsent(consent) || typeof window === 'undefined') {
    return { initialized: false, reason: 'disabled_or_denied' };
  }
  if (!isApprovedRedditPixelPath(pathname ?? window.location.pathname)) {
    return { initialized: false, reason: 'route_not_approved' };
  }
  if (initializedPixelId) {
    return initializedPixelId === resolved.pixelId
      ? { initialized: true, duplicate: true }
      : { initialized: false, reason: 'pixel_identity_locked' };
  }

  if (!window.rdt) {
    const queue = function (...args) {
      if (queue.sendEvent) queue.sendEvent(...args);
      else queue.callQueue.push(args);
    };
    queue.callQueue = [];
    window.rdt = queue;
    const script = document.createElement('script');
    script.async = true;
    script.src = `${REDDIT_SCRIPT_ORIGIN}${REDDIT_SCRIPT_PATH}?pixel_id=${encodeURIComponent(resolved.pixelId)}`;
    script.dataset.sagesetProvider = 'reddit';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }
  window.rdt('init', resolved.pixelId);
  initializedPixelId = resolved.pixelId;
  record('init', 'RedditPixel');
  return { initialized: true };
}

export function trackRedditPageVisit({ consent, pathname, search, config, conversionId } = {}) {
  const path = pathname ?? globalThis.window?.location?.pathname ?? '';
  const query = search ?? globalThis.window?.location?.search ?? '';
  if (!isApprovedRedditPixelPath(path)) return { sent: false, reason: 'route_not_approved' };
  const init = initRedditPixel({ consent, pathname: path, config });
  if (!init.initialized || typeof window.rdt !== 'function') return { sent: false, reason: init.reason || 'pixel_unavailable' };
  const routeKey = `${path}${query}`;
  if (routeKey === lastPageView) return { sent: false, reason: 'duplicate_suppressed' };
  const id = validConversionId(conversionId) || createRedditConversionId('page');
  window.rdt('track', 'PageVisit', { conversionId: id });
  lastPageView = routeKey;
  record('track', 'PageVisit', { conversionId: id });
  return { sent: true, conversionId: id };
}

export function trackRedditSignUp({ conversionId, consent, config } = {}) {
  const init = initRedditPixel({ consent, pathname: '/signup', config });
  const id = validConversionId(conversionId);
  if (!init.initialized || !id || typeof window.rdt !== 'function') {
    return { sent: false, reason: !id ? 'invalid_conversion_id' : init.reason || 'pixel_unavailable' };
  }
  window.rdt('track', 'SignUp', { conversionId: id });
  record('track', 'SignUp', { conversionId: id });
  return { sent: true, conversionId: id };
}

function validConversionId(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return CONVERSION_ID.test(normalized) ? normalized : '';
}

function record(kind, name, metadata = {}) {
  if (typeof window === 'undefined') return;
  window[DEBUG_KEY] = [...(window[DEBUG_KEY] || []), { kind, name, metadata }].slice(-50);
}

export function resetRedditPixelForTests() {
  initializedPixelId = '';
  lastPageView = '';
}
