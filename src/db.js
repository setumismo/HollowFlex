// Firestore CRUD operations
import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, orderBy, limit, getDocs,
  serverTimestamp, Timestamp
} from 'firebase/firestore';

/**
 * Create a new user document in Firestore
 * @param {string} uid
 * @param {object} data - { email, displayName }
 */
export async function createUser(uid, data) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    email: data.email || '',
    displayName: data.displayName || 'Caballero',
    RM: 0,
    streak: 0,
    streak_freezes: 0,
    souls: 0,
    total_pushups: 0,
    current_day_node: 1,
    total_days_trained: 0,
    last_workout_date: null,
    consecutive_hard_feedbacks: 0,
    rm_adjustments: { series1_bonus: 0, series3_bonus: 0 },
    createdAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Get user profile from Firestore
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUser(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Update user profile partially
 * @param {string} uid
 * @param {object} data
 */
export async function updateUser(uid, data) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
}

/**
 * Save a workout document
 * @param {string} uid
 * @param {object} workout - { type, reps_completed, feedback? }
 */
export async function saveWorkout(uid, workout) {
  const workoutsRef = collection(db, 'workouts', uid, 'sessions');
  await addDoc(workoutsRef, {
    date: serverTimestamp(),
    type: workout.type, // "A" or "B"
    reps_completed: workout.reps_completed, // array of ints
    feedback: workout.feedback || null, // 1, 2, 3 or null (for Day B)
    dateString: new Date().toISOString().split('T')[0] // "YYYY-MM-DD" for querying
  });
}

/**
 * Get the last completed Day A workout
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getLastDayAWorkout(uid) {
  const workoutsRef = collection(db, 'workouts', uid, 'sessions');
  const q = query(
    workoutsRef,
    where('type', '==', 'A'),
    orderBy('date', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

/**
 * Get the N most recent Day A feedbacks
 * @param {string} uid
 * @param {number} n
 * @returns {Promise<number[]>}
 */
export async function getRecentDayAFeedbacks(uid, n = 2) {
  const workoutsRef = collection(db, 'workouts', uid, 'sessions');
  const q = query(
    workoutsRef,
    where('type', '==', 'A'),
    orderBy('date', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().feedback);
}

/**
 * Check if user has already trained today
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export async function hasTrainedToday(uid) {
  const today = new Date().toISOString().split('T')[0];
  const workoutsRef = collection(db, 'workouts', uid, 'sessions');
  const q = query(
    workoutsRef,
    where('dateString', '==', today),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Get today's date string
 * @returns {string} YYYY-MM-DD
 */
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}
