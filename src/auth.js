// Authentication module - Google, Email/Password, Anonymous
import { auth, googleProvider } from './firebase.js';
import {
  signInWithPopup,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth';
import { getUser, createUser } from './db.js';

/**
 * Sign in with Google popup
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await ensureUserProfile(user);
  return user;
}

/**
 * Sign in anonymously (guest mode)
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInAsGuest() {
  const result = await signInAnonymously(auth);
  const user = result.user;
  await ensureUserProfile(user, 'Caballero Anónimo');
  return user;
}

/**
 * Register with email & password
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function registerWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  if (displayName) {
    await updateProfile(user, { displayName });
  }
  await ensureUserProfile(user, displayName);
  return user;
}

/**
 * Login with email & password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Ensure user has a Firestore profile. Creates one if missing.
 * @param {import('firebase/auth').User} user
 * @param {string} [fallbackName]
 */
async function ensureUserProfile(user, fallbackName = 'Caballero') {
  try {
    const existing = await getUser(user.uid);
    if (!existing) {
      await createUser(user.uid, {
        email: user.email || '',
        displayName: user.displayName || fallbackName,
      });
    }
  } catch (err) {
    // If getUser fails (e.g., doc doesn't exist yet), just create it
    console.warn('ensureUserProfile fallback:', err.message);
    await createUser(user.uid, {
      email: user.email || '',
      displayName: user.displayName || fallbackName,
    });
  }
}

/**
 * Sign out current user
 */
export async function logOut() {
  await signOut(auth);
}

/**
 * Listen to auth state changes
 * @param {function} callback 
 * @returns {function} unsubscribe
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}
