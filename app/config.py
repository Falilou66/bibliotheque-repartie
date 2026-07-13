import os

# ==========================================
# Configuration issue du contrat d'interface (guide §1.2)
# Variables injectées par docker-compose : SITE_NAME, DB_HOST,
# DB_USER, DB_PASSWORD, PEERS.
# ==========================================

SITE_NAME = os.getenv("SITE_NAME")          # ex. "UGB"
DB_HOST = os.getenv("DB_HOST")              # ex. "db_ugb"
DB_USER = os.getenv("DB_USER", "biblio")
DB_PASSWORD = os.getenv("DB_PASSWORD")      # même valeur que MYSQL_PASSWORD des bases
DB_NAME = os.getenv("DB_NAME", "biblio")    # base MySQL (contrat : "biblio")

# Transformation de "UCAD:db_ucad,UADB:db_uadb" en dict {"UCAD": "db_ucad", ...}
PEERS_RAW = os.getenv("PEERS", "")
PEERS = dict(item.split(":") for item in PEERS_RAW.split(",")) if PEERS_RAW else {}

# Limite globale d'emprunts simultanés (hypothèse H4 / CHECK nbre_emprunts BETWEEN 0 AND 5)
MAX_EMPRUNTS = 5

# Journal de décision du coordinateur 2PC (volume monté sur /data)
JOURNAL_PATH = os.getenv("JOURNAL_PATH", "/data/journal_2pc.log")
