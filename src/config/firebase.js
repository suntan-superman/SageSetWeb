// Firebase configuration for SageSet Web Admin
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAfvT1fT1mBnx6Gg0TksunEQ6Prpdc1nSw",
  authDomain: "greencheck-d3d88.firebaseapp.com",
  projectId: "greencheck-d3d88",
  storageBucket: "greencheck-d3d88.firebasestorage.app",
  messagingSenderId: "541362391240",
  appId: "1:541362391240:web:d3fa46cff89bd0767e3dfd"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
