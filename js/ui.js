// Fonctions de manipulation du DOM et de l'interface utilisateur
// Fonctions de manipulation du DOM et de l'interface utilisateur
import { addCategory } from './category.js';
import { menus, currentMenuId, saveMenuToFirestore, deleteMenu } from './menu.js';

import { uploadImageToCloudinary } from './firebase.js';

export function renderImagePreview(type, src) {
  const bannerPreviewContainer = document.getElementById('banner-preview');
  const logoPreviewContainer = document.getElementById('logo-preview');
  var container = type === 'banner' ? bannerPreviewContainer : logoPreviewContainer;
  container.innerHTML = '';
  if (src) {
    var img = document.createElement('img');
    img.src = src;
    container.appendChild(img);
  }
}

export function handleImageUpload(input, type) {
  input.onchange = function () {
    var file = input.files[0];
    if (!file) return;
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

export function updateViewPublishedButton() {
  // TODO: logique d'activation/désactivation du bouton "voir en ligne"
}

export function renderMenus() {
  const menuList = document.getElementById('menu-list');
  menuList.innerHTML = '';
  menus.forEach(function(menu, index) {
    // Bouton pour éditer
    const btn = document.createElement('button');
    btn.textContent = menu.title || "Menu " + (index + 1);
    btn.onclick = function() { editMenu(index); };
    menuList.appendChild(btn);
    // Bouton pour supprimer
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️ Supprimer';
    delBtn.className = 'delete-btn';
    delBtn.onclick = function() {
      if (confirm('Supprimer ce menu ?')) {
        if (window.currentUser) {
          deleteMenu(menu, index, window.currentUser);
        } else {
          alert('Non connecté');
        }
      }
    };
    menuList.appendChild(delBtn);
  });
}

export function editMenu(index) {
  currentMenuId = index;
  const menu = menus[index];
  document.getElementById('menu-selection').classList.add('hidden');
  document.getElementById('menu-editor').classList.remove('hidden');
  document.getElementById('menu-title').value = menu.title || '';
  renderImagePreview('banner', menu.banner || '');
  renderImagePreview('logo', menu.logo || '');
  const categoriesContainer = document.getElementById('categories');
  categoriesContainer.innerHTML = '';
  (menu.categories || []).forEach(function(cat, catIndex) {
    // Création du conteneur de catégorie
    const catDiv = document.createElement('div');
    catDiv.className = 'category';
    // Champ nom de catégorie
    const catNameInput = document.createElement('input');
    catNameInput.type = 'text';
    catNameInput.placeholder = 'Nom de la catégorie';
    catNameInput.value = cat.name || '';
    catNameInput.oninput = function(e) {
      cat.name = e.target.value;
      if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
        saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
          console.log('Catégorie sauvegardée');
        });
      }
    };
    catDiv.appendChild(catNameInput);
    // Bouton suppression catégorie
    const delCatBtn = document.createElement('button');
    delCatBtn.textContent = '🗑️';
    delCatBtn.title = 'Supprimer cette catégorie';
    delCatBtn.onclick = function() {
      if (confirm('Supprimer cette catégorie ?')) {
        menu.categories.splice(catIndex, 1);
        renderMenus();
        editMenu(index);
      }
    };
    catDiv.appendChild(delCatBtn);
    // Affichage des items de la catégorie
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'items';
    (cat.items || []).forEach(function(item, itemIndex) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item';
      // Nom
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Nom';
      nameInput.value = item.name || '';
      nameInput.oninput = function(e) {
        item.name = e.target.value;
        if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
          saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
            // Auto-save OK
          });
        }
      };
      itemDiv.appendChild(nameInput);
      // Prix
      const priceInput = document.createElement('input');
      priceInput.type = 'text';
      priceInput.placeholder = 'Prix';
      priceInput.value = item.price || '';
      priceInput.oninput = function(e) {
        item.price = e.target.value;
        if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
          saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
            // Auto-save OK
          });
        }
      };
      itemDiv.appendChild(priceInput);
      // Description
      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.placeholder = 'Description';
      descInput.value = item.desc || '';
      descInput.oninput = function(e) {
        item.desc = e.target.value;
        if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
          saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
            // Auto-save OK
          });
        }
      };
      itemDiv.appendChild(descInput);
      // Badges
      const BADGES = [
        {label: 'Vegan', value: 'Vegan'},
        {label: 'Nouveau', value: 'Nouveau'},
        {label: 'Populaire', value: 'Populaire'},
        {label: 'Spécialité', value: 'Spécialité'}
      ];
      const badgesWrapper = document.createElement('div');
      badgesWrapper.className = 'badges-editor';
      BADGES.forEach(function(badge) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = badge.value;
        checkbox.checked = Array.isArray(item.badges) && item.badges.includes(badge.value);
        checkbox.onchange = function(e) {
          if (!item.badges) item.badges = [];
          if (e.target.checked) {
            if (!item.badges.includes(badge.value)) item.badges.push(badge.value);
          } else {
            item.badges = item.badges.filter(b => b !== badge.value);
          }
          if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
            saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
              // Auto-save OK
            });
          }
        };
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(badge.label));
        badgesWrapper.appendChild(label);
      });
      itemDiv.appendChild(badgesWrapper);
      // Image
      const imgInput = document.createElement('input');
      imgInput.type = 'file';
      imgInput.accept = 'image/*';
      imgInput.onchange = function(e) {
        const file = imgInput.files[0];
        if (!file) return;
        uploadImageToCloudinary(file, function(url) {
          item.imgUrl = url;
          imgPreview.src = url;
          if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
            saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
              // Auto-save OK
            });
          }
        }, function(errorMsg) {
          alert('Erreur upload image plat: ' + errorMsg);
        });
      };
      itemDiv.appendChild(imgInput);
      // Preview image
      const imgPreview = document.createElement('img');
      imgPreview.style.maxHeight = '40px';
      imgPreview.style.display = item.imgUrl ? '' : 'none';
      if (item.imgUrl) imgPreview.src = item.imgUrl;
      itemDiv.appendChild(imgPreview);
      // Bouton suppression item
      const delItemBtn = document.createElement('button');
      delItemBtn.textContent = '🗑️';
      delItemBtn.title = 'Supprimer cet item';
      delItemBtn.onclick = function() {
        if (confirm('Supprimer cet item ?')) {
          cat.items.splice(itemIndex, 1);
          renderMenus();
          editMenu(index);
        }
      };
      itemDiv.appendChild(delItemBtn);
      itemsDiv.appendChild(itemDiv);
    });
    // Bouton ajouter un item
    const addItemBtn = document.createElement('button');
    addItemBtn.textContent = '+ Ajouter un plat';
    addItemBtn.onclick = function() {
      if (!cat.items) cat.items = [];
      cat.items.push({ name: '', price: '', desc: '', imgUrl: '', badges: [] });
      renderMenus();
      editMenu(index);
    };
    itemsDiv.appendChild(addItemBtn);
    catDiv.appendChild(itemsDiv);
    categoriesContainer.appendChild(catDiv);
  });
}

