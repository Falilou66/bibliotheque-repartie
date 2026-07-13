from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routers import lecture, ecriture, admin, auth
import config

app = FastAPI(title=f"API Bibliothèque Répartie — {config.SITE_NAME or '?'}")

# API (préfixe /api) — enregistrée avant le montage statique pour avoir priorité
app.include_router(auth.router, prefix="/api")
app.include_router(lecture.router, prefix="/api")
app.include_router(ecriture.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    print(f"[{config.SITE_NAME}] Démarrage — vérification des transactions XA "
          f"en attente...")
    try:
        admin.resoudre_au_demarrage()
    except Exception as e:
        # Au premier démarrage, les tables/pairs peuvent ne pas être prêts :
        # la reprise reste disponible via l'endpoint /api/admin/xa.
        print(f"[{config.SITE_NAME}] Reprise au démarrage différée : {e}")


# Interface web (HTML + JS fetch) servie à la racine
app.mount("/", StaticFiles(directory="static", html=True), name="static")
