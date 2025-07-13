// Fonction utilitaire d'ajout de catégorie pour compatibilité avec les appels existants
function addCategory() {
  if (typeof menus === 'undefined' || currentMenuId === null) return;
  if (!menus[currentMenuId].categories) menus[currentMenuId].categories = [];
  menus[currentMenuId].categories.push({ name: '', items: [] });
  if (typeof renderMenus === 'function') renderMenus();
}
