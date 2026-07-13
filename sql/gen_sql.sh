#!/usr/bin/env bash

set -e

echo "========================================="
echo " Génération des schémas SQL"
echo "========================================="

for SITE in UGB UCAD UADB
do
    site=$(echo "$SITE" | tr 'A-Z' 'a-z')

    mkdir -p "sql/$site"

    # Génération du schéma
    sed "s/@SITE@/$SITE/g" \
        sql/templates/schema.sql.tpl \
        > "sql/$site/01_schema.sql"

    # Copie du jeu de données
    cp "sql/seeds/seed_${site}.sql" \
       "sql/$site/02_seed.sql"

    echo "✔ $SITE généré."
done

echo ""
echo "Toutes les bases ont été générées avec succès."