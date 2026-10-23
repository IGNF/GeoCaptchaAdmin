# Documentation développeur

GeoCaptchaAdmin est l'interface d'administration des GéoCaptcha de l'IGN. Cette application monopage est construite avec Vue 3, Vue Router et Vite. Son interface utilise les composants de [vue-dsfr](https://github.com/GouvernementFR/vue-dsfr) et les feuilles de style du [DSFR](https://www.systeme-de-design.gouv.fr/).

L'interface communique avec une instance distincte de l'API GéoCaptcha. Le dépôt contient le frontend, pas le code du backend.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation et lancement](#installation-et-lancement)
- [Configuration et accès à l'API](#configuration-et-accès-à-lapi)
- [Build et vérifications](#build-et-vérifications)
- [Architecture du frontend](#architecture-du-frontend)
- [Parcours fonctionnels](#parcours-fonctionnels)
- [Dépendances principales](#dépendances-principales)
- [Contribution](#contribution)
- [Documentation complémentaire](#documentation-complémentaire)

## Fonctionnalités

- **Accueil** : chargement de la bibliothèque GeoCaptcha de l'API, lancement d'un captcha de démonstration et validation de son jeton.
- **Génération de GéoCaptcha** : choix d'une localisation sur la carte, saisie de coordonnées exactes ou génération aléatoire ; choix du fond (Ortho, Plan ou Scan), prévisualisation, puis acceptation ou refus du défi.
- **Tableau de bord** : carte de chaleur et statistiques calculées à partir des sessions renvoyées par l'API ; recherche, filtres, tri, pagination, détails et rejet d'un GéoCaptcha.
- **Gestion des clés d'accès** : recherche des utilisateurs, création, modification et suppression de clés avec nom, adresse e-mail, référents et rôle.
- **Interface** : navigation entre les pages, champ de clé API et bascule entre thème clair et sombre.

## Prérequis

- Node.js 22 (22.12 ou supérieur recommandé pour Vite 7) et npm.
- Une instance de l'[API GéoCaptcha](https://github.com/IGNF/GeocaptchaAPI) démarrée et accessible depuis le navigateur.
- Une clé API autorisée par cette instance pour les fonctionnalités d'administration.

## Installation et lancement

Depuis la racine du dépôt, installez les dépendances déclarées dans `package.json` :

```sh
npm install
```

Démarrez le serveur local :

```sh
npm run dev
```

Vite affiche l'adresse locale à ouvrir dans le navigateur. Pour rendre le serveur accessible depuis le réseau local :

```sh
npm run dev -- --host
```

## Configuration et accès à l'API

L'adresse de base actuellement utilisée est `http://127.0.0.1:3000/api/v1`. Elle est définie dans `src/services/api-config.ts`. La page de gestion des clés utilise également cette adresse, déclarée dans `src/views/KeyAccess.vue`.

Les requêtes administratives transmettent les en-têtes `x-api-key` et `x-app-id`. L'identifiant d'application utilisé par l'interface est `admin`. Saisissez la clé API dans le champ de l'en-tête : elle est conservée dans le `sessionStorage` du navigateur sous `dashboardApiKey` pendant la session.

La configuration de l'adresse de l'API est actuellement inscrite dans le code ; il n'y a pas de fichier `.env` configuré pour la remplacer. Ne publiez jamais de clé ou de secret dans le dépôt. Les variables préfixées par `VITE_` sont incorporées au code client et ne doivent pas servir à protéger un secret.

L'API doit autoriser les requêtes du navigateur depuis l'origine du frontend (CORS). Pour les contrats et exemples de requêtes, consultez le dossier [`bruno`](./bruno/README.md) et la documentation de l'API.

## Build et vérifications

Générez le build de production dans `dist/` :

```sh
npm run build
```

Prévisualisez localement le build :

```sh
npm run preview
```

Le dépôt ne déclare actuellement ni script de lint ni script de test dans `package.json`. Vérifiez au minimum la compilation avec `npm run build` après une modification. Un `Dockerfile` est également fourni pour construire une image servie par Nginx.

## Architecture du frontend

```text
src/
├── assets/       Images et ressources graphiques
├── components/   Composants Vue réutilisables (carte, aperçu, en-tête, tableaux…)
├── composables/  État réactif et logique métier réutilisable
├── router/       Routes Vue Router
├── services/     Accès à l'API et sources de tuiles
├── utils/        Fonctions et types pour la géographie, les GéoCaptcha et le tableau de bord
├── views/        Pages de l'application
├── App.vue       Structure commune et conservation de la clé API
└── main.js       Initialisation de Vue, DSFR et du routeur
```

Les pages principales sont :

| Page | Route | Fichier |
| --- | --- | --- |
| Accueil et captcha de démonstration | `/` | `src/views/Home.vue` |
| Génération d'un GéoCaptcha | `/geo-captcha` | `src/views/CreateGeoCaptcha.vue` |
| Statistiques, carte de chaleur et journaux | `/dashboard` | `src/views/Dashboard.vue` |
| Gestion des clés d'accès | `/key-access` | `src/views/KeyAccess.vue` |

Les services `kingpin-service.ts` et `session-service.ts` centralisent respectivement les requêtes de gestion des GéoCaptcha et des sessions. Les composables associés chargent les données et gèrent leur état réactif. Les utilitaires `geo/` et `geocaptcha/` regroupent les fonctions de localisation, de géométrie, de sélection des modes et de préparation des données.

## Parcours fonctionnels

### Génération

La page de génération propose trois modes de localisation :

1. **Sur la carte** : dessiner une zone ; l'application tente d'y sélectionner un point situé en France.
2. **Coordonnées exactes** : choisir un département puis saisir latitude et longitude. Le code postal est facultatif et peut être déterminé à partir de la commune.
3. **Aléatoire** : générer une localisation dans un département et une commune.

Le fond cartographique du défi est choisi parmi Ortho, Plan et Scan. L'aperçu est affiché dans une fenêtre modale avant l'enregistrement. L'acceptation envoie le défi à l'API ; le refus ferme l'aperçu sans l'enregistrer.

### Tableau de bord

Les statistiques sont calculées à partir de la première page de sessions chargée depuis l'API (jusqu'à 100 sessions). La liste peut être recherchée, filtrée par état de réussite, triée et paginée. La carte de chaleur utilise les données de GéoCaptcha renvoyées par l'API. Le rejet d'un défi supprime la session correspondante auprès du backend.

L'onglet « Logs » n'est pas actuellement relié à une source de journaux active : le service d'audit côté frontend est désactivé. L'action « Tout effacer » modifie seulement l'état affiché en mémoire ; elle ne supprime pas de journaux sur le backend.

### Gestion des clés

La page utilise les routes d'administration `GET` et `POST /admin/cuser`, ainsi que `PUT` et `DELETE /admin/cuser/:appId`. Elle charge au plus 100 entrées par requête. La création d'une clé peut ouvrir un nouveau message e-mail prérempli avec la clé retournée par l'API ; l'envoi du message reste à la charge de l'utilisateur.

## Dépendances principales

- **Vue 3**, **Vue Router** et **Vite** : interface, navigation et serveur de développement/build.
- **@gouvminint/vue-dsfr** et **@gouvfr/dsfr** : composants et styles du système de design de l'État.
- **OpenLayers** (`ol`) : cartes et interactions cartographiques.
- **Turf** (`@turf/turf`) : calculs géographiques.
- **proj4** : transformations de projections cartographiques.

Les dépendances sont gérées depuis la racine du dépôt. En règle générale, ajoutez une dépendance au manifeste avec npm plutôt que de l'installer à la main dans un sous-dossier.

## Contribution

1. Forkez le dépôt et clonez votre fork.
2. Créez une branche dédiée à votre changement.
3. Installez les dépendances avec `npm install`.
4. Implémentez le changement en respectant les conventions de [CODING.md](../CODING.md).
5. Vérifiez le build avec `npm run build`.
6. Ouvrez une pull request en décrivant les changements et la vérification effectuée.

Consultez le [guide de contribution](../CONTRIBUTING.md) pour le processus détaillé.

## Documentation complémentaire

- [Documentation de l'API GéoCaptcha](https://github.com/IGNF/GeocaptchaAPI)
- [Documentation du DSFR](./DSFR.md)
- [Fichier de requêtes Bruno](./bruno/README.md)
- [Roadmap](./ROADMAP.md)
