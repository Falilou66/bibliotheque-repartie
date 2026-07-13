#!/usr/bin/env bash
set -e

# Liste des sites du réseau inter-universitaire
for S in UGB UCAD UADB ; do
    # Passage en minuscules pour les noms de dossiers
    s=$(echo "$S" | tr 'A-Z' 'a-z')
    
    mkdir -p "sql/$s"
    
    echo "Génération du schéma pour $S..."
    # Remplacement du gabarit @SITE@ par l'université correspondante
    sed "s/@SITE@/$S/g" sql/templates/schema.sql.tpl > "sql/$s/01_schema.sql"
    
    # Copie du jeu de données (seed) correspondant s'il existe
    if [ -f "sql/seeds/seed_$s.sql" ]; then
        cp "sql/seeds/seed_$s.sql" "sql/$s/02_schema.sql"
    fi
done

echo "✅ Structures SQL initiales générées dans sql/{ugb,ucad,uadb}/"