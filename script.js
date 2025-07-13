document.addEventListener('DOMContentLoaded', function() {
    var firebaseConfig = {
      apiKey: "AIzaSyCxVS6IvetneJ1Q5kr8t5d7F3qd8oe8KjQ",
      authDomain: "menu-outil.firebaseapp.com",
      projectId: "menu-outil",
      storageBucket: "menu-outil.appspot.com",
      messagingSenderId: "659889655771",
      appId: "1:659889655771:web:c970fa451635dac4dfe1fe",
      measurementId: "G-18ZGPKGBQD"
    };
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    // Configuration Cloudinary
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dcwbucaxl/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'menu_unsigned';

    // Fonction utilitaire d'upload Cloudinary
    function uploadImageToCloudinary(file, callback, errorCallback) {
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
  
    // DOM selectors
    var authZone = document.getElementById('auth-zone');
    var loginGoogleBtn = document.getElementById('login-google');
    var userInfo = document.getElementById('user-info');
    var mainApp = document.getElementById('main-app');
    var menuList = document.getElementById('menu-list');
    var menuSelection = document.getElementById('menu-selection');
    var menuEditor = document.getElementById('menu-editor');
    var addMenuBtn = document.getElementById('add-menu');
    var backToListBtn = document.getElementById('back-to-list');
    var menuTitleInput = document.getElementById('menu-title');
    var bannerUpload = document.getElementById('banner-upload');
    var logoUpload = document.getElementById('logo-upload');
    var bannerPreviewContainer = document.getElementById('banner-preview');
    var logoPreviewContainer = document.getElementById('logo-preview');
    var categoriesContainer = document.getElementById('categories');
    var addCategoryBtn = document.getElementById('add-category');
    var publishOnlineBtn = document.getElementById('publish-online');
    var viewPublishedBtn = document.getElementById('view-published');
    var saveChangesBtn = document.getElementById('save-changes');
  
    // Profile bar
    var profileBar = document.getElementById('profile-bar');
    var profileAvatar = document.getElementById('profile-avatar');
    var avatarImg = document.getElementById('avatar-img');
    var profileMenu = document.getElementById('profile-menu');
    var profileName = document.getElementById('profile-name');
    var logoutBtn = document.getElementById('logout-btn');
  
    var landingBg = document.getElementById('landing-bg');
  
    // User & menu data
    var user = null;
    var menus = [];
    var currentMenuId = null;
  
    // Auth
    loginGoogleBtn.onclick = function() {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .catch(function(error) {
          alert("Erreur de connexion : " + error.message);
        });
    };
  
    firebase.auth().onAuthStateChanged(function(u) {
      user = u;
      if (user) {
        profileBar.classList.remove('hidden');
        avatarImg.src = user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email);
        profileName.textContent = user.displayName || user.email;
        mainApp.classList.remove('hidden');
        landingBg.classList.add('hidden');
        loadMenus();
      } else {
        profileBar.classList.add('hidden');
        mainApp.classList.add('hidden');
        landingBg.classList.remove('hidden');
        userInfo.innerText = "Non connecté";
      }
    });
  
    profileAvatar.onclick = function(e) {
      profileMenu.classList.toggle('hidden');
      e.stopPropagation();
    };
    document.addEventListener('click', function(e) {
      if (!profileBar.contains(e.target)) {
        profileMenu.classList.add('hidden');
      }
    });
    logoutBtn.onclick = function() {
      firebase.auth().signOut();
      profileMenu.classList.add('hidden');
    };
  
    function loadMenus() {
      if (!user) return;
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
    function saveMenuToFirestore(menu, cb) {
      if (!user) return;
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
    function deleteMenu(menu, index) {
      if (!user || !menu.firestoreId) return;
      db.collection('users').doc(user.uid).collection('menus').doc(menu.firestoreId).delete().then(function() {
        menus.splice(index, 1);
        renderMenus();
      });
    }
    function renderMenus() {
      menuList.innerHTML = '';
      menus.forEach(function(menu, index) {
        var btn = document.createElement('button');
        btn.textContent = menu.title || "Menu " + (index + 1);
        btn.onclick = function() { editMenu(index); };
        menuList.appendChild(btn);
  
        var delBtn = document.createElement('button');
        delBtn.textContent = '🗑️ Supprimer';
        delBtn.className = 'delete-btn';
        delBtn.onclick = function() {
          if (confirm('Supprimer ce menu ?')) {
            deleteMenu(menu, index);
          }
        };
        menuList.appendChild(delBtn);
      });
    }
    function editMenu(index) {
      currentMenuId = index;
      var menu = menus[index];
      menuSelection.classList.add('hidden');
      menuEditor.classList.remove('hidden');
      menuTitleInput.value = menu.title || '';
      renderImagePreview('banner', menu.banner || '');
      renderImagePreview('logo', menu.logo || '');
      categoriesContainer.innerHTML = '';
      (menu.categories || []).forEach(function(cat, catIndex) {
        addCategory(
          cat.name || '',
          Array.isArray(cat.items) ? cat.items : [],
          catIndex,
          Array.isArray(cat.subcategories) ? cat.subcategories : []
        );
      });
      updateViewPublishedButton();
    }
    function renderImagePreview(type, src) {
      var container = type === 'banner' ? bannerPreviewContainer : logoPreviewContainer;
      container.innerHTML = '';
      if (src) {
        var img = document.createElement('img');
        img.src = src;
        container.appendChild(img);
      }
    }
    function handleImageUpload(input, type) {
      input.onchange = function () {
        var file = input.files[0];
        if (!file) return;
        // upload the image to Cloudinary
        uploadImageToCloudinary(file, function(url) {
          renderImagePreview(type, url);
          if (currentMenuId !== null) {
            menus[currentMenuId][type] = url;
          }
        }, function(errorMsg) {
          alert('Erreur upload image plat: ' + errorMsg);
        });
      };
    }
var menus = [];
var currentMenuId = null;

// Fonction utilitaire d'ajout de catégorie pour compatibilité avec les appels existants
function addCategory() {
  if (typeof menus === 'undefined' || currentMenuId === null) return;
  if (!menus[currentMenuId].categories) menus[currentMenuId].categories = [];
  menus[currentMenuId].categories.push({ name: '', items: [] });
  if (typeof renderMenus === 'function') renderMenus();
}


// Auth
loginGoogleBtn.onclick = function() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .catch(function(error) {
      alert("Erreur de connexion : " + error.message);
    });
};

firebase.auth().onAuthStateChanged(function(u) {
  user = u;
  if (user) {
    profileBar.classList.remove('hidden');
    avatarImg.src = user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.email);
    profileName.textContent = user.displayName || user.email;
    mainApp.classList.remove('hidden');
    landingBg.classList.add('hidden');
    loadMenus();
  } else {
    profileBar.classList.add('hidden');
    mainApp.classList.add('hidden');
    landingBg.classList.remove('hidden');
    userInfo.innerText = "Non connecté";
  }
});

profileAvatar.onclick = function(e) {
  profileMenu.classList.toggle('hidden');
  e.stopPropagation();
};
document.addEventListener('click', function(e) {
  if (!profileBar.contains(e.target)) {
    profileMenu.classList.add('hidden');
  }
});
logoutBtn.onclick = function() {
  firebase.auth().signOut();
  profileMenu.classList.add('hidden');
};

function loadMenus() {
  if (!user) return;
  db.collection('users').doc(user.uid).collection('menus').get()
    .then(function(querySnapshot) {
      menus = [];
      querySnapshot.forEach(function(doc) {
        var menu = doc.data();
        menu.firestoreId = doc.id;
        menus.push(menu);
      });
      var desc = '';
      desc = desc || '';
      var div = document.createElement('div');
      div.className = 'item';
      var imgUrl = '';
  
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Nom';
      nameInput.value = name;
      var price = '';
      var priceInput = document.createElement('input');
      priceInput.type = 'text';
      priceInput.placeholder = 'Prix';
      priceInput.value = price;
      var descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.placeholder = 'Description';
      descInput.value = '';
  
      // Badges disponibles
      var BADGES = [
        {label: 'Vegan', value: 'Vegan'},
        {label: 'Nouveau', value: 'Nouveau'},
        {label: 'Populaire', value: 'Populaire'},
        {label: 'Spécialité', value: 'Spécialité'}
      ];
      var badgesWrapper = document.createElement('div');
      badgesWrapper.className = 'badges-editor';
      badgesWrapper.style.margin = "6px 0 9px 0";
      badgesWrapper.style.display = "flex";
      badgesWrapper.style.gap = "10px";
      badgesWrapper.style.flexWrap = "wrap";
  
      // Détecte badges déjà présents
      var initialBadges = Array.isArray(badges) ? badges : [];
      BADGES.forEach(function(badge) {
        var label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '4px';
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = badge.value;
        // Pré-cocher si badge déjà présent
        if (initialBadges.includes(badge.value)) checkbox.checked = true;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(badge.label));
        badgesWrapper.appendChild(label);
      });
  
      var imgUpload = document.createElement('input');
      imgUpload.type = 'file';
      imgUpload.accept = 'image/*';
      imgUpload.style.marginTop = "8px";

      var imgPreview = document.createElement('div');
      imgPreview.style.marginTop = "7px";
      if (imgUrl) {
        var imgTag = document.createElement('img');
        imgTag.src = imgUrl;
        imgTag.style.maxWidth = '80px';
        imgTag.style.maxHeight = '80px';
        imgTag.style.borderRadius = '8px';
        imgPreview.appendChild(imgTag);
      }

      var badges = [];

      imgUpload.onchange = function (event) {
        var file = event.target.files[0];
        if (!file) return;
        // Affiche l'aperçu local
        var reader = new FileReader();
        reader.onload = function (e) {
          imgPreview.innerHTML = '';
          var imgTag = document.createElement('img');
          imgTag.src = e.target.result;
          imgTag.style.maxWidth = '80px';
          imgTag.style.maxHeight = '80px';
          imgTag.style.borderRadius = '8px';
          imgPreview.appendChild(imgTag);
        };
        reader.readAsDataURL(file);
  
        // Upload sur Cloudinary
        uploadImageToCloudinary(file, function(url) {
          div.dataset.imgUrl = url;
        }, function(errorMsg) {
          alert('Erreur upload image plat: ' + errorMsg);
        });
      };
  
      div.appendChild(nameInput);
      div.appendChild(priceInput);
      div.appendChild(descInput);
      div.appendChild(badgesWrapper);
      div.appendChild(imgUpload);
      div.appendChild(imgPreview);
  
      var delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.className = 'delete-btn';
      delBtn.style.width = 'auto';
      delBtn.onclick = function() { div.remove(); };
      div.appendChild(delBtn);
  
      // Stocker l'URL de l'image, si déjà existante
      if (imgUrl) {
        div.dataset.imgUrl = imgUrl;
      }
      container.appendChild(div);
})

addMenuBtn.onclick = function() {
  menus.push({ title: '', categories: [], banner: '', logo: '' });
  renderMenus();
};

backToListBtn.onclick = function() {
  menuSelection.classList.remove('hidden');
  menuEditor.classList.add('hidden');
  saveCurrentMenu(function() {
    renderMenus();
    loadMenus();
  });
};

menuTitleInput.oninput = function() {
  if (currentMenuId !== null) {
    menus[currentMenuId].title = menuTitleInput.value;
  }
};

addCategoryBtn.onclick = function() {
  // Ajoute une catégorie vide à l'UI et au tableau menus
  if (!menus[currentMenuId]) return;
  if (!menus[currentMenuId].categories) menus[currentMenuId].categories = [];
  menus[currentMenuId].categories.push({ name: '', items: [] });
  renderMenus();
};

// Fonction utilitaire d'ajout de catégorie pour compatibilité avec les appels existants
function addCategory() {
  if (typeof menus === 'undefined' || currentMenuId === null) return;
  if (!menus[currentMenuId].categories) menus[currentMenuId].categories = [];
  menus[currentMenuId].categories.push({ name: '', items: [] });
  if (typeof renderMenus === 'function') renderMenus();
}

// Save menu, then callback (e.g. update button, show alert)
function saveCurrentMenu(cb) {
  if (currentMenuId === null) return;
  var categories = [];
  categoriesContainer.querySelectorAll('.category').forEach(function(catEl) {
    var catInputs = catEl.querySelectorAll('input[type="text"]');
    var name = catInputs[0] ? catInputs[0].value : '';
    // Gestion sous-catégories
    var subcatNodes = catEl.querySelectorAll('.subcategory');
    var subcategories = [];
    if (subcatNodes.length > 0) {
      subcatNodes.forEach(function(subcatEl) {
        var subcatInputs = subcatEl.querySelectorAll('input[type="text"]');
        var subcatName = subcatInputs[0] ? subcatInputs[0].value : '';
        var subcatItems = [];
            subcatEl.querySelectorAll('.item').forEach(function(itemEl) {
              var inputs = itemEl.querySelectorAll('input[type="text"]');
              var imgUrl = itemEl.dataset.imgUrl || "";
              var badgesInputs = Array.from(itemEl.querySelectorAll('.badges-editor input[type="checkbox"]'));
              var badges = badgesInputs.filter(function(chk){return chk.checked;}).map(function(chk){return chk.value;});
              subcatItems.push({
                name: inputs[0] ? inputs[0].value : '',
                price: inputs[1] ? inputs[1].value : '',
                desc: inputs[2] ? inputs[2].value : '',
                img: imgUrl,
                badges: badges
              });
            });
            if (subcatName) subcategories.push({ name: subcatName, items: subcatItems });
          });
          if (name) categories.push({ name: name, subcategories: subcategories });
        } else {
          var items = [];
          catEl.querySelectorAll('.item').forEach(function(itemEl) {
            var inputs = itemEl.querySelectorAll('input[type="text"]');
            var imgUrl = itemEl.dataset.imgUrl || "";
            var badgesInputs = Array.from(itemEl.querySelectorAll('.badges-editor input[type="checkbox"]'));
            var badges = badgesInputs.filter(function(chk){return chk.checked;}).map(function(chk){return chk.value;});
            items.push({
              name: inputs[0] ? inputs[0].value : '',
              price: inputs[1] ? inputs[1].value : '',
              desc: inputs[2] ? inputs[2].value : '',
              img: imgUrl,
              badges: badges
            });
          });
          if (name) categories.push({ name: name, items: items });
        }
      });
      menus[currentMenuId].categories = categories;
      saveMenuToFirestore(menus[currentMenuId], function() {
        loadMenus();
        if (cb) cb();
      });
    }

  }
  
    publishOnlineBtn.onclick = function() {
      saveCurrentMenu(function() {
        updateViewPublishedButton();
        var menu = menus[currentMenuId];
        var publicUrl = window.location.origin + "/menu.html?uid=" + user.uid + "&id=" + menu.firestoreId;
        prompt("Voici l’URL à utiliser pour le QR code :", publicUrl);
      });
    };
  
    saveChangesBtn.onclick = function() {
      saveCurrentMenu(function() {
        updateViewPublishedButton();
        alert("Le menu a bien été mis à jour !");
      });
    };
  
    function updateViewPublishedButton() {
      if (currentMenuId === null) {
        viewPublishedBtn.classList.add("inactive");
        viewPublishedBtn.classList.remove("active");
        viewPublishedBtn.disabled = true;
        viewPublishedBtn.dataset.url = "";
        return;
      }
      var menu = menus[currentMenuId];
      if (menu && menu.firestoreId) {
        viewPublishedBtn.classList.remove("inactive");
        viewPublishedBtn.classList.add("active");
        viewPublishedBtn.disabled = false;
        var publicUrl = window.location.origin + "/menu.html?uid=" + user.uid + "&id=" + menu.firestoreId;
        viewPublishedBtn.dataset.url = publicUrl;
      } else {
        viewPublishedBtn.classList.add("inactive");
        viewPublishedBtn.classList.remove("active");
        viewPublishedBtn.disabled = true;
        viewPublishedBtn.dataset.url = "";
      }
    }
  
    viewPublishedBtn.onclick = function() {
      if (viewPublishedBtn.disabled) return;
      var url = viewPublishedBtn.dataset.url;
      if (url) window.open(url, "_blank");
    };
}); // <-- fermeture du DOMContentLoaded