// Fonctions de manipulation du DOM et de l'interface utilisateur
// Fonctions de manipulation du DOM et de l'interface utilisateur
import { addCategory } from './category.js';
// Import des fonctions et variables nécessaires
import { menus, currentMenuId, saveMenuToFirestore, deleteMenu, setCurrentMenuId, loadMenus } from './menu.js';

import { uploadImageToCloudinary } from './firebase.js';

let saveTimeout = null;
function debouncedSaveMenu(menu, user, cb) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveMenuToFirestore(menu, user, cb);
  }, 500);
}

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
    // --- Drag & Drop pour réordonner les catégories ---
catDiv.draggable = true;
catDiv.ondragstart = function(e) {
  e.dataTransfer.setData('text/plain', catIndex);
  catDiv.classList.add('dragging');
};
catDiv.ondragend = function() {
  catDiv.classList.remove('dragging');
};
catDiv.ondragover = function(e) {
  e.preventDefault();
  catDiv.classList.add('drag-over');
};
catDiv.ondragleave = function() {
  catDiv.classList.remove('drag-over');
};
catDiv.ondrop = function(e) {
  e.preventDefault();
  catDiv.classList.remove('drag-over');
  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
  const toIndex = catIndex;
  if (fromIndex !== toIndex) {
    const movedCat = menu.categories.splice(fromIndex, 1)[0];
    menu.categories.splice(toIndex, 0, movedCat);
    saveMenuToFirestore(menu, window.currentUser, function() {
      editMenu(index);
    });
  }
};
    // Champ nom de catégorie
    const catNameInput = document.createElement('input');
    catNameInput.type = 'text';
    catNameInput.placeholder = 'Nom de la catégorie';
    catNameInput.value = cat.name || '';
    catNameInput.oninput = function(e) {
      cat.name = e.target.value;
      if (currentMenuId !== null && menus[currentMenuId] && window.currentUser) {
        debouncedSaveMenu(menus[currentMenuId], window.currentUser, function() {
          if (typeof menu !== 'undefined' && Array.isArray(menu.categories)) {
            menu.categories.forEach(function(cat) {
              if (!cat.id) cat.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              if (Array.isArray(cat.subcategories)) {
                cat.subcategories.forEach(function(subcat) {
                  if (!subcat.id) subcat.id = 'subcat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                });
              }
            });
          }
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
      const newSubcat = { 
        name: '', 
        items: [] 
      };
      
      // Génération d'un id unique pour la sous-catégorie
      newSubcat.id = 'subcat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      cat.subcategories.push(newSubcat);
      saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
        editMenu(index);
      });
    };
    catDiv.appendChild(addSubCatBtn);
    // Affichage des sous-catégories si présentes
    if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
      cat.subcategories.forEach(function(subcat, subcatIndex) {
        // 1. Drop zone avant la sous-catégorie
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        console.log('DROPZONE créée (sous-catégorie)', subcatIndex);
        dropZone.ondragover = function(e) { e.preventDefault(); dropZone.classList.add('active'); };
        dropZone.ondragleave = function() { dropZone.classList.remove('active'); };
        dropZone.ondrop = function(e) {
          e.preventDefault();
          dropZone.classList.remove('active');
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const fromIndex = cat.subcategories.findIndex(sc => sc.id === data.fromSubcatId);
          if (fromIndex !== -1 && fromIndex !== subcatIndex) {
            const moved = cat.subcategories.splice(fromIndex, 1)[0];
            cat.subcategories.splice(subcatIndex, 0, moved);
            saveMenuToFirestore(menu, window.currentUser, function() { editMenu(index); });
          }
        };
        catDiv.appendChild(dropZone);

        // 2. Création du subcatDiv (drag & drop désactivé ici)
        const subcatDiv = document.createElement('div');
        subcatDiv.className = 'subcategory';
        // --- DRAG HANDLE POUR SOUS-CATEGORIE ---
        // Après la création de subcatDiv
        const subcatDragHandle = document.createElement('span');
        subcatDragHandle.textContent = '☰';
        subcatDragHandle.className = 'drag-handle';
        subcatDragHandle.draggable = true;
        subcatDragHandle.ondragstart = function(e) {
          const payload = JSON.stringify({
            fromCatId: cat.id,
            fromSubcatId: subcat.id
          });
          console.log('DRAGSTART sous-catégorie', payload);
          e.dataTransfer.setData('text/plain', payload);
          subcatDragHandle.classList.add('dragging');
        };
        subcatDragHandle.ondragend = function() {
          subcatDragHandle.classList.remove('dragging');
        };
        subcatDiv.insertBefore(subcatDragHandle, subcatDiv.firstChild);
        // subcatDiv.draggable = true; // Désactivé pour éviter conflit
        // subcatDiv.ondragstart = ...
        // subcatDiv.ondragend = ...
        // subcatDiv.ondragover = ...
        // subcatDiv.ondragleave = ...
        // subcatDiv.ondrop = ...
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
        // --- Zone de drop sur le conteneur d'items (sous-catégorie) ---
subItemsDiv.ondragover = function(e) {
  e.preventDefault();
  subItemsDiv.classList.add('drag-over');
};
subItemsDiv.ondragleave = function() {
  subItemsDiv.classList.remove('drag-over');
};
subItemsDiv.ondrop = function(e) {
  e.preventDefault();
  subItemsDiv.classList.remove('drag-over');
  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
  // Recherche de la catégorie et sous-catégorie source par id
  const fromCatIndex = menu.categories.findIndex(c => c.id === data.fromCatId);
  const fromCat = menu.categories[fromCatIndex];
  let fromSubcatIndex = -1;
  if (fromCat && data.fromSubcatId) {
    fromSubcatIndex = fromCat.subcategories.findIndex(sc => sc.id === data.fromSubcatId);
  }
  let movedItem = null;

  if (
    fromCat &&
    Array.isArray(fromCat.subcategories) &&
    fromSubcatIndex !== -1 &&
    fromCat.subcategories[fromSubcatIndex] &&
    Array.isArray(fromCat.subcategories[fromSubcatIndex].items)
  ) {
    // Drag depuis une sous-catégorie
    movedItem = fromCat.subcategories[fromSubcatIndex].items.splice(data.fromItem, 1)[0];
  } else if (fromCat && Array.isArray(fromCat.items)) {
    // Drag depuis une catégorie simple
    movedItem = fromCat.items.splice(data.fromItem, 1)[0];
  }

  if (movedItem) {
    if (!cat.subcategories[subcatIndex].items) cat.subcategories[subcatIndex].items = [];
    cat.subcategories[subcatIndex].items.push(movedItem);
    saveMenuToFirestore(menu, window.currentUser, function() {
      editMenu(index);
    });
  } else {
    console.error('Drag & drop item: impossible de trouver l\'item à déplacer', data, menu);
  }
};
        // --- Boucle des items dans une sous-catégorie ---
        (subcat.items || []).forEach(function(item, itemIndex) {
          const thisCat = cat;
          const thisSubcat = subcat;
          console.log('Boucle items (sous-catégorie)', {cat: thisCat, subcat: thisSubcat, itemIndex});
          const itemDiv = document.createElement('div');
          // 1. Drop zone avant l'item
          const dropZone = document.createElement('div');
          dropZone.className = 'drop-zone';
          console.log('DROPZONE créée (item)', itemIndex);
          dropZone.ondragover = function(e) { e.preventDefault(); dropZone.classList.add('active'); };
          dropZone.ondragleave = function() { dropZone.classList.remove('active'); };
          dropZone.ondrop = function(e) {
            e.preventDefault();
            dropZone.classList.remove('active');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            // Recherche de la catégorie et sous-catégorie source par id
            const fromCatIndex = menu.categories.findIndex(c => c.id === data.fromCatId);
            const fromCat = menu.categories[fromCatIndex];
            let fromSubcatIndex = -1;
            if (fromCat && data.fromSubcatId) {
              fromSubcatIndex = fromCat.subcategories.findIndex(sc => sc.id === data.fromSubcatId);
            }
            let movedItem = null;
            if (
              fromCat &&
              Array.isArray(fromCat.subcategories) &&
              fromSubcatIndex !== -1 &&
              fromCat.subcategories[fromSubcatIndex] &&
              Array.isArray(fromCat.subcategories[fromSubcatIndex].items)
            ) {
              movedItem = fromCat.subcategories[fromSubcatIndex].items.splice(data.fromItem, 1)[0];
            } else if (fromCat && Array.isArray(fromCat.items)) {
              movedItem = fromCat.items.splice(data.fromItem, 1)[0];
            }
            if (movedItem) {
              if (!subcat.items) subcat.items = [];
              subcat.items.splice(itemIndex, 0, movedItem);
              saveMenuToFirestore(menu, window.currentUser, function() { editMenu(index); });
            } else {
              console.error('Drag & drop item: impossible de trouver l\'item à déplacer', data, menu);
            }
          };
          subItemsDiv.appendChild(dropZone);

          // 2. Création du itemDiv (drag & drop désactivé ici)
          const itemDragHandle = document.createElement('span');
          itemDragHandle.textContent = '☰';
          itemDragHandle.className = 'drag-handle';
          itemDragHandle.draggable = true;
          itemDragHandle.ondragstart = function(e) {
            console.log('DEBUG drag handle', {thisCat, thisSubcat, itemIndex});
            const payload = JSON.stringify({
              fromCatId: thisCat.id,
              fromSubcatId: thisSubcat.id,
              fromItem: itemIndex
            });
            console.log('DRAGSTART item (sous-catégorie)', payload);
            e.dataTransfer.setData('text/plain', payload);
            itemDragHandle.classList.add('dragging');
          };
          itemDragHandle.ondragend = function() {
            itemDragHandle.classList.remove('dragging');
          };
          itemDiv.insertBefore(itemDragHandle, itemDiv.firstChild);
          // itemDiv.draggable = true; // Désactivé pour éviter conflit
          // itemDiv.ondragstart = ...
          // itemDiv.ondragend = ...
          // itemDiv.ondragover = ...
          // itemDiv.ondragleave = ...
          // itemDiv.ondrop = ...
          // Nom
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.placeholder = 'Nom';
          nameInput.value = item.name || '';
          nameInput.onblur = function(e) {
            item.name = e.target.value;
            debouncedSaveMenu(menus[currentMenuId], window.currentUser);
          };
          itemDiv.appendChild(nameInput);
          // Prix
          const priceInput = document.createElement('input');
          priceInput.type = 'text';
          priceInput.placeholder = 'Prix';
          priceInput.value = item.price || '';
          priceInput.onblur = function(e) {
            item.price = e.target.value;
            debouncedSaveMenu(menus[currentMenuId], window.currentUser);
          };
          itemDiv.appendChild(priceInput);
          // Description
          const descInput = document.createElement('input');
          descInput.type = 'text';
          descInput.placeholder = 'Description';
          descInput.value = item.desc || '';
          descInput.onblur = function(e) {
            item.desc = e.target.value;
            debouncedSaveMenu(menus[currentMenuId], window.currentUser);
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
          // Bouton suppression item (dans sous-catégorie)
          const delItemBtn = document.createElement('button');
          delItemBtn.textContent = '🗑️';
          delItemBtn.title = 'Supprimer cet item';
          delItemBtn.onclick = function() {
            if (confirm('Supprimer cet item ?')) {
              subcat.items.splice(itemIndex, 1);
              saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
                editMenu(index);
              });
            }
          };
          itemDiv.appendChild(delItemBtn);
          // Ajout input file pour image
          const imgInput = document.createElement('input');
          imgInput.type = 'file';
          imgInput.accept = 'image/*';
          imgInput.onchange = function(e) {
            const file = imgInput.files[0];
            if (!file) return;
            uploadImageToCloudinary(file, function(url) {
              item.imgUrl = url;
              const imgPreview = document.createElement('img');
              imgPreview.style.maxHeight = '40px';
              imgPreview.style.display = item.imgUrl ? '' : 'none';
              if (item.imgUrl) imgPreview.src = item.imgUrl;
              itemDiv.appendChild(imgPreview);
              saveMenuToFirestore(menus[currentMenuId], window.currentUser);
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
          subItemsDiv.appendChild(itemDiv);
        });
        // Drop zone finale pour drop à la fin de la liste d'items
        const itemDropZoneEnd = document.createElement('div');
        itemDropZoneEnd.className = 'drop-zone';
        console.log('DROPZONE créée (fin items)', subcat.items ? subcat.items.length : 0);
        itemDropZoneEnd.ondragover = function(e) { e.preventDefault(); itemDropZoneEnd.classList.add('active'); };
        itemDropZoneEnd.ondragleave = function() { itemDropZoneEnd.classList.remove('active'); };
        itemDropZoneEnd.ondrop = function(e) {
          e.preventDefault();
          itemDropZoneEnd.classList.remove('active');
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const fromCatIndex = menu.categories.findIndex(c => c.id === data.fromCatId);
          const fromCat = menu.categories[fromCatIndex];
          let fromSubcatIndex = -1;
          if (fromCat && data.fromSubcatId) {
            fromSubcatIndex = fromCat.subcategories.findIndex(sc => sc.id === data.fromSubcatId);
          }
          let movedItem = null;
          if (
            fromCat &&
            Array.isArray(fromCat.subcategories) &&
            fromSubcatIndex !== -1 &&
            fromCat.subcategories[fromSubcatIndex] &&
            Array.isArray(fromCat.subcategories[fromSubcatIndex].items)
          ) {
            movedItem = fromCat.subcategories[fromSubcatIndex].items.splice(data.fromItem, 1)[0];
          } else if (fromCat && Array.isArray(fromCat.items)) {
            movedItem = fromCat.items.splice(data.fromItem, 1)[0];
          }
          if (movedItem) {
            if (!subcat.items) subcat.items = [];
            subcat.items.push(movedItem);
            saveMenuToFirestore(menu, window.currentUser, function() { editMenu(index); });
          } else {
            console.error('Drag & drop item: impossible de trouver l\'item à déplacer', data, menu);
          }
        };
        subItemsDiv.appendChild(itemDropZoneEnd);
        subcatDiv.appendChild(subItemsDiv);
        catDiv.appendChild(subcatDiv);
      });
      // 3. Drop zone finale (pour drop à la fin)
      const dropZoneEnd = document.createElement('div');
      dropZoneEnd.className = 'drop-zone';
      console.log('DROPZONE créée (fin sous-catégories)', cat.subcategories ? cat.subcategories.length : 0);
      dropZoneEnd.ondragover = function(e) { e.preventDefault(); dropZoneEnd.classList.add('active'); };
      dropZoneEnd.ondragleave = function() { dropZoneEnd.classList.remove('active'); };
      dropZoneEnd.ondrop = function(e) {
        e.preventDefault();
        dropZoneEnd.classList.remove('active');
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const fromIndex = cat.subcategories.findIndex(sc => sc.id === data.fromSubcatId);
        if (fromIndex !== -1 && fromIndex !== cat.subcategories.length - 1) {
          const moved = cat.subcategories.splice(fromIndex, 1)[0];
          cat.subcategories.push(moved);
          saveMenuToFirestore(menu, window.currentUser, function() { editMenu(index); });
        }
      };
      catDiv.appendChild(dropZoneEnd);
    } else {
      // Affichage des items de la catégorie (fallback)
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'items';
      // --- Zone de drop sur le conteneur d'items (catégorie simple) ---
itemsDiv.ondragover = function(e) {
  e.preventDefault();
  itemsDiv.classList.add('drag-over');
};
itemsDiv.ondragleave = function() {
  itemsDiv.classList.remove('drag-over');
};
itemsDiv.ondrop = function(e) {
  e.preventDefault();
  itemsDiv.classList.remove('drag-over');
  const raw = e.dataTransfer.getData('text/plain');
  console.log('DROPZONE catégorie simple reçoit', raw);
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Impossible de parser le dataTransfer (catégorie simple)', raw);
    return;
  }
  const fromCatIndex = menu.categories.findIndex(c => c.id === data.fromCatId);
  const fromCat = menu.categories[fromCatIndex];
  let fromSubcatIndex = -1;
  if (fromCat && data.fromSubcatId) {
    fromSubcatIndex = fromCat.subcategories && fromCat.subcategories.findIndex(sc => sc.id === data.fromSubcatId);
  }
  let movedItem = null;
  if (
    fromCat &&
    Array.isArray(fromCat.subcategories) &&
    fromSubcatIndex !== -1 &&
    fromCat.subcategories[fromSubcatIndex] &&
    Array.isArray(fromCat.subcategories[fromSubcatIndex].items)
  ) {
    movedItem = fromCat.subcategories[fromSubcatIndex].items.splice(data.fromItem, 1)[0];
  } else if (fromCat && Array.isArray(fromCat.items)) {
    movedItem = fromCat.items.splice(data.fromItem, 1)[0];
  }
  if (movedItem) {
    if (!cat.items) cat.items = [];
    cat.items.push(movedItem);
    saveMenuToFirestore(menu, window.currentUser, function() {
      editMenu(index);
    });
  } else {
    console.error('Drag & drop item: impossible de trouver l\'item à déplacer', data, menu);
  }
};
      // --- Boucle des items dans une catégorie simple ---
      (cat.items || []).forEach(function(item, itemIndex) {
        const thisCat = cat;
        console.log('Boucle items (catégorie simple)', {cat: thisCat, itemIndex});
        const itemDiv = document.createElement('div');
        // --- Drag handle uniquement sur la poignée ---
        const itemDragHandle = document.createElement('span');
        itemDragHandle.textContent = '☰';
        itemDragHandle.className = 'drag-handle';
        itemDragHandle.draggable = true;
        itemDragHandle.ondragstart = function(e) {
          const payload = JSON.stringify({
            fromCatId: thisCat.id,
            fromSubcatId: null,
            fromItem: itemIndex
          });
          console.log('DRAGSTART item (catégorie simple)', payload);
          e.dataTransfer.setData('text/plain', payload);
          itemDragHandle.classList.add('dragging');
        };
        itemDragHandle.ondragend = function() {
          itemDragHandle.classList.remove('dragging');
        };
        itemDiv.insertBefore(itemDragHandle, itemDiv.firstChild);
        // Nom
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Nom';
        nameInput.value = item.name || '';
        nameInput.onblur = function(e) {
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
        priceInput.onblur = function(e) {
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
        descInput.onblur = function(e) {
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
        // Bouton suppression item (fallback)
        const delItemBtn = document.createElement('button');
        delItemBtn.textContent = '🗑️';
        delItemBtn.title = 'Supprimer cet item';
        delItemBtn.onclick = function() {
          if (confirm('Supprimer cet item ?')) {
            cat.items.splice(itemIndex, 1);
            saveMenuToFirestore(menus[currentMenuId], window.currentUser, function() {
              editMenu(index);
            });
          }
        };
        itemDiv.appendChild(delItemBtn);
        // Ajout input file pour image
        const imgInput2 = document.createElement('input');
        imgInput2.type = 'file';
        imgInput2.accept = 'image/*';
        imgInput2.onchange = function(e) {
          const file = imgInput2.files[0];
          if (!file) return;
          uploadImageToCloudinary(file, function(url) {
            item.imgUrl = url;
            const imgPreview2 = document.createElement('img');
            imgPreview2.style.maxHeight = '40px';
            imgPreview2.style.display = item.imgUrl ? '' : 'none';
            if (item.imgUrl) imgPreview2.src = item.imgUrl;
            itemDiv.appendChild(imgPreview2);
            saveMenuToFirestore(menus[currentMenuId], window.currentUser);
          }, function(errorMsg) {
            alert('Erreur upload image plat: ' + errorMsg);
          });
        };
        itemDiv.appendChild(imgInput2);
        // Preview image
        const imgPreview2 = document.createElement('img');
        imgPreview2.style.maxHeight = '40px';
        imgPreview2.style.display = item.imgUrl ? '' : 'none';
        if (item.imgUrl) imgPreview2.src = item.imgUrl;
        itemDiv.appendChild(imgPreview2);
        itemsDiv.appendChild(itemDiv);
      });
      // Bouton ajout item dans catégorie (fallback)
      const addItemBtn = document.createElement('button');
      addItemBtn.textContent = 'Ajouter un item';
      addItemBtn.onclick = function() {
        if (!cat.items) cat.items = [];
        cat.items.push({ name: '', price: '', desc: '', badges: [], imgUrl: '' });
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
      // Migration : ajoute un id à chaque catégorie et sous-catégorie si absent
if (typeof menu !== 'undefined' && Array.isArray(menu.categories)) {
  menu.categories.forEach(function(cat) {
    if (!cat.id) cat.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    if (Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach(function(subcat) {
        if (!subcat.id) subcat.id = 'subcat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      });
    }
  });
  // Sauvegarde le menu pour persister les ids
  if (window.currentUser) {
    saveMenuToFirestore(menu, window.currentUser, function() {
      console.log('[DEBUG] Migration des ids terminée et menu sauvegardé');
    });
  }
}
      menu.categories = menu.categories || [];
      const newCat = { name: "Nouvelle catégorie", items: [] };
      if (!newCat.id) newCat.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      menu.categories.push(newCat);      console.log('[DEBUG] Ajout catégorie - menu AVANT saveMenuToFirestore:', JSON.parse(JSON.stringify(menu)));
      if (window.currentUser) {
        saveMenuToFirestore(menu, window.currentUser, function() {
          console.log('[DEBUG] saveMenuToFirestore terminé (succès) pour menu:', menu.firestoreId);
          loadMenus(window.currentUser, function() {
            // MIGRATION : Ajoute un id à chaque catégorie et sous-catégorie si absent
if (typeof menu !== 'undefined' && Array.isArray(menu.categories)) {
  menu.categories.forEach(function(cat) {
    if (!cat.id) cat.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    if (Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach(function(subcat) {
        if (!subcat.id) subcat.id = 'subcat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      });
    }
  });
  // Sauvegarde le menu pour persister les ids
  if (window.currentUser) {
    saveMenuToFirestore(menu, window.currentUser, function() {
      console.log('[DEBUG] Migration des ids terminée et menu sauvegardé');
    });
  }
}
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

