# 📚 Bibliothèque Inter-Universitaire — Système Réparti

Projet de Bases de Données Réparties (BDR) : un réseau de **3 bibliothèques universitaires**
(UGB, UCAD, UADB), chacune avec sa propre base MySQL et sa propre application web, capables de :

- consulter le **catalogue global** du réseau (lecture répartie via `FEDERATED`) même si un
  site tombe en panne (mode dégradé) ;
- réaliser des **emprunts inter-sites** cohérents grâce à un coordinateur **2PC / XA**
  applicatif, avec journal de décision et reprise sur panne automatique.

> Master 2 Systèmes d'Information — UADB / UFR SATIC · Projet BDR

---

## Sommaire

- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Stack technique](#stack-technique)
- [Structure du dépôt](#structure-du-dépôt)
- [Démarrage rapide](#démarrage-rapide)
- [Accès aux interfaces](#accès-aux-interfaces--comptes-de-démo)
- [Concepts clés](#concepts-clés)
  - [Lecture répartie (FEDERATED) et mode dégradé](#lecture-répartie-federated-et-mode-dégradé)
  - [Écriture répartie (2PC / XA)](#écriture-répartie-2pc--xa)
  - [Reprise sur panne](#reprise-sur-panne)
- [API HTTP](#api-http)
- [Le front (React sans build tool)](#le-front-react-sans-build-tool)
- [Scripts utiles](#scripts-utiles)
- [Dépannage](#dépannage)

---

## Architecture

Trois sites strictement symétriques, chacun avec sa base de données locale et sa propre
instance d'application web (même code, comportement piloté par variables d'environnement) :

```
                         ┌─────────────────────────────────────────┐
                         │              Réseau Docker                │
                         │           Clock_network_biblio            │
                         └─────────────────────────────────────────┘

   SITE UGB (Saint-Louis)      SITE UCAD (Dakar)         SITE UADB (Bambey)
  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
  │  app_ugb  (FastAPI)  │    │  app_ucad (FastAPI)  │    │  app_uadb (FastAPI)  │
  │   :8001 → :8000      │    │   :8002 → :8000      │    │   :8003 → :8000      │
  └──────────┬───────────┘    └──────────┬───────────┘    └──────────┬───────────┘
             │                            │                            │
  ┌──────────▼───────────┐    ┌──────────▼───────────┐    ┌──────────▼───────────┐
  │   db_ugb (MySQL 8.4)  │◄──►│  db_ucad (MySQL 8.4) │◄──►│  db_uadb (MySQL 8.4) │
  │  --federated  :33061  │    │  --federated :33062  │    │  --federated :33063  │
  └───────────────────────┘    └───────────────────────┘    └───────────────────────┘
        liens FEDERATED bidirectionnels entre les 3 bases (lecture seule)
```

- Chaque base MySQL possède ses **tables locales** (`auteur`, `employe`, `etudiant`,
  `ouvrage`, `pret`) et, pour chaque pair, des **tables `FEDERATED`** (`ft_<table>_<pair>`)
  qui pointent en lecture vers les tables du pair. Des **vues globales** (`<table>_global`)
  font l'union locale + fragments distants.
- Chaque application FastAPI ne se connecte **en écriture** qu'à sa propre base et,
  pour les écritures réparties, directement aux bases distantes (jamais via `FEDERATED`,
  qui ne supporte pas les transactions XA).
- Le nom du site (`SITE_NAME`), l'hôte de la base locale (`DB_HOST`) et la liste des pairs
  (`PEERS`) sont injectés par `docker-compose.yaml` — c'est le contrat d'interface entre les
  3 instances identiques de l'application.

---

## Modèle de données

Schéma répliqué sur les 3 sites (`sql/templates/schema.sql.tpl`, `@SITE@` = `UGB`/`UCAD`/`UADB`) :

| Table      | Portée                                   | Notes                                                                 |
|------------|-------------------------------------------|------------------------------------------------------------------------|
| `auteur`   | **Répliquée** sur les 3 sites (même id)   | Ajout via transaction XA à 3 branches (voir `POST /api/auteurs`)       |
| `employe`  | Locale au site (`CHECK bibliotheque = @SITE@`) | Authentification locale uniquement, jamais exposée via `FEDERATED` pour `login`/`mot_de_passe` |
| `etudiant` | Locale au site d'inscription (`CHECK universite = @SITE@`) | `nbre_emprunts` = compteur global d'emprunts en cours, `CHECK BETWEEN 0 AND 5` (hypothèse H4) |
| `ouvrage`  | Locale au site détenteur (`CHECK site = @SITE@`) | `stock` décrémenté/incrémenté à l'emprunt/retour                      |
| `pret`     | Locale au site qui détient l'ouvrage      | `date_retour NULL` = prêt en cours                                    |

---

## Stack technique

| Composant       | Choix                                                                 |
|-----------------|------------------------------------------------------------------------|
| Base de données | MySQL 8.4 (moteur `FEDERATED` + transactions **XA**)                  |
| Backend         | Python 3.12, **FastAPI** + `uvicorn`, `mysql-connector-python`         |
| Frontend        | **React 18** (UMD, sans bundler) + **Tailwind CSS v4** (CDN navigateur) |
| Build front     | JSX transpilé une seule fois via `@babel/standalone` (Node, pas de Babel au runtime navigateur) |
| Orchestration   | Docker Compose (6 conteneurs : 3× MySQL + 3× FastAPI)                 |

Le frontend est **une seule codebase React** (`app/static/app.jsx`) servie identiquement par
les 3 sites : le thème (couleurs, nom, ville) est déduit dynamiquement du champ `site` renvoyé
par `GET /api/stats`.

---

## Structure du dépôt

```
bibliotheque-repartie/
├── docker-compose.yaml        # 3 sites × (MySQL + FastAPI), réseau + volumes communs
├── .env.example                # Modèle de secrets (DB_PASSWORD, DB_ROOT_PASSWORD)
│
├── app/                        # Code de l'application (identique sur les 3 sites)
│   ├── main.py                  # Point d'entrée FastAPI + montage du front statique
│   ├── config.py                 # Lecture des variables d'environnement (contrat d'interface)
│   ├── db.py                     # Connexion MySQL "une connexion par requête"
│   ├── coordinateur.py           # Coordinateur 2PC applicatif (XA START/END/PREPARE/COMMIT)
│   ├── journal.py                # Journal de décision 2PC (JSONL, volume /data)
│   ├── routers/
│   │   ├── auth.py                # POST /api/auth/login (local au site)
│   │   ├── lecture.py             # GET catalogue/étudiants/employés/auteurs/prêts/stats
│   │   ├── ecriture.py            # POST prêts/retours/étudiants/auteurs (local ou 2PC)
│   │   └── admin.py               # Console XA RECOVER + résolution manuelle
│   └── static/
│       ├── index.html             # Shell HTML (Tailwind CDN, React UMD)
│       ├── app.jsx                # Source React (à éditer)
│       └── app.js                 # Généré par scripts/build_front.sh (ne pas éditer à la main)
│
├── scripts/
│   ├── build_front.sh            # Compile app.jsx -> app.js (Babel, une fois, hors navigateur)
│   ├── setup_federated.sh        # Crée les SERVER links + tables FEDERATED + vues globales
│   └── demo_xa_manuel.sql        # Scénarios XA à rejouer à la main (commit/rollback/en attente)
│
└── sql/
    ├── templates/
    │   ├── schema.sql.tpl         # Modèle de schéma (placeholder @SITE@)
    │   └── federated.sql.tpl      # Modèle FEDERATED + vues (placeholders @PEER*@/@HOST*@/@PASSWORD@)
    ├── gen_sql.sh                 # Génère sql/<site>/01_schema.sql depuis les templates
    ├── seeds/                     # Jeux de données de démo par site (versionnés)
    ├── ugb/ · ucad/ · uadb/       # 01_schema.sql + 02_seed.sql exécutés au 1er démarrage MySQL
    └── generated/                 # SQL FEDERATED généré au runtime (contient le mdp, ignoré par git)
```

---

## Démarrage rapide

### Prérequis

- Docker + Docker Compose
- **Au moins 4 Go de RAM alloués à Docker Desktop** (3 instances MySQL 8.4 tournent en
  parallèle ; voir [Dépannage](#dépannage) si un conteneur se fait tuer par l'OOM killer)
- Node.js + npm (uniquement pour compiler le frontend en local, `scripts/build_front.sh`)

### 1. Configurer les secrets

```bash
cp .env.example .env
# éditer .env si besoin (mots de passe MySQL)
```

### 2. Démarrer l'infrastructure

```bash
docker compose up -d --build
```

Chaque base MySQL exécute automatiquement `sql/<site>/01_schema.sql` puis `02_seed.sql`
(données de démo) **au tout premier démarrage** (volume vide). Attendre que les 3 bases
soient `healthy` :

```bash
docker compose ps
```

### 3. Configurer les liens FEDERATED (obligatoire, une fois)

```bash
./scripts/setup_federated.sh
```

Ce script crée, sur chaque base, les `SERVER` links vers les 2 pairs, les tables
`FEDERATED` (`ft_*`) et les vues globales (`*_global`), puis vérifie que tout répond.
**À relancer si vous recréez les volumes** (`docker compose down -v`) ou si un conteneur
MySQL est remplacé.

### 4. (Ré)générer le frontend si vous modifiez `app.jsx`

```bash
./scripts/build_front.sh
```

Le premier lancement installe `@babel/standalone` dans `scripts/.build/` (ignoré par git).
Comme `./app` est monté en volume dans les conteneurs, le rafraîchissement du navigateur
suffit ensuite — pas besoin de rebuild Docker.

### 5. Ouvrir l'application

Voir la table ci-dessous. C'est parti 🎉

---

## Accès aux interfaces & comptes de démo

| Site  | Interface web            | MySQL direct (démo/inspection) |
|-------|----------------------------|----------------------------------|
| UGB   | http://localhost:8001      | `localhost:33061`                |
| UCAD  | http://localhost:8002      | `localhost:33062`                |
| UADB  | http://localhost:8003      | `localhost:33063`                |

Espace employé — mot de passe commun de démo : **`biblio123`**

| Site  | Identifiants (`login`)                              |
|-------|--------------------------------------------------------|
| UGB   | `awa`, `mamadou`, `fatou`, `ousmane`                    |
| UCAD  | `aminata`, `cheikh`, `seynabou`, `papa`                 |
| UADB  | `mouhamed`, `aissatou`, `abdoulaye`, `rokhaya`          |

---

## Concepts clés

### Lecture répartie (FEDERATED) et mode dégradé

Toute lecture "réseau" (`scope=global`) interroge d'abord la vue globale (`ouvrage_global`,
`etudiant_global`, …), qui fait l'union de la table locale et des tables `FEDERATED` des
2 pairs. Si un pair est injoignable, MySQL renvoie une erreur `FEDERATED` connue
(`1429`/`1430`, ou `1146` si les vues ne sont pas encore créées) : l'API **retombe alors
sur une lecture fragment par fragment**, ignore le(s) site(s) en panne, et renvoie la liste
des sites indisponibles dans `sites_indisponibles`. Le front affiche alors un bandeau
« Mode dégradé » — les données restent disponibles mais partielles (voir `lecture.py::_lire`).

### Écriture répartie (2PC / XA)

**Règle d'or : on n'écrit jamais via une table `FEDERATED`.** Toute écriture qui touche
plusieurs sites passe par une connexion MySQL directe vers chaque base participante, pilotée
par `Coordinateur2PC` (`app/coordinateur.py`) :

1. **Phase 1 (vote)** — sur chaque branche : `XA START` → écritures → `XA END` → `XA PREPARE`.
2. **Décision journalisée** — écrite dans `journal_2pc.log` **avant** le moindre `XA COMMIT`
   (point de non-retour du protocole).
3. **Phase 2 (décision)** — `XA COMMIT` (ou `XA ROLLBACK` si une branche a refusé) sur
   toutes les branches.

Deux écritures réparties concrètes dans le projet :

- **Emprunt/retour inter-sites** (`ecriture.py::_emprunt_reparti` / `_retour_reparti`) :
  quand un étudiant emprunte un ouvrage hors de son université d'inscription, une branche
  locale (stock + prêt) et une branche distante (compteur `nbre_emprunts` de l'étudiant)
  sont validées ensemble en 2PC.
- **Ajout d'un auteur** (`ecriture.py::ajouter_auteur`) : réplication synchrone à
  **3 branches** (le site courant + les 2 pairs), même `id_aut` partout.

### Reprise sur panne

Si un participant devient injoignable **après** la décision `COMMIT` journalisée, la
transaction reste « douteuse » côté MySQL (visible via `XA RECOVER`). Deux mécanismes de
résolution, tous deux appuyés sur `journal.py` (source de vérité de la décision) :

- **Automatique au démarrage** : `admin.resoudre_au_demarrage()` (appelé au `startup` de
  chaque FastAPI) parcourt `XA RECOVER` sur la base locale + chaque pair et rejoue la
  décision journalisée.
- **Manuelle via la console d'admin** : écran *Admin 2PC* du front (`GET /api/admin/xa`,
  `POST /api/admin/xa/{txid}/resoudre`) — utile pour rejouer un scénario de panne en démo
  (voir `scripts/demo_xa_manuel.sql` pour des scénarios `XA` à la main en SQL brut).

---

## API HTTP

Toutes les routes sont préfixées par `/api` et servies par chaque site (même schéma,
données différentes). Réponses JSON.

| Méthode & route                        | Description                                                          |
|-----------------------------------------|--------------------------------------------------------------------------|
| `POST /api/auth/login`                  | Authentification employé (locale au site)                                |
| `GET /api/stats`                        | Compteurs réseau (ouvrages, étudiants, prêts en cours) pour le tableau de bord |
| `GET /api/ouvrages?scope=&q=`           | Catalogue (`scope=global|local`, recherche par titre)                    |
| `GET /api/etudiants?scope=`             | Liste des étudiants + compteur d'emprunts                                |
| `GET /api/employes?scope=`              | Liste des employés                                                       |
| `GET /api/auteurs?scope=`               | Référentiel auteurs (table répliquée)                                    |
| `GET /api/prets?scope=`                 | Liste des prêts                                                          |
| `POST /api/prets`                       | Créer un emprunt (`id_ouv`, `id_etud`) — local ou 2PC selon les sites     |
| `POST /api/prets/{id_pret}/retour`      | Retour d'un ouvrage — local ou 2PC                                        |
| `POST /api/etudiants`                   | Inscrire un étudiant (toujours local au site)                            |
| `POST /api/auteurs`                     | Ajouter un auteur (réplication XA à 3 branches)                          |
| `GET /api/admin/xa`                     | Lister les transactions XA douteuses (`XA RECOVER` croisé au journal)    |
| `POST /api/admin/xa/{txid}/resoudre`    | Forcer la résolution (`XA COMMIT`/`XA ROLLBACK`) d'une transaction douteuse |

Toutes les routes de lecture avec `scope=global` renvoient également
`sites_indisponibles: string[]` (mode dégradé).

---

## Le front (React sans build tool)

- `app/static/index.html` charge Tailwind et React/ReactDOM depuis un CDN, puis
  `app/static/app.js`.
- `app/static/app.jsx` est la **source à éditer** : composants React (JSX), thèmes par
  université, appels `fetch` vers `/api/*`.
- `app/static/app.js` est **généré** par `scripts/build_front.sh` (transpilation Babel en
  mode `classic`, une seule fois côté build — pas de Babel chargé dans le navigateur).
  **Ne pas éditer `app.js` à la main**, il sera écrasé au prochain build.
- Après toute modification de `app.jsx` :
  ```bash
  ./scripts/build_front.sh
  ```
  puis rafraîchir le navigateur (le code est servi directement depuis le volume monté,
  aucun redémarrage de conteneur n'est nécessaire).

---

## Scripts utiles

| Script                          | Rôle                                                                 |
|----------------------------------|------------------------------------------------------------------------|
| `sql/gen_sql.sh`                 | Génère `sql/<site>/01_schema.sql` depuis `sql/templates/schema.sql.tpl` et copie le seed correspondant |
| `scripts/setup_federated.sh`     | Crée les `SERVER` links, les tables `FEDERATED` et les vues globales sur les 3 bases ; affiche un rapport de vérification |
| `scripts/build_front.sh`        | Compile `app/static/app.jsx` → `app/static/app.js` (Babel, Node)         |
| `scripts/demo_xa_manuel.sql`     | Scénarios `XA START/PREPARE/COMMIT/ROLLBACK` à rejouer à la main (démo pédagogique du protocole) |

---

## Dépannage

**Bandeau « Mode dégradé » alors que tous les conteneurs sont `Up`**
→ Les tables `FEDERATED`/vues globales n'ont probablement pas encore été créées : lancez
`./scripts/setup_federated.sh`. Si un site reste marqué indisponible après coup, vérifiez
qu'aucun conteneur MySQL n'a été redémarré/OOM-killé entre-temps (`docker ps -a`,
`docker inspect <conteneur> --format '{{.State.OOMKilled}}'`).

**Un conteneur `db_*` passe à `Exited (137)`**
→ `137` = tué par l'OOM killer. 3 instances MySQL 8.4 + 3 apps consomment facilement
~1,5-2 Go au repos : augmentez la mémoire allouée à Docker Desktop (Settings → Resources →
Memory, viser 4 Go+), puis `docker start db_<site>` et relancez `setup_federated.sh` si
nécessaire.

**`ERROR 1146` sur une table `ft_*` ou une vue `*_global`**
→ `setup_federated.sh` n'a pas encore tourné sur ce site (ou les volumes ont été recréés).

**Recommencer de zéro (⚠️ efface toutes les données)**
```bash
docker compose down -v
docker compose up -d --build
./scripts/setup_federated.sh
```
