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

    # Colonnes à ne pas utiliser comme features
    DROP_COLS = ["fraud_bool"]

    # Colonne cible
    TARGET_COL = "fraud_bool"

    def __init__(self):
        self.label_encoders: dict[str, LabelEncoder] = {}
        self.categorical_cols: list[str] = []
        self.feature_columns: list[str] = []
        self.is_fitted = False
        self.imputer = None
        self.fitted_impute_cols = []
        self.impute_cols = [
            "prev_address_months_count",
            "current_address_months_count",
            "credit_risk_score",
            "bank_months_count",
            "session_length_in_minutes",
            "device_distinct_emails_8w"
        ]

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

        # Identifier les colonnes catégorielles dynamiquement (types object, category ou string)
        self.categorical_cols = df.select_dtypes(include=["object", "category", "string"]).columns.tolist()
        logger.info(f"Colonnes catégorielles identifiées pour encodage : {self.categorical_cols}")

        # Encoder les colonnes catégorielles
        for col in self.categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le

        # Gérer les valeurs manquantes et imputer les sentinelles -1 par la médiane
        from sklearn.impute import SimpleImputer
        self.fitted_impute_cols = [c for c in self.impute_cols if c in df.columns]
        if self.fitted_impute_cols:
            for col in self.fitted_impute_cols:
                df[col] = df[col].replace(-1, np.nan)
                df[col] = df[col].replace(-1.0, np.nan)
            self.imputer = SimpleImputer(strategy="median")
            df[self.fitted_impute_cols] = self.imputer.fit_transform(df[self.fitted_impute_cols])

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

        # Gérer les valeurs manquantes et imputer les sentinelles -1 par la médiane
        if self.imputer is not None and self.fitted_impute_cols:
            cols_to_impute = []
            for col in self.fitted_impute_cols:
                if col not in df.columns:
                    df[col] = np.nan
                else:
                    df[col] = df[col].replace(-1, np.nan)
                    df[col] = df[col].replace(-1.0, np.nan)
                cols_to_impute.append(col)
            df[cols_to_impute] = self.imputer.transform(df[cols_to_impute])

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
