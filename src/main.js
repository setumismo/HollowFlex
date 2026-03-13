// Hollow Flex - Main Application
// SPA router, screen renderers, and UI binding

import { onAuthChange, signInWithGoogle, signInAsGuest, registerWithEmail, loginWithEmail, getCurrentUser } from './auth.js';
import { getUser, createUser, updateUser, saveWorkout, getLastDayAWorkout, hasTrainedToday } from './db.js';
import { calculateDayA, calculateDayB, applyFeedback, getWorkoutType, getWorkoutTitle } from './engine.js';
import { processWorkoutRewards, checkMidnightStreak, getStreakBannerState, generateSendaNodes } from './gamification.js';
import { playTapSound, playVictorySound, initAudio } from './sounds.js';
import { startTimer, stopTimer } from './timer.js';

// ===========================
// App State
// ===========================
const state = {
  user: null,        // Firebase Auth user
  profile: null,     // Firestore user profile
  currentScreen: 'loading',
  workoutType: 'A',  // 'A' or 'B'
  workoutSeries: [],  // Array of rep targets for each series
  currentSeries: 0,   // 0-indexed series counter
  repsRemaining: 0,
  repsCompleted: [],   // Reps done per series
  totalRepsThisWorkout: 0
};

const app = document.getElementById('app');

// ===========================
// Router
// ===========================
function navigate(screen) {
  state.currentScreen = screen;
  render();
}

// ===========================
// Render Dispatcher
// ===========================
function render() {
  switch (state.currentScreen) {
    case 'loading':
      renderLoading();
      break;
    case 'onboarding':
      renderOnboarding();
      break;
    case 'rm-test':
      renderRMTest();
      break;
    case 'home':
      renderHome();
      break;
    case 'workout':
      renderWorkout();
      break;
    case 'rest':
      renderRest();
      break;
    case 'victory':
      renderVictory();
      break;
    default:
      renderLoading();
  }
}

// ===========================
// Screen: Loading
// ===========================
function renderLoading() {
  app.innerHTML = `
    <div class="screen active loading-screen">
      <div class="spinner"></div>
      <p style="color: var(--text-secondary); font-size: 14px;">Cargando tu aventura...</p>
    </div>
  `;
}

