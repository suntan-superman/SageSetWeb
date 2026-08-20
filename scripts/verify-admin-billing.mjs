import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const webRoot = process.cwd();
const read = (relativePath) => readFileSync(resolve(webRoot, relativePath), 'utf8');
const page = read('src/pages/AdminUsersPage.jsx');
const service = read('src/services/adminUsers.js');

for (const functionName of [
  'getAdminBillingDetail',
  'manageStripeSubscriptionForAdmin',
  'refundStripeChargeForAdmin',
]) {
  assert.match(service, new RegExp(`export async function ${functionName}`));
  assert.match(page, new RegExp(`\\b${functionName}\\b`));
}

assert.match(page, /Subscription & Refund Management/);
assert.match(page, /Cancel at period end/);
assert.match(page, /Cancel immediately/);
assert.match(page, /Issue refund/);
assert.match(page, /Type CANCEL to continue/);
assert.match(page, /Type REFUND to continue/);
assert.match(page, /support@worksidesoftware\.com/);
assert.match(page, /Open App Store Connect/);
assert.match(page, /Open Google Play Console/);

console.log('Admin billing portal controls and destructive-action confirmations verified.');
