# ─────────────────────────────────────────────────────────────
# Preprocessor — Prétraitement des données FiFAR
# ─────────────────────────────────────────────────────────────

import logging
from typing import Optional

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

from app.config import settings

logger = logging.getLogger(__name__)


class Preprocessor:
    """
    Prétraitement des données BAF pour l'entraînement des modèles.
    """

    # Colonnes catégorielles à encoder
    CATEGORICAL_COLS = [
        "payment_type", "employment_status", "housing_status",
        "source", "device_os",
    ]

    # Colonnes à ne pas utiliser comme features
    DROP_COLS = ["fraud_bool", "month"]

    # Colonne cible
    TARGET_COL = "fraud_bool"

    def __init__(self):
        self.label_encoders: dict[str, LabelEncoder] = {}
        self.feature_columns: list[str] = []
        self.is_fitted = False

    def fit_transform(self, df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
        """
        Prépare les données pour l'entraînement.
        
        Returns:
            Tuple (X, y) prêt pour l'entraînement.
        """
        df = df.copy()
        logger.info(f"Preprocessing de {len(df)} lignes...")

        # Vérifier la colonne cible
        if self.TARGET_COL not in df.columns:
            raise ValueError(f"Colonne cible '{self.TARGET_COL}' non trouvée")

        # Extraire y
        y = df[self.TARGET_COL].astype(int)

        # Supprimer les colonnes non-features
        cols_to_drop = [c for c in self.DROP_COLS if c in df.columns]
        df = df.drop(columns=cols_to_drop)

        # Encoder les colonnes catégorielles
        for col in self.CATEGORICAL_COLS:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le

        # Gérer les valeurs manquantes
        df = df.fillna(0)

        # Ne garder que les colonnes numériques
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        df = df[numeric_cols]

        self.feature_columns = list(df.columns)
        self.is_fitted = True

        logger.info(f"Features après preprocessing : {len(self.feature_columns)}")
        return df, y

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforme de nouvelles données (sans y)."""
        if not self.is_fitted:
            raise RuntimeError("Le preprocessor n'est pas entraîné.")

        df = df.copy()

        # Supprimer les colonnes non-features
        cols_to_drop = [c for c in self.DROP_COLS if c in df.columns]
        df = df.drop(columns=cols_to_drop, errors="ignore")

        # Encoder les catégorielles
        for col, le in self.label_encoders.items():
            if col in df.columns:
                # Gérer les valeurs inconnues
                df[col] = df[col].astype(str).map(
                    lambda x, _le=le: _le.transform([x])[0] if x in _le.classes_ else -1
                )

        df = df.fillna(0)

        # S'assurer que les mêmes colonnes sont présentes
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0

        return df[self.feature_columns]

    def get_feature_stats(self, df: pd.DataFrame) -> list[dict]:
        """Retourne les statistiques descriptives des features."""
        stats = []
        for col in df.select_dtypes(include=[np.number]).columns:
            stats.append({
                "feature": col,
                "mean": round(float(df[col].mean()), 4),
                "std": round(float(df[col].std()), 4),
                "min": round(float(df[col].min()), 4),
                "max": round(float(df[col].max()), 4),
                "median": round(float(df[col].median()), 4),
                "missing": int(df[col].isnull().sum()),
                "missing_pct": round(float(df[col].isnull().mean()), 4),
            })
        return stats
