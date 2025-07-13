// Fonctions liées à la gestion des menus
import { getDb } from './firebase.js';

export let menus = [];
export let currentMenuId = null;

export function loadMenus(user) {
  if (!user) return;
  const db = getDb();
  db.collection('users').doc(user.uid).collection('menus').get()
    .then(function(querySnapshot) {
      menus = [];
      querySnapshot.forEach(function(doc) {
        var menu = doc.data();
        menu.firestoreId = doc.id;
        menus.push(menu);
      });
      renderMenus();
    });
}

export function saveMenuToFirestore(menu, user, cb) {
  if (!user) return;
  const db = getDb();
  var menusRef = db.collection('users').doc(user.uid).collection('menus');
  if (menu.firestoreId) {
    menusRef.doc(menu.firestoreId).set(menu)
      .then(function() { if (cb) cb(menu.firestoreId); })
      .catch(function(error) { alert("Erreur enregistrement menu: " + error.message); });
  } else {
    menusRef.add(menu)
      .then(function(docRef) { menu.firestoreId = docRef.id; if (cb) cb(docRef.id); })
      .catch(function(error) { alert("Erreur enregistrement menu: " + error.message); });
  }
}

export function deleteMenu(menu, index, user) {
  if (!user || !menu.firestoreId) return;
  const db = getDb();
  db.collection('users').doc(user.uid).collection('menus').doc(menu.firestoreId).delete().then(function() {
    menus.splice(index, 1);
    renderMenus();
  });
}

export function renderMenus() {
  // Cette fonction doit être branchée à l'UI (menuList, etc.)
  // Elle sera déplacée dans ui.js pour la séparation stricte UI/logique
}

export function editMenu(index) {
  currentMenuId = index;
  // Cette fonction doit être branchée à l'UI (menuEditor, menuSelection, etc.)
  // Elle sera déplacée dans ui.js pour la séparation stricte UI/logique
}


