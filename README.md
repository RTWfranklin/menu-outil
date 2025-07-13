# Menu-v1 - Structure Professionnelle

## Structure des dossiers

```
/menu-v1
  /js
    app.js         # Point d'entrée principal
    menu.js        # Gestion des menus
    category.js    # Gestion des catégories
    ui.js          # Manipulation du DOM
    firebase.js    # Intéraction avec Firebase
    utils.js       # Fonctions utilitaires
  /css
    menu-style.css
  index.html
  README.md
```

## Instructions
- Le code est désormais découpé par responsabilité.
- Le point d'entrée est `js/app.js` (chargé en tant que module dans index.html).
- Chaque fichier JS exporte ses fonctions principales.
- Ajoutez/complétez les fonctions dans chaque module selon vos besoins.

## Conseils
- Utilisez un linter (ESLint) pour éviter les erreurs de syntaxe.
- Commentez et documentez vos fonctions.
- Testez à chaque étape la bonne intégration des modules.
