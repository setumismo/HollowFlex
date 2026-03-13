// Hollow Flex - Main Application
// SPA router, screen renderers, and UI binding

import { homeMascotImg, workoutNoseImg, victoryMascotImg } from './images.js';
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
  state.profile = await getUser(state.user.uid);
  const profile = state.profile;
  
  const streakUpdate = checkMidnightStreak(profile);
  if (streakUpdate) {
    const { _streakFreezeUsed, _streakLost, ...dbUpdates } = streakUpdate;
    await updateUser(state.user.uid, dbUpdates);
    Object.assign(profile, dbUpdates);
  }
  
  const nodes = generateSendaNodes(profile.current_day_node || 1);
  const bannerState = getStreakBannerState(profile);
  const todayTrained = await hasTrainedToday(state.user.uid);
  
  const nodesHTML = nodes.slice().reverse().map((n, index) => {
    const isCompleted = n.status === 'completed';
    const isCurrent = n.status === 'current';
    
    let ml = index % 2 === 0 ? 'ml-24' : 'mr-16'; 
    if(index === 0) ml = 'ml-32';
    if(index === nodes.length - 1) ml = 'mr-4';

    if (isCurrent) {
        return `
            <div class="relative flex flex-col items-center ${ml}">
                <div class="absolute -top-16 flex flex-col items-center knight-float z-20">
                    <div class="relative cursor-pointer" data-action="start-workout" role="button" tabindex="0">
                        <div class="w-[84px] h-[84px] rounded-full bg-knight-blue crochet-border flex items-center justify-center pulse-glow">
                            <img src="${homeMascotImg}" alt="Knight" class="w-[64px] h-[64px] object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)]"/>
                        </div>
                    </div>
                </div>
                <div class="size-20 rounded-full bg-slate-800 border-4 border-knight-blue/50 flex flex-col items-center justify-center shadow-lg shadow-black/50 z-10 mt-4 cursor-pointer" data-action="start-workout" role="button" tabindex="0">
                    <span class="text-white text-xl font-extrabold drop-shadow-md">${n.day}</span>
                </div>
                <div class="mt-4 bg-accent-soul px-4 py-1 rounded-full shadow-lg z-10">
                    <p class="text-[10px] font-black text-knight-blue uppercase">Día ${n.day % 2 === 0 ? 'B' : 'A'}</p>
                </div>
            </div>
        `;
    } else if (isCompleted) {
        return `
            <div class="flex flex-col items-center ${ml} opacity-80 cursor-default">
                <div class="size-14 rounded-full bg-knight-blue border-4 border-primary/40 flex items-center justify-center text-primary font-bold shadow-lg shadow-black/50 relative">
                    <span class="material-symbols-outlined text-background-dark absolute -right-2 -top-2 bg-green-400 rounded-full text-sm p-0.5 border-2 border-slate-800 shadow-md">check</span>
                    ${n.day}
                </div>
                <p class="mt-2 text-[10px] font-bold text-primary opacity-70 uppercase bg-slate-800/50 px-2 py-0.5 rounded backdrop-blur-sm">Día ${n.day % 2 === 0 ? 'B' : 'A'}</p>
            </div>
        `;
    } else {
        return `
            <div class="flex flex-col items-center group ${ml} opacity-70">
                <div class="size-12 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-slate-500 font-bold shadow-inner">${n.day}</div>
                <p class="mt-2 text-[10px] font-bold text-slate-500 uppercase">Día ${n.day % 2 === 0 ? 'B' : 'A'}</p>
            </div>
        `;
    }
  }).join('');
  
  app.innerHTML = `
    <div class="screen active flex flex-col min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
        <header class="sticky top-0 z-50 px-4 pt-6 pb-4">
            <div class="bg-knight-blue/90 banner-texture rounded-lg border-b-4 border-black/20 p-4 shadow-xl flex flex-row items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="bg-orange-500 rounded-full p-2 flex items-center justify-center shadow-inner">
                        <span class="material-symbols-outlined text-white text-xl">local_fire_department</span>
                    </div>
                    <div class="flex flex-col">
                        <h2 class="text-primary text-xs font-bold tracking-widest uppercase opacity-70">Zona Mundial</h2>
                        <h1 class="text-white text-lg font-extrabold tracking-tight">CRUCES OLVIDADOS</h1>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex flex-col items-end">
                        <div class="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full border border-white/10">
                            <span class="material-symbols-outlined text-primary text-sm fill-1">toll</span>
                            <span class="text-xs font-bold text-primary leading-none">${profile.souls || 0}</span>
                        </div>
                        ${profile.streak_freezes > 0 ? `<div class="flex items-center gap-1 mt-1"><span class="material-symbols-outlined text-[10px] text-blue-300">ac_unit</span><span class="text-[10px] font-bold text-blue-300 leading-none">${profile.streak_freezes}/3</span></div>` : `<div class="flex items-center gap-1 mt-1"><span class="text-[10px] font-bold ${bannerState === 'danger' && !todayTrained ? 'text-red-400 animate-pulse' : 'text-primary/70'} leading-none">Racha: ${profile.streak || 0}🔥</span></div>`}
                    </div>
                    <div class="size-10 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center overflow-hidden cursor-pointer" data-nav="profile">
                        <span class="material-symbols-outlined text-primary">account_circle</span>
                    </div>
                </div>
            </div>
            <div class="mt-4 text-center">
                <span class="bg-knight-blue/30 text-primary text-[10px] font-bold py-1 px-4 rounded-full border border-primary/20 tracking-[0.2em] uppercase">Senda Mensual del Caballero</span>
            </div>
        </header>

        <main class="flex-1 relative px-6 py-8 handcrafted-path">
            <div class="absolute inset-0 pointer-events-none overflow-hidden">
                <svg class="w-full h-full opacity-30" fill="none" viewbox="0 0 400 1200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M200 0 Q250 150 100 300 T200 600 T300 900 T150 1200" stroke="#2e586b" stroke-dasharray="20 10" stroke-width="12"></path>
                </svg>
            </div>
            
            <div class="relative z-10 flex flex-col items-center gap-24">
                ${nodesHTML}
            </div>

            <!-- Float Action Button -->
            <div class="fixed bottom-24 right-6 z-20">
                <button id="fab-workout" class="bg-primary text-background-dark h-16 w-16 rounded-full shadow-[0_8px_30px_rgb(224,245,255,0.3)] flex items-center justify-center active:scale-95 transition-transform border-4 border-white/20">
                    <span class="material-symbols-outlined text-3xl font-bold">play_arrow</span>
                </button>
            </div>
        </main>

        <nav class="sticky bottom-0 bg-background-dark border-t border-primary/10 px-6 py-4 pb-8 flex justify-between items-center z-50">
            <a class="flex flex-col items-center gap-1 group" href="#" data-nav="home">
                <div class="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
                    <span class="material-symbols-outlined text-primary fill-1">map</span>
                </div>
                <span class="text-[10px] font-bold text-primary tracking-tighter">SENDERO</span>
            </a>
            <a class="flex flex-col items-center gap-1 group opacity-40 cursor-pointer" id="nav-entreno">
                <div class="p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <span class="material-symbols-outlined text-slate-100">exercise</span>
                </div>
                <span class="text-[10px] font-bold text-slate-100 tracking-tighter">ENTRENO</span>
            </a>
            <a class="flex flex-col items-center gap-1 group opacity-40 cursor-pointer" data-nav="social">
                <div class="p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <span class="material-symbols-outlined text-slate-100">group</span>
                </div>
                <span class="text-[10px] font-bold text-slate-100 tracking-tighter">SOCIAL</span>
            </a>
            <a class="flex flex-col items-center gap-1 group opacity-40 cursor-pointer" data-nav="profile">
                <div class="p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <span class="material-symbols-outlined text-slate-100">person_play</span>
                </div>
                <span class="text-[10px] font-bold text-slate-100 tracking-tighter">PERFIL</span>
            </a>
        </nav>
    </div>
  `;
  
  const currentNode = document.querySelectorAll('[data-action="start-workout"]');
  currentNode.forEach(node => {
      node.addEventListener('click', () => {
          initAudio();
          startWorkout();
      });
  });
  
  document.getElementById('nav-entreno').addEventListener('click', () => {
    initAudio();
    startWorkout();
  });
  document.getElementById('fab-workout').addEventListener('click', () => {
    initAudio();
    startWorkout();
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
    console.warn("User already trained today, allowing test run bypass");
    // if (!confirm("Ya has entrenado hoy. ¿Quieres hacer un entrenamiento de prueba de todos modos? (No sumará a la racha real)")) {
    //     return;
    // }
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
  
  const setIndicatorsHTML = state.workoutSeries.map((reps, index) => {
      const isActive = index === state.currentSeries;
      const isCompleted = index < state.currentSeries;
      const isPending = index > state.currentSeries;
      
      if (isCompleted || isActive) {
          return `
            <div class="flex flex-col items-center gap-2">
                <div class="w-20 h-24 ${isActive ? 'bg-primary/20 border-primary/40 amigurumi-shadow' : 'bg-primary/40 border-primary/60'} rounded-xl border-2 flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/knitted-net.png')]"></div>
                    <span class="material-symbols-outlined text-primary text-4xl ${isActive ? 'animate-pulse' : ''}">${isCompleted ? 'check' : 'favorite'}</span>
                </div>
                <span class="text-[10px] font-bold tracking-widest uppercase ${isActive ? 'text-primary' : 'text-primary/60'}">SET ${index + 1}</span>
            </div>
          `;
      } else {
          return `
            <div class="flex flex-col items-center gap-2">
                <div class="w-20 h-24 bg-slate-800/40 rounded-xl border-2 border-slate-700 flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/knitted-net.png')]"></div>
                    <span class="material-symbols-outlined text-slate-600 text-4xl">favorite</span>
                </div>
                <span class="text-[10px] font-bold tracking-widest uppercase text-slate-600">SET ${index + 1}</span>
            </div>
          `;
      }
  }).join('');
  
  app.innerHTML = `
    <div class="screen active crochet-texture bg-background-light dark:bg-background-dark min-h-screen flex flex-col overflow-x-hidden font-display text-slate-900 dark:text-slate-100">
        <nav class="flex items-center justify-between p-6 z-10 w-full relative">
            <button class="dark:text-slate-100 hover:opacity-80 transition-opacity" id="btn-back-home">
                <span class="material-symbols-outlined text-3xl">arrow_back</span>
            </button>
            <h2 class="text-lg font-bold tracking-tight uppercase">Hollow Flex</h2>
            <div class="w-8"></div>
        </nav>
        
        <div class="flex justify-center gap-6 px-4 py-8 z-10 relative">
            ${setIndicatorsHTML}
        </div>
        
        <main class="flex-1 flex flex-col items-center justify-center px-6 z-10 relative">
            <div class="relative">
                <h1 id="workout-counter" class="text-[140px] font-black leading-none tracking-tighter drop-shadow-2xl transition-transform duration-100 text-slate-900 dark:text-white">
                    ${state.repsRemaining}
                </h1>
                <div class="absolute -inset-4 border-4 border-dashed border-primary/30 rounded-full -z-10 animate-pulse"></div>
            </div>
            <h2 class="text-primary text-xl font-bold leading-tight tracking-[0.2em] uppercase mt-4 text-center">
                Flexiones<br />Restantes
            </h2>
        </main>
        
        <footer class="p-8 pb-12 flex flex-col items-center gap-6 z-10 relative">
            <div class="relative group">
                <button id="nose-button" class="relative z-10 flex flex-col items-center justify-center w-64 h-64 rounded-full bg-slate-100 dark:bg-slate-800 text-background-dark dark:text-slate-100 transition-transform active:scale-95 shadow-[0_20px_50px_rgba(224,245,255,0.3)] border-8 border-primary/20 overflow-hidden">
                    <div class="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]"></div>
                    <img src="${workoutNoseImg}" class="w-16 h-16 object-contain mb-4" />
                    <span class="text-center font-black text-xl leading-tight tracking-tight px-8">
                        TOQUE CON<br/>LA NARIZ
                    </span>
                </button>
                <div class="absolute -inset-4 rounded-full border border-primary/20 border-dashed"></div>
            </div>
            
            <div class="flex flex-col items-center gap-1">
                <p class="text-primary/60 text-xs font-medium tracking-widest uppercase text-center">
                    ${isB ? 'HOY TOCA VARIANTE: FLEXIONES DE DIAMANTE 💎' : 'Mantén la postura... Baja el pecho.'}
                </p>
                <div class="flex gap-1 mt-2">
                    <div class="h-1 w-8 bg-primary rounded-full"></div>
                    <div class="h-1 w-4 bg-primary/30 rounded-full"></div>
                    <div class="h-1 w-4 bg-primary/30 rounded-full"></div>
                </div>
            </div>
        </footer>
        
        <div class="absolute top-1/4 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none"></div>
        <div class="absolute bottom-1/4 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none"></div>
    </div>
  `;
  
  const counterEl = document.getElementById('workout-counter');
  const noseBtn = document.getElementById('nose-button');
  const backBtn = document.getElementById('btn-back-home');
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      navigate('home');
    });
  }
  
  noseBtn.addEventListener('click', () => {
    if (state.repsRemaining <= 0) return;
    
    state.repsRemaining--;
    state.totalRepsThisWorkout++;
    
    counterEl.textContent = state.repsRemaining;
    counterEl.classList.add('scale-90');
    setTimeout(() => counterEl.classList.remove('scale-90'), 150);
    
    playTapSound();
    
    if (state.repsRemaining <= 0) {
      const seriesReps = state.workoutSeries[state.currentSeries];
      state.repsCompleted.push(seriesReps);
      
      state.currentSeries++;
      
      if (state.currentSeries < state.workoutSeries.length) {
        setTimeout(() => navigate('rest'), 400);
      } else {
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
  const circumference = 2 * Math.PI * 88;
  
  app.innerHTML = `
    <div class="screen active crochet-texture bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-12 tracking-tight z-10 relative">Descanso</h2>
        
        <div class="relative flex items-center justify-center z-10">
            <svg viewBox="0 0 200 200" class="-rotate-90 w-64 h-64">
                <circle cx="100" cy="100" r="88" class="stroke-slate-300 dark:stroke-slate-800/60" stroke-width="12" fill="none" />
                <circle id="timer-progress" cx="100" cy="100" r="88" stroke="currentColor" stroke-width="12" fill="none"
                    class="text-primary transition-all duration-1000 ease-linear"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="0" stroke-linecap="round" />
            </svg>
            <div id="timer-text" class="absolute text-5xl font-black text-slate-900 dark:text-white drop-shadow-lg">${totalSeconds}</div>
        </div>
        
        <div class="mt-12 mb-8 bg-slate-100 dark:bg-slate-800/50 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm z-10 relative text-center">
            <p class="text-primary/80 font-bold uppercase tracking-wider text-sm">Siguiente: Serie ${state.currentSeries + 1} · ${state.workoutSeries[state.currentSeries]} reps</p>
        </div>
        
        <button id="skip-rest" class="bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2 z-10 relative">
            <span class="material-symbols-outlined">skip_next</span>
            Saltar descanso
        </button>
        
        <div class="absolute top-1/4 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl z-0"></div>
        <div class="absolute bottom-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl z-0"></div>
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
    <div class="space-y-4 w-full">
        <p class="text-slate-900/80 text-sm font-bold leading-normal tracking-wide text-center uppercase mt-6">¿Qué te ha parecido la sesión?</p>
        <div class="flex flex-col gap-3">
            <label class="group flex items-center gap-4 rounded-lg bg-white/20 border-2 border-slate-900/10 p-4 cursor-pointer hover:bg-white/30 transition-all feedback-label-input">
                <input class="hidden peer feedback-radio" name="difficulty" type="radio" value="1" />
                <div class="h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center peer-checked:bg-slate-900">
                    <div class="h-2 w-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                </div>
                <div class="flex grow items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="size-3 rounded-full bg-green-500"></span><p class="text-slate-900 text-base font-bold">Fácil</p>
                    </div>
                </div>
            </label>
            <label class="group flex items-center gap-4 rounded-lg bg-white/20 border-2 border-slate-900/10 p-4 cursor-pointer hover:bg-white/30 transition-all feedback-label-input">
                <input class="hidden peer feedback-radio" name="difficulty" type="radio" value="2" />
                <div class="h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center peer-checked:bg-slate-900">
                    <div class="h-2 w-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                </div>
                <div class="flex grow items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="size-3 rounded-full bg-yellow-500"></span><p class="text-slate-900 text-base font-bold">Normal</p>
                    </div>
                </div>
            </label>
            <label class="group flex items-center gap-4 rounded-lg bg-white/20 border-2 border-slate-900/10 p-4 cursor-pointer hover:bg-white/30 transition-all feedback-label-input">
                <input class="hidden peer feedback-radio" name="difficulty" type="radio" value="3" />
                <div class="h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center peer-checked:bg-slate-900">
                    <div class="h-2 w-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                </div>
                <div class="flex grow items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="size-3 rounded-full bg-red-500"></span><p class="text-slate-900 text-base font-bold">Al límite</p>
                    </div>
                </div>
            </label>
        </div>
    </div>
  ` : ``;
  
  app.innerHTML = `
    <div class="screen active bg-[#12161D] min-h-screen flex items-center justify-center p-4 font-display">
        <div class="relative w-full max-w-md overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700 shadow-2xl">
            <div class="flex items-center p-4 justify-between border-b border-slate-700/50">
                <div class="text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-700/50 cursor-pointer opacity-0"></div>
                <h2 class="text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10 uppercase">Hollow Flex</h2>
            </div>
            
            <div class="p-6">
                <div class="cardboard-texture rounded-xl p-8 border-b-4 border-r-4 border-cardboard-dark shadow-inner text-slate-900 flex flex-col items-center">
                    <div class="flex flex-col items-center gap-6 mb-2 w-full">
                        <div class="relative">
                            <div class="absolute inset-0 bg-primary/40 blur-3xl rounded-full scale-150"></div>
                            <div class="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full border-4 border-white/50 shadow-lg min-h-32 w-32" style="background-image: url('${victoryMascotImg}')"></div>
                        </div>
                        
                        <div class="flex flex-col items-center justify-center text-center">
                            <h3 class="text-slate-900 text-2xl font-bold leading-tight tracking-tight">¡Gran trabajo, pequeño guerrero!</h3>
                            <p class="text-slate-800/80 text-base font-semibold mt-1">Victoria obtenida · ${getWorkoutTitle(state.workoutType)}</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-center w-full gap-4 mt-6 border-t border-slate-900/10 pt-6">
                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-black">${totalReps}</span>
                            <span class="text-xs font-bold uppercase opacity-60">Flexiones</span>
                        </div>
                        <div class="flex flex-col items-center px-4 border-x border-slate-900/10">
                            <span class="text-3xl font-black text-amber-600">+${soulsEarned}</span>
                            <span class="text-xs font-bold uppercase opacity-60">Souls</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-black">${state.repsCompleted.length}</span>
                            <span class="text-xs font-bold uppercase opacity-60">Series</span>
                        </div>
                    </div>

                    ${feedbackHTML}
                </div>
                
                <div class="mt-8">
                    <button id="btn-finish-victory" class="w-full flex cursor-pointer items-center justify-center rounded-xl h-14 px-6 bg-primary text-slate-900 text-lg font-extrabold leading-normal tracking-wide shadow-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-50">
                        Continuar <span class="material-symbols-outlined ml-2">home</span>
                    </button>
                </div>
            </div>
            <div class="absolute -bottom-1 -left-1 -right-1 h-2 bg-cardboard-dark/20 blur-sm"></div>
        </div>
    </div>
  `;
  
  const finishBtn = document.getElementById('btn-finish-victory');
  
  if (isA) {
    const radioInputs = document.querySelectorAll('.feedback-radio');
    let selectedFeedback = null;
    
    radioInputs.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedFeedback = parseInt(e.target.value);
            // Highlight selected
            document.querySelectorAll('.feedback-label-input').forEach(label => label.classList.remove('ring-2', 'ring-primary'));
            e.target.closest('label').classList.add('ring-2', 'ring-primary');
        });
    });
    
    finishBtn.addEventListener('click', async () => {
      if (!selectedFeedback) {
          alert('Por favor, selecciona qué te ha parecido la sesión.');
          return;
      }
      await finishWorkout(selectedFeedback);
    });
  } else {
    finishBtn.addEventListener('click', async () => {
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
