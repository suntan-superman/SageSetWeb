// Firebase configuration for SageSet Web Admin
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyAfvT1fT1mBnx6Gg0TksunEQ6Prpdc1nSw",
  authDomain: "greencheck-d3d88.firebaseapp.com",
  projectId: "greencheck-d3d88",
  storageBucket: "greencheck-d3d88.firebasestorage.app",
  messagingSenderId: "541362391240",
  appId: "1:541362391240:web:d3fa46cff89bd0767e3dfd"
};

const app = initializeApp(firebaseConfig);
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
const appCheck = appCheckSiteKey
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
