import json
import os
import time

from config import JOURNAL_PATH

# ==========================================
# Journal de décision du coordinateur 2PC (doc de conception §6.3)
# Petit module qui ajoute {txid, decision, ts} en JSONL dans un volume
# (/data/journal_2pc.log). La décision est écrite AVANT la phase 2 :
# c'est ce journal qui permet la reprise sur panne (XA RECOVER + résolution).
# ==========================================


def ecrire(txid, decision):
    """Ajoute une ligne de décision durablement (flush + fsync)."""
    entry = {"txid": txid, "decision": decision, "ts": time.time()}
    os.makedirs(os.path.dirname(JOURNAL_PATH), exist_ok=True)
    with open(JOURNAL_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
        f.flush()
        os.fsync(f.fileno())


def lire_decisions():
    """Retourne un dict {txid: derniere_decision} à partir du journal."""
    decisions = {}
    if not os.path.exists(JOURNAL_PATH):
        return decisions
    with open(JOURNAL_PATH) as f:
        for ligne in f:
            ligne = ligne.strip()
            if not ligne:
                continue
            try:
                entry = json.loads(ligne)
            except json.JSONDecodeError:
                continue
            decisions[entry["txid"]] = entry["decision"]
    return decisions


# Décisions qui signifient « commit » lors de la reprise
DECISIONS_COMMIT = {"COMMIT", "COMMIT_INCOMPLET", "TERMINE"}
