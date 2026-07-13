import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD

def get_conn(host=DB_HOST):
    # Important : on utilise le mot de passe récupéré de la config
    return mysql.connector.connect(
        host=host,
        user=DB_USER,
        password=DB_PASSWORD,
        database="bilbio", # Attention : vérifiez l'orthographe dans votre compose (c'est écrit "bilbio" et non "bibliotheque")
        autocommit=False
    )