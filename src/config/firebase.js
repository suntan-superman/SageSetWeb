// Firebase configuration for SageSet Web Admin
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { runtimeEnvironment } from './runtimeEnvironment.js';

const firebaseConfig = runtimeEnvironment.isStaging ? runtimeEnvironment.firebase : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_LEGACY_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_LEGACY_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_LEGACY_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_LEGACY_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_LEGACY_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.VITE_LEGACY_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
// The reCAPTCHA Enterprise site key is public client configuration. Keep a
// production fallback so Git-connected Netlify builds remain protected even
// when the optional environment override has not been configured.
const appCheckSiteKey = runtimeEnvironment.isStaging ?
  runtimeEnvironment.appCheckSiteKey :
  (import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || import.meta.env.VITE_LEGACY_FIREBASE_APPCHECK_SITE_KEY);
// Meta release certification uses an explicitly marked route and should not
// create first-party analytics or request a real-browser App Check attestation.
// Omitting App Check never bypasses server enforcement; protected requests
// remain protected and would be rejected without a valid token.
const isMetaReleaseCheck =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('release_check') === 'meta';
const appCheck = appCheckSiteKey && !isMetaReleaseCheck
  ? initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null;

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, appCheck, auth, db, functions, storage };