// ===========================
// Screen: Onboarding (Login)
// ===========================
function renderOnboarding() {
  app.innerHTML = `
    <div class="screen active onboarding-screen">
      <div class="onboarding-logo">⚔️</div>
      <h1 class="onboarding-title">Hollow Flex</h1>
      <p class="onboarding-subtitle">
        Entrena flexiones como un caballero. Cada rep te acerca a la victoria.
      </p>
      
      <!-- Google Sign-In -->
      <button id="btn-google-login" class="btn-primary btn-google" style="max-width: 300px;">
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
        Entrar con Google
      </button>
      
      <div class="auth-divider">
        <span>o</span>
      </div>
      
      <!-- Email/Password form -->
      <div id="email-form" class="email-form" style="width:100%; max-width:300px; display:flex; flex-direction:column; gap:10px;">
        <input id="email-name" class="auth-input" type="text" placeholder="Tu nombre de guerrero" style="display:none;" />
        <input id="email-input" class="auth-input" type="email" placeholder="Email" />
        <input id="email-password" class="auth-input" type="password" placeholder="Contraseña (mín. 6 chars)" />
        <button id="btn-email-login" class="btn-primary" style="max-width: 300px;">
          <span class="material-symbols-rounded">login</span>
          Iniciar Sesión
        </button>
        <button id="btn-toggle-register" class="btn-text" type="button">
          ¿No tienes cuenta? <strong>Regístrate</strong>
        </button>
      </div>
      
      <div class="auth-divider">
        <span>o</span>
      </div>
      
      <!-- Anonymous / Guest -->
      <button id="btn-guest" class="btn-secondary" style="max-width: 300px;">
        <span class="material-symbols-rounded">person_outline</span>
        Entrar como Invitado
      </button>
    </div>
  `;
  
  let isRegisterMode = false;
  const nameInput = document.getElementById('email-name');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('email-password');
  const emailBtn = document.getElementById('btn-email-login');
  const toggleBtn = document.getElementById('btn-toggle-register');
  
  // Google Sign-In
  document.getElementById('btn-google-login').addEventListener('click', async () => {
    try {
      initAudio();
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login failed:', err);
      alert('Error al iniciar sesión con Google.');
    }
  });
  
  // Toggle login/register mode
  toggleBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    nameInput.style.display = isRegisterMode ? 'block' : 'none';
    emailBtn.innerHTML = isRegisterMode
      ? '<span class="material-symbols-rounded">person_add</span> Crear Cuenta'
      : '<span class="material-symbols-rounded">login</span> Iniciar Sesión';
    toggleBtn.innerHTML = isRegisterMode
      ? '¿Ya tienes cuenta? <strong>Inicia sesión</strong>'
      : '¿No tienes cuenta? <strong>Regístrate</strong>';
  });
  
  // Email login/register
  emailBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) { alert('Rellena email y contraseña.'); return; }
    if (password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres.'); return; }
    
    emailBtn.disabled = true;
    try {
      initAudio();
      if (isRegisterMode) {
        const name = nameInput.value.trim() || 'Caballero';
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      console.error('Email auth failed:', err);
      const msg = err.code === 'auth/user-not-found' ? 'No existe una cuenta con ese email.'
        : err.code === 'auth/wrong-password' ? 'Contraseña incorrecta.'
        : err.code === 'auth/email-already-in-use' ? 'Ese email ya está registrado. Inicia sesión.'
        : err.code === 'auth/invalid-email' ? 'Email no válido.'
        : 'Error de autenticación. Intenta de nuevo.';
      alert(msg);
      emailBtn.disabled = false;
    }
  });
  
  // Guest login
  document.getElementById('btn-guest').addEventListener('click', async () => {
    try {
      initAudio();
      await signInAsGuest();
    } catch (err) {
      console.error('Guest login failed:', err);
      alert('Error al entrar como invitado.');
    }
  });
}

// ===========================
// Screen: RM Test (Onboarding step 2)
// ===========================
function renderRMTest() {
  app.innerHTML = `
    <div class="screen active onboarding-screen">
      <div class="onboarding-logo">💪</div>
      <h1 class="onboarding-title">Test Inicial</h1>
      <p class="onboarding-subtitle">
        ¿Cuántas flexiones puedes hacer al fallo? Haz tu máximo absoluto y escribe el número.
      </p>
      <div class="rm-test">
        <label class="rm-test__label">Tu Rendimiento Máximo (RM)</label>
        <input 
          id="rm-input" 
          class="rm-test__input" 
          type="number" 
          min="1" 
          max="200" 
          placeholder="Ej: 20"
          inputmode="numeric"
        />
        <button id="btn-save-rm" class="btn-primary" disabled>
          <span class="material-symbols-rounded">save</span>
          Guardar y Empezar
        </button>
      </div>
    </div>
  `;
  
  const input = document.getElementById('rm-input');
  const btn = document.getElementById('btn-save-rm');
  
  input.addEventListener('input', () => {
    const val = parseInt(input.value);
    btn.disabled = !(val > 0 && val <= 200);
  });
  
  btn.addEventListener('click', async () => {
    const rm = parseInt(input.value);
    if (rm <= 0) return;
    
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    
    try {
      await updateUser(state.user.uid, { RM: rm });
      state.profile.RM = rm;
      navigate('home');
    } catch (err) {
      console.error('Error saving RM:', err);
      alert('Error al guardar. Intenta de nuevo.');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">save</span> Guardar y Empezar';
    }
  });
}

