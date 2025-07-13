// Fonctions liées à la gestion des catégories
import { menus, currentMenuId } from './menu.js';
import { renderMenus } from './ui.js';

export function addCategory() {
  if (typeof menus === 'undefined' || currentMenuId === null) return;
  if (!menus[currentMenuId].categories) menus[currentMenuId].categories = [];
  menus[currentMenuId].categories.push({ name: '', items: [] });
  if (typeof renderMenus === 'function') renderMenus();
}
