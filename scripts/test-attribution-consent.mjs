import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  CONSENT_VERSION,
  CONSENT_STORAGE_KEY,
  readConsentPreferences,
  saveConsentPreferences,
  isAdvertisingAllowed,
} from '../src/services/consentPreferences.js';
import {
  ATTRIBUTION_KEY,
  captureAdvertisingAttribution,
  clearAdvertisingAttribution,
  getAdvertisingAttributionSnapshot,
  mergeAttributionTouches,
  parseLandingTouch,
} from '../src/services/advertisingAttribution.js';

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

const granted = {
  analytics: 'granted', advertising: 'granted', gpc: false,
  version: 'test-v2', capturedAt: '2026-10-22T12:00:00.000Z',
};

test('consent defaults to unknown and advertising is not allowed', () => {
  const preference = readConsentPreferences({ storage: storage(), navigator: {} });
  assert.equal(preference.analytics, 'unknown');
  assert.equal(preference.advertising, 'unknown');
  assert.equal(isAdvertisingAllowed(preference), false);
});

test('separate granted and denied choices persist', () => {
  const store = storage();
  saveConsentPreferences(
    { analytics: 'granted', advertising: 'denied' },
    { storage: store, navigator: {}, now: () => new Date('2026-10-22T12:00:00Z') }
  );
  const preference = readConsentPreferences({ storage: store, navigator: {} });
  assert.equal(preference.analytics, 'granted');
  assert.equal(preference.advertising, 'denied');
  assert.ok(store.getItem(CONSENT_STORAGE_KEY));
});

test('GPC forces advertising denied even after a grant', () => {
  const store = storage({ [CONSENT_STORAGE_KEY]: JSON.stringify(granted) });
  const preference = readConsentPreferences({ storage: store, navigator: { globalPrivacyControl: true } });
  assert.equal(preference.advertising, 'denied');
  assert.equal(preference.gpc, true);
});

test('Reddit click ID remains exact only with advertising consent', () => {
  const url = 'https://sagesetfitness.com/?utm_source=reddit&rdt_cid=Exact_Reddit-123&campaign_id=cmp:7';
  const allowed = parseLandingTouch({ url, occurredAt: '2026-10-22T12:00:00Z', consent: granted });
  assert.equal(allowed.redditClickId, 'Exact_Reddit-123');
  assert.equal(allowed.campaignId, 'cmp:7');
  const denied = parseLandingTouch({ url, occurredAt: '2026-10-22T12:00:00Z', consent: { ...granted, advertising: 'denied' } });
  assert.equal(denied, null);
});

test('consent denial clears previously stored advertising attribution', () => {
  const paid = { provider: 'reddit', redditClickId: 'reddit-1', touchedAt: '2026-10-20T12:00:00Z' };
  const denied = { ...granted, advertising: 'denied' };
  assert.deepEqual(
    mergeAttributionTouches({ firstTouch: paid, latestTouch: paid }, null, denied),
    { firstTouch: null, latestTouch: null }
  );
  const store = storage({ [ATTRIBUTION_KEY]: JSON.stringify({ firstTouch: paid, latestTouch: paid }) });
  clearAdvertisingAttribution({ storage: store });
  assert.equal(store.getItem(ATTRIBUTION_KEY), null);
});

test('first touch is immutable and latest touch advances by time', () => {
  const first = { provider: 'meta', metaClickId: 'meta-1', touchedAt: '2026-10-20T12:00:00Z' };
  const newer = { provider: 'reddit', redditClickId: 'reddit-1', touchedAt: '2026-10-21T12:00:00Z' };
  const merged = mergeAttributionTouches({ firstTouch: first, latestTouch: first }, newer, granted);
  assert.deepEqual(merged.firstTouch, first);
  assert.deepEqual(merged.latestTouch, newer);
  const older = { provider: 'google', googleClickId: 'google-1', touchedAt: '2026-10-19T12:00:00Z' };
  assert.deepEqual(mergeAttributionTouches(merged, older, granted), merged);
});

test('direct/organic visit does not replace a paid latest touch', () => {
  const paid = { provider: 'meta', metaClickId: 'meta-1', touchedAt: '2026-10-20T12:00:00Z' };
  const direct = { provider: 'organic', touchedAt: '2026-10-22T12:00:00Z' };
  assert.deepEqual(mergeAttributionTouches({ firstTouch: paid, latestTouch: paid }, direct, granted).latestTouch, paid);
});

test('snapshot uses stable anonymous identity and stores no personal profile', () => {
  const store = storage();
  const snapshot = getAdvertisingAttributionSnapshot({
    storage: store,
    createId: () => '123e4567-e89b-42d3-a456-426614174000',
    url: 'https://sagesetfitness.com/?utm_source=google&gclid=gclid-1',
    consent: granted,
    now: () => new Date('2026-10-22T12:00:00Z'),
  });
  assert.equal(snapshot.anonymousId, '123e4567-e89b-42d3-a456-426614174000');
  assert.equal(JSON.stringify(snapshot).includes('email'), false);
  assert.ok(store.getItem(ATTRIBUTION_KEY));
  const repeated = captureAdvertisingAttribution({ storage: store, url: 'https://sagesetfitness.com/', consent: granted });
  assert.equal(repeated.firstTouch.googleClickId, 'gclid-1');
});

test('CAPI-only consent and privacy disclosure excludes the browser Reddit Pixel', () => {
  assert.equal(CONSENT_VERSION, '2026-10-23-capi-only');
  const consentUi = fs.readFileSync(new URL('../src/components/ConsentPreferences.jsx', import.meta.url), 'utf8');
  const authContext = fs.readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  const privacy = fs.readFileSync(new URL('../src/pages/PrivacyPolicyPage.jsx', import.meta.url), 'utf8');
  assert.match(consentUi, /does not load the Reddit Pixel/);
  assert.match(privacy, /does not load the Reddit Pixel or send browser-side Reddit conversion events/);
  assert.match(privacy, /Global Privacy Control and withdrawal of advertising consent stop future Reddit delivery/);
  assert.doesNotMatch(privacy, /public marketing pages may use the Reddit Pixel/);
  assert.match(consentUi, /clearAdvertisingAttribution/);
  assert.match(authContext, /CONSENT_CHANGED_EVENT/);
  assert.match(authContext, /linkAdvertisingAttribution\('session'\)/);
});

