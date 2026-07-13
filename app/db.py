import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME


def get_conn(host=None):
    """Une connexion MySQL par requête (guide §3.1).

    host=None -> base locale du site (DB_HOST) ; sinon on cible un pair
    (ex. db_ucad) pour les branches distantes du coordinateur 2PC.
    autocommit=False : indispensable pour maîtriser les transactions XA
    et les transactions locales.
    """
    return mysql.connector.connect(
        host=host or DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=False,
    )
