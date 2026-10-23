# Guide de Style de Code

Ce guide a pour but de garantir un code cohérent et maintenable dans l'ensemble du projet. 
Merci de suiverces conventions pour écrire du code propre et lisible.

## Style automatique 


Le style et les conventions sont automatiquement corrigés lorsque vous exécutez : 
- `npm run lint` pour le JavaScript
- `npm run stylelint` pour le CSS

Vous pouvez également configurer VSCode pour qu'il fasse les corrections automatiquement. 
Nous vous conseillons d'utiliser l'extension ESLint avec la configuration suivante :
```json
"eslint.experimental.useFlatConfig": true,
"editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
}
 ```


## Généralités

- Utilisez des noms de variables et de fonctions clairs et significatifs.
- Commentez votre code lorsque cela est nécessaire pour expliquer des parties complexes ou non évidentes.
- Respectez les conventions de nommage spécifiques au langage utilisé.

## Indentation

- Utilisez des espaces pour l'indentation, pas de tabulations.
- Indentez votre code avec 2 espaces pour JavaScript et JSON.
- Indentez votre code avec 4 espaces pour YAML et Markdown.

## Nommage

- Utilisez le camelCase pour les noms de variables et de fonctions en JavaScript.
- Utilisez le PascalCase pour les noms de classes en JavaScript.
- Utilisez des noms de constantes en majuscules avec des underscores (e.g., `CONSTANT_NAME`).

## Espaces et Retours à la Ligne

- Ajoutez une ligne vide à la fin de chaque fichier.
- Limitez la longueur des lignes à 80 caractères.
- Utilisez des espaces autour des opérateurs (e.g., `a + b`).

## Syntaxe JavaScript

- Utilisez `const` pour les variables qui ne changent pas et `let` pour celles qui changent.
- Préférez les fonctions fléchées (`=>`) aux fonctions anonymes.
- Utilisez des templates littéraux (backticks) pour les chaînes de caractères multi-lignes ou contenant des variables.
- Utilisez des accolades pour toutes les structures de contrôle (e.g., `if`, `for`).

## Exemples

### Variables et Fonctions


```javascript
// Mauvais
var myVariable = 10;
function myfunction() {
  // code
}

// Bon
const myVariable = 10;
const myFunction = () => {
  // code
};

//structures de controles

// Mauvais
if(condition) doSomething();

// Bon
if (condition) {
  doSomething();
}

//Chaînes de Caractères 

// Mauvais
const message = 'Hello, ' + name + '!';

// Bon
const message = `Hello, ${name}!`;
```

### Linting

- Utilisez ESLINT pour vérifier et corriger automatiquement les erreurs de style de code.
- Configurez ESLint avec les règles définies dans ce guide

### Documentation

- Documentez vos fonctions et classes avec des commentaires JSDoc.
- Utilisez des commentaires pour expliquer les parties complexes du code

### Tests

- Ecrivez des tests pour toute nouvelle fonctionnalité ou correction de bug.
- Utilisez des noms de tests clairs et descriptifs.

## Ressources

- [Javascripts Standard Style](https://standardjs.com/)
- [ESLint](https://eslint.org/)

En suivant ces conventions, nous pouvons ainsi garantir une qualité de code élevée et une meilleure collaboration entre les membres de l'équipe.