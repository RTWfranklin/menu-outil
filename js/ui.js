// Fonctions de manipulation du DOM et de l'interface utilisateur
// Fonctions de manipulation du DOM et de l'interface utilisateur
import { addCategory } from './category.js';
// Import des fonctions et variables nécessaires
import { menus, currentMenuId, saveMenuToFirestore, deleteMenu, setCurrentMenuId, loadMenus } from './menu.js';

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

export function updateViewPublishedButton(menu) {
  const viewPublishedBtn = document.getElementById('view-published');
  if (!viewPublishedBtn) return;
  if (menu && menu.firestoreId) {
    viewPublishedBtn.disabled = false;
    viewPublishedBtn.classList.remove('inactive');
  } else {
    viewPublishedBtn.disabled = true;
    viewPublishedBtn.classList.add('inactive');
  }
}

export function renderMenus() {
  const menuList = document.getElementById('menu-list');
  menuList.innerHTML = '';
  menus.forEach(function(menu, index) {
    // Bouton pour éditer
    const btn = document.createElement('button');
    btn.textContent = menu.title || "Menu " + (index + 1);
    btn.onclick = function() {
        if (menus[index]) {
          editMenu(index);
        } else {
          console.warn('[UI] Menu inexistant pour index', index);
          renderMenus();
          document.getElementById('menu-editor').classList.add('hidden');
          document.getElementById('menu-selection').classList.remove('hidden');
        }
      };
    menuList.appendChild(btn);
    // Bouton pour supprimer
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️ Supprimer';
    delBtn.className = 'delete-btn';
    delBtn.onclick = function() {
      console.log('[UI] Clic bouton supprimer menu', index);
      if (confirm('Supprimer ce menu ?')) {
        if (window.currentUser) {
          deleteMenu(menu, index, window.currentUser, function() {
            loadMenus(window.currentUser, function() {
              renderMenus();
              document.getElementById('menu-editor').classList.add('hidden');
              document.getElementById('menu-selection').classList.remove('hidden');
            });
          });
        } else {
          alert('Non connecté');
        }
      }
    };
    menuList.appendChild(delBtn);
  });
}

