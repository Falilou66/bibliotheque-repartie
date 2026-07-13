import uuid

import mysql.connector

import journal
from config import SITE_NAME, DB_USER, DB_PASSWORD, DB_NAME

# ==========================================
# Coordinateur 2PC applicatif (doc de conception §6, guide §3.3)
#
# Le FastAPI du site initiateur joue le rôle de coordinateur : il ouvre une
# connexion dédiée par participant (une connexion MySQL ne porte qu'une
# transaction XA à la fois), exécute les écritures, puis pilote le protocole :
#   Phase 1 (vote)     : XA END -> XA PREPARE sur chaque branche
#   Décision           : journalisée AVANT la phase 2
#   Phase 2 (décision) : XA COMMIT partout (ou XA ROLLBACK si abandon)
#
# Règle d'or du projet : on n'écrit JAMAIS via une table FEDERATED ; toute
# écriture répartie passe par une connexion directe vers la base participante.
# ==========================================


class Branche:
    """Un participant = une connexion dédiée + un txid partagé."""

    def __init__(self, hote, txid):
        self.hote = hote
        self.txid = txid
        self.cnx = mysql.connector.connect(
            host=hote,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            autocommit=False,
        )
        self.cur = self.cnx.cursor(dictionary=True)
        self.cur.execute(f"XA START '{txid}'")

    def executer(self, sql, params=()):
        """Exécute une écriture et retourne le nombre de lignes affectées."""
        self.cur.execute(sql, params)
        return self.cur.rowcount

    def lire_un(self, sql, params=()):
        """Lecture (ex. SELECT ... FOR UPDATE) dans la branche XA."""
        self.cur.execute(sql, params)
        return self.cur.fetchone()

    def fermer(self):
        try:
            self.cur.close()
        except Exception:
            pass
        try:
            self.cnx.close()
        except Exception:
            pass


class Coordinateur2PC:
    def __init__(self, type_tx):
        # Identifiant global unique : <type>-<SITE>-<uuid8> (contrat §1.2)
        self.txid = f"{type_tx}-{SITE_NAME}-{uuid.uuid4().hex[:8]}"
        self.branches = []

    def branche(self, hote):
        b = Branche(hote, self.txid)
        self.branches.append(b)
        return b

    def valider(self):
        """Phases 1 et 2 du 2PC. Lève une exception si un participant casse."""
        try:
            # Clôture des branches
            for b in self.branches:
                b.cur.execute(f"XA END '{b.txid}'")

            # Phase 1 : vote (prepare)
            for b in self.branches:
                b.cur.execute(f"XA PREPARE '{b.txid}'")

            # Décision journalisée AVANT d'envoyer le moindre XA COMMIT
            journal.ecrire(self.txid, "COMMIT")

            # Phase 2 : décision (commit)
            try:
                for b in self.branches:
                    b.cur.execute(f"XA COMMIT '{b.txid}'")
                journal.ecrire(self.txid, "TERMINE")
            except Exception:
                # Participant injoignable APRÈS décision COMMIT : transaction
                # douteuse -> à résoudre par l'endpoint d'admin / au démarrage.
                journal.ecrire(self.txid, "COMMIT_INCOMPLET")
                raise
        finally:
            self._fermer_tout()

    def abandonner(self):
        """Décision négative : XA ROLLBACK sur toutes les branches."""
        try:
            for b in self.branches:
                try:
                    b.cur.execute(f"XA END '{b.txid}'")
                    b.cur.execute(f"XA ROLLBACK '{b.txid}'")
                except Exception:
                    # Branche déjà invalide / non préparée : rien à défaire
                    pass
            journal.ecrire(self.txid, "ROLLBACK")
        finally:
            self._fermer_tout()

    def _fermer_tout(self):
        for b in self.branches:
            b.fermer()
