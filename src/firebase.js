// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQPOy-7iNlv0QkOA-9wOTYlu8gVpa5oGI",
  authDomain: "hollow-flex.firebaseapp.com",
  projectId: "hollow-flex",
  storageBucket: "hollow-flex.firebasestorage.app",
  messagingSenderId: "174776007332",
  appId: "1:174776007332:web:6dd38ffdaec319854c8431"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
