from fastapi import APIRouter

from db import get_conn
import config
import journal

router = APIRouter()


def _hotes():
    """Base locale + chaque pair, sous forme (nom_site, hote)."""
    return [("LOCAL", config.DB_HOST)] + list(config.PEERS.items())


def _txid_de(row):
    """Extrait le txid de la colonne 'data' de XA RECOVER (bytes -> str)."""
    data = row.get("data")
    if isinstance(data, (bytes, bytearray)):
        return data.decode(errors="replace")
    return str(data)


def _xa_recover(host):
    """Liste des txid en état préparé (douteux) sur une base."""
    conn = get_conn(host)
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("XA RECOVER")
        return [_txid_de(r) for r in cur.fetchall()]
    finally:
        conn.close()


@router.get("/admin/xa")
def lister_xa():
    """Transactions douteuses (XA RECOVER) croisées avec la décision journalisée."""
    decisions = journal.lire_decisions()
    resultats = []
    for nom, host in _hotes():
        try:
            for txid in _xa_recover(host):
                resultats.append({
                    "txid": txid,
                    "hote": host,
                    "site": nom,
                    "decision": decisions.get(txid, "INCONNUE"),
                })
        except Exception:
            # Site injoignable : on l'ignore (mode dégradé)
            pass
    return resultats


def _resoudre(txid, decisions):
    """Applique XA COMMIT/ROLLBACK selon le journal, partout où txid apparaît."""
    commit = decisions.get(txid) in journal.DECISIONS_COMMIT
    action = "XA COMMIT" if commit else "XA ROLLBACK"
    faits = []
    for nom, host in _hotes():
        try:
            conn = get_conn(host)
            try:
                cur = conn.cursor(dictionary=True)
                cur.execute("XA RECOVER")
                present = any(_txid_de(r) == txid for r in cur.fetchall())
                if present:
                    cur.execute(f"{action} '{txid}'")
                    conn.commit()
                    faits.append(host)
            finally:
                conn.close()
        except Exception:
            pass
    return action, faits


@router.post("/admin/xa/{txid}/resoudre")
def resoudre_xa(txid: str):
    decisions = journal.lire_decisions()
    action, faits = _resoudre(txid, decisions)
    return {
        "txid": txid,
        "decision": decisions.get(txid, "INCONNUE"),
        "action": action,
        "hotes_resolus": faits,
    }


def resoudre_au_demarrage():
    """Appelée au startup : résout automatiquement les transactions douteuses."""
    decisions = journal.lire_decisions()
    vus = set()
    for nom, host in _hotes():
        try:
            txids = _xa_recover(host)
        except Exception:
            continue
        for txid in txids:
            if txid in vus:
                continue
            vus.add(txid)
            action, faits = _resoudre(txid, decisions)
            print(f"[reprise] {txid} -> {action} sur {faits}")
    if vus:
        print(f"[reprise] {len(vus)} transaction(s) douteuse(s) résolue(s).")
    else:
        print("[reprise] Aucune transaction XA douteuse.")