export function setupUI() {
  // Boutons et champs
  const addMenuBtn = document.getElementById('add-menu');
  const backToListBtn = document.getElementById('back-to-list');
  const menuTitleInput = document.getElementById('menu-title');
  const bannerUpload = document.getElementById('banner-upload');
  const logoUpload = document.getElementById('logo-upload');
  const addCategoryBtn = document.getElementById('add-category');

  // Ajout d'un menu (à compléter selon ta logique d'ajout)
  if (addMenuBtn) {
    addMenuBtn.onclick = function() {
      // Crée un nouveau menu vierge
      const newMenu = { title: '', banner: '', logo: '', categories: [] };
      // Sauvegarde dans Firestore
      if (window.currentUser) {
        saveMenuToFirestore(newMenu, window.currentUser, function(id) {
          newMenu.firestoreId = id;
          menus.push(newMenu);
          if (typeof renderMenus === 'function') renderMenus();
          if (typeof editMenu === 'function') editMenu(menus.length - 1);
        });
      } else {
        alert('Veuillez vous connecter pour créer un menu.');
      }
    };
  }

  // Retour à la liste
  if (backToListBtn) {
    backToListBtn.onclick = function() {
      document.getElementById('menu-editor').classList.add('hidden');
      document.getElementById('menu-selection').classList.remove('hidden');
    };
  }

  // Modification du titre du menu courant
  if (menuTitleInput) {
    menuTitleInput.oninput = function(e) {
      if (currentMenuId !== null) {
        menus[currentMenuId].title = e.target.value;
      }
    };
  }

  // Uploads d'images
  if (bannerUpload) handleImageUpload(bannerUpload, 'banner');
  if (logoUpload) handleImageUpload(logoUpload, 'logo');

  // Ajout de catégorie
  if (addCategoryBtn) {
    addCategoryBtn.onclick = addCategory;
  }

  // Sauvegarde du menu courant
  const saveChangesBtn = document.getElementById('save-changes');
  if (saveChangesBtn) {
    saveChangesBtn.onclick = function() {
      if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
        saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
          alert('Menu sauvegardé !');
        });
      } else {
        alert('Impossible de sauvegarder : aucun menu sélectionné ou utilisateur non connecté.');
      }
    };
  }

  // Publication en ligne du menu courant
  const publishOnlineBtn = document.getElementById('publish-online');
  if (publishOnlineBtn) {
    publishOnlineBtn.onclick = function() {
      if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
        const menu = menus[currentMenuId];
        const db = firebase.firestore();
        db.collection('public_menus').doc(menu.firestoreId || '').set({
          ...menu,
          public: true,
          owner: window.currentUser.uid,
          publishedAt: new Date().toISOString()
        }).then(function() {
          alert('Menu publié en ligne !');
          // Active le bouton de visualisation
          const viewPublishedBtn = document.getElementById('view-published');
          if (viewPublishedBtn) {
            viewPublishedBtn.disabled = false;
            viewPublishedBtn.classList.remove('inactive');
          }
        }).catch(function(err) {
          alert('Erreur lors de la publication : ' + err.message);
        });
      } else {
        alert('Impossible de publier : aucun menu sélectionné ou utilisateur non connecté.');
      }
    };
  }

  // Visualisation du menu publié
  const viewPublishedBtn = document.getElementById('view-published');
  if (viewPublishedBtn) {
    viewPublishedBtn.onclick = function() {
      if (currentMenuId !== null && menus[currentMenuId]) {
        const menu = menus[currentMenuId];
        if (!menu.firestoreId) {
          alert('Ce menu doit être sauvegardé et publié avant de pouvoir être visualisé.');
          return;
        }
        // Ouvre une nouvelle fenêtre (ou onglet) sur la page publique du menu
        window.open(`/public-menu.html?id=${menu.firestoreId}`, '_blank');
      } else {
        alert('Aucun menu sélectionné.');
      }
    };
  }
}

