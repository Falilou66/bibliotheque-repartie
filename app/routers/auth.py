from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import get_conn
import config

router = APIRouter()

# ==========================================
# Authentification des employés (locale au site)
# Chaque employé est géré par sa bibliothèque (H1/H6) : la vérification se fait
# donc contre la base LOCALE, jamais via une table FEDERATED.
# Mot de passe en clair : projet BDR (démo), hors périmètre sécurité.
# ==========================================


class LoginIn(BaseModel):
    login: str
    mot_de_passe: str


@router.post("/auth/login")
def login(data: LoginIn):
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id_emp, nom, statut, bibliotheque "
            "FROM employe WHERE login = %s AND mot_de_passe = %s",
            (data.login, data.mot_de_passe),
        )
        emp = cur.fetchone()
    finally:
        conn.close()

    if not emp:
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    return {
        "id_emp": emp["id_emp"],
        "nom": emp["nom"],
        "statut": emp["statut"],
        "bibliotheque": emp["bibliotheque"],
        "site": config.SITE_NAME,
    }
