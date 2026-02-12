# ─────────────────────────────────────────────────────────────
# Feature Engineering — Calcul des Features Avancées
# ─────────────────────────────────────────────────────────────

import pandas as pd
import numpy as np
from typing import Optional


class FeatureEngineer:
    """
    Calcule des features avancées pour la détection de fraude.
    """

    def add_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ajoute des features dérivées au dataset."""
        df = df.copy()

        # ─── Ratios de vélocité ───
        if "velocity_24h" in df.columns and "velocity_6h" in df.columns:
            df["velocity_ratio_6h_24h"] = (
                df["velocity_6h"] / df["velocity_24h"].replace(0, np.nan)
            ).fillna(0)

        if "velocity_4w" in df.columns and "velocity_24h" in df.columns:
            df["velocity_ratio_24h_4w"] = (
                df["velocity_24h"] / df["velocity_4w"].replace(0, np.nan)
            ).fillna(0)

        # ─── Score de risque composite ───
        risk_features = []
        if "credit_risk_score" in df.columns:
            # Normaliser inversement (score bas = risque élevé)
            df["credit_risk_normalized"] = 1 - (df["credit_risk_score"] / 850)
            risk_features.append("credit_risk_normalized")

        if "foreign_request" in df.columns:
            risk_features.append("foreign_request")

        if "device_fraud_count" in df.columns:
            df["has_fraud_history"] = (df["device_fraud_count"] > 0).astype(int)
            risk_features.append("has_fraud_history")

        if risk_features:
            df["composite_risk_score"] = df[risk_features].mean(axis=1)

        # ─── Indicateurs binaires ───
        if "customer_age" in df.columns:
            df["is_young"] = (df["customer_age"] < 25).astype(int)
            df["is_senior"] = (df["customer_age"] > 60).astype(int)

        if "bank_months_count" in df.columns:
            df["is_new_customer"] = (df["bank_months_count"] < 6).astype(int)

        if "income" in df.columns:
            df["income_log"] = np.log1p(df["income"])

        if "proposed_credit_limit" in df.columns and "income" in df.columns:
            df["credit_income_ratio"] = (
                df["proposed_credit_limit"] / df["income"].replace(0, np.nan)
            ).fillna(0).clip(0, 100)

        # ─── Combinaisons de features ───
        if "email_is_free" in df.columns and "phone_home_valid" in df.columns:
            df["contact_risk"] = (
                df["email_is_free"] * (1 - df["phone_home_valid"])
            )

        return df

    def get_engineered_feature_names(self) -> list[str]:
        """Liste des features ajoutées par le feature engineering."""
        return [
            "velocity_ratio_6h_24h",
            "velocity_ratio_24h_4w",
            "credit_risk_normalized",
            "has_fraud_history",
            "composite_risk_score",
            "is_young",
            "is_senior",
            "is_new_customer",
            "income_log",
            "credit_income_ratio",
            "contact_risk",
        ]
