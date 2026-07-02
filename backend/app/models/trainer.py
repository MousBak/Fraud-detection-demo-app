# ─────────────────────────────────────────────────────────────
# Trainer — Orchestration de l'entraînement des modèles
# ─────────────────────────────────────────────────────────────

import time
import logging
from typing import Optional

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

from app.config import settings
from app.models.ml_models import FraudDetectionModel, ModelResult
from app.models.expert_ensemble import ExpertEnsemble
from app.models.l2d_system import L2DSystem

logger = logging.getLogger(__name__)


class ModelTrainer:
    """
    Orchestre l'entraînement et l'évaluation de tous les modèles.
    """

    def __init__(self):
        self.models: dict[str, FraudDetectionModel] = {}
        self.results: dict[str, ModelResult] = {}
        self.expert_ensemble = ExpertEnsemble()
        self.l2d_system = L2DSystem()
        self.X_train: Optional[pd.DataFrame] = None
        self.X_test: Optional[pd.DataFrame] = None
        self.y_train: Optional[pd.Series] = None
        self.y_test: Optional[pd.Series] = None

    def prepare_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2,
    ):
        """Prépare les données train/test par split temporel sur 'month'."""
        if "month" in X.columns:
            train_mask = X["month"] <= 5
            test_mask = X["month"] > 5
            
            self.X_train = X[train_mask]
            self.y_train = y[train_mask]
            self.X_test = X[test_mask]
            self.y_test = y[test_mask]
        else:
            # Fallback en cas d'absence de la colonne 'month'
            self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
                X, y,
                test_size=test_size,
                random_state=settings.RANDOM_STATE,
                stratify=y,
            )
            
        logger.info(
            f"Données préparées (Split temporel) : {len(self.X_train)} train (mois <= 5), "
            f"{len(self.X_test)} test (mois > 5), "
            f"taux de fraude train : {self.y_train.mean():.3%}, "
            f"taux de fraude test : {self.y_test.mean():.3%}"
        )

    def train_all_models(self) -> dict[str, ModelResult]:
        """Entraîne LR, RF et XGBoost."""
        if self.X_train is None:
            raise RuntimeError("Données non préparées. Appelez prepare_data().")

        model_types = ["logistic_regression", "random_forest", "xgboost"]

        for model_type in model_types:
            logger.info(f"Entraînement de {model_type}...")
            start = time.time()

            model = FraudDetectionModel(model_type)
            model.fit(self.X_train, self.y_train)

            elapsed = time.time() - start
            result = model.evaluate(self.X_test, self.y_test)
            result.training_time = f"{elapsed:.1f}s"

            self.models[model_type] = model
            self.results[model_type] = result

            logger.info(
                f"  {model_type} : accuracy={result.accuracy:.4f}, "
                f"f1={result.f1:.4f}, auc={result.auc_roc:.4f} ({elapsed:.1f}s)"
            )

            # Sauvegarder le modèle
            model.save()

        return self.results

    def train_single_model(self, model_type: str) -> ModelResult:
        """Entraîne un seul modèle."""
        if self.X_train is None:
            raise RuntimeError("Données non préparées.")

        start = time.time()
        model = FraudDetectionModel(model_type)
        model.fit(self.X_train, self.y_train)
        elapsed = time.time() - start

        result = model.evaluate(self.X_test, self.y_test)
        result.training_time = f"{elapsed:.1f}s"

        self.models[model_type] = model
        self.results[model_type] = result
        model.save()

        return result

    def setup_experts(self, expert_predictions: pd.DataFrame, y_true: pd.Series):
        """Configure le système d'experts."""
        self.expert_ensemble.load_predictions(expert_predictions)
        self.expert_ensemble.compute_profiles(y_true)

    def setup_l2d(self, model_type: str = "xgboost"):
        """Configure le système L2D avec un modèle spécifique."""
        if model_type not in self.models:
            raise RuntimeError(f"Modèle {model_type} non entraîné.")
        if self.expert_ensemble.expert_predictions is None:
            raise RuntimeError("Les experts ne sont pas configurés.")

        model = self.models[model_type]
        ml_scores = model.predict_proba(self.X_test)
        ml_predictions = model.predict(self.X_test)

        # Obtenir le consensus des experts pour les données de test
        test_indices = self.X_test.index.tolist()
        expert_consensus = self.expert_ensemble.get_consensus(test_indices)

        self.l2d_system.setup(
            ml_scores=ml_scores,
            ml_predictions=ml_predictions,
            expert_consensus=expert_consensus,
            y_true=self.y_test.values,
        )

    def get_comparison(self) -> list[dict]:
        """Retourne la comparaison de tous les modèles entraînés."""
        return [
            {
                "name": result.name,
                "accuracy": result.accuracy,
                "precision": result.precision,
                "recall": result.recall,
                "f1": result.f1,
                "auc_roc": result.auc_roc,
                "auc_pr": result.auc_pr,
                "training_time": result.training_time,
            }
            for result in self.results.values()
        ]