// ===========================
// Screen: Home - Senda Mensual
// ===========================
async function renderHome() {
  // Reload profile
  state.profile = await getUser(state.user.uid);
  const profile = state.profile;
  
  // Check midnight streak
  const streakUpdate = checkMidnightStreak(profile);
  if (streakUpdate) {
    const { _streakFreezeUsed, _streakLost, ...dbUpdates } = streakUpdate;
    await updateUser(state.user.uid, dbUpdates);
    Object.assign(profile, dbUpdates);
  }
  
  const nodes = generateSendaNodes(profile.current_day_node || 1);
  const bannerState = getStreakBannerState(profile);
  const todayTrained = await hasTrainedToday(state.user.uid);
  const workoutType = getWorkoutType(profile.total_days_trained || 0);
  
  let bannerHTML = '';
  if (bannerState === 'danger' && !todayTrained) {
    bannerHTML = `
      <div class="streak-banner streak-banner--danger">
        <div class="streak-banner__icon">🔥</div>
        <div class="streak-banner__text">
          <div class="streak-banner__title">¡RACHA EN PELIGRO!</div>
          <div class="streak-banner__desc">Tu racha de ${profile.streak} días peligra. ¡FLEXIONA HOY!</div>
        </div>
        <div class="streak-count">${profile.streak}🔥</div>
      </div>
    `;
  } else if (bannerState === 'lost') {
    bannerHTML = `
      <div class="streak-banner streak-banner--lost">
        <div class="streak-banner__icon">💀</div>
        <div class="streak-banner__text">
          <div class="streak-banner__title">RACHA PERDIDA</div>
          <div class="streak-banner__desc">Racha perdida... El abismo te reclama. ¡Vuelve a empezar!</div>
        </div>
        <div class="streak-count">0🔥</div>
      </div>
    `;
  } else if (bannerState === 'completed' && todayTrained) {
    bannerHTML = `
      <div class="streak-banner streak-banner--completed">
        <div class="streak-banner__icon">✅</div>
        <div class="streak-banner__text">
          <div class="streak-banner__title">MISIÓN COMPLETADA</div>
          <div class="streak-banner__desc">¡Racha completada! Te has fortalecido hoy.</div>
        </div>
        <div class="streak-count">${profile.streak}🔥</div>
      </div>
    `;
  }
  
  // Generate senda nodes HTML
  const nodesHTML = nodes.map(n => `
    <div class="senda-row">
      <div class="senda-node senda-node--${n.status}"${n.status === 'current' ? ' data-action="start-workout" role="button" tabindex="0"' : ''}>${
        n.status === 'completed' ? '✓' : n.day
      }</div>
      ${n.day < nodes.length ? `<div class="senda-connector senda-connector--${n.status === 'completed' ? 'done' : 'pending'}"></div>` : ''}
    </div>
  `).join('');
  
  app.innerHTML = `
    <div class="screen active">
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="top-bar__title">Hollow Flex</div>
        <div class="top-bar__souls">
          <span class="material-symbols-rounded">toll</span>
          ${profile.souls || 0}
        </div>
      </div>
      
      <!-- Zone info -->
      <div class="zone-label">Zona Mundial</div>
      <div class="zone-name">CRUCES OLVIDADOS</div>
      
      <!-- Day badges -->
      <div class="day-badges">
        <span class="day-badge day-badge--a">🔥 Día A - Intenso</span>
        <span class="day-badge day-badge--b">💎 Día B - Diamante</span>
        ${profile.streak_freezes > 0 ? `
          <div class="freeze-indicator">
            <span class="material-symbols-rounded">ac_unit</span>
            ${profile.streak_freezes}/3 Comodines
          </div>
        ` : ''}
      </div>
      
      <!-- Streak Banner -->
      ${bannerHTML}
      
      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__value">${profile.streak || 0}</div>
          <div class="stat-card__label">Racha</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${profile.total_pushups || 0}</div>
          <div class="stat-card__label">Flexiones</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${profile.RM || 0}</div>
          <div class="stat-card__label">RM</div>
        </div>
      </div>
      
      <!-- Senda Path -->
      <div class="senda-container">
        <div class="senda-path">
          ${nodesHTML}
        </div>
      </div>
      
      <!-- Bottom Nav -->
      <nav class="bottom-nav">
        <button class="nav-item active" data-nav="home">
          <span class="material-symbols-rounded nav-item__icon">map</span>
          <span class="nav-item__label">Sendero</span>
        </button>
        <button class="nav-item" data-nav="workout" id="nav-entreno">
          <span class="material-symbols-rounded nav-item__icon">exercise</span>
          <span class="nav-item__label">Entreno</span>
        </button>
        <button class="nav-item" data-nav="social">
          <span class="material-symbols-rounded nav-item__icon">group</span>
          <span class="nav-item__label">Social</span>
        </button>
        <button class="nav-item" data-nav="profile">
          <span class="material-symbols-rounded nav-item__icon">person_play</span>
          <span class="nav-item__label">Perfil</span>
        </button>
      </nav>
    </div>
  `;
  
  // Current day node starts the workout
  const currentNode = document.querySelector('[data-action="start-workout"]');
  if (currentNode) {
    currentNode.addEventListener('click', () => {
      initAudio();
      startWorkout();
    });
  }
  
  // Nav handlers
  document.getElementById('nav-entreno').addEventListener('click', () => {
    initAudio();
    startWorkout();
  });
  
  // Other nav items (placeholders)
  document.querySelectorAll('.nav-item[data-nav="social"], .nav-item[data-nav="profile"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Future feature
    });
  });
}

