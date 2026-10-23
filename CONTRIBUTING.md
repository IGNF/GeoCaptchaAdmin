# Guide de contribution

Merci de votre intérêt pour le projet GeoCaptchaAdmin. Les contributions sont les bienvenues, à condition de rester cohérentes avec l'architecture du projet et ses conventions.

## Table des matières

- [Guide de contribution](#guide-de-contribution)
  - [Table des matières](#table-des-matières)
  - [Signaler un bug ou proposer une évolution](#signaler-un-bug-ou-proposer-une-évolution)
  - [Améliorer la documentation](#améliorer-la-documentation)
  - [Processus de développement](#processus-de-développement)
    - [Forker le dépôt](#forker-le-dépôt)
    - [Développer et vérifier](#développer-et-vérifier)
    - [Proposer une pull request](#proposer-une-pull-request)
  - [Style de code](#style-de-code)
  - [Communiquer avec nous](#communiquer-avec-nous)

## Signaler un bug ou proposer une évolution

- Suivez la procédure décrite dans [doc/conventions/issues.md](doc/conventions/issues.md)
- Vérifiez qu'un ticket similaire n'existe pas déjà
- Décrivez clairement le contexte, les étapes de reproduction et le résultat attendu

## Améliorer la documentation

Si vous repérez une erreur, une imprécision ou une absence dans la documentation, vous pouvez ouvrir une issue ou proposer directement une pull request.

## Processus de développement

### Forker le dépôt

1. Forkez le dépôt puis clonez votre fork localement.
2. Créez une branche dédiée à votre travail :

```bash
git clone https://github.com/[votre-utilisateur]/GeoCaptchaAdmin.git
cd GeoCaptchaAdmin
git checkout -b feature/nom-de-la-fonctionnalite
```

### Développer et vérifier

Avant d'ouvrir une pull request, installez les dépendances puis lancez les vérifications utiles :

```bash
npm install
npm run lint
npm run dev
```

### Proposer une pull request

1. Synchronisez votre branche avec `main` si nécessaire.
2. Poussez vos changements vers votre fork.

```bash
git push origin feature/nom-de-la-fonctionnalite
```

3. Ouvrez une pull request vers la branche `main` du dépôt principal.
4. Décrivez dans la PR :
	- les changements effectués
	- les raisons de ces changements
	- la manière de tester ces changements

Merci de suivre le [modèle de pull request](.github/pull_request_template.md) pour uniformiser les contributions.

## Style de code

Le style de code à suivre est résumé dans [CODING.md](CODING.md).


## Communiquer avec nous

- Issues GitHub pour les discussions liées au projet et aux bugs
- Courriel du projet : `geocaptcha@ign.fr`