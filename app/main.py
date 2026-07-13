from fastapi import FastAPI
from routers import lecture, ecriture
import os

app = FastAPI(title="API Bibliotheque Repartie")

app.include_router(lecture.router, prefix="/api")
app.include_router(ecriture.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Ici, ajoutez l'appel à la résolution automatique 2PC (Étape 2.5)
    print("Application démarrée. Vérification des transactions XA en attente...")