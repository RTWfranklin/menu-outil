// Fonctions liées à la gestion des menus
import { getDb } from './firebase.js';

export let menus = [];
export let currentMenuId = null;
export function setCurrentMenuId(id) { currentMenuId = id; }


export function loadMenus(user, cb) {
  if (!user) return;
  const db = getDb();
  db.collection('users').doc(user.uid).collection('menus').get()
    .then(function(querySnapshot) {
      menus.length = 0;
      querySnapshot.forEach(function(doc) {
        var menu = doc.data();
        menu.firestoreId = doc.id;
        menus.push(menu);
      });
         // === MIGRATION DES IDS ICI ===
   menus.forEach(function(menu) {
    if (Array.isArray(menu.categories)) {
      menu.categories.forEach(function(cat) {
        if (!cat.id) cat.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        if (Array.isArray(cat.subcategories)) {
          cat.subcategories.forEach(function(subcat) {
            if (!subcat.id) subcat.id = 'subcat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          });
        }
      });
    }
  });
  console.log('[DEBUG] Après migration', JSON.parse(JSON.stringify(menus)));
  // =============================
      if (cb) cb();
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

export function deleteMenu(menu, index, user, cb) {
  console.log('[DEBUG] deleteMenu called with:', {menu, index, user, firestoreId: menu.firestoreId});
  if (!user || !menu.firestoreId) {
    console.warn('[DEBUG] deleteMenu: user ou menu.firestoreId manquant', {user, firestoreId: menu.firestoreId});
    return;
  }
  const db = getDb();
  db.collection('users').doc(user.uid).collection('menus').doc(menu.firestoreId).delete().then(function() {
    menus.splice(index, 1);
    console.log('[DEBUG] Menu supprimé localement, index:', index);
    if (cb) cb();
  }).catch(function(err) {
    console.error('[DEBUG] Erreur Firestore deleteMenu:', err);
  });
}




