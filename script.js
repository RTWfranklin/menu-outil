document.addEventListener('DOMContentLoaded', function() {
    // Firebase v8 config (copie depuis la console Firebase)
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
  
    // Sélecteurs DOM
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
  
    var menus = JSON.parse(localStorage.getItem('menus')) || [];
    var currentMenuId = null;
  
    function saveMenus() {
      localStorage.setItem('menus', JSON.stringify(menus));
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
            menus.splice(index, 1);
            saveMenus();
            renderMenus();
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
        addCategory(cat.name, cat.items, catIndex);
      });
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
        var reader = new FileReader();
        reader.onload = function (e) {
          renderImagePreview(type, e.target.result);
          if (currentMenuId !== null) {
            menus[currentMenuId][type] = e.target.result;
            saveMenus();
          }
        };
        reader.readAsDataURL(file);
      };
    }
    handleImageUpload(bannerUpload, 'banner');
    handleImageUpload(logoUpload, 'logo');
  
    function addCategory(name, items, catIndex) {
      name = name || '';
      items = items || [];
      var wrapper = document.createElement('div');
      wrapper.className = 'category';
      if (typeof catIndex === "number") {
        var upBtn = document.createElement('button');
        upBtn.textContent = '↑';
        upBtn.className = 'move-btn';
        upBtn.onclick = function() { moveCategory(catIndex, -1); };
        wrapper.appendChild(upBtn);
        var downBtn = document.createElement('button');
        downBtn.textContent = '↓';
        downBtn.className = 'move-btn';
        downBtn.onclick = function() { moveCategory(catIndex, 1); };
        wrapper.appendChild(downBtn);
      }
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Nom de la catégorie';
      input.value = name;
      wrapper.appendChild(input);
  
      var itemList = document.createElement('div');
      items.forEach(function(item, itemIndex) {
        addItem(itemList, item.name, item.price, itemIndex, wrapper);
      });
      wrapper.appendChild(itemList);
  
      var btn = document.createElement('button');
      btn.textContent = 'Ajouter un plat';
      btn.onclick = function() { addItem(itemList, '', '', null, wrapper); };
      wrapper.appendChild(btn);
  
      var delCatBtn = document.createElement('button');
      delCatBtn.textContent = '🗑️ Supprimer catégorie';
      delCatBtn.className = 'delete-btn';
      delCatBtn.onclick = function() { wrapper.remove(); };
      wrapper.appendChild(delCatBtn);
  
      categoriesContainer.appendChild(wrapper);
    }
  
    function moveCategory(index, direction) {
      if (currentMenuId === null) return;
      var categories = menus[currentMenuId].categories;
      var newIndex = index + direction;
      if (newIndex < 0 || newIndex >= categories.length) return;
      var temp = categories[index];
      categories[index] = categories[newIndex];
      categories[newIndex] = temp;
      saveMenus();
      editMenu(currentMenuId);
    }
  
    function addItem(container, name, price, itemIndex, categoryWrapper) {
      name = name || '';
      price = price || '';
      var div = document.createElement('div');
      div.className = 'item';
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Nom';
      nameInput.value = name;
      var priceInput = document.createElement('input');
      priceInput.type = 'text';
      priceInput.placeholder = 'Prix';
      priceInput.value = price;
      div.appendChild(nameInput);
      div.appendChild(priceInput);
      var delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.className = 'delete-btn';
      delBtn.style.width = 'auto';
      delBtn.onclick = function() { div.remove(); };
      div.appendChild(delBtn);
      container.appendChild(div);
    }
  
    addMenuBtn.onclick = function() {
      menus.push({ title: '', categories: [], banner: '', logo: '' });
      saveMenus();
      renderMenus();
    };
  
    backToListBtn.onclick = function() {
      menuSelection.classList.remove('hidden');
      menuEditor.classList.add('hidden');
      saveCurrentMenu();
      saveMenus();
      renderMenus();
    };
  
    menuTitleInput.oninput = function() {
      if (currentMenuId !== null) {
        menus[currentMenuId].title = menuTitleInput.value;
        saveMenus();
      }
    };
  
    addCategoryBtn.onclick = function() {
      addCategory();
    };
  
    function saveCurrentMenu() {
      if (currentMenuId === null) return;
      var categories = [];
      categoriesContainer.querySelectorAll('.category').forEach(function(catEl) {
        var catInputs = catEl.querySelectorAll('input[type="text"]');
        var name = catInputs[0] ? catInputs[0].value : '';
        var items = [];
        catEl.querySelectorAll('.item').forEach(function(itemEl) {
          var inputs = itemEl.querySelectorAll('input');
          items.push({ name: inputs[0].value, price: inputs[1].value });
        });
        if (name) categories.push({ name: name, items: items });
      });
      menus[currentMenuId].categories = categories;
    }
  
    function publishMenuOnline(menu) {
      if (menu.firestoreId) {
        return db.collection('menus').doc(menu.firestoreId).set(menu).then(function() {
          return menu.firestoreId;
        });
      }
      return db.collection('menus').add(menu).then(function(docRef) {
        menu.firestoreId = docRef.id;
        saveMenus();
        return docRef.id;
      });
    }
  
    publishOnlineBtn.onclick = function() {
      saveCurrentMenu();
      if (currentMenuId === null) return;
      var menu = menus[currentMenuId];
      publishMenuOnline(menu).then(function(id) {
        var publicUrl = window.location.origin + "/menu.html?id=" + id;
        prompt("Voici l’URL à utiliser pour le QR code :", publicUrl);
      });
    };
  
    renderMenus();
  });