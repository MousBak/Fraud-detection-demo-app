# ═══════════════════════════════════════════════════════════
# Dockerfile — FiFAR Fraud Detection System
# ═══════════════════════════════════════════════════════════
# Build multi-étapes : Frontend (React/Vite) + Backend (FastAPI)
#
# Étape 1 : Compile le frontend React en fichiers statiques
# Étape 2 : Prépare le backend Python et copie le frontend compilé
#
# Usage :
#   docker build -t fifar-fraud .
#   docker run -p 8000:8000 fifar-fraud

# ── Étape 1 : Compilation du Frontend ──
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copier les fichiers de dépendances d'abord (optimise le cache Docker)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent

# Copier le reste du code frontend
COPY frontend/ ./

# Construire les fichiers statiques optimisés
RUN npm run build

# ── Étape 2 : Backend Python ──
FROM python:3.11-slim AS backend

WORKDIR /app

# Installer les dépendances système nécessaires à la compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code du backend
COPY backend/ ./backend/

# Copier les fichiers statiques du frontend depuis l'étape 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Créer les répertoires de données
RUN mkdir -p /app/backend/data/raw /app/backend/data/processed /app/backend/data/models

# Variables d'environnement Python
ENV PYTHONPATH=/app/backend
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Exposer le port de l'API
EXPOSE 8000

# Commande de lancement
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
