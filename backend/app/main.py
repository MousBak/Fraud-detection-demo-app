# ─────────────────────────────────────────────────────────────
# Point d'Entrée FastAPI — Système de Détection de Fraude FiFAR
# ─────────────────────────────────────────────────────────────

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import data, predictions, models, experts, l2d, analytics

# ═══════════════════════════════════════════════════════════
#  Initialisation de l'Application
# ═══════════════════════════════════════════════════════════

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API de détection de fraude basée sur le dataset FiFAR. "
        "Combine modèles ML (LR, RF, XGBoost) avec un système "
        "de 50 experts synthétiques via Learning to Defer."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════
#  Enregistrement des Routes
# ═══════════════════════════════════════════════════════════

app.include_router(data.router, prefix=f"{settings.API_PREFIX}/data", tags=["Données"])
app.include_router(predictions.router, prefix=f"{settings.API_PREFIX}/predictions", tags=["Prédictions"])
app.include_router(models.router, prefix=f"{settings.API_PREFIX}/models", tags=["Modèles ML"])
app.include_router(experts.router, prefix=f"{settings.API_PREFIX}/experts", tags=["Experts"])
app.include_router(l2d.router, prefix=f"{settings.API_PREFIX}/l2d", tags=["Learning to Defer"])
app.include_router(analytics.router, prefix=f"{settings.API_PREFIX}/analytics", tags=["Analytics"])


# ── Endpoint de santé ──
@app.get("/health", tags=["Santé"])
async def health_check():
    """Vérifie que le service est en ligne."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Accueil"])
async def root():
    """Point d'entrée racine avec informations sur l'API."""
    return {
        "message": f"Bienvenue sur {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


# ═══════════════════════════════════════════════════════════
#  Lancement
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )
