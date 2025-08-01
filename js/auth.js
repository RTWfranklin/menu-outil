// Module d'authentification Firebase
let currentUser = null;

export function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider);
}

export function logout() {
  return firebase.auth().signOut();
}

export function onAuthStateChanged(callback) {
  firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    callback(user);
  });
}

export function getCurrentUser() {
  return currentUser;
}
