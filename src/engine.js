// Workout Engine - Day A & Day B calculation, RM adjustment
// Day A: 3 series at percentages of RM
// Day B: 1 series of diamond pushups = series2 of last Day A

/**
 * Calculate Day A series reps
 * @param {number} rm - Current RM
 * @param {object} adjustments - { series1_bonus, series3_bonus }
 * @returns {{ series1: number, series2: number, series3: number }}
 */
export function calculateDayA(rm, adjustments = { series1_bonus: 0, series3_bonus: 0 }) {
  const base1 = Math.round(rm * 0.65); // 60-70% midpoint
  const base2 = Math.round(rm * 0.55); // 50-60% midpoint  
  const base3 = Math.round(rm * 0.55); // 50-60% midpoint
  
  return {
    series1: Math.max(1, base1 + (adjustments.series1_bonus || 0)),
    series2: Math.max(1, base2),
    series3: Math.max(1, base3 + (adjustments.series3_bonus || 0))
  };
}

/**
 * Calculate Day B reps (diamond pushups)
 * @param {object|null} lastDayA - Last Day A workout data
 * @param {number} rm - Current RM (fallback)
 * @returns {number}
 */
export function calculateDayB(lastDayA, rm) {
  if (lastDayA && lastDayA.reps_completed && lastDayA.reps_completed.length >= 2) {
    // Reps = series2 of last Day A
    return lastDayA.reps_completed[1];
  }
  // Fallback: 55% of RM
  return Math.max(1, Math.round(rm * 0.55));
}

/**
 * Apply feedback adjustment to RM bonuses
 * Feedback 1 (Easy): +1 to series1 and series3
 * Feedback 2 (Normal): +1 to series3 only
 * Feedback 3 (Hard): maintain. If 2 consecutive hard, -1 to all
 * 
 * @param {number} feedback - 1, 2, or 3
 * @param {object} currentAdjustments - { series1_bonus, series3_bonus }
 * @param {number} consecutiveHard - count of consecutive "hard" feedbacks
 * @returns {{ adjustments: object, consecutiveHard: number }}
 */
export function applyFeedback(feedback, currentAdjustments, consecutiveHard = 0) {
  const adj = { ...currentAdjustments };
  
  switch (feedback) {
    case 1: // Easy - bump series1 & series3
      adj.series1_bonus = (adj.series1_bonus || 0) + 1;
      adj.series3_bonus = (adj.series3_bonus || 0) + 1;
      return { adjustments: adj, consecutiveHard: 0 };
    
    case 2: // Normal - bump series3 only
      adj.series3_bonus = (adj.series3_bonus || 0) + 1;
      return { adjustments: adj, consecutiveHard: 0 };
    
    case 3: // Hard - maintain, or lower if 2 consecutive
      if (consecutiveHard >= 1) {
        // 2nd consecutive hard: lower by 1
        adj.series1_bonus = Math.max(0, (adj.series1_bonus || 0) - 1);
        adj.series3_bonus = Math.max(0, (adj.series3_bonus || 0) - 1);
        return { adjustments: adj, consecutiveHard: 0 };
      }
      return { adjustments: adj, consecutiveHard: consecutiveHard + 1 };
    
    default:
      return { adjustments: adj, consecutiveHard };
  }
}

/**
 * Determine today's workout type
 * Simple alternation: odd training days = A, even = B
 * @param {number} totalDaysTrained
 * @returns {'A' | 'B'}
 */
export function getWorkoutType(totalDaysTrained) {
  // First day is always Day A, then alternates
  return (totalDaysTrained % 2 === 0) ? 'A' : 'B';
}

/**
 * Get workout description for display
 * @param {'A' | 'B'} type
 * @returns {string}
 */
export function getWorkoutTitle(type) {
  return type === 'A' ? 'Día A - Intenso 🔥' : 'Día B - Diamante 💎';
}
