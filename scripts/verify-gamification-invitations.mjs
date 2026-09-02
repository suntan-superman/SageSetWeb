import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(root, 'src/pages/VerifiedSquatSharePage.jsx'), 'utf8');
const service = fs.readFileSync(path.join(root, 'src/services/gamificationSharing.js'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'src/services/gamificationValidationAnalytics.js'), 'utf8');
const edge = fs.readFileSync(path.join(root, 'netlify/edge-functions/verified-share-meta.ts'), 'utf8');
const netlify = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');

assert.match(page, /sageset:\/\/verified-squats\//);
assert.match(page, /Open in SageSet and Accept/);
assert.match(page, /friend_challenge_app_handoff_clicked/);
assert.match(page, /friend_challenge_install_clicked/);
assert.match(page, /phase5b-v0/);
assert.match(page, /identity, recording, or private workout data/);
assert.match(service, /recordVerifiedChallengeShareOpen/);
assert.match(analytics, /friend_challenge_app_handoff_clicked/);
assert.match(analytics, /friend_challenge_install_clicked/);
assert.match(edge, /SageSet Verified Squats — Can You Match It/);
assert.match(edge, /payload\?\.result\?\.available === true/);
assert.match(edge, /og:title/);
assert.match(edge, /A SageSet member completed/);
assert.doesNotMatch(edge, /ownerUid|inviteeUid|displayName|email/);
assert.match(netlify, /path = "\/share\/verified-squats\/\*"/);

console.log('Web gamification invitation verification passed.');
