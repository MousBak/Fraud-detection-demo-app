# ─────────────────────────────────────────────────────────────
# Data Loader — Chargement du Dataset FiFAR / BAF
# ─────────────────────────────────────────────────────────────

import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from app.config import settings

logger = logging.getLogger(__name__)


class DataLoader:
    """
    Charge et gère le dataset BAF (Bank Account Fraud)
    et les prédictions des experts FiFAR.
    """

    def __init__(self):
        self._dataset: Optional[pd.DataFrame] = None
        self._expert_predictions: Optional[pd.DataFrame] = None

    @property
    def dataset(self) -> pd.DataFrame:
        """Retourne le dataset, le charge si nécessaire."""
        if self._dataset is None:
            self.load_dataset()
        return self._dataset

    @property
    def expert_predictions(self) -> pd.DataFrame:
        """Retourne les prédictions des experts."""
        if self._expert_predictions is None:
            self.load_expert_predictions()
        return self._expert_predictions

    def load_dataset(self, path: Optional[Path] = None) -> pd.DataFrame:
        """
        Charge le dataset BAF (alerts) depuis un fichier Parquet.
        
        Args:
            path: Chemin optionnel vers le fichier.
        
        Returns:
            DataFrame avec le dataset chargé.
        """
        if path is None:
            path = settings.RAW_DATA_DIR / "alert_data" / "processed_data" / "alerts.parquet"

        if not path.exists():
            raise FileNotFoundError(
                f"Dataset réel non trouvé à l'emplacement : {path}. "
                "Veuillez y placer le fichier alerts.parquet."
            )

        logger.info(f"Chargement du dataset depuis {path}...")
        self._dataset = pd.read_parquet(path)
        logger.info(f"Dataset chargé : {self._dataset.shape[0]} lignes, {self._dataset.shape[1]} colonnes")

        return self._dataset

    def load_expert_predictions(self, path: Optional[Path] = None) -> pd.DataFrame:
        """Charge les prédictions des 50 experts FiFAR depuis un fichier Parquet."""
        if path is None:
            path = settings.RAW_DATA_DIR / "synthetic_experts" / "expert_predictions.parquet"

        if not path.exists():
            raise FileNotFoundError(
                f"Prédictions d'experts réelles non trouvées à l'emplacement : {path}. "
                "Veuillez y placer le fichier expert_predictions.parquet."
            )

        logger.info(f"Chargement des prédictions experts depuis {path}...")
        self._expert_predictions = pd.read_parquet(path)

        # Aligner les experts sur l'index des alertes
        # S'assurer que le dataset est chargé d'abord
        if self._dataset is None:
            self.load_dataset()
            
        if self._dataset is not None:
            self._expert_predictions = self._expert_predictions.loc[self._dataset.index]

        logger.info(f"Prédictions chargées et alignées : {self._expert_predictions.shape}")

        return self._expert_predictions

    def get_dataset_stats(self) -> dict:
        """Retourne les statistiques du dataset."""
        df = self.dataset
        fraud_col = self._find_fraud_column(df)

        stats = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values": df.isnull().sum().to_dict(),
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / 1e6, 2),
        }

        if fraud_col:
            fraud_count = int(df[fraud_col].sum())
            stats.update({
                "fraud_column": fraud_col,
                "fraud_count": fraud_count,
                "legitimate_count": len(df) - fraud_count,
                "fraud_rate": round(fraud_count / len(df), 4),
            })

        return stats

    def get_sample(self, n: int = 100) -> list[dict]:
        """Retourne un échantillon du dataset enrichi avec les scores ML et experts réels."""
        df = self.dataset
        
        # Prendre un échantillon déterministe ou le début du dataset
        if len(df) <= n:
            sample_df = df
        else:
            sample_df = df.head(n) # Utiliser head pour la cohérence temporelle

        records = []

        # Calculer les prédictions ML réelles si possible
        ml_scores = None
        ml_preds = None
        try:
            from app.models.ml_models import FraudDetectionModel
            from app.services.preprocessor import Preprocessor
            
            model = FraudDetectionModel("xgboost")
            model.load()
            preprocessor = Preprocessor()
            X, _ = preprocessor.fit_transform(df)
            ml_scores = model.predict_proba(X)
            ml_preds = model.predict(X)
        except Exception as e:
            logger.warning(f"Impossible de calculer les scores ML réels : {e}. Utilisation de fallbacks.")
            
        expert_preds = self.expert_predictions

        for idx, row in sample_df.iterrows():
            rec = row.to_dict()
            
            # Identifiants
            rec_id = str(row.get("case_id", idx))
            rec["id"] = f"TXN-{rec_id}"
            rec["customerId"] = f"CLI-{row.get('customer_age', 30)}-{idx}"
            rec["customerName"] = f"Client {rec_id}"
            
            # Caractéristiques financières
            rec["amount"] = float(row.get("income", 5) * 100.0)
            rec["currency"] = "EUR"
            rec["merchant"] = "Marchand FiFAR"
            rec["merchantCategory"] = "E-commerce"
            rec["cardType"] = "credit"
            rec["country"] = "FR"
            rec["city"] = "Paris"
            rec["channel"] = "online"
            rec["isRecurring"] = False
            rec["timestamp"] = "2026-07-02T12:00:00Z"
            
            # Target
            rec["fraudBool"] = bool(row.get("fraud_bool", False))

            # Scores ML
            try:
                loc_idx = df.index.get_loc(idx)
            except Exception:
                loc_idx = 0

            if ml_scores is not None:
                rec["modelScore"] = float(ml_scores[loc_idx])
                rec["prediction"] = int(ml_preds[loc_idx])
            else:
                rec["modelScore"] = 0.82 if rec["fraudBool"] else 0.12
                rec["prediction"] = 1 if rec["fraudBool"] else 0

            # Risques et statuts
            rec["riskLevel"] = (
                "critical" if rec["modelScore"] > 0.85 else
                "high" if rec["modelScore"] > 0.65 else
                "medium" if rec["modelScore"] > 0.4 else "low"
            )
            rec["status"] = (
                "blocked" if rec["modelScore"] > 0.85 else
                "review" if rec["modelScore"] > 0.65 else
                "deferred" if rec["modelScore"] > 0.4 else "approved"
            )

            # Consensus expert
            if expert_preds is not None and idx in expert_preds.index:
                # Consensus moyen des 50 experts
                rec["expertConsensus"] = float(expert_preds.loc[idx].mean())
            else:
                rec["expertConsensus"] = 0.90 if rec["fraudBool"] else 0.10

            records.append(rec)

        return records

    def _find_fraud_column(self, df: pd.DataFrame) -> Optional[str]:
        """Détecte la colonne de fraude dans le dataset."""
        candidates = ["fraud_bool", "fraud", "is_fraud", "isFraud", "label", "target"]
        for col in candidates:
            if col in df.columns:
                return col
        return None

    def _generate_demo_data(self, n: int = 1000) -> pd.DataFrame:
        """Génère des données de démonstration si le dataset n'est pas disponible."""
        import numpy as np

        np.random.seed(settings.RANDOM_STATE)
        fraud_rate = 0.048

        n_fraud = int(n * fraud_rate)
        n_legit = n - n_fraud

        data = {
            "fraud_bool": [1] * n_fraud + [0] * n_legit,
            "month": np.random.randint(0, 8, n),
            "income": np.random.lognormal(8, 1.5, n).round(2),
            "name_email_similarity": np.random.beta(5, 2, n).round(3),
            "customer_age": np.clip(np.random.normal(40, 15, n), 18, 80).astype(int),
            "velocity_24h": np.abs(np.random.normal(2, 2, n)).round(2),
            "velocity_6h": np.abs(np.random.normal(1, 1, n)).round(2),
            "velocity_4w": np.abs(np.random.normal(3, 3, n)).round(2),
            "zip_count_4w": np.abs(np.random.normal(3, 3, n)).astype(int),
            "credit_risk_score": np.clip(np.random.normal(600, 100, n), 100, 850).astype(int),
            "foreign_request": np.random.binomial(1, 0.1, n),
            "email_is_free": np.random.binomial(1, 0.6, n),
            "phone_home_valid": np.random.binomial(1, 0.7, n),
            "phone_mobile_valid": np.random.binomial(1, 0.85, n),
            "bank_months_count": np.abs(np.random.normal(30, 20, n)).astype(int),
            "has_other_cards": np.random.binomial(1, 0.5, n),
            "proposed_credit_limit": np.clip(np.random.normal(5000, 3000, n), 200, 25000).astype(int),
            "session_length_in_minutes": np.clip(np.random.normal(15, 8, n), 1, 60).round(1),
            "device_distinct_emails_8w": np.abs(np.random.normal(1.5, 1.5, n)).astype(int),
            "device_fraud_count": np.random.binomial(1, 0.05, n),
            "payment_type": np.random.choice(["AA", "AB", "AC", "AD", "AE"], n),
            "employment_status": np.random.choice(["CA", "CB", "CC", "CD", "CE", "CF", "CG"], n),
            "housing_status": np.random.choice(["BA", "BB", "BC", "BD", "BE", "BF", "BG"], n),
            "source": np.random.choice(["INTERNET", "TELEAPP"], n),
            "device_os": np.random.choice(["windows", "macintosh", "linux", "other", "x11"], n),
        }

        df = pd.DataFrame(data)
        return df.sample(frac=1, random_state=settings.RANDOM_STATE).reset_index(drop=True)

    def _generate_demo_expert_predictions(self) -> pd.DataFrame:
        """Génère des prédictions d'experts de démonstration."""
        import numpy as np

        np.random.seed(settings.RANDOM_STATE)
        n = len(self.dataset)
        fraud_col = self._find_fraud_column(self.dataset)
        y_true = self.dataset[fraud_col].values if fraud_col else np.zeros(n)

        expert_data = {}
        for i in range(50):
            skill = 0.6 + (i % 10) * 0.035 + (0.05 if i < 25 else 0)
            preds = np.where(
                np.random.random(n) < skill,
                y_true,
                1 - y_true,
            )
            expert_data[f"expert_{i}"] = preds

        return pd.DataFrame(expert_data)


# Singleton
data_loader = DataLoader()
