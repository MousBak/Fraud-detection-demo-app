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
        Charge le dataset BAF depuis un fichier CSV.
        
        Args:
            path: Chemin optionnel vers le fichier.
        
        Returns:
            DataFrame avec le dataset chargé.
        """
        if path is None:
            path = settings.RAW_DATA_DIR / settings.BAF_DATASET_FILENAME

        if not path.exists():
            logger.warning(f"Dataset non trouvé : {path}. Génération de données de démonstration.")
            self._dataset = self._generate_demo_data()
            return self._dataset

        logger.info(f"Chargement du dataset depuis {path}...")
        self._dataset = pd.read_csv(path)
        logger.info(f"Dataset chargé : {self._dataset.shape[0]} lignes, {self._dataset.shape[1]} colonnes")

        return self._dataset

    def load_expert_predictions(self, path: Optional[Path] = None) -> pd.DataFrame:
        """Charge les prédictions des 50 experts FiFAR."""
        if path is None:
            path = settings.RAW_DATA_DIR / settings.EXPERT_PREDICTIONS_FILENAME

        if not path.exists():
            logger.warning(f"Prédictions experts non trouvées : {path}. Génération de données de démonstration.")
            self._expert_predictions = self._generate_demo_expert_predictions()
            return self._expert_predictions

        logger.info(f"Chargement des prédictions experts depuis {path}...")
        self._expert_predictions = pd.read_csv(path)
        logger.info(f"Prédictions chargées : {self._expert_predictions.shape}")

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
        """Retourne un échantillon du dataset."""
        df = self.dataset
        sample = df.head(n) if len(df) <= n else df.sample(n, random_state=settings.RANDOM_STATE)
        return sample.to_dict(orient="records")

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
