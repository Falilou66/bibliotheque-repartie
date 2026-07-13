from fastapi import APIRouter
from db import get_conn
from config import SITE_NAME, PEERS
import mysql.connector

router = APIRouter()

def table_pour(site, table):
    if not site: return f"{table}_global"
    return table if site == SITE_NAME else f"ft_{table}_{site.lower()}"

@router.get("/ouvrages")
def get_ouvrages(site: str = None):
    table = table_pour(site, "ouvrage")
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table}")
        return cursor.fetchall()
    except mysql.connector.Error as e:
        if e.errno in [1429, 1430]:
            return {"error": "Federated error", "sites_indisponibles": list(PEERS.keys())}
        raise e