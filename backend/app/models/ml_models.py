# ─────────────────────────────────────────────────────────────
# Modèles ML — Logistic Regression, Random Forest, XGBoost
# ─────────────────────────────────────────────────────────────
# Entraînement et prédiction des modèles de détection de fraude
# basés sur le dataset BAF (Bank Account Fraud).

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    precision_recall_curve, roc_curve
)
from sklearn.preprocessing import StandardScaler

from app.config import settings


@dataclass
class ModelResult:
    """Résultats d'évaluation d'un modèle."""
    name: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    auc_roc: float
    auc_pr: float
    confusion_matrix: dict
    roc_curve: dict
    pr_curve: dict
    feature_importance: list[dict]
    training_time: str


class FraudDetectionModel:
    """
    Classe de base pour les modèles de détection de fraude.
    Supporte LR, RF et XGBoost.
    """

    SUPPORTED_TYPES = ["logistic_regression", "random_forest", "xgboost"]

    def __init__(self, model_type: str = "xgboost"):
        if model_type not in self.SUPPORTED_TYPES:
            raise ValueError(f"Type de modèle non supporté : {model_type}")

        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names: list[str] = []
        self.is_fitted = False

    def _create_model(self):
        """Crée l'instance du modèle selon le type."""
        if self.model_type == "logistic_regression":
            return LogisticRegression(
                max_iter=1000,
                random_state=settings.RANDOM_STATE,
                class_weight="balanced",
            )
        elif self.model_type == "random_forest":
            return RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                random_state=settings.RANDOM_STATE,
                class_weight="balanced",
                n_jobs=-1,
            )
        elif self.model_type == "xgboost":
            return XGBClassifier(
                n_estimators=300,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=settings.RANDOM_STATE,
                scale_pos_weight=20,  # Ratio déséquilibre ~1:20
                eval_metric="aucpr",
                use_label_encoder=False,
            )

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "FraudDetectionModel":
        """Entraîne le modèle sur les données."""
        self.feature_names = list(X.columns)
        self.model = self._create_model()

        # Normalisation pour LR
        if self.model_type == "logistic_regression":
            X_scaled = self.scaler.fit_transform(X)
            self.model.fit(X_scaled, y)
        else:
            self.model.fit(X, y)

        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Prédit les classes (0/1)."""
        if not self.is_fitted:
            raise RuntimeError("Le modèle n'est pas entraîné.")
        if self.model_type == "logistic_regression":
            return self.model.predict(self.scaler.transform(X))
        return self.model.predict(X)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Prédit les probabilités de fraude."""
        if not self.is_fitted:
            raise RuntimeError("Le modèle n'est pas entraîné.")
        if self.model_type == "logistic_regression":
            return self.model.predict_proba(self.scaler.transform(X))[:, 1]
        return self.model.predict_proba(X)[:, 1]

    def evaluate(self, X: pd.DataFrame, y: pd.Series) -> ModelResult:
        """Évalue le modèle et retourne les métriques complètes."""
        y_pred = self.predict(X)
        y_proba = self.predict_proba(X)

        # Métriques de base
        acc = accuracy_score(y, y_pred)
        prec = precision_score(y, y_pred, zero_division=0)
        rec = recall_score(y, y_pred, zero_division=0)
        f1 = f1_score(y, y_pred, zero_division=0)
        auc_roc = roc_auc_score(y, y_proba)

        # Courbe ROC
        fpr, tpr, _ = roc_curve(y, y_proba)
        roc_data = {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
        }

        # Courbe PR
        prec_curve, rec_curve, _ = precision_recall_curve(y, y_proba)
        pr_data = {
            "precision": prec_curve.tolist(),
            "recall": rec_curve.tolist(),
        }

        # AUC-PR
        from sklearn.metrics import average_precision_score
        auc_pr = average_precision_score(y, y_proba)

        # Matrice de confusion
        cm = confusion_matrix(y, y_pred)
        cm_dict = {
            "tn": int(cm[0, 0]),
            "fp": int(cm[0, 1]),
            "fn": int(cm[1, 0]),
            "tp": int(cm[1, 1]),
        }

        # Feature importance
        importance = self._get_feature_importance()

        return ModelResult(
            name=self.model_type,
            accuracy=round(acc, 4),
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1=round(f1, 4),
            auc_roc=round(auc_roc, 4),
            auc_pr=round(auc_pr, 4),
            confusion_matrix=cm_dict,
            roc_curve=roc_data,
            pr_curve=pr_data,
            feature_importance=importance,
            training_time="",
        )

    def _get_feature_importance(self) -> list[dict]:
        """Récupère l'importance des features."""
        if self.model_type == "logistic_regression":
            importances = np.abs(self.model.coef_[0])
        elif self.model_type == "random_forest":
            importances = self.model.feature_importances_
        elif self.model_type == "xgboost":
            importances = self.model.feature_importances_
        else:
            return []

        # Normaliser
        total = importances.sum()
        if total > 0:
            importances = importances / total

        result = [
            {"feature": name, "importance": round(float(imp), 4)}
            for name, imp in zip(self.feature_names, importances)
        ]
        return sorted(result, key=lambda x: x["importance"], reverse=True)

    def save(self, path: Optional[Path] = None) -> Path:
        """Sauvegarde le modèle sur disque."""
        if path is None:
            path = settings.MODELS_DIR / f"{self.model_type}_model.joblib"
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "model_type": self.model_type,
        }, path)
        return path

    def load(self, path: Optional[Path] = None) -> "FraudDetectionModel":
        """Charge un modèle depuis le disque."""
        if path is None:
            path = settings.MODELS_DIR / f"{self.model_type}_model.joblib"
        data = joblib.load(path)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.feature_names = data["feature_names"]
        self.model_type = data["model_type"]
        self.is_fitted = True
        return self
