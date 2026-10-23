import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveRuntimeEnvironment } from './src/config/runtimeEnvironment.js';

const productionDefaults = {
  VITE_LEGACY_FIREBASE_API_KEY: 'AIzaSyAfvT1fT1mBnx6Gg0TksunEQ6Prpdc1nSw',
  VITE_LEGACY_FIREBASE_AUTH_DOMAIN: 'greencheck-d3d88.firebaseapp.com',
  VITE_LEGACY_FIREBASE_PROJECT_ID: 'greencheck-d3d88',
  VITE_LEGACY_FIREBASE_STORAGE_BUCKET: 'greencheck-d3d88.firebasestorage.app',
  VITE_LEGACY_FIREBASE_MESSAGING_SENDER_ID: '541362391240',
  VITE_LEGACY_FIREBASE_APP_ID: '1:541362391240:web:d3fa46cff89bd0767e3dfd',
  VITE_LEGACY_FIREBASE_APPCHECK_SITE_KEY: '6LdFOFYtAAAAAAcaljNPZC_aiN7aY22xpTm_8dg4',
  VITE_LEGACY_META_CAPI_ENDPOINT: 'https://us-central1-greencheck-d3d88.cloudfunctions.net/sendMetaConversion',
};

const stagingSafetyPlugin = (mode) => ({
  name: 'sageset-staging-safety',
  transformIndexHtml(html) {
    if (mode !== 'staging') return html;
    return html.replace('</head>', '  <meta name="robots" content="noindex,nofollow,noarchive">\n</head>');
  },
  generateBundle() {
    if (mode !== 'staging') return;
    this.emitFile({type: 'asset', fileName: '_headers', source: '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store\n'});
    this.emitFile({type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /\n'});
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'staging') resolveRuntimeEnvironment({...env, ...productionDefaults, MODE: mode});
  const legacyValues = mode === 'staging' ? Object.fromEntries(Object.keys(productionDefaults).map((key) => [key, ''])) : productionDefaults;
  return {
    plugins: [react(), stagingSafetyPlugin(mode)],
    define: Object.fromEntries(Object.entries(legacyValues).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])),
    server: {port: 5173, strictPort: true},
  };
});
