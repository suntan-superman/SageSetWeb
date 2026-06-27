import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer';

const HOST = '127.0.0.1';
const LIVE_MODE = process.env.SAGESET_PIXEL_TEST_LIVE === '1' || process.argv.includes('--live');
const PORT = Number(process.env.SAGESET_PIXEL_TEST_PORT || (LIVE_MODE ? 4175 : 4174));
const DEFAULT_BASE_URL = `http://${HOST}:${PORT}`;
const BASE_URL = (process.env.SAGESET_PIXEL_TEST_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const SHOULD_START_SERVER = !process.env.SAGESET_PIXEL_TEST_URL;
const TEST_EVENT_CODE = String(process.env.SAGESET_META_TEST_EVENT_CODE || '').trim();
const PIXEL_DEBUG_KEY = '__SAGESET_META_PIXEL_EVENTS__';
const PIXEL_REQUEST_PATTERN = /(?:facebook|facebook-n?ocookie)\.com\/tr/i;
const HEADFUL_MODE = process.env.SAGESET_PIXEL_TEST_HEADFUL === '1' || process.argv.includes('--headful');

const scenarios = [
  {
    path: '/',
    expected: ['PageView'],
  },
  {
    path: '/signup',
    expected: ['PageView', 'ViewContent'],
  },
  {
    path: '/pricing',
    expected: ['PageView', 'ViewContent'],
  },
  {
    path: '/billing/success',
    expected: ['PageView', 'StartTrial', 'Subscribe'],
  },
  {
    path: '/billing/cancel',
    expected: ['PageView', 'CheckoutCancelled'],
    custom: ['CheckoutCancelled'],
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is not ready yet.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startViteServer() {
  if (!SHOULD_START_SERVER) return null;

  const child = spawn(
    'npm',
    ['run', 'dev', '--', '--host', HOST, '--port', String(PORT)],
    {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: 'none' },
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  child.stdout.on('data', (chunk) => {
    const text = String(chunk);
    if (/error|failed/i.test(text)) process.stdout.write(text);
  });
  child.stderr.on('data', (chunk) => process.stderr.write(String(chunk)));

  return child;
}

async function installFbqRecorder(page) {
  await page.evaluateOnNewDocument(() => {
    window.__SAGESET_PIXEL_TEST_EVENTS__ = [];
    window.fbq = (...args) => {
      window.__SAGESET_PIXEL_TEST_EVENTS__.push({
        args,
        timestamp: new Date().toISOString(),
      });
    };
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window._fbq = window.fbq;
  });
}

function installPixelNetworkRecorder(page) {
  const pixelRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!PIXEL_REQUEST_PATTERN.test(url)) return;
    const parsed = new URL(url);
    const eventName = parsed.searchParams.get('ev') || '';
    pixelRequests.push({
      eventName,
      url,
      testEventCode:
        parsed.searchParams.get('test_event_code') ||
        parsed.searchParams.get('cd[test_event_code]') ||
        '',
      pixelId: parsed.searchParams.get('id') || '',
      timestamp: new Date().toISOString(),
    });
  });
  return pixelRequests;
}

async function getPixelEvents(page) {
  if (LIVE_MODE) {
    return page.evaluate((key) => window[key] || [], PIXEL_DEBUG_KEY);
  }
  return page.evaluate(() => window.__SAGESET_PIXEL_TEST_EVENTS__ || []);
}

function eventNameFromCall(call) {
  if (LIVE_MODE) return call.name;
  const [kind, name] = call.args || [];
  if (kind === 'track' || kind === 'trackCustom') return name;
  return kind;
}

function eventKindFromCall(call) {
  if (LIVE_MODE) return call.kind;
  const [kind] = call.args || [];
  return kind;
}

function summarizeEvents(events) {
  if (LIVE_MODE) {
    return events.filter((event) => event.kind !== 'init');
  }
  return events
    .map((event) => {
      const [kind, name, parameters] = event.args || [];
      return {
        kind,
        name,
        parameters: parameters || {},
      };
    })
    .filter((event) => event.kind !== 'init');
}

async function runScenario(page, scenario, pixelRequests = []) {
  pixelRequests.length = 0;
  if (LIVE_MODE) {
    await page.evaluate((key) => {
      window[key] = [];
    }, PIXEL_DEBUG_KEY);
  } else {
    await page.evaluate(() => {
      window.__SAGESET_PIXEL_TEST_EVENTS__ = [];
    });
  }

  await page.goto(buildScenarioUrl(scenario.path), {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await delay(LIVE_MODE ? 2500 : 750);

  const events = await getPixelEvents(page);
  const names = events.map(eventNameFromCall);
  const missing = scenario.expected.filter((name) => !names.includes(name));

  if (missing.length) {
    throw new Error(
      `Missing Meta Pixel event(s) on ${scenario.path}: ${missing.join(', ')}\n` +
        `Observed: ${JSON.stringify(summarizeEvents(events), null, 2)}`
    );
  }

  if (scenario.custom?.length) {
    const missingCustom = scenario.custom.filter(
      (name) => !events.some((event) => eventKindFromCall(event) === 'trackCustom' && eventNameFromCall(event) === name)
    );
    if (missingCustom.length) {
      throw new Error(
        `Missing custom Meta Pixel event(s) on ${scenario.path}: ${missingCustom.join(', ')}\n` +
          `Observed: ${JSON.stringify(summarizeEvents(events), null, 2)}`
      );
    }
  }

  if (LIVE_MODE) {
    const missingNetworkEvents = scenario.expected.filter(
      (name) => !pixelRequests.some((request) => request.eventName === name)
    );
    if (missingNetworkEvents.length) {
      throw new Error(
        `Missing outbound Meta Pixel request(s) on ${scenario.path}: ${missingNetworkEvents.join(', ')}\n` +
          `Observed Pixel requests: ${JSON.stringify(pixelRequests, null, 2)}\n` +
          `Observed app calls: ${JSON.stringify(summarizeEvents(events), null, 2)}`
      );
    }
  }

  return {
    path: scenario.path,
    events: summarizeEvents(events),
    pixelRequests: [...pixelRequests],
  };
}

async function main() {
  let server = null;
  let browser = null;

  try {
    server = startViteServer();
    if (SHOULD_START_SERVER) {
      await waitForServer(BASE_URL);
    }

    browser = await puppeteer.launch({
      headless: HEADFUL_MODE ? false : 'new',
      defaultViewport: { width: 1280, height: 900 },
      args: LIVE_MODE ? ['--disable-blink-features=AutomationControlled'] : [],
    });

    const page = await browser.newPage();
    if (LIVE_MODE) {
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });
    }
    const pixelRequests = LIVE_MODE ? installPixelNetworkRecorder(page) : [];
    if (!LIVE_MODE) {
      await installFbqRecorder(page);
    }

    const results = [];
    for (const scenario of scenarios) {
      results.push(await runScenario(page, scenario, pixelRequests));
    }

    console.log(`\nMeta Pixel Puppeteer verification passed${LIVE_MODE ? ' in live mode' : ''}.\n`);
    results.forEach((result) => {
      const eventLabels = result.events.map((event) => `${event.kind}:${event.name}`).join(', ');
      const networkLabels = result.pixelRequests?.length
        ? ` | network: ${result.pixelRequests.map((request) => request.eventName).join(', ')}`
        : '';
      console.log(`${result.path} -> ${eventLabels}${networkLabels}`);
    });
  } catch (error) {
    const message = String(error?.message || error);
    if (/Could not find Chrome|Could not find Chromium|browser revision|executable/i.test(message)) {
      console.error(
        '\nPuppeteer could not find a browser. Install the managed Chrome binary once with:\n\n' +
          '  npx puppeteer browsers install chrome\n'
      );
    }
    console.error(`\nMeta Pixel Puppeteer verification failed:\n${message}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        server.kill('SIGTERM');
      }
    }
  }
}

main();

function buildScenarioUrl(path) {
  const url = new URL(`${BASE_URL}${path}`);
  if (LIVE_MODE && TEST_EVENT_CODE) {
    url.searchParams.set('test_event_code', TEST_EVENT_CODE);
  }
  return url.toString();
}
