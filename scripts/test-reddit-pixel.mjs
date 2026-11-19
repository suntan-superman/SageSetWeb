import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  initRedditPixel,
  isApprovedRedditPixelPath,
  resetRedditPixelForTests,
  trackRedditPageVisit,
  trackRedditSignUp,
} from '../src/services/redditPixel.js';

const enabled = { enabled: true, pixelId: 'test_pixel_123', testMode: true };
const granted = { advertising: 'granted', analytics: 'granted', gpc: false };
const denied = { ...granted, advertising: 'denied' };

function browser(pathname = '/') {
  const calls = [];
  const inserted = [];
  globalThis.window = { location: { pathname, search: '' } };
  globalThis.document = {
    createElement: () => ({ dataset: {} }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: (node) => inserted.push(node) } }],
  };
  return { calls, inserted };
}

test.afterEach(() => {
  resetRedditPixelForTests();
  delete globalThis.window;
  delete globalThis.document;
});

test('unknown, denied, and GPC consent never load or call the Pixel', () => {
  for (const consent of [{ advertising: 'unknown', gpc: false }, denied, { ...granted, gpc: true }]) {
    const state = browser('/');
    assert.equal(initRedditPixel({ consent, config: enabled }).initialized, false);
    assert.equal(state.inserted.length, 0);
    resetRedditPixelForTests();
  }
});

test('granted consent initializes once and supports a public PageVisit without PII', () => {
  const state = browser('/pricing');
  const first = trackRedditPageVisit({ pathname: '/pricing', consent: granted, config: enabled, conversionId: 'page:one' });
  assert.equal(first.sent, true);
  assert.equal(state.inserted.length, 1);
  assert.match(state.inserted[0].src, /^https:\/\/www\.redditstatic\.com\/ads\/pixel\.js\?pixel_id=/);
  assert.deepEqual(window.rdt.callQueue[0], ['init', enabled.pixelId]);
  assert.deepEqual(window.rdt.callQueue[1], ['track', 'PageVisit', { conversionId: 'page:one' }]);
  assert.equal(trackRedditPageVisit({ pathname: '/pricing', consent: granted, config: enabled }).reason, 'duplicate_suppressed');
  const serialized = JSON.stringify(window.__SAGESET_REDDIT_PIXEL_EVENTS__);
  assert.doesNotMatch(serialized, /email|phone|firebase|stripe|injury|workout/i);
});

test('consent withdrawal stops subsequent PageVisit and SignUp delivery', () => {
  browser('/pricing');
  assert.equal(trackRedditPageVisit({ pathname: '/pricing', consent: granted, config: enabled, conversionId: 'page:before' }).sent, true);
  const callsBeforeWithdrawal = window.rdt.callQueue.length;
  assert.equal(trackRedditPageVisit({ pathname: '/features', consent: denied, config: enabled, conversionId: 'page:after' }).sent, false);
  assert.equal(trackRedditSignUp({ conversionId: 'registration:after', consent: denied, config: enabled }).sent, false);
  assert.equal(window.rdt.callQueue.length, callsBeforeWithdrawal);
});

test('authenticated and sensitive routes are excluded even with consent', () => {
  browser('/dashboard/nutrition');
  for (const path of ['/dashboard', '/dashboard/workouts', '/dashboard/nutrition', '/share/verified-squats/example', '/admin']) {
    assert.equal(isApprovedRedditPixelPath(path), false);
    assert.equal(trackRedditPageVisit({ pathname: path, consent: granted, config: enabled }).reason, 'route_not_approved');
  }
});

test('registration uses the backend conversion ID for browser/server deduplication', () => {
  browser('/signup');
  const result = trackRedditSignUp({ conversionId: 'registration:stable-123', consent: granted, config: enabled });
  assert.deepEqual(result, { sent: true, conversionId: 'registration:stable-123' });
  assert.equal(window.__SAGESET_REDDIT_PIXEL_EVENTS__.at(-1).name, 'SignUp');
  assert.equal(trackRedditSignUp({ conversionId: 'bad id with spaces', consent: granted, config: enabled }).sent, false);
});

test('missing configuration fails closed and no provider script is inserted', () => {
  const state = browser('/');
  assert.equal(trackRedditPageVisit({ pathname: '/', consent: granted, config: { enabled: false, pixelId: '' } }).sent, false);
  assert.equal(state.inserted.length, 0);
});

test('shipped application has no browser Reddit Pixel invocation points', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const auth = fs.readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  for (const source of [app, auth]) {
    assert.doesNotMatch(source, /redditPixel\.js/);
    assert.doesNotMatch(source, /trackReddit(?:PageVisit|SignUp)|initRedditPixel/);
  }
});
