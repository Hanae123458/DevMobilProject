// backend/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Ajoutez cette ligne

const firebaseConfig = {
  apiKey: "AIzaSyBQSuNM48oibD73gbY3hFj0rN2rQiK-MP0",
  authDomain: "devmobilproject.firebaseapp.com",
  projectId: "devmobilproject",
  storageBucket: "devmobilproject.firebasestorage.app",
  messagingSenderId: "1001708505160",
  appId: "1:1001708505160:web:abf0ad34c8abb2681d707d",
  measurementId: "G-PDYBCMH306"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Ajoutez cette ligne
export default app;