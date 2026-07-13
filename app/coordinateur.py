import mysql.connector  # Maintenant utilisé
from mysql.connector import Error as MySQLError  # Pour capturer les erreurs spécifiques
import json
import time
import os
from db import get_conn


class Coordinateur2PC:
    def __init__(self, transaction_id, participants):
        self.transaction_id = transaction_id
        self.participants = participants
        self.log_file = "/data/journal_2pc.log"
        self.conns = {}

    def _log_decision(self, decision):
        entry = {"txid": self.transaction_id, "decision": decision, "ts": time.time()}
        with open(self.log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")
            f.flush()
            os.fsync(f.fileno())

    def execute(self, operations):
        try:
            for site, host in self.participants.items():
                self.conns[site] = get_conn(host)

            # Phase 1: PREPARE
            for site, queries in operations.items():
                cursor = self.conns[site].cursor()
                cursor.execute(f"XA START '{self.transaction_id}'")
                for query in queries:
                    cursor.execute(query)
                cursor.execute(f"XA END '{self.transaction_id}'")
                cursor.execute(f"XA PREPARE '{self.transaction_id}'")

            self._log_decision("COMMIT")

            # Phase 2: COMMIT
            for site in self.participants:
                cursor = self.conns[site].cursor()
                cursor.execute(f"XA COMMIT '{self.transaction_id}'")
            return True

        except MySQLError as err:  # Exception spécifique au lieu de "broad exception"
            print(f"Erreur MySQL lors du 2PC: {err}")
            self._log_decision("ROLLBACK")
            self._rollback_all()
            return False

        finally:
            self._close_all()

    def _rollback_all(self):
        for conn in self.conns.values():
            try:
                cursor = conn.cursor()
                cursor.execute(f"XA ROLLBACK '{self.transaction_id}'")
            except MySQLError:
                pass

    def _close_all(self):
        for conn in self.conns.values():
            conn.close()