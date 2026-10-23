import assert from 'node:assert/strict';
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
  VITE_STRIPE_CHECKOUT_HOST: 'checkout.stripe.com',
};

test('valid staging configuration is explicit and provider delivery is disabled', () => {
  const result = resolveRuntimeEnvironment(valid, valid.VITE_STAGING_SITE_ORIGIN);
  assert.equal(result.firebase.projectId, 'sageset-stage-123');
  assert.equal(result.notificationsEnabled, false);
  assert.deepEqual(result.meta, {pixelId: '', capiEndpoint: '', testEventCode: ''});
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

test('staging rejects notifications and advertising destinations', () => {
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_OUTBOUND_NOTIFICATIONS_ENABLED: 'true'}));
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_META_CAPI_ENDPOINT: 'https://example.test/meta'}));
  assert.throws(() => resolveRuntimeEnvironment({...valid, VITE_REDDIT_TRACKING_ENABLED: 'true'}));
});

test('production branch retains legacy behavior until separately migrated', () => {
  const result = resolveRuntimeEnvironment({MODE: 'production'});
  assert.equal(result.name, 'production');
  assert.equal(result.isStaging, false);
  assert.equal(result.notificationsEnabled, true);
});
