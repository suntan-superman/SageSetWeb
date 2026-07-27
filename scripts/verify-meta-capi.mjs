import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const webRoot = process.cwd();
const sageSetRoot = resolve(webRoot, '..');
const worksideRoot = resolve(sageSetRoot, '..', 'Workside-Analytics-Dashboard');
const read = (path) => readFileSync(path, 'utf8');

const browser = read(resolve(webRoot, 'src/services/metaPixel.js'));
const marketing = read(resolve(webRoot, 'src/pages/MarketingLandingPage.jsx'));
const home = read(resolve(webRoot, 'src/pages/HomePage.jsx'));
const auth = read(resolve(webRoot, 'src/pages/AuthPage.jsx'));
const envExample = read(resolve(webRoot, '.env.example'));
const backend = read(resolve(sageSetRoot, 'mobile/functions/src/metaConversion.ts'));
const worksideEvents = read(resolve(worksideRoot, 'packages/shared/src/events.js'));
const worksideHealth = read(resolve(worksideRoot, 'packages/analytics-core/src/metaCapiHealth.js'));

assert.match(browser, /createMetaEventId\('vc'\)/);
assert.match(browser, /eventID:\s*sharedEventId/);
assert.match(browser, /eventId:\s*sharedEventId/);
assert.match(browser, /getMetaMarketingConsent/);
assert.match(browser, /globalPrivacyControl/);
assert.match(browser, /getAppCheckToken/);
assert.match(browser, /X-Firebase-AppCheck/);
assert.match(browser, /meta_browser_event/);
assert.doesNotMatch(browser, /VITE_META_(?:CAPI_ACCESS_TOKEN|DATASET_ID|GRAPH_API_VERSION)/);
assert.doesNotMatch(envExample, /VITE_META_(?:CAPI_ACCESS_TOKEN|DATASET_ID|GRAPH_API_VERSION)/);

for (const [label, source] of [['marketing', marketing], ['home', home], ['auth', auth]]) {
  assert.match(source, /trackMetaEvent\s*\(\s*\{/u, `${label} must use the paired helper.`);
  assert.doesNotMatch(source, /trackEvent\s*\(\s*['"]ViewContent['"]/u, `${label} contains a Pixel-only ViewContent.`);
}

assert.match(backend, /META_VIEW_CONTENT_EVENT\s*=\s*"ViewContent"/);
assert.match(backend, /EVENT_NOT_ALLOWED/);
assert.match(backend, /verifyAppCheckToken/);
assert.match(backend, /https:\/\/sagesetfitness\.com/);
assert.match(backend, /https:\/\/www\.sagesetfitness\.com/);
assert.match(backend, /META_CAPI_ACCESS_TOKEN_SECRET/);
assert.match(backend, /datasetId !== SAGESET_META_DATASET_ID/);
assert.match(backend, /authorization.*Bearer/si);
assert.doesNotMatch(backend, /access_token=/);
assert.match(backend, /meta_capi_delivery/);

assert.match(worksideEvents, /meta_browser_event/);
assert.match(worksideEvents, /meta_capi_delivery/);
const metricMap = worksideEvents.slice(worksideEvents.indexOf('export const EVENT_TO_DAILY_METRIC'));
assert.doesNotMatch(metricMap, /meta_browser_event/);
assert.doesNotMatch(metricMap, /meta_capi_delivery/);
assert.match(worksideHealth, /deduplicationPairRate/);
assert.match(worksideHealth, /businessFunnelPolicy/);

console.log('Meta CAPI coverage, shared-ID, privacy, and Workside guard verification passed.');