// ===========================
// Start Workout Flow
// ===========================
async function startWorkout() {
  const profile = state.profile;
  
  // Check if already trained today
  const trained = await hasTrainedToday(state.user.uid);
  if (trained) {
    alert('¡Ya has entrenado hoy! Descansa y vuelve mañana, caballero. ⚔️');
    return;
  }
  
  state.workoutType = getWorkoutType(profile.total_days_trained || 0);
  state.repsCompleted = [];
  state.currentSeries = 0;
  
  if (state.workoutType === 'A') {
    // Day A: 3 series
    const dayA = calculateDayA(profile.RM, profile.rm_adjustments || { series1_bonus: 0, series3_bonus: 0 });
    state.workoutSeries = [dayA.series1, dayA.series2, dayA.series3];
  } else {
    // Day B: 1 series of diamond pushups
    const lastDayA = await getLastDayAWorkout(state.user.uid);
    const reps = calculateDayB(lastDayA, profile.RM);
    state.workoutSeries = [reps];
  }
  
  state.repsRemaining = state.workoutSeries[0];
  state.totalRepsThisWorkout = 0;
  navigate('workout');
}

// ===========================
// Screen: Workout (Active)
// ===========================
function renderWorkout() {
  const isB = state.workoutType === 'B';
  const seriesLabel = isB
    ? `Serie única · Diamante 💎`
    : `Serie ${state.currentSeries + 1} de ${state.workoutSeries.length}`;
  
  const instructionHTML = isB
    ? `<p class="workout-instruction workout-instruction--diamond">HOY TOCA VARIANTE: FLEXIONES DE DIAMANTE 💎</p>`
    : `<p class="workout-instruction">Mantén la postura... Baja el pecho hasta el suelo.</p>`;
  
  app.innerHTML = `
    <div class="screen active workout-screen">
      <div class="workout-header">
        <div class="workout-header__title">Hollow Flex</div>
      </div>
      <div class="workout-series-info">${seriesLabel}</div>
      <div id="workout-counter" class="workout-counter">${state.repsRemaining}</div>
      <div class="workout-counter-label">Flexiones Restantes</div>
      <button id="nose-button" class="nose-button" aria-label="Registrar flexión">
        <span class="nose-button-text">TOCA CON LA NARIZ</span>
      </button>
      ${instructionHTML}
    </div>
  `;
  
  const counterEl = document.getElementById('workout-counter');
  const noseBtn = document.getElementById('nose-button');
  
  noseBtn.addEventListener('click', () => {
    if (state.repsRemaining <= 0) return;
    
    state.repsRemaining--;
    state.totalRepsThisWorkout++;
    
    // Update counter with bump animation
    counterEl.textContent = state.repsRemaining;
    counterEl.classList.add('bump');
    setTimeout(() => counterEl.classList.remove('bump'), 150);
    
    // Play tap sound
    playTapSound();
    
    // Check if series complete
    if (state.repsRemaining <= 0) {
      const seriesReps = state.workoutSeries[state.currentSeries];
      state.repsCompleted.push(seriesReps);
      
      state.currentSeries++;
      
      if (state.currentSeries < state.workoutSeries.length) {
        // More series to go → show rest timer
        setTimeout(() => navigate('rest'), 400);
      } else {
        // All series done → victory!
        setTimeout(() => navigate('victory'), 400);
      }
    }
  });
}

