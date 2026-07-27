import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const baseUrl = (process.env.SAGESET_CAPI_TEST_URL || 'https://sagesetfitness.com').replace(/\/$/, '');
const appCheckDebugToken = process.env.SAGESET_APPCHECK_DEBUG_TOKEN || '';
const endpointPath = '/sendMetaConversion';
const observations = [];
const diagnostics = [];

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  if (appCheckDebugToken) {
    await page.evaluateOnNewDocument((token) => {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = token;
    }, appCheckDebugToken);
  }

  page.on('request', (request) => {
    if (!request.url().includes(endpointPath) || request.method() !== 'POST') return;
    let payload = {};
    try {
      payload = JSON.parse(request.postData() || '{}');
    } catch {
      payload = {};
    }
    observations.push({
      phase: 'request',
      eventId: payload.eventId || null,
      eventName: payload.eventName || null,
    });
  });

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes(endpointPath) && response.request().method() === 'POST') {
      observations.push({
        phase: 'response',
        status: response.status(),
      });
      return;
    }
    if (
      url.includes('firebaseappcheck.googleapis.com') ||
      url.includes('recaptchaenterprise.googleapis.com')
    ) {
      diagnostics.push({
        kind: 'attestation_response',
        target: new URL(url).hostname,
        status: response.status(),
      });
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (
      url.includes(endpointPath) ||
      url.includes('firebaseappcheck.googleapis.com') ||
      url.includes('recaptchaenterprise.googleapis.com')
    ) {
      diagnostics.push({
        kind: 'request_failed',
        target: new URL(url).hostname,
        error: request.failure()?.errorText || 'unknown',
      });
    }
  });

  page.on('pageerror', (error) => {
    diagnostics.push({ kind: 'page_error', message: error.message });
  });

  await page.goto(`${baseUrl}/signup?capi_live_probe=1`, {
    waitUntil: 'networkidle2',
    timeout: 30_000,
  });
  const responseDeadline = Date.now() + 20_000;
  while (
    !observations.some((entry) => entry.phase === 'response') &&
    Date.now() < responseDeadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const request = observations.find((entry) => entry.phase === 'request');
  const response = observations.find((entry) => entry.phase === 'response');

  assert.ok(
    request,
    `No CAPI request left the browser. Diagnostics: ${JSON.stringify(diagnostics)}`
  );
  assert.equal(request.eventName, 'ViewContent');
  assert.match(request.eventId || '', /^vc_[0-9a-f-]{36}$/i);
  assert.ok(
    response,
    `The CAPI request did not receive a response. Diagnostics: ${JSON.stringify(diagnostics)}`
  );
  assert.equal(
    response.status,
    200,
    `CAPI returned HTTP ${response.status}. Diagnostics: ${JSON.stringify(diagnostics)}`
  );

  console.log(`Live Meta CAPI verification passed (${request.eventName}, HTTP ${response.status}).`);
} finally {
  await browser.close();
}
