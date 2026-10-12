import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const panel = (await fs.readFile(path.join(root, 'src/components/WorkoutFlexibilityPanel.jsx'), 'utf8'))
  .replace(/import \{ getWorkoutFlexibilityForAdmin, updateWorkoutFlexibilityForAdmin \} from '[^']+';/, `
const getWorkoutFlexibilityForAdmin = async () => ({policy: {...window.fixturePolicy}});
const updateWorkoutFlexibilityForAdmin = async (updates) => {
  if (window.fixtureFailure) throw new Error('Fixture policy unavailable');
  window.fixtureWrites.push(updates);
  Object.assign(window.fixturePolicy, updates);
  return {policy: {...window.fixturePolicy}};
};`)
  .replace('export default function WorkoutFlexibilityPanel', 'function WorkoutFlexibilityPanel');
const result = await build({
  stdin: {contents: `import {createRoot} from 'react-dom/client';\n${panel}\ncreateRoot(document.getElementById('root')).render(<WorkoutFlexibilityPanel/>);`,
    resolveDir: root, loader: 'jsx'},
  bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: {'process.env.NODE_ENV': '"test"'},
});
const bundle = result.outputFiles[0].text;
const server = http.createServer((request, response) => {
  if (request.url === '/fixture.js') { response.writeHead(200, {'Content-Type': 'text/javascript'}); response.end(bundle); return; }
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<html><body><div id="root"></div><script>window.fixturePolicy={version:"workout-duration-v1",enabled:false,rolloutPercent:0};window.fixtureWrites=[];</script><script src="/fixture.js"></script></body></html>');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => request.url().startsWith('http://127.0.0.1:') ? request.continue() : request.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}`, {waitUntil: 'networkidle0'});
  await page.waitForSelector('[data-testid="workout-flexibility-policy"]');
  assert.equal(await page.$eval('button:last-of-type', (button) => button.disabled), true, 'Saving is disabled before policy load.');
  const click = async (text) => {
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.textContent === label && !button.disabled), {}, text);
    await page.evaluate((label) => [...document.querySelectorAll('button')].find((button) => button.textContent === label).click(), text);
  };
  await click('Load policy');
  await page.waitForFunction(() => document.querySelector('input[type="checkbox"]').disabled === false);
  assert.equal(await page.$eval('input[type="checkbox"]', (input) => input.checked), false);
  await page.click('input[type="checkbox"]');
  await page.$eval('input[type="number"]', (input) => {const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, '25'); input.dispatchEvent(new Event('input', {bubbles:true}));});
  await click('Save policy');
  await page.waitForFunction(() => window.fixtureWrites.length === 1);
  assert.deepEqual(await page.evaluate(() => window.fixtureWrites[0]), {enabled:true, rolloutPercent:25});
  await page.click('input[type="checkbox"]');
  await click('Save policy');
  await page.waitForFunction(() => window.fixtureWrites.length === 2);
  assert.equal(await page.evaluate(() => window.fixturePolicy.enabled), false, 'Master switch can be disabled explicitly.');
  await page.evaluate(() => {window.fixtureFailure = true;});
  await click('Save policy');
  await page.waitForSelector('[role="alert"]');
  assert.equal(await page.$eval('[role="alert"]', (alert) => alert.textContent), 'Fixture policy unavailable');
  assert.equal(await page.evaluate(() => window.fixtureWrites.length), 2, 'Failed save does not claim success.');
  assert.deepEqual(pageErrors, [], 'The admin panel must render without browser errors.');
  console.log('Local admin panel browser checks passed: default-off, initial save lock, explicit cohort save, kill switch and retry error. All external network requests were blocked; callable authorization is covered by the real emulator suite.');
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
