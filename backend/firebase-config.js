import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQSuNM48oibD73gbY3hFj0rN2rQiK-MP0",
  authDomain: "devmobilproject.firebaseapp.com",
  projectId: "devmobilproject",
  storageBucket: "devmobilproject.firebasestorage.app",
  messagingSenderId: "1001708505160",
  appId: "1:1001708505160:web:abf0ad34c8abb2681d707d",
  measurementId: "G-PDYBCMH306"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter l'authentification
export const auth = getAuth(app);
export default app;