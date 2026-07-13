import os

SITE_NAME = os.getenv("SITE_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_USER = "biblio"
DB_PASSWORD = os.getenv("MYSQL_PASSWORD") # Assurez-vous que cela correspond au nom dans docker-compose

# Transformation de la chaîne "UCAD:db_ucad,UADB:db_uadb" en dictionnaire
PEERS_RAW = os.getenv("PEERS", "")
PEERS = dict(item.split(":") for item in PEERS_RAW.split(",")) if PEERS_RAW else {}

MAX_EMPRUNTS = 5