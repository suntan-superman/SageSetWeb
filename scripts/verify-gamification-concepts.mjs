import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const app = read('src/App.jsx');
const page = read('src/pages/ConceptValidationPage.jsx');

const checks = [
  ['four concept routes are registered', (app.match(/\/concept\//g) || []).length >= 4],
  ['concept pages require explicit Vite flag', /VITE_ENABLE_GAMIFICATION_CONCEPTS === 'true'/.test(page)],
  ['concept views are instrumented', /concept_page_viewed/.test(page)],
  ['concept CTAs are instrumented', /concept_cta_clicked/.test(page)],
  ['preference responses are instrumented', /concept_preference_submitted/.test(page)],
  ['waitlist intent is instrumented', /concept_waitlist_intent/.test(page)],
  ['concept copy identifies validation-only behavior', /Nothing here changes your SageSet account/.test(page)],
];

const failed = checks.filter(([, passed]) => !passed);
checks.forEach(([label, passed]) => console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`));
if (failed.length) process.exit(1);
console.log(`Web gamification concept verification passed (${checks.length}/${checks.length}).`);
