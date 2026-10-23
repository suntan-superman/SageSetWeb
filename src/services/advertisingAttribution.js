import { readConsentPreferences, isAdvertisingAllowed } from './consentPreferences.js';

export const VISITOR_KEY = 'sageset.analytics.visitor.v1';
export const ATTRIBUTION_KEY = 'sageset.analytics.attribution.v2';
const MAX_IDENTIFIER_LENGTH = 500;
const MAX_TEXT_LENGTH = 300;
const PAID_PROVIDERS = new Set(['meta', 'reddit', 'google']);
let memoryAnonymousId = null;

function safeParse(value, fallback = null) {
  try { return JSON.parse(value || '') ?? fallback; } catch { return fallback; }
}

function safeStorage(storage) {
  if (storage) return storage;
  try { return globalThis.window?.localStorage || null; } catch { return null; }
}

function clean(value, maximum = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximum && !/[\u0000-\u001f\u007f]/u.test(normalized)
    ? normalized
    : null;
}

function exactIdentifier(value) {
  const normalized = clean(value, MAX_IDENTIFIER_LENGTH);
  return normalized && /^[A-Za-z0-9][A-Za-z0-9._~-]*$/u.test(normalized) ? normalized : null;
}

function entityIdentifier(value) {
  const normalized = clean(value, 200);
  return normalized && /^[A-Za-z0-9][A-Za-z0-9._~:-]*$/u.test(normalized) ? normalized : null;
}

function safeUrl(value) {
  const normalized = clean(value, 2000);
  if (!normalized) return null;
  try { return new URL(normalized).toString(); } catch { return null; }
}

export function createStableAnonymousId({ storage, createId = () => crypto.randomUUID() } = {}) {
  const resolvedStorage = safeStorage(storage);
  let value = null;
  try { value = resolvedStorage?.getItem(VISITOR_KEY); } catch { value = null; }
  if (!value) value = memoryAnonymousId;
  if (!/^[0-9a-f-]{36}$/i.test(value || '')) {
    value = createId();
    memoryAnonymousId = value;
    try { resolvedStorage?.setItem(VISITOR_KEY, value); } catch { /* memory-only */ }
  }
  return value;
}

export function parseLandingTouch({ url, referrer = '', occurredAt = new Date().toISOString(), consent } = {}) {
  const parsed = new URL(url || globalThis.window?.location?.href || 'https://invalid.local/');
  const params = parsed.searchParams;
  const advertisingAllowed = isAdvertisingAllowed(consent || readConsentPreferences());
  const metaClickId = advertisingAllowed ? exactIdentifier(params.get('fbclid')) : null;
  const redditClickId = advertisingAllowed ? exactIdentifier(params.get('rdt_cid')) : null;
  const googleClickId = advertisingAllowed ? exactIdentifier(params.get('gclid')) : null;
  const source = clean(params.get('utm_source'), 100)?.toLowerCase() || null;
  const provider = redditClickId || source === 'reddit'
    ? 'reddit'
    : metaClickId || ['facebook', 'instagram', 'meta'].includes(source)
      ? 'meta'
      : googleClickId || source === 'google'
        ? 'google'
        : source
          ? 'organic'
          : 'organic';
  const campaignId = !advertisingAllowed || provider === 'organic' ? null : entityIdentifier(params.get('campaign_id') || params.get('utm_id'));
  const adGroupId = !advertisingAllowed || provider === 'organic' ? null : entityIdentifier(params.get('adgroup_id') || params.get('adset_id'));
  const adId = !advertisingAllowed || provider === 'organic' ? null : entityIdentifier(params.get('ad_id'));
  const hasCampaign = Boolean(
    metaClickId || redditClickId || googleClickId || source || campaignId || adGroupId || adId
  );
  if (!hasCampaign) return null;

  return Object.fromEntries(Object.entries({
    provider,
    utmSource: source,
    utmMedium: clean(params.get('utm_medium'), 100),
    utmCampaign: clean(params.get('utm_campaign')),
    utmContent: clean(params.get('utm_content')),
    utmTerm: clean(params.get('utm_term')),
    redditClickId,
    metaClickId,
    googleClickId,
    campaignId,
    adGroupId,
    adId,
    referrer: safeUrl(referrer),
    landingPage: safeUrl(`${parsed.origin}${parsed.pathname}`),
    touchedAt: occurredAt,
  }).filter(([, value]) => value !== null));
}

export function mergeAttributionTouches(existing = {}, incoming, consent) {
  const preference = consent || readConsentPreferences();
  const current = existing && typeof existing === 'object' ? existing : {};
  if (!incoming) return { firstTouch: current.firstTouch || null, latestTouch: current.latestTouch || null };
  const sanitized = { ...incoming };
  if (!isAdvertisingAllowed(preference)) {
    delete sanitized.redditClickId;
    delete sanitized.metaClickId;
    delete sanitized.googleClickId;
    delete sanitized.campaignId;
    delete sanitized.adGroupId;
    delete sanitized.adId;
  }
  const incomingTime = Date.parse(sanitized.touchedAt || '');
  if (!Number.isFinite(incomingTime)) return { firstTouch: current.firstTouch || null, latestTouch: current.latestTouch || null };
  const firstTouch = current.firstTouch || sanitized;
  const latestTime = Date.parse(current.latestTouch?.touchedAt || '');
  const directCannotReplacePaid = sanitized.provider === 'organic' && PAID_PROVIDERS.has(current.latestTouch?.provider);
  const latestTouch = !directCannotReplacePaid && (!Number.isFinite(latestTime) || incomingTime > latestTime)
    ? sanitized
    : current.latestTouch || sanitized;
  return { firstTouch, latestTouch };
}

export function captureAdvertisingAttribution({ storage, url, referrer, now = () => new Date(), consent } = {}) {
  const resolvedStorage = safeStorage(storage);
  const preference = consent || readConsentPreferences({ storage: resolvedStorage });
  let existing = {};
  try { existing = safeParse(resolvedStorage?.getItem(ATTRIBUTION_KEY), {}) || {}; } catch { existing = {}; }
  const touch = parseLandingTouch({
    url: url || globalThis.window?.location?.href,
    referrer: referrer ?? globalThis.document?.referrer ?? '',
    occurredAt: now().toISOString(),
    consent: preference,
  });
  const merged = mergeAttributionTouches(existing, touch, preference);
  try { resolvedStorage?.setItem(ATTRIBUTION_KEY, JSON.stringify(merged)); } catch { /* memory-only */ }
  return merged;
}

export function getAdvertisingAttributionSnapshot(options = {}) {
  const preference = options.consent || readConsentPreferences({ storage: options.storage });
  return {
    schemaVersion: 2,
    anonymousId: createStableAnonymousId(options),
    ...captureAdvertisingAttribution({ ...options, consent: preference }),
    consent: {
      analytics: preference.analytics,
      advertising: preference.advertising,
      gpc: preference.gpc === true,
      version: preference.version,
      capturedAt: preference.capturedAt,
    },
  };
}