// ===========================
// Screen: Rest Timer
// ===========================
function renderRest() {
  const totalSeconds = 60;
  const circumference = 2 * Math.PI * 88; // radius = 88
  
  app.innerHTML = `
    <div class="screen active rest-screen">
      <div class="rest-label">Descanso</div>
      <div class="rest-timer-circle">
        <svg viewBox="0 0 200 200">
          <circle class="rest-timer-circle__track" cx="100" cy="100" r="88" />
          <circle id="timer-progress" class="rest-timer-circle__progress" cx="100" cy="100" r="88"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="0" />
        </svg>
        <div id="timer-text" class="rest-timer-text">${totalSeconds}</div>
      </div>
      <div class="rest-next-info">
        Siguiente: Serie ${state.currentSeries + 1} · ${state.workoutSeries[state.currentSeries]} reps
      </div>
      <button id="skip-rest" class="btn-secondary" style="max-width: 200px;">
        <span class="material-symbols-rounded">skip_next</span>
        Saltar descanso
      </button>
    </div>
  `;
  
  const progressEl = document.getElementById('timer-progress');
  const textEl = document.getElementById('timer-text');
  const skipBtn = document.getElementById('skip-rest');
  
  startTimer(totalSeconds, (remaining, total) => {
    textEl.textContent = remaining;
    const offset = circumference * (1 - remaining / total);
    progressEl.style.strokeDashoffset = offset;
  }, () => {
    // Timer complete - move to next series
    state.repsRemaining = state.workoutSeries[state.currentSeries];
    navigate('workout');
  });
  
  skipBtn.addEventListener('click', () => {
    stopTimer();
    state.repsRemaining = state.workoutSeries[state.currentSeries];
    navigate('workout');
  });
}

