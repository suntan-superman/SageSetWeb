import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const forbidden = [
  ['production Firebase project', /greencheck-d3d88/i],
  ['production Firebase app', /1:541362391240:web:d3fa46cff89bd0767e3dfd/i],
  ['production App Check key', /6LdFOFYtAAAAAAcaljNPZC_aiN7aY22xpTm_8dg4/i],
  ['production Meta Pixel', /2504506900022362/],
  ['live Stripe secret', /sk_live_[A-Za-z0-9]+/],
  ['private key', /-----BEGIN (?:RSA )?PRIVATE KEY-----/],
];

async function files(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

for (const file of await files(root)) {
  const body = await readFile(file, 'utf8').catch(() => '');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(body)) throw new Error(`Staging bundle contains ${label} in ${path.relative(root, file)}.`);
  }
}
console.log('Staging bundle contains no prohibited production identifiers or credential patterns.');
