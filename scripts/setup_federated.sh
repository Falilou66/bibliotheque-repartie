#!/usr/bin/env bash
set -e

# Charger les variables d'environnement pour récupérer le mot de passe root
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "🚨 Erreur : Le fichier .env est introuvable à la racine."
    exit 1
fi

DB_USER="root"
DB_PASS="${DB_ROOT_PASSWORD}"

echo "🔄 Initialisation des liaisons FEDERATED inter-sites..."

# ---------------------------------------------------------------------
# 1. Configuration sur le nœud UGB
# ---------------------------------------------------------------------
echo "🔗 Configuration des liens distants sur db_ugb..."
docker compose exec -T db_ugb mysql -u${DB_USER} -p${DB_PASS} -e "
CREATE SERVER IF NOT EXISTS link_ucad
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST 'db_ucad', PORT 3306, DATABASE 'bilbio');

CREATE SERVER IF NOT EXISTS link_uadb
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST 'db_uadb', PORT 3306, DATABASE 'bilbio');
"

# ---------------------------------------------------------------------
# 2. Configuration sur le nœud UCAD
# ---------------------------------------------------------------------
echo "🔗 Configuration des liens distants sur db_ucad..."
docker compose exec -T db_ucad mysql -u${DB_USER} -p${DB_PASS} -e "
CREATE SERVER IF NOT EXISTS link_ugb
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST 'db_ugb', PORT 3306, DATABASE 'bilbio');

CREATE SERVER IF NOT EXISTS link_uadb
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST 'db_uadb', PORT 3306, DATABASE 'bilbio');
"

# ---------------------------------------------------------------------
# 3. Configuration sur le nœud UADB
# ---------------------------------------------------------------------
echo "🔗 Configuration des liens distants sur db_uadb..."
docker compose exec -T db_uadb mysql -u${DB_USER} -p${DB_PASS} -e "
CREATE SERVER IF NOT EXISTS link_ugb
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST 'db_ugb', PORT 3306, DATABASE 'bilbio');

CREATE SERVER IF NOT EXISTS link_ucad
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST 'db_ucad', PORT 3306, DATABASE 'bilbio');
"

echo "✅ Toutes les liaisons réseau inter-MySQL (CREATE SERVER) sont prêtes !"