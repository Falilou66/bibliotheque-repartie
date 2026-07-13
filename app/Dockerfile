FROM python:3.12-slim

# Configuration des variables d'environnement Python pour éviter les packages tampons
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

# Copie et installation des prérequis applicatifs
# (mysql-connector-python est en Python pur, uvicorn[standard]/fastapi s'installent
#  depuis des wheels : aucune compilation, donc pas besoin de build-essential)
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copie de tout le code source de l'application
COPY . /code

# Port exposé par FastAPI
EXPOSE 8000

# Commande par défaut pour lancer l'application avec rechargement automatique en développement
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]