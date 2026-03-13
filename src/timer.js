// 60-second rest timer module

/**
 * @typedef {object} TimerState
 * @property {number} remaining - seconds remaining
 * @property {boolean} isRunning
 * @property {number|null} intervalId
 */

let timerState = {
  remaining: 60,
  isRunning: false,
  intervalId: null
};

let onTickCallback = null;
let onCompleteCallback = null;

/**
 * Start a rest timer
 * @param {number} seconds - Duration in seconds (default 60)
 * @param {function} onTick - Called every second with remaining seconds
 * @param {function} onComplete - Called when timer reaches 0
 */
export function startTimer(seconds = 60, onTick, onComplete) {
  stopTimer();
  
  timerState.remaining = seconds;
  timerState.isRunning = true;
  onTickCallback = onTick;
  onCompleteCallback = onComplete;
  
  if (onTick) onTick(timerState.remaining, seconds);
  
  timerState.intervalId = setInterval(() => {
    timerState.remaining--;
    
    if (onTickCallback) onTickCallback(timerState.remaining, seconds);
    
    if (timerState.remaining <= 0) {
      stopTimer();
      if (onCompleteCallback) onCompleteCallback();
    }
  }, 1000);
}

/**
 * Stop and clear the timer
 */
export function stopTimer() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  timerState.isRunning = false;
}

/**
 * Get remaining seconds
 * @returns {number}
 */
export function getRemaining() {
  return timerState.remaining;
}

/**
 * Check if timer is running
 * @returns {boolean}
 */
export function isTimerRunning() {
  return timerState.isRunning;
}