// ===========================
// Screen: Victory
// ===========================
function renderVictory() {
  playVictorySound();
  
  const isA = state.workoutType === 'A';
  const totalReps = state.repsCompleted.reduce((a, b) => a + b, 0);
  const soulsEarned = isA ? 20 : 10;
  
  const feedbackHTML = isA ? `
    <div class="feedback-group">
      <div class="feedback-label">¿Qué te ha parecido la sesión?</div>
      <button class="feedback-btn feedback-btn--easy" data-feedback="1">
        😊 Fácil
      </button>
      <button class="feedback-btn feedback-btn--normal" data-feedback="2">
        💪 Normal
      </button>
      <button class="feedback-btn feedback-btn--hard" data-feedback="3">
        🥵 Al límite
      </button>
    </div>
  ` : `
    <button id="btn-finish-b" class="btn-primary" style="max-width: 300px;">
      <span class="material-symbols-rounded">home</span>
      Volver al Sendero
    </button>
  `;
  
  app.innerHTML = `
    <div class="screen active victory-screen">
      <img class="victory-image" src="/assets/victoria_knight.png" alt="Victoria" />
      <h2 class="victory-title">¡Gran trabajo, pequeño guerrero!</h2>
      <p class="victory-subtitle">Victoria obtenida · ${getWorkoutTitle(state.workoutType)}</p>
      
      <div class="victory-stats">
        <div class="victory-stat">
          <div class="victory-stat__value">${totalReps}</div>
          <div class="victory-stat__label">Flexiones</div>
        </div>
        <div class="victory-stat">
          <div class="victory-stat__value">+${soulsEarned}</div>
          <div class="victory-stat__label">Souls</div>
        </div>
        <div class="victory-stat">
          <div class="victory-stat__value">${state.repsCompleted.length}</div>
          <div class="victory-stat__label">Series</div>
        </div>
      </div>
      
      ${feedbackHTML}
    </div>
  `;
  
  if (isA) {
    // Day A: feedback buttons
    document.querySelectorAll('.feedback-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const feedback = parseInt(btn.dataset.feedback);
        await finishWorkout(feedback);
      });
    });
  } else {
    // Day B: direct finish
    document.getElementById('btn-finish-b').addEventListener('click', async () => {
      await finishWorkout(null);
    });
  }
}

// ===========================
// Finish Workout (save to DB + gamification)
// ===========================
async function finishWorkout(feedback) {
  const profile = state.profile;
  
  // Disable all buttons to prevent double-tap
  document.querySelectorAll('.feedback-btn, #btn-finish-b').forEach(b => {
    b.disabled = true;
    b.style.opacity = '0.5';
  });
  
  try {
    // 1. Save workout to Firestore
    await saveWorkout(state.user.uid, {
      type: state.workoutType,
      reps_completed: state.repsCompleted,
      feedback: feedback
    });
    
    // 2. Process gamification rewards
    const { updates, soulsEarned, totalReps } = processWorkoutRewards(
      profile, state.workoutType, state.repsCompleted
    );
    
    // 3. Apply feedback-based RM adjustment (Day A only)
    if (feedback !== null && state.workoutType === 'A') {
      const { adjustments, consecutiveHard } = applyFeedback(
        feedback,
        profile.rm_adjustments || { series1_bonus: 0, series3_bonus: 0 },
        profile.consecutive_hard_feedbacks || 0
      );
      updates.rm_adjustments = adjustments;
      updates.consecutive_hard_feedbacks = consecutiveHard;
    }
    
    // 4. Update user profile
    await updateUser(state.user.uid, updates);
    Object.assign(state.profile, updates);
    
    // 5. Navigate to home
    navigate('home');
    
  } catch (err) {
    console.error('Error finishing workout:', err);
    alert('Error al guardar el entrenamiento. Intenta de nuevo.');
    document.querySelectorAll('.feedback-btn, #btn-finish-b').forEach(b => {
      b.disabled = false;
      b.style.opacity = '1';
    });
  }
}

// ===========================
// Auth State & Init
// ===========================
async function init() {
  renderLoading();
  
  onAuthChange(async (user) => {
    if (user) {
      state.user = user;
      
      // Try to load or create profile
      let profile = null;
      try {
        profile = await getUser(user.uid);
      } catch (err) {
        console.warn('getUser failed, will create profile:', err.message);
      }
      
      // If profile doesn't exist, create it
      if (!profile) {
        try {
          await createUser(user.uid, {
            email: user.email || '',
            displayName: user.displayName || 'Caballero',
          });
          profile = await getUser(user.uid);
        } catch (err) {
          console.error('Failed to create user profile:', err);
        }
      }
      
      state.profile = profile;
      
      if (!profile || profile.RM === 0) {
        navigate('rm-test');
      } else {
        navigate('home');
      }
    } else {
      state.user = null;
      state.profile = null;
      navigate('onboarding');
    }
  });
}

// Start the app
init();
