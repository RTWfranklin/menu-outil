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
  // Affiche l'avatar et le nom dans la barre profil
  const profileBar = document.getElementById('profile-bar');
  const avatarImg = document.getElementById('avatar-img');
  const profileName = document.getElementById('profile-name');
  if (profileBar && avatarImg && profileName) {
    profileBar.classList.remove('hidden');
    avatarImg.src = user.photoURL || '';
    profileName.textContent = user.displayName || user.email;
  }
  window.currentUser = user;
}


function showDisconnectedUI() {
  mainApp.classList.add('hidden');
  landingBg.classList.remove('hidden');
  userInfo.innerText = 'Non connecté';
  // Cache la barre profil
  const profileBar = document.getElementById('profile-bar');
  if (profileBar) profileBar.classList.add('hidden');
  window.currentUser = null;
}

document.addEventListener('DOMContentLoaded', () => {
  // Gestion du menu profil déroulant
  const avatar = document.getElementById('profile-avatar');
  const menuContent = document.getElementById('profile-menu-content');
  const closeMenuBtn = document.getElementById('close-profile-menu');
  if (avatar && menuContent) {
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      menuContent.style.display = (menuContent.style.display === 'flex' ? 'none' : 'flex');
    });
    if (closeMenuBtn) closeMenuBtn.onclick = function(e) {
      menuContent.style.display = 'none';
      e.stopPropagation();
    };
    // Ferme le menu si clic en dehors
    document.addEventListener('click', (e) => {
      if (!avatar.contains(e.target)) menuContent.style.display = 'none';
    });
  }
  // Affichage fallback si pas de photoURL
  const avatarImg = document.getElementById('avatar-img');
  if (avatarImg) {
    avatarImg.onerror = function() {
      avatarImg.src = 'https://ui-avatars.com/api/?name=User&background=eee&color=555&rounded=true';
    };
  }

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
      import('./ui.js').then(mod => mod.setupUI());
    } else {
      showDisconnectedUI();
    }
  });
});
