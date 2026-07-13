from fastapi import APIRouter
import mysql.connector

from db import get_conn
import config

router = APIRouter()

# Codes d'erreur qui déclenchent le repli fragment par fragment :
#  1429/1430 : pair FEDERATED injoignable (mode dégradé, doc §6.4)
#  1146      : vue globale absente (setup_federated.sh pas encore exécuté)
FEDERATED_ERRORS = (1429, 1430, 1146)


def table_pour(site_filtre, table):
    """Réduction pour la fragmentation horizontale (doc §5.2).

    - site_filtre None / "global" -> vue globale (reconstruction R = U R_x)
    - site_filtre == SITE_NAME     -> fragment local
    - sinon                        -> fragment distant via table FEDERATED
    """
    if not site_filtre or site_filtre == "global":
        return f"{table}_global"
    if site_filtre.upper() == config.SITE_NAME:
        return table
    return f"ft_{table}_{site_filtre.lower()}"


def _resoudre_table(table, scope, site):
    """scope=local|global (+ éventuel filtre 'site' précis)."""
    if site:
        return table_pour(site, table)
    if scope == "local":
        return table
    return f"{table}_global"


def _fragments(table):
    """Liste (nom_site, table) des fragments : local + un par pair."""
    frags = [(config.SITE_NAME, table)]
    for site in config.PEERS:
        frags.append((site, f"ft_{table}_{site.lower()}"))
    return frags


def _lire(table_cible, colonnes, where="", params=(), post_from=""):
    """Exécute un SELECT sur la table/vue cible, avec repli fragment par
    fragment si la vue globale échoue (un pair FEDERATED est en panne).

    Retourne (lignes, sites_indisponibles).
    """
    sql = f"SELECT {colonnes} FROM {table_cible} o{post_from}{where}"
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(sql, params)
            return cur.fetchall(), []
        except mysql.connector.Error as e:
            # Mode dégradé : seulement si on interrogeait une vue globale
            if e.errno in FEDERATED_ERRORS and table_cible.endswith("_global"):
                return _lire_par_fragment(cur, table_cible, colonnes, where,
                                          params, post_from)
            raise
    finally:
        conn.close()


def _lire_par_fragment(cur, vue_globale, colonnes, where, params, post_from):
    """Repli du mode dégradé : on interroge les fragments un par un et on
    ignore les sites en panne (guide §3.2 / doc §6.4)."""
    table = vue_globale[:-len("_global")]
    lignes = []
    indisponibles = []
    for site, frag in _fragments(table):
        sql = f"SELECT {colonnes} FROM {frag} o{post_from}{where}"
        try:
            cur.execute(sql, params)
            lignes.extend(cur.fetchall())
        except mysql.connector.Error:
            indisponibles.append(site)
    return lignes, indisponibles


# ==========================================
# CATALOGUE DES OUVRAGES
# ==========================================

@router.get("/ouvrages")
def get_ouvrages(scope: str = "global", q: str = "", domaine: str = "",
                 site: str = None):
    table = _resoudre_table("ouvrage", scope, site)
    # auteur est répliqué à l'identique partout : jointure sur la table locale.
    colonnes = ("o.id_ouv, o.titre, o.id_auteur, a.nom_auteur, o.editeur, "
                "o.annee, o.domaine, o.stock, o.site")
    post_from = " LEFT JOIN auteur a ON o.id_auteur = a.id_aut"
    conditions = []
    params = []
    if q:
        conditions.append("o.titre LIKE %s")
        params.append(f"%{q}%")
    if domaine:
        conditions.append("o.domaine = %s")
        params.append(domaine)
    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    lignes, indisponibles = _lire(table, colonnes, where, tuple(params), post_from)
    return {"ouvrages": lignes, "sites_indisponibles": indisponibles}


# ==========================================
# ETUDIANTS / EMPLOYES / AUTEURS / PRETS
# ==========================================

@router.get("/etudiants")
def get_etudiants(scope: str = "global", site: str = None):
    table = _resoudre_table("etudiant", scope, site)
    cols = "o.id_etud, o.nom, o.adresse, o.universite, o.specialite, o.nbre_emprunts"
    lignes, indisponibles = _lire(table, cols)
    return {"etudiants": lignes, "sites_indisponibles": indisponibles}


@router.get("/employes")
def get_employes(scope: str = "global", site: str = None):
    table = _resoudre_table("employe", scope, site)
    cols = "o.id_emp, o.nom, o.adresse, o.statut, o.bibliotheque"
    lignes, indisponibles = _lire(table, cols)
    return {"employes": lignes, "sites_indisponibles": indisponibles}


@router.get("/auteurs")
def get_auteurs(scope: str = "global", site: str = None):
    table = _resoudre_table("auteur", scope, site)
    cols = "o.id_aut, o.nom_auteur"
    lignes, indisponibles = _lire(table, cols)
    return {"auteurs": lignes, "sites_indisponibles": indisponibles}


@router.get("/prets")
def get_prets(scope: str = "global", site: str = None):
    table = _resoudre_table("pret", scope, site)
    cols = "o.id_pret, o.id_ouv, o.id_etud, o.date_emprunt, o.date_retour"
    lignes, indisponibles = _lire(table, cols)
    return {"prets": lignes, "sites_indisponibles": indisponibles}


# ==========================================
# TABLEAU DE BORD
# ==========================================

@router.get("/stats")
def get_stats():
    """Compteurs du site : ouvrages, étudiants, prêts en cours (réseau).

    Si un pair FEDERATED est en panne, on retombe sur les compteurs locaux.
    """
    def compter(cur, vue, frag_local, where=""):
        try:
            cur.execute(f"SELECT COUNT(*) AS n FROM {vue}{where}")
            return cur.fetchone()["n"]
        except mysql.connector.Error:
            cur.execute(f"SELECT COUNT(*) AS n FROM {frag_local}{where}")
            return cur.fetchone()["n"]

    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        total_ouvrages = compter(cur, "ouvrage_global", "ouvrage")
        total_etudiants = compter(cur, "etudiant_global", "etudiant")
        total_prets = compter(cur, "pret_global", "pret",
                              " WHERE date_retour IS NULL")
        return {
            "site": config.SITE_NAME,
            "total_ouvrages": total_ouvrages,
            "total_etudiants": total_etudiants,
            "total_prets_encours": total_prets,
        }
    finally:
        conn.close()
