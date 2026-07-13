from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from coordinateur import Coordinateur2PC
from db import get_conn
import config

router = APIRouter()


# ==========================================
# Schémas de requête
# ==========================================

class EmpruntIn(BaseModel):
    id_ouv: int
    id_etud: int


class EtudiantIn(BaseModel):
    nom: str
    adresse: str = ""
    specialite: str = ""


class AuteurIn(BaseModel):
    nom_auteur: str


# ==========================================
# Helpers
# ==========================================

def _universite_etudiant(id_etud):
    """Routage seulement : université d'inscription via etudiant_global."""
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT universite FROM etudiant_global WHERE id_etud = %s",
            (id_etud,),
        )
        row = cur.fetchone()
        return row["universite"] if row else None
    finally:
        conn.close()


# ==========================================
# EMPRUNT (doc §6.2, cœur du projet)
# ==========================================

@router.post("/prets", status_code=201)
def creer_pret(data: EmpruntIn):
    universite = _universite_etudiant(data.id_etud)
    if universite is None:
        raise HTTPException(status_code=404, detail="Étudiant inconnu")

    # Cas O == B : transaction locale ordinaire (pas de XA)
    if universite == config.SITE_NAME:
        return _emprunt_local(data)

    # Cas O != B : le pair doit être joignable pour le routage
    if universite not in config.PEERS:
        raise HTTPException(
            status_code=409,
            detail=f"Université {universite} hors du réseau de ce site",
        )

    return _emprunt_reparti(data, universite)


def _emprunt_local(data: EmpruntIn):
    """Étudiant et ouvrage sur le même site -> une seule connexion, COMMIT."""
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT stock FROM ouvrage WHERE id_ouv = %s FOR UPDATE",
            (data.id_ouv,),
        )
        ouv = cur.fetchone()
        if not ouv:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Ouvrage introuvable")
        if ouv["stock"] <= 0:
            conn.rollback()
            raise HTTPException(status_code=409, detail="Stock épuisé")

        # Incrément conditionnel atomique du compteur (source de vérité H4)
        cur.execute(
            "UPDATE etudiant SET nbre_emprunts = nbre_emprunts + 1 "
            "WHERE id_etud = %s AND nbre_emprunts < %s",
            (data.id_etud, config.MAX_EMPRUNTS),
        )
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=409,
                                detail="Limite d'emprunts atteinte")

        cur.execute("UPDATE ouvrage SET stock = stock - 1 WHERE id_ouv = %s",
                    (data.id_ouv,))
        cur.execute("INSERT INTO pret (id_ouv, id_etud) VALUES (%s, %s)",
                    (data.id_ouv, data.id_etud))
        conn.commit()
        return {"status": "created", "mode": "local"}
    except HTTPException:
        raise
    finally:
        conn.close()


def _emprunt_reparti(data: EmpruntIn, universite):
    """2PC : branche locale (ouvrage/pret) + branche distante (compteur)."""
    coord = Coordinateur2PC("emprunt")
    try:
        # Branche B (locale) : site qui détient l'ouvrage
        bl = coord.branche(config.DB_HOST)
        ouv = bl.lire_un(
            "SELECT stock FROM ouvrage WHERE id_ouv = %s FOR UPDATE",
            (data.id_ouv,),
        )
        if not ouv:
            coord.abandonner()
            raise HTTPException(status_code=404, detail="Ouvrage introuvable")
        if ouv["stock"] <= 0:
            coord.abandonner()
            raise HTTPException(status_code=409, detail="Stock épuisé")
        bl.executer("UPDATE ouvrage SET stock = stock - 1 WHERE id_ouv = %s",
                    (data.id_ouv,))
        bl.executer("INSERT INTO pret (id_ouv, id_etud) VALUES (%s, %s)",
                    (data.id_ouv, data.id_etud))

        # Branche O (distante) : incrément conditionnel du compteur
        bo = coord.branche(config.PEERS[universite])
        n = bo.executer(
            "UPDATE etudiant SET nbre_emprunts = nbre_emprunts + 1 "
            "WHERE id_etud = %s AND nbre_emprunts < %s",
            (data.id_etud, config.MAX_EMPRUNTS),
        )
        if n == 0:
            coord.abandonner()
            raise HTTPException(status_code=409,
                                detail="Limite d'emprunts atteinte")

        coord.valider()
        return {"status": "created", "mode": "2pc", "txid": coord.txid}
    except HTTPException:
        raise
    except Exception as e:
        coord.abandonner()
        raise HTTPException(status_code=500, detail=f"Échec 2PC : {e}")


