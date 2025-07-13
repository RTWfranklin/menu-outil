// Point d'entrée principal de l'application
import { initFirebase } from './firebase.js';
import { loadMenus } from './menu.js';
import { loginGoogle, logout, onAuthStateChanged } from './auth.js';

// Sélecteurs DOM principaux
const loginGoogleBtn = document.getElementById('login-google');
const logoutBtn = document.getElementById('logout-btn');
const mainApp = document.getElementById('main-app');
const landingBg = document.getElementById('landing-bg');
const userInfo = document.getElementById('user-info');

function showConnectedUI(user) {
  mainApp.classList.remove('hidden');
  landingBg.classList.add('hidden');
  userInfo.innerText = user.displayName || user.email;
}

function showDisconnectedUI() {
  mainApp.classList.add('hidden');
  landingBg.classList.remove('hidden');
  userInfo.innerText = 'Non connecté';
}

document.addEventListener('DOMContentLoaded', () => {
  initFirebase();

  loginGoogleBtn.addEventListener('click', () => {
    loginGoogle().catch(err => alert('Erreur de connexion : ' + err.message));
  });
  logoutBtn.addEventListener('click', () => {
    logout();
  });

  onAuthStateChanged(user => {
    if (user) {
      showConnectedUI(user);
      loadMenus(user);
    } else {
      showDisconnectedUI();
    }
  });
});