export function editMenu(index) {
  setCurrentMenuId(index);
  const menu = menus[index];
  updateViewPublishedButton(menu);
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
      console.log('[UI] Clic bouton supprimer catégorie', catIndex);
      if (confirm('Supprimer cette catégorie ?')) {
        menu.categories.splice(catIndex, 1);
        renderMenus();
        editMenu(index);
      }
    };
    catDiv.appendChild(delCatBtn);
    // Bouton ajout sous-catégorie
    const addSubCatBtn = document.createElement('button');
    addSubCatBtn.textContent = 'Ajouter une sous-catégorie';
    addSubCatBtn.onclick = function() {
      if (!cat.subcategories) cat.subcategories = [];
      cat.subcategories.push({ name: '', items: [] });
      saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
        editMenu(index);
      });
    };
    catDiv.appendChild(addSubCatBtn);
    // Affichage des sous-catégories si présentes
    if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
      cat.subcategories.forEach(function(subcat, subcatIndex) {
        const subcatDiv = document.createElement('div');
        subcatDiv.className = 'subcategory';
        // Champ nom de sous-catégorie
        const subcatNameInput = document.createElement('input');
        subcatNameInput.type = 'text';
        subcatNameInput.placeholder = 'Nom de la sous-catégorie';
        subcatNameInput.value = subcat.name || '';
        subcatNameInput.oninput = function(e) {
          subcat.name = e.target.value;
          saveMenuToFirestore(menus[currentMenuId], window.currentUser);
        };
        subcatDiv.appendChild(subcatNameInput);
        // Bouton suppression sous-catégorie
        const delSubCatBtn = document.createElement('button');
        delSubCatBtn.textContent = '🗑️';
        delSubCatBtn.title = 'Supprimer cette sous-catégorie';
        delSubCatBtn.onclick = function() {
          if (confirm('Supprimer cette sous-catégorie ?')) {
            cat.subcategories.splice(subcatIndex, 1);
            saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
              editMenu(index);
            });
          }
        };
        subcatDiv.appendChild(delSubCatBtn);
        // Affichage des items de la sous-catégorie
        const subItemsDiv = document.createElement('div');
        subItemsDiv.className = 'items';
        (subcat.items || []).forEach(function(item, itemIndex) {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item';
          // Nom
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.placeholder = 'Nom';
          nameInput.value = item.name || '';
          nameInput.oninput = function(e) {
            item.name = e.target.value;
            saveMenuToFirestore(menus[currentMenuId], window.currentUser);
          };
          itemDiv.appendChild(nameInput);
          // Prix
          const priceInput = document.createElement('input');
          priceInput.type = 'text';
          priceInput.placeholder = 'Prix';
          priceInput.value = item.price || '';
          priceInput.oninput = function(e) {
            item.price = e.target.value;
            saveMenuToFirestore(menus[currentMenuId], window.currentUser);
          };
          itemDiv.appendChild(priceInput);
          // Description
          const descInput = document.createElement('input');
          descInput.type = 'text';
          descInput.placeholder = 'Description';
          descInput.value = item.desc || '';
          descInput.oninput = function(e) {
            item.desc = e.target.value;
            saveMenuToFirestore(menus[currentMenuId], window.currentUser);
          };
          itemDiv.appendChild(descInput);
          // Badges (reprendre la logique existante)
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
              saveMenuToFirestore(menus[currentMenuId], window.currentUser);
            };
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(badge.label));
            badgesWrapper.appendChild(label);
          });
          itemDiv.appendChild(badgesWrapper);
          subItemsDiv.appendChild(itemDiv);
        });
        // Bouton ajout item dans sous-catégorie
        const addItemBtn = document.createElement('button');
        addItemBtn.textContent = 'Ajouter un item';
        addItemBtn.onclick = function() {
          if (!subcat.items) subcat.items = [];
          subcat.items.push({ name: '', price: '', desc: '', badges: [] });
          saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
            editMenu(index);
          });
        };
        subItemsDiv.appendChild(addItemBtn);
        subcatDiv.appendChild(subItemsDiv);
        catDiv.appendChild(subcatDiv);
      });
    } else {
      // Affichage des items de la catégorie (fallback)
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
        // Badges (reprendre la logique existante)
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
        itemsDiv.appendChild(itemDiv);
      });
      // Bouton ajout item dans catégorie (fallback)
      const addItemBtn = document.createElement('button');
      addItemBtn.textContent = 'Ajouter un item';
      addItemBtn.onclick = function() {
        if (!cat.items) cat.items = [];
        cat.items.push({ name: '', price: '', desc: '', badges: [] });
        saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
          editMenu(index);
        });
      };
      itemsDiv.appendChild(addItemBtn);
      catDiv.appendChild(itemsDiv);
    }
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

  // Appel initial à renderMenus();
  if (window.currentUser) {
    loadMenus(window.currentUser, renderMenus);
  }

  // Ajout d'un menu (à compléter selon ta logique d'ajout)
  if (addMenuBtn) { console.log('[UI] Bouton add-menu trouvé, wiring...');
    addMenuBtn.onclick = function() {
      // Crée un nouveau menu vierge
      const newMenu = { title: '', banner: '', logo: '', categories: [] };
      menus.push(newMenu);
      saveMenuToFirestore(newMenu, window.currentUser, function() {
        loadMenus(window.currentUser, function() {
          renderMenus();
          editMenu(menus.length - 1);
        });
      });
    };
  }

  // Retour à la liste
  if (backToListBtn) { console.log('[UI] Bouton back-to-list trouvé, wiring...');
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
  if (addCategoryBtn) { console.log('[UI] Bouton add-category trouvé, wiring...');
    addCategoryBtn.onclick = function() {
      if (addCategoryBtn.disabled) return; // anti-double-clic
      addCategoryBtn.disabled = true;
      if (currentMenuId === null || !menus[currentMenuId]) {
        addCategoryBtn.disabled = false;
        return;
      }
      const menu = menus[currentMenuId];
      menu.categories = menu.categories || [];
      menu.categories.push({ name: "Nouvelle catégorie", items: [] });
      console.log('[DEBUG] Ajout catégorie - menu AVANT saveMenuToFirestore:', JSON.parse(JSON.stringify(menu)));
      if (window.currentUser) {
        saveMenuToFirestore(menu, window.currentUser, function() {
          console.log('[DEBUG] saveMenuToFirestore terminé (succès) pour menu:', menu.firestoreId);
          loadMenus(window.currentUser, function() {
            console.log('[DEBUG] loadMenus terminé après ajout catégorie. Menus rechargés:', JSON.parse(JSON.stringify(menus)));
            renderMenus();
            // Retrouve le bon index du menu courant après reload
            const newIndex = menus.findIndex(m => m.firestoreId === menu.firestoreId);
            if (newIndex !== -1) {
              console.log('[DEBUG] Catégories du menu rechargé:', JSON.parse(JSON.stringify(menus[newIndex].categories)));
              editMenu(newIndex);
            } else {
              console.warn('[DEBUG] Menu courant introuvable après reload');
              document.getElementById('menu-editor').classList.add('hidden');
              document.getElementById('menu-selection').classList.remove('hidden');
            }
            addCategoryBtn.disabled = false;
          });
        });
      } else {
        addCategoryBtn.disabled = false;
      }
    };
  }


  // Publication en ligne du menu courant
  const publishOnlineBtn = document.getElementById('publish-online');
  if (publishOnlineBtn) { console.log('[UI] Bouton publish-online trouvé, wiring...');
    let isPublishing = false;
    publishOnlineBtn.onclick = function() {
      if (isPublishing) return;
      if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
        isPublishing = true;
        publishOnlineBtn.disabled = true;
        saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
          const menu = menus[currentMenuId];
          const db = firebase.firestore();
          const { title, banner, logo, categories } = menu;
          const publicMenu = {
            title: title || '',
            banner: banner || '',
            logo: logo || '',
            categories: Array.isArray(categories) ? categories : [],
            public: true,
            owner: window.currentUser.uid,
            publishedAt: new Date().toISOString()
          };
          db.collection('public_menus').doc(menu.firestoreId || '').set(publicMenu).then(function() {
            alert('Menu publié en ligne !');
            isPublishing = false;
            publishOnlineBtn.disabled = false;
            // Active le bouton de visualisation
            const viewPublishedBtn = document.getElementById('view-published');
            if (viewPublishedBtn) {
              viewPublishedBtn.disabled = false;
              viewPublishedBtn.classList.remove('inactive');
            }
          }).catch(function(err) {
            alert('Erreur lors de la publication : ' + err.message);
            isPublishing = false;
            publishOnlineBtn.disabled = false;
          });
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