# ==========================================
# RETOUR (doc §6.2, symétrique de l'emprunt)
# ==========================================

@router.post("/prets/{id_pret}/retour")
def retour_pret(id_pret: int):
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id_ouv, id_etud, date_retour FROM pret WHERE id_pret = %s",
            (id_pret,),
        )
        pret = cur.fetchone()
    finally:
        conn.close()

    if not pret:
        raise HTTPException(status_code=404, detail="Prêt introuvable")
    if pret["date_retour"] is not None:
        raise HTTPException(status_code=409, detail="Prêt déjà rendu")

    universite = _universite_etudiant(pret["id_etud"])

    # Étudiant local -> transaction locale ; sinon 2PC
    if universite == config.SITE_NAME or universite not in config.PEERS:
        return _retour_local(id_pret, pret)
    return _retour_reparti(id_pret, pret, universite)


def _retour_local(id_pret, pret):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE pret SET date_retour = CURRENT_TIMESTAMP "
            "WHERE id_pret = %s AND date_retour IS NULL",
            (id_pret,),
        )
        if cur.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=409, detail="Prêt déjà rendu")
        cur.execute("UPDATE ouvrage SET stock = stock + 1 WHERE id_ouv = %s",
                    (pret["id_ouv"],))
        cur.execute(
            "UPDATE etudiant SET nbre_emprunts = nbre_emprunts - 1 "
            "WHERE id_etud = %s AND nbre_emprunts > 0",
            (pret["id_etud"],),
        )
        conn.commit()
        return {"status": "returned", "mode": "local"}
    except HTTPException:
        raise
    finally:
        conn.close()


def _retour_reparti(id_pret, pret, universite):
    coord = Coordinateur2PC("retour")
    try:
        bl = coord.branche(config.DB_HOST)
        n = bl.executer(
            "UPDATE pret SET date_retour = CURRENT_TIMESTAMP "
            "WHERE id_pret = %s AND date_retour IS NULL",
            (id_pret,),
        )
        if n == 0:
            coord.abandonner()
            raise HTTPException(status_code=409, detail="Prêt déjà rendu")
        bl.executer("UPDATE ouvrage SET stock = stock + 1 WHERE id_ouv = %s",
                    (pret["id_ouv"],))

        bo = coord.branche(config.PEERS[universite])
        bo.executer(
            "UPDATE etudiant SET nbre_emprunts = nbre_emprunts - 1 "
            "WHERE id_etud = %s AND nbre_emprunts > 0",
            (pret["id_etud"],),
        )

        coord.valider()
        return {"status": "returned", "mode": "2pc", "txid": coord.txid}
    except HTTPException:
        raise
    except Exception as e:
        coord.abandonner()
        raise HTTPException(status_code=500, detail=f"Échec 2PC : {e}")


# ==========================================
# INSCRIPTION D'UN ETUDIANT (local : site = université)
# ==========================================

@router.post("/etudiants", status_code=201)
def inscrire_etudiant(data: EtudiantIn):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO etudiant (nom, adresse, universite, specialite, "
            "nbre_emprunts) VALUES (%s, %s, %s, %s, 0)",
            (data.nom, data.adresse, config.SITE_NAME, data.specialite),
        )
        conn.commit()
        return {"id_etud": cur.lastrowid, "universite": config.SITE_NAME}
    finally:
        conn.close()


# ==========================================
# AJOUT D'UN AUTEUR (réplication synchrone : XA à 3 branches)
# ==========================================

@router.post("/auteurs", status_code=201)
def ajouter_auteur(data: AuteurIn):
    coord = Coordinateur2PC("auteur")
    try:
        # Branche locale : on calcule le nouvel id sous verrou
        bl = coord.branche(config.DB_HOST)
        row = bl.lire_un(
            "SELECT COALESCE(MAX(id_aut), 0) + 1 AS nid FROM auteur FOR UPDATE"
        )
        nid = row["nid"]
        bl.executer("INSERT INTO auteur (id_aut, nom_auteur) VALUES (%s, %s)",
                    (nid, data.nom_auteur))

        # Branches distantes : même id explicite partout
        for host in config.PEERS.values():
            b = coord.branche(host)
            b.executer("INSERT INTO auteur (id_aut, nom_auteur) VALUES (%s, %s)",
                       (nid, data.nom_auteur))

        coord.valider()
        return {"id_aut": nid, "nom_auteur": data.nom_auteur}
    except HTTPException:
        raise
    except Exception as e:
        coord.abandonner()
        raise HTTPException(status_code=500,
                            detail=f"Échec réplication auteur : {e}")
