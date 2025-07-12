document.addEventListener('DOMContentLoaded', function() {
  // Firebase config (ta config !)
  const firebaseConfig = {
    apiKey: "AIzaSyCxVS6IvetneJ1Q5kr8t5d7F3qd8oe8KjQ",
    authDomain: "menu-outil.firebaseapp.com",
    projectId: "menu-outil",
    storageBucket: "menu-outil.appspot.com",
    messagingSenderId: "659889655771",
    appId: "1:659889655771:web:c970fa451635dac4dfe1fe",
    measurementId: "G-18ZGPKGBQD"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Sélecteurs
  const menuList = document.getElementById('menu-list');
  const menuSelection = document.getElementById('menu-selection');
  const menuEditor = document.getElementById('menu-editor');
  const addMenuBtn = document.getElementById('add-menu');
  const backToListBtn = document.getElementById('back-to-list');
  const menuTitleInput = document.getElementById('menu-title');
  const bannerUpload = document.getElementById('banner-upload');
  const logoUpload = document.getElementById('logo-upload');
  const bannerPreviewContainer = document.getElementById('banner-preview');
  const logoPreviewContainer = document.getElementById('logo-preview');
  const categoriesContainer = document.getElementById('categories');
  const addCategoryBtn = document.getElementById('add-category');
  const publishOnlineBtn = document.getElementById('publish-online');

  let menus = JSON.parse(localStorage.getItem('menus')) || [];
  let currentMenuId = null;

  function saveMenus() {
    localStorage.setItem('menus', JSON.stringify(menus));
  }

  function renderMenus() {
    menuList.innerHTML = '';
    menus.forEach((menu, index) => {
      const btn = document.createElement('button');
      btn.textContent = menu.title || `Menu ${index + 1}`;
      btn.onclick = () => editMenu(index);
      menuList.appendChild(btn);

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️ Supprimer';
      delBtn.className = 'delete-btn';
      delBtn.onclick = () => {
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
    const menu = menus[index];
    menuSelection.classList.add('hidden');
    menuEditor.classList.remove('hidden');
    menuTitleInput.value = menu.title || '';
    renderImagePreview('banner', menu.banner || '');
    renderImagePreview('logo', menu.logo || '');
    categoriesContainer.innerHTML = '';
    (menu.categories || []).forEach((cat, catIndex) => addCategory(cat.name, cat.items, catIndex));
  }

  function renderImagePreview(type, src) {
    const container = type === 'banner' ? bannerPreviewContainer : logoPreviewContainer;
    container.innerHTML = '';
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      container.appendChild(img);
    }
  }

  function handleImageUpload(input, type) {
    input.onchange = function () {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
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

  function addCategory(name = '', items = [], catIndex = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'category';
    if (catIndex !== null) {
      const upBtn = document.createElement('button');
      upBtn.textContent = '↑';
      upBtn.className = 'move-btn';
      upBtn.onclick = () => moveCategory(catIndex, -1);
      wrapper.appendChild(upBtn);
      const downBtn = document.createElement('button');
      downBtn.textContent = '↓';
      downBtn.className = 'move-btn';
      downBtn.onclick = () => moveCategory(catIndex, 1);
      wrapper.appendChild(downBtn);
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nom de la catégorie';
    input.value = name;
    wrapper.appendChild(input);

    const itemList = document.createElement('div');
    items.forEach((item, itemIndex) => addItem(itemList, item.name, item.price, itemIndex, wrapper));
    wrapper.appendChild(itemList);

    const btn = document.createElement('button');
    btn.textContent = 'Ajouter un plat';
    btn.onclick = () => addItem(itemList, '', '', null, wrapper);
    wrapper.appendChild(btn);

    const delCatBtn = document.createElement('button');
    delCatBtn.textContent = '🗑️ Supprimer catégorie';
    delCatBtn.className = 'delete-btn';
    delCatBtn.onclick = () => { wrapper.remove(); };
    wrapper.appendChild(delCatBtn);

    categoriesContainer.appendChild(wrapper);
  }

  function moveCategory(index, direction) {
    if (currentMenuId === null) return;
    const categories = menus[currentMenuId].categories;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    [categories[index], categories[newIndex]] = [categories[newIndex], categories[index]];
    saveMenus();
    editMenu(currentMenuId);
  }

  function addItem(container, name = '', price = '', itemIndex = null, categoryWrapper = null) {
    const div = document.createElement('div');
    div.className = 'item';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Nom';
    nameInput.value = name;
    const priceInput = document.createElement('input');
    priceInput.type = 'text';
    priceInput.placeholder = 'Prix';
    priceInput.value = price;
    div.appendChild(nameInput);
    div.appendChild(priceInput);
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.className = 'delete-btn';
    delBtn.style.width = 'auto';
    delBtn.onclick = () => div.remove();
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
    const categories = [];
    categoriesContainer.querySelectorAll('.category').forEach(catEl => {
      const catInputs = catEl.querySelectorAll('input[type="text"]');
      const name = catInputs[0] ? catInputs[0].value : '';
      const items = [];
      catEl.querySelectorAll('.item').forEach(itemEl => {
        const [nameInput, priceInput] = itemEl.querySelectorAll('input');
        items.push({ name: nameInput.value, price: priceInput.value });
      });
      if (name) categories.push({ name, items });
    });
    menus[currentMenuId].categories = categories;
  }

  async function publishMenuOnline(menu) {
    if (menu.firestoreId) {
      await db.collection('menus').doc(menu.firestoreId).set(menu);
      return menu.firestoreId;
    }
    const docRef = await db.collection('menus').add(menu);
    menu.firestoreId = docRef.id;
    saveMenus();
    return docRef.id;
  }

  publishOnlineBtn.onclick = async function() {
    saveCurrentMenu();
    if (currentMenuId === null) return;
    const menu = menus[currentMenuId];
    const id = await publishMenuOnline(menu);
    const publicUrl = window.location.origin + "/menu.html?id=" + id;
    prompt("Voici l’URL à utiliser pour le QR code :", publicUrl);
  };

  renderMenus();
});