# Bruno -- Exporter/importer une collection

## 1. Exporter / importer une collection

Par exemple, pour transférer ta collection d'API Geocaptcha vers un autre poste.

Exporter

1. Dans la barre latérale, survole la collection.
2. Clique sur `...`, puis Share.
3. Choisis l'onglet Export et le format Bruno Collection.
4. Enregistre l'export.

Importer

1. Clique sur `+` ou sur Import Collection depuis l'accueil.
2. Sélectionne le format Bruno Collection.
3. Sélectionne les données exportées et le dossier de destination.

La collection est transférée avec ses requêtes, dossiers et paramètres compatibles avec le format choisi.

## 2. Exporter / importer un environnement

Utile pour transférer tes configurations `dev`, `qualif` ou `prod`.

1. Ouvre le menu Environments en haut à droite.
2. Clique sur Configure.
3. Utilise Export et sélectionne l'environnement à exporter : Bruno génère un fichier JSON.
4. Sur le poste cible, retourne dans Configure, puis clique sur Import pour charger le JSON.

Attention : les variables marquées comme secrètes ne sont pas incluses dans l'export. Il faudra donc reconfigurer les tokens et secrets sur le poste cible.
