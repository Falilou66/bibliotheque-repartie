#!/usr/bin/env bash
set -euo pipefail

echo "============================================="
echo "   Configuration des tables FEDERATED"
echo "============================================="

#------------------------------------------------
# Chargement des variables
#------------------------------------------------

if [ ! -f .env ]; then
    echo "Erreur : fichier .env introuvable."
    exit 1
fi

set -a
source .env
set +a

DB_USER="${DB_USER:-root}"
DB_ROOT_PASS="${DB_ROOT_PASSWORD:-${DB_PASSWORD:-}}"

if [ -z "$DB_ROOT_PASS" ]; then
    echo "Erreur : DB_ROOT_PASSWORD (ou DB_PASSWORD) est absent dans .env."
    exit 1
fi

mkdir -p sql/generated

#------------------------------------------------
# Création des liens distants sur chaque site
#------------------------------------------------

create_server_links() {
    local SITE=$1
    local PEER1=$2
    local HOST1=$3
    local PEER2=$4
    local HOST2=$5

    echo "🔗 Configuration des liens distants sur db_${SITE}..."

    docker compose exec -T "db_${SITE}" mysql -u"${DB_USER}" -p"${DB_ROOT_PASS}" -e "
CREATE SERVER IF NOT EXISTS link_${PEER1}
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST '${HOST1}', PORT 3306, DATABASE 'bilbio');

CREATE SERVER IF NOT EXISTS link_${PEER2}
FOREIGN DATA WRAPPER mysql
OPTIONS (USER 'biblio', PASSWORD '${DB_PASSWORD}', HOST '${HOST2}', PORT 3306, DATABASE 'bilbio');
"
}

#------------------------------------------------
# Génération d'un SQL FEDERATED
#------------------------------------------------

generate_sql() {
    local SITE=$1
    local PEER1=$2
    local HOST1=$3
    local PEER2=$4
    local HOST2=$5

    sed \
        -e "s/@PEER1@/$PEER1/g" \
        -e "s/@PEER2@/$PEER2/g" \
        -e "s/@HOST1@/$HOST1/g" \
        -e "s/@HOST2@/$HOST2/g" \
        -e "s/@PASSWORD@/$DB_PASSWORD/g" \
        sql/templates/federated.sql.tpl \
        > "sql/generated/federated_${SITE}.sql"
}

echo
create_server_links ugb ucad db_ucad uadb db_uadb
create_server_links ucad ugb db_ugb uadb db_uadb
create_server_links uadb ugb db_ugb ucad db_ucad

echo
echo "Génération des scripts..."

generate_sql ugb ucad db_ucad uadb db_uadb
generate_sql ucad ugb db_ugb uadb db_uadb
generate_sql uadb ugb db_ugb ucad db_ucad

echo "OK"

#------------------------------------------------
# Installation
#------------------------------------------------

for SITE in ugb ucad uadb
 do
    echo
    echo "Installation sur ${SITE}..."

    docker compose exec -T "db_${SITE}" \
        mysql \
        -ubiblio \
        -p"${DB_PASSWORD}" \
        biblio \
        < "sql/generated/federated_${SITE}.sql"
done

echo
echo "Installation terminée."

#------------------------------------------------
# Vérification FEDERATED
#------------------------------------------------

echo
printf "%-8s %-28s %-8s %-5s\n" "SITE" "OBJET" "COUNT" "ETAT"
echo "----------------------------------------------------------------"

TABLES=("auteur" "employe" "etudiant" "ouvrage" "pret")

for SITE in ugb ucad uadb
 do
    if [ "$SITE" = "ugb" ]; then
        PEERS=("ucad" "uadb")
    elif [ "$SITE" = "ucad" ]; then
        PEERS=("ugb" "uadb")
    else
        PEERS=("ugb" "ucad")
    fi

    for PEER in "${PEERS[@]}"
    do
        for T in "${TABLES[@]}"
        do
            OBJ="ft_${T}_${PEER}"

            COUNT=$(docker compose exec -T "db_${SITE}" \
                mysql \
                -N \
                -B \
                -ubiblio \
                -p"${DB_PASSWORD}" \
                biblio \
                -e "SELECT COUNT(*) FROM ${OBJ};")

            printf "%-8s %-28s %-8s %-5s\n" \
                "$SITE" "$OBJ" "$COUNT" "OK"
        done
    done

    for T in "${TABLES[@]}"
    do
        VIEW="${T}_global"

        COUNT=$(docker compose exec -T "db_${SITE}" \
            mysql \
            -N \
            -B \
            -ubiblio \
            -p"${DB_PASSWORD}" \
            biblio \
            -e "SELECT COUNT(*) FROM ${VIEW};")

        printf "%-8s %-28s %-8s %-5s\n" \
            "$SITE" "$VIEW" "$COUNT" "OK"
    done
done

echo
echo "============================================="
echo "Toutes les tables FEDERATED répondent."
echo "Toutes les vues globales répondent."
echo "============================================="
