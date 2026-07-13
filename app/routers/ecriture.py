from fastapi import APIRouter, HTTPException
from coordinateur import Coordinateur2PC
import config
import time

router = APIRouter()


@router.post("/prets")
def create_pret(etudiant_id: int, ouvrage_id: int, universite: str):
    txid = f"pret_{etudiant_id}_{int(time.time())}"

    # Si local, transaction simple
    if universite == config.SITE_NAME:
        # Logique de transaction locale
        return {"status": "success"}

    # Sinon, 2PC avec le site distant
    participants = {"local": config.DB_HOST, "distant": config.PEERS[universite]}
    coord = Coordinateur2PC(txid, participants)

    ops = {
        "local": [f"UPDATE ouvrage SET stock = stock - 1 WHERE id = {ouvrage_id}",
                  f"INSERT INTO pret (id_etud, id_ouv) VALUES ({etudiant_id}, {ouvrage_id})"],
        "distant": [
            f"UPDATE etudiant SET nbre_emprunts = nbre_emprunts + 1 WHERE id = {etudiant_id} AND nbre_emprunts < 5"]
    }

    if coord.execute(ops):
        return {"status": "created"}
    raise HTTPException(status_code=409, detail="Transaction échouée")