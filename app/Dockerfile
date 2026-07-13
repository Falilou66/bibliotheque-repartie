FROM python:3.12-slim

# Configuration des variables d'environnement Python pour éviter les packages tampons
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

# Installation des dépendances système nécessaires pour compiler d'éventuels drivers si besoin
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des prérequis applicatifs
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copie de tout le code source de l'application
COPY . /code

# Port exposé par FastAPI
EXPOSE 8000

# Commande par défaut pour lancer l'application avec rechargement automatique en développement
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]