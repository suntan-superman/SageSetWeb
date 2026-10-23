import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const STAGING_URL = 'https://sageset-staging.netlify.app';
const browser = await puppeteer.launch({headless: true});
try {
  const page = await browser.newPage();
  const redditRequests = [];
  page.on('request', (request) => {
    try {
      const host = new URL(request.url()).hostname.toLowerCase();
      if (host.endsWith('reddit.com') || host.endsWith('redditstatic.com')) redditRequests.push(request.url());
    } catch {
      // Ignore browser-internal URLs.
    }
  });
  await page.goto(STAGING_URL, {waitUntil: 'networkidle2', timeout: 45_000});
  await page.evaluate(() => {
    localStorage.setItem('sageset.consent.v2', JSON.stringify({
      analytics: 'granted',
      advertising: 'granted',
      gpc: false,
      version: 'phase-5-staging-smoke',
      capturedAt: new Date().toISOString(),
    }));
  });
  await page.reload({waitUntil: 'networkidle2', timeout: 45_000});
  const result = await page.evaluate(() => ({
    banner: document.body.innerText.includes('SAGESET STAGING — TEST DATA ONLY'),
    redditDisclosure: document.body.innerText.includes('Reddit'),
    redditDebugEvents: window.__SAGESET_REDDIT_PIXEL_EVENTS__ || [],
    providerScripts: [...document.scripts].map((script) => script.src).filter((src) => /reddit/i.test(src)),
  }));
  assert.equal(result.banner, true);
  assert.equal(result.redditDisclosure, true);
  assert.deepEqual(result.redditDebugEvents, []);
  assert.deepEqual(result.providerScripts, []);
  assert.deepEqual(redditRequests, []);
  console.log('Staging browser verification passed: explicit consent cannot activate unconfigured Reddit delivery.');
} finally {
  await browser.close();
}
