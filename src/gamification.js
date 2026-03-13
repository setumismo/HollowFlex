// Gamification module: streaks, freezes, souls, senda

/**
 * Process post-workout gamification updates
 * @param {object} userData - Current user data
 * @param {'A' | 'B'} workoutType
 * @param {number[]} repsCompleted
 * @returns {object} Updated fields for Firestore
 */
export function processWorkoutRewards(userData, workoutType, repsCompleted) {
  const totalReps = repsCompleted.reduce((a, b) => a + b, 0);
  const updates = {};
  
  // Souls reward
  const soulsEarned = workoutType === 'A' ? 20 : 10;
  updates.souls = (userData.souls || 0) + soulsEarned;
  
  // Total pushups
  updates.total_pushups = (userData.total_pushups || 0) + totalReps;
  
  // Streak
  updates.streak = (userData.streak || 0) + 1;
  
  // Advance day node on the senda
  updates.current_day_node = Math.min(31, (userData.current_day_node || 1) + 1);
  
  // Total days trained
  updates.total_days_trained = (userData.total_days_trained || 0) + 1;
  
  // Last workout date
  updates.last_workout_date = new Date().toISOString().split('T')[0];
  
  // Streak freeze: earn 1 every 7 consecutive days, max 3
  const newStreak = updates.streak;
  if (newStreak > 0 && newStreak % 7 === 0) {
    const currentFreezes = userData.streak_freezes || 0;
    if (currentFreezes < 3) {
      updates.streak_freezes = currentFreezes + 1;
    }
  }
  
  return { updates, soulsEarned, totalReps };
}

/**
 * Check midnight streak logic
 * If no workout today and it's past midnight:
 * - If streak_freezes > 0, use one freeze
 * - If streak_freezes === 0, reset streak to 0
 * 
 * @param {object} userData
 * @returns {object|null} Updates to apply, or null if no change needed
 */
export function checkMidnightStreak(userData) {
  const today = new Date().toISOString().split('T')[0];
  const lastWorkout = userData.last_workout_date;
  
  // If last workout IS today, no action needed
  if (lastWorkout === today) return null;
  
  // If no last workout at all (new user), no action
  if (!lastWorkout) return null;
  
  // Calculate days since last workout
  const lastDate = new Date(lastWorkout);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  
  // Only act if they missed at least 1 day
  if (diffDays <= 1) return null;
  
  const freezes = userData.streak_freezes || 0;
  
  if (freezes > 0) {
    return {
      streak_freezes: freezes - 1,
      _streakFreezeUsed: true
    };
  } else {
    return {
      streak: 0,
      _streakLost: true
    };
  }
}

/**
 * Determine streak banner state
 * @param {object} userData
 * @returns {'completed' | 'danger' | 'lost' | null}
 */
export function getStreakBannerState(userData) {
  const today = new Date().toISOString().split('T')[0];
  const lastWorkout = userData.last_workout_date;
  
  // Just completed today
  if (lastWorkout === today) return 'completed';
  
  // Has a streak but hasn't trained today
  if ((userData.streak || 0) > 0 && lastWorkout) {
    const lastDate = new Date(lastWorkout);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 2 && userData.streak === 0) return 'lost';
    if (diffDays >= 1) return 'danger';
  }
  
  // Streak is 0 and they lost it recently
  if (userData.streak === 0 && lastWorkout) {
    return 'lost';
  }
  
  return null;
}

/**
 * Generate senda nodes for the current month
 * @param {number} currentDayNode - Current position (1-31)
 * @returns {Array<{ day: number, status: 'completed' | 'current' | 'locked' }>}
 */
export function generateSendaNodes(currentDayNode) {
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  
  const nodes = [];
  for (let i = 1; i <= daysInMonth; i++) {
    let status = 'locked';
    if (i < currentDayNode) status = 'completed';
    else if (i === currentDayNode) status = 'current';
    nodes.push({ day: i, status });
  }
  return nodes;
}
