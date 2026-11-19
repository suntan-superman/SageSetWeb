import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { resolveRuntimeEnvironment } from '../src/config/runtimeEnvironment.js';

const valid = {
  VITE_LEGACY_FIREBASE_PROJECT_ID: 'greencheck-d3d88',
  MODE: 'staging', VITE_APP_ENV: 'staging', VITE_STAGING_SITE_ORIGIN: 'https://sageset-staging.example.net',
  VITE_FIREBASE_API_KEY: 'public-test-key', VITE_FIREBASE_AUTH_DOMAIN: 'sageset-stage-123.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'sageset-stage-123', VITE_FIREBASE_STORAGE_BUCKET: 'sageset-stage-123.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789', VITE_FIREBASE_APP_ID: '1:123:web:abc',
  VITE_FIREBASE_APPCHECK_SITE_KEY: 'public-stage-app-check-key',
  VITE_WORKSIDE_ANALYTICS_URL: 'https://workside-analytics-staging.web.app',
  VITE_WORKSIDE_ANALYTICS_ENVIRONMENT: 'staging', VITE_OUTBOUND_NOTIFICATIONS_ENABLED: 'false',
  VITE_META_PIXEL_ID: '', VITE_META_CAPI_ENDPOINT: '', VITE_REDDIT_TRACKING_ENABLED: 'false',
  VITE_REDDIT_PIXEL_ID: '', VITE_REDDIT_TEST_MODE: 'false',
  VITE_STRIPE_CHECKOUT_HOST: 'checkout.stripe.com',
};

test('valid staging configuration is explicit and provider delivery is disabled', () => {
  const result = resolveRuntimeEnvironment(valid, valid.VITE_STAGING_SITE_ORIGIN);
  assert.equal(result.firebase.projectId, 'sageset-stage-123');
  assert.equal(result.notificationsEnabled, false);
  assert.deepEqual(result.meta, {pixelId: '', capiEndpoint: '', testEventCode: ''});
  assert.deepEqual(result.reddit, {enabled: false, pixelId: '', testMode: false, channel: 'capi-only'});
});

test('staging never inherits production Firebase or origin values', () => {
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_FIREBASE_PROJECT_ID: 'greencheck-d3d88'}));
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_STAGING_SITE_ORIGIN: 'https://sagesetfitness.com'}));
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_FIREBASE_AUTH_DOMAIN: 'greencheck-d3d88.firebaseapp.com'}));
});

test('staging rejects missing values and environment mismatch', () => {
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_FIREBASE_APP_ID: ''}));
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_APP_ENV: ''}));
  assert.throws(() => resolveRuntimeEnvironment({...valid}, 'https://unexpected.example.net'));
});

test('staging rejects notifications, unguarded destinations, and every browser Reddit activation input', () => {
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_OUTBOUND_NOTIFICATIONS_ENABLED: 'true'}));
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_META_CAPI_ENDPOINT: 'https://example.test/meta'}));
  for (const override of [
    {VITE_REDDIT_TRACKING_ENABLED: 'true'},
    {VITE_REDDIT_PIXEL_ID: 'stage_pixel_123'},
    {VITE_REDDIT_TEST_MODE: 'true'},
    {VITE_REDDIT_TRACKING_ENABLED: 'true', VITE_REDDIT_PIXEL_ID: 'stage_pixel_123', VITE_REDDIT_TEST_MODE: 'true'},
  ]) assert.throws(() => resolveRuntimeEnvironment({...valid, ...override}), /CAPI-only release/);
});

test('production remains CAPI-only and does not fall back to the staging analytics collector', () => {
  const result = resolveRuntimeEnvironment({MODE: 'production'});
  assert.equal(result.name, 'production');
  assert.equal(result.isStaging, false);
  assert.equal(result.notificationsEnabled, true);
  assert.equal(result.workside, null);
  assert.deepEqual(result.reddit, {enabled: false, pixelId: '', testMode: false, channel: 'capi-only'});
});

test('production accepts only an explicit production Workside collector', () => {
  assert.throws(() => resolveRuntimeEnvironment({
    MODE: 'production',
    VITE_WORKSIDE_ANALYTICS_URL: 'https://workside-analytics-staging.web.app',
    VITE_WORKSIDE_ANALYTICS_ENVIRONMENT: 'staging',
  }), /explicit production HTTPS collector/);
  assert.throws(() => resolveRuntimeEnvironment({
    MODE: 'production',
    VITE_WORKSIDE_ANALYTICS_URL: 'https://analytics.example.com',
    VITE_WORKSIDE_ANALYTICS_ENVIRONMENT: 'staging',
  }), /explicit production HTTPS collector/);
  assert.deepEqual(resolveRuntimeEnvironment({
    MODE: 'production',
    VITE_WORKSIDE_ANALYTICS_URL: 'https://analytics.example.com',
    VITE_WORKSIDE_ANALYTICS_ENVIRONMENT: 'production',
  }).workside, {endpoint: 'https://analytics.example.com', environment: 'production'});
});

test('production configuration rejects every browser Reddit activation flag', () => {
  assert.throws(() => resolveRuntimeEnvironment({
    MODE: 'production', VITE_APP_ENV: 'production', VITE_REDDIT_TEST_MODE: 'true',
  }), /CAPI-only release/);
  assert.throws(() => resolveRuntimeEnvironment({
    MODE: 'production', VITE_APP_ENV: 'production', VITE_REDDIT_TRACKING_ENABLED: 'true',
  }), /CAPI-only release/);
});

test('browser registration delegates trial authority to the staging Function', () => {
  const source = fs.readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  const registration = source.slice(source.indexOf('const signup = async'), source.indexOf('const signInWithApple'));
  assert.doesNotMatch(registration, /\b(?:trial|subscription|entitlements|metrics)\s*:/);
  assert.match(registration, /httpsCallable\(functions, 'initializeUserTrial'\)/);
  assert.ok(registration.indexOf("initializeUserTrial") < registration.indexOf("linkAdvertisingAttribution('registration')"));
});
