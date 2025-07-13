// Initialisation de Firebase et fonctions liées à Firestore
let db = null;

export function initFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyCxVS6IvetneJ1Q5kr8t5d7F3qd8oe8KjQ",
    authDomain: "menu-outil.firebaseapp.com",
    projectId: "menu-outil",
    storageBucket: "menu-outil.appspot.com",
    messagingSenderId: "659889655771",
    appId: "1:659889655771:web:c970fa451635dac4dfe1fe",
    measurementId: "G-18ZGPKGBQD"
  };
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
}

export function getDb() {
  return db;
}

// Configuration Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dcwbucaxl/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'menu_unsigned';

export function uploadImageToCloudinary(file, callback, errorCallback) {
  const url = CLOUDINARY_URL;
  const preset = CLOUDINARY_UPLOAD_PRESET;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  fetch(url, {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.secure_url) {
        callback(data.secure_url);
      } else {
        errorCallback(data.error && data.error.message ? data.error.message : 'Erreur Cloudinary');
      }
    })
    .catch(err => errorCallback(err.message));
}
