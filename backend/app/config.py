# ─────────────────────────────────────────────────────────────
# Configuration — Système de Détection de Fraude FiFAR
# ─────────────────────────────────────────────────────────────

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration centralisée de l'application."""

    # ── Général ──
    APP_NAME: str = "FiFAR Fraud Detection System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── API ──
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Chemins de données ──
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    MODELS_DIR: Path = DATA_DIR / "models"

    # ── Dataset FiFAR ──
    BAF_DATASET_FILENAME: str = "Base.csv"
    EXPERT_PREDICTIONS_FILENAME: str = "FiFAR_expert_predictions.csv"

    # ── Modèles ML ──
    DEFAULT_MODEL_TYPE: str = "xgboost"
    RANDOM_STATE: int = 42
    TEST_SIZE: float = 0.2
    N_EXPERTS: int = 50

    # ── Learning to Defer ──
    CONFIDENCE_THRESHOLD: float = 0.7
    MAX_EXPERT_CAPACITY: int = 100
    DEFERRAL_COST: float = 10.0

    # ── Base de données ──
    DATABASE_URL: str = "sqlite:///./fifar_fraud.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Créer les répertoires s'ils n'existent pas
for dir_path in [settings.RAW_DATA_DIR, settings.PROCESSED_DATA_DIR, settings.MODELS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)
