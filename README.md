# GeoCaptchaAdmin

GeoCaptchaAdmin est l'interface d'administration des GéoCaptcha, des captchas fondés sur des données géographiques et développés par l'IGN. Elle permet de tester un GéoCaptcha, d'en générer, d'administrer les clés d'accès et de suivre l'activité de l'API.

L'application est développée avec Vue 3 et Vite. Son interface s'appuie sur le Système de Design de l'État (DSFR) et OpenLayers.

## Fonctionnalités

- **Accueil** : lancer un GéoCaptcha de démonstration et vérifier le résultat auprès de l'API.
- **Génération** (`/geo-captcha`) : choisir une localisation sur la carte, saisir des coordonnées exactes ou générer une localisation aléatoire ; sélectionner le fond cartographique (Ortho, Plan ou Scan), puis prévisualiser et accepter ou refuser le GéoCaptcha.
- **Tableau de bord** (`/dashboard`) : consulter et rechercher les statistiques et la carte de chaleur des GéoCaptcha ; examiner ou rejeter un défi ; consulter les journaux d'audit, les filtrer et les effacer.
- **Gestion des clés d'accès** (`/key-access`) : rechercher les utilisateurs et créer, modifier ou supprimer leurs clés, avec leurs informations associées (nom, adresse e-mail, référents et rôle).
- En-tête de navigation avec champ de clé API, liens vers les principales pages et bascule entre thèmes clair et sombre.
- Interface conçue à partir des composants DSFR.

## Prérequis

- Node.js et npm
- Une instance de l'API GéoCaptcha accessible à l'adresse configurée dans l'application
- Une clé API autorisée par cette API

## Installation et développement

À la racine du dépôt, installez les dépendances :

```sh
npm install
```

Lancez le serveur de développement :

```sh
npm run dev
```

Pour rendre le serveur accessible depuis d'autres appareils du réseau local :

```sh
npm run dev -- --host
```

Ouvrez ensuite l'adresse locale indiquée dans le terminal. Si vous utilisez l'option `--host`, l'adresse réseau y est également indiquée.

## Connexion à l'API

L'application utilise actuellement l'API à l'adresse `http://127.0.0.1:3000/api/v1`. Démarrez l'API à cette adresse avant d'utiliser les fonctionnalités qui en dépendent. L'identifiant d'application transmis par l'interface est actuellement `admin`.

Saisissez votre clé API dans le champ prévu à cet effet dans l'en-tête. Elle est conservée dans le stockage de session du navigateur pour rester disponible pendant la session. Ne placez pas de secrets dans le dépôt ni dans des variables d'environnement préfixées par `VITE_` : ces variables sont intégrées au code envoyé au navigateur.

## Build et prévisualisation

Générez les fichiers de production dans `dist/` :

```sh
npm run build
```

Pour prévisualiser le build localement :

```sh
npm run preview
```

## Docker

Construisez l'image depuis la racine du dépôt :

```sh
docker build -t geocaptcha-admin .
```

Lancez le conteneur :

```sh
docker run --rm -p 8080:8080 geocaptcha-admin
```

L'interface est alors disponible à l'adresse <http://localhost:8080/>.

## Documentation et contribution

- [Documentation développeur](doc/DOC%20DEV.md)
- [Documentation du DSFR](doc/DSFR.md)
- [Guide de contribution](CONTRIBUTING.md)
- [Conventions de code](CODING.md)

## Contact

Pour toute question ou proposition :
📧 geocaptcha-admin@ign.fr
🔗 Site principal du projet GeoCaptcha

## Licence

Ce projet est distribué sous licence MIT. Consultez le fichier [LICENCE](LICENCE).
