# GeoCaptchaAdmin

GeoCaptchaAdmin est l'interface d'administration des GéoCaptcha, des captchas fondés sur des données géographiques et développés par l'IGN. Elle permet notamment de gérer les clés d'accès, de consulter les métriques et les journaux, et de créer des défis.

L'application est développée avec Vue 3 et Vite. Son interface s'appuie sur le Système de Design de l'État (DSFR) et OpenLayers.

## Fonctionnalités

- Création et prévisualisation de GéoCaptcha
- Consultation des statistiques, des journaux et des cartes de chaleur
- Administration des clés d'accès à l'API
- Interface conforme au Système de Design de l'État

## Prérequis

- Node.js et npm
- Une instance de l'API GéoCaptcha accessible depuis l'application
- Une clé API et un identifiant d'application autorisés par cette API

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

L'application utilise actuellement l'API à l'adresse `http://127.0.0.1:3000/api/v1`. Démarrez l'API à cette adresse avant d'utiliser les fonctionnalités qui en dépendent. L'identifiant d'application utilisé par l'interface est actuellement `admin`.

Saisissez la clé API dans le champ prévu à cet effet dans l'interface. Ne placez pas de secrets dans le dépôt ni dans des variables d'environnement préfixées par `VITE_` : ces variables sont intégrées au code envoyé au navigateur.

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

## Licence

Ce projet est distribué sous licence MIT. Consultez le fichier [LICENCE](LICENCE).
