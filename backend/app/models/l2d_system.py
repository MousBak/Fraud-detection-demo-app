# ─────────────────────────────────────────────────────────────
# Learning to Defer (L2D) — Système de Déférence Humain-IA
# ─────────────────────────────────────────────────────────────
# Implémente les stratégies L2D du paper FiFAR :
# - Confidence-based deferral
# - Disagreement-based deferral
# - Cost-sensitive deferral

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Literal

from app.config import settings


@dataclass
class L2DResult:
    """Résultat d'une simulation L2D."""
    strategy: str
    threshold: float
    expert_capacity: float
    ml_decisions: int
    expert_reviews: int
    hybrid_accuracy: float
    ml_only_accuracy: float
    expert_only_accuracy: float
    synergy: float  # hybrid - max(ml, expert)
    cost_ml: float
    cost_expert: float
    cost_hybrid: float
    deferral_details: list[dict]
    hybrid_recall: float = 0.0
    ml_recall: float = 0.0
    expert_recall: float = 0.0
    cost_review: float = 500.0
    should_defer: np.ndarray = None




class L2DSystem:
    """
    Système Learning to Defer.
    
    Décide si le modèle ML peut prendre la décision seul
    ou s'il faut déléguer à un expert humain.
    
    Stratégies supportées :
    - confidence : defer si la confiance du modèle est basse
    - disagreement : defer si les experts ne s'accordent pas
    - cost_sensitive : defer basé sur le coût attendu des erreurs
    """

    def __init__(self):
        self.ml_scores: np.ndarray | None = None
        self.ml_predictions: np.ndarray | None = None
        self.expert_consensus: np.ndarray | None = None
        self.y_true: np.ndarray | None = None
        self.X_test: pd.DataFrame | None = None
        self.gating_pipeline = None

    def setup(
        self,
        ml_scores: np.ndarray,
        ml_predictions: np.ndarray,
        expert_consensus: np.ndarray,
        y_true: np.ndarray,
        X_test: pd.DataFrame | None = None,
        X_train: pd.DataFrame | None = None,
        y_train: pd.Series | None = None,
        expert_consensus_train: np.ndarray | None = None,
        base_model = None,
    ):
        """Configure le système avec les données nécessaires."""
        self.ml_scores = ml_scores
        self.ml_predictions = ml_predictions
        self.expert_consensus = expert_consensus
        self.y_true = y_true
        self.X_test = X_test
        
        # Entraîner le gating si possible
        if X_train is not None and y_train is not None and expert_consensus_train is not None and base_model is not None:
            self.train_gating(X_train, y_train, expert_consensus_train, base_model)

    def train_gating(self, X_train: pd.DataFrame, y_train: pd.Series, expert_consensus_train: np.ndarray, base_model):
        """Entraîne le modèle de gating pour la déférence apprise."""
        import logging
        from sklearn.model_selection import cross_val_predict, StratifiedKFold
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline import Pipeline
        
        logger = logging.getLogger(__name__)
        logger.info("Entraînement du modèle de gating...")
        
        # 1. Obtenir les prédictions cross_val_predict du base_model sur X_train
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        ml_scores_cv = cross_val_predict(base_model, X_train, y_train, cv=cv, method="predict_proba")[:, 1]
        ml_predictions_cv = (ml_scores_cv >= 0.5).astype(int)
        
        # 2. Définir expert_decisions sur train
        expert_decisions_train = (expert_consensus_train > 0.5).astype(int)
        
        # 3. Label de gating : defer_helps = 1 si (expert correct) & (ml incorrect), sinon 0
        expert_correct = (expert_decisions_train == y_train.values)
        ml_incorrect = (ml_predictions_cv != y_train.values)
        defer_helps = (expert_correct & ml_incorrect).astype(int)
        
        # 4. Features pour le gating
        gating_features = pd.DataFrame()
        gating_features["score_ml"] = ml_scores_cv
        gating_features["confiance"] = np.abs(ml_scores_cv - 0.5) * 2
        
        cols = [
            "proposed_credit_limit", "customer_age", "credit_risk_score", 
            "month", "bank_months_count", "income", 
            "name_email_similarity", "model_score", "velocity_6h"
        ]
        for col in cols:
            if col in X_train.columns:
                gating_features[col] = X_train[col].values
            else:
                gating_features[col] = 0.0
                
        # 5. Créer et entraîner le pipeline
        self.gating_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
        ])
        
        self.gating_pipeline.fit(gating_features, defer_helps)


    def simulate(
        self,
        strategy: Literal["confidence", "disagreement", "cost_sensitive", "learned", "random"] = "confidence",
        threshold: float = 0.7,
        expert_capacity: float = 0.2,
        expert_selection: Literal["best", "average", "consensus"] = "consensus",
        cost_review: float = 500.0,
        force_capacity: bool = False,
    ) -> L2DResult:
        """
        Simule une stratégie L2D.
        
        Args:
            strategy: Stratégie de déférence.
            threshold: Seuil pour la stratégie choisie.
            expert_capacity: Fraction des cas pouvant être envoyés aux experts.
            expert_selection: Méthode de sélection de la décision experte.
            cost_review: Coût d'une revue par expert.
            force_capacity: Si True, force la déférence de la capacité maximale exacte.
        
        Returns:
            L2DResult avec les métriques hybrides.
        """
        if self.ml_scores is None or self.y_true is None:
            raise RuntimeError("Le système n'est pas configuré. Appelez setup() d'abord.")

        n = len(self.ml_scores)
        max_expert_reviews = int(n * expert_capacity)

        # Décisions experts : consensus par vote majoritaire
        expert_decisions = (self.expert_consensus > 0.5).astype(int)

        # Confiance du modèle
        confidence = np.abs(self.ml_scores - 0.5) * 2

        # ML-only accuracy
        ml_correct = (self.ml_predictions == self.y_true).sum()
        ml_only_accuracy = ml_correct / n

        # Expert-only accuracy
        expert_correct = (expert_decisions == self.y_true).sum()
        expert_only_accuracy = expert_correct / n

        # Déterminer quels cas déférer
        if strategy == "confidence":
            # Trier par confiance croissante (les plus incertains d'abord)
            defer_scores = 1 - confidence
        elif strategy == "disagreement":
            expert_agreement = np.abs(self.expert_consensus - 0.5) * 2
            defer_scores = 1 - expert_agreement
        elif strategy == "cost_sensitive":
            cost_fp, cost_fn = 100, 5000
            ml_pred_fraude = self.ml_scores >= 0.5
            expected_cost = np.where(ml_pred_fraude,
                (1 - self.ml_scores) * cost_fp,   # risque de faux positif
                self.ml_scores * cost_fn)          # risque de faux négatif
            defer_scores = expected_cost / expected_cost.max() if expected_cost.max() > 0 else expected_cost
        elif strategy == "learned":
            if self.gating_pipeline is None:
                # Fallback sur confidence si non entraîné
                defer_scores = 1 - confidence
            else:
                # Construire features test pour le gating
                gating_features_test = pd.DataFrame()
                gating_features_test["score_ml"] = self.ml_scores
                gating_features_test["confiance"] = np.abs(self.ml_scores - 0.5) * 2
                
                cols = [
                    "proposed_credit_limit", "customer_age", "credit_risk_score", 
                    "month", "bank_months_count", "income", 
                    "name_email_similarity", "model_score", "velocity_6h"
                ]
                for col in cols:
                    if self.X_test is not None and col in self.X_test.columns:
                        gating_features_test[col] = self.X_test[col].values
                    else:
                        gating_features_test[col] = 0.0
                
                # Prédire le score de déférence
                defer_scores = self.gating_pipeline.predict_proba(gating_features_test)[:, 1]
        elif strategy == "random":
            np.random.seed(42)
            defer_scores = np.random.rand(n)
        else:
            raise ValueError(f"Stratégie inconnue : {strategy}")

        # Sélectionner les cas à déférer (les scores les plus élevés)
        if strategy == "learned" or force_capacity:
            if max_expert_reviews > 0:
                top_indices = np.argsort(defer_scores)[-max_expert_reviews:]
                should_defer = np.zeros(n, dtype=bool)
                should_defer[top_indices] = True
            else:
                should_defer = np.zeros(n, dtype=bool)
        else:
            should_defer = defer_scores >= (1 - threshold)
            if should_defer.sum() > max_expert_reviews:
                # Garder les top max_expert_reviews cas
                top_indices = np.argsort(defer_scores)[-max_expert_reviews:]
                should_defer = np.zeros(n, dtype=bool)
                should_defer[top_indices] = True

        # Calculer les résultats hybrides
        hybrid_correct = 0
        ml_decisions = 0
        expert_reviews = 0

        y_pred_hybrid = np.zeros(n, dtype=int)
        for i in range(n):
            if should_defer[i]:
                expert_reviews += 1
                y_pred_hybrid[i] = expert_decisions[i]
                if expert_decisions[i] == self.y_true[i]:
                    hybrid_correct += 1
            else:
                ml_decisions += 1
                y_pred_hybrid[i] = self.ml_predictions[i]
                if self.ml_predictions[i] == self.y_true[i]:
                    hybrid_correct += 1

        hybrid_accuracy = hybrid_correct / n
        synergy = hybrid_accuracy - max(ml_only_accuracy, expert_only_accuracy)

        # ── Calculs des Coûts Réels ──
        cost_fp_unit, cost_fn_unit = 100, 5000
        
        # 1. Coût ML seul
        fp_ml = int(((self.ml_predictions == 1) & (self.y_true == 0)).sum())
        fn_ml = int(((self.ml_predictions == 0) & (self.y_true == 1)).sum())
        cost_ml = fp_ml * cost_fp_unit + fn_ml * cost_fn_unit

        # 2. Coût Expert seul (100% de déférence donc n revues)
        fp_exp = int(((expert_decisions == 1) & (self.y_true == 0)).sum())
        fn_exp = int(((expert_decisions == 0) & (self.y_true == 1)).sum())
        cost_expert = fp_exp * cost_fp_unit + fn_exp * cost_fn_unit + n * cost_review

        # 3. Coût Hybride L2D
        fp_hybrid = int(((y_pred_hybrid == 1) & (self.y_true == 0)).sum())
        fn_hybrid = int(((y_pred_hybrid == 0) & (self.y_true == 1)).sum())
        cost_hybrid = fp_hybrid * cost_fp_unit + fn_hybrid * cost_fn_unit + expert_reviews * cost_review

        # ── Calculs du Rappel Réel (TP / (TP + FN)) ──
        tp_ml = int(((self.ml_predictions == 1) & (self.y_true == 1)).sum())
        ml_recall = tp_ml / (tp_ml + fn_ml) if (tp_ml + fn_ml) > 0 else 0

        tp_exp = int(((expert_decisions == 1) & (self.y_true == 1)).sum())
        expert_recall = tp_exp / (tp_exp + fn_exp) if (tp_exp + fn_exp) > 0 else 0

        tp_hybrid = int(((y_pred_hybrid == 1) & (self.y_true == 1)).sum())
        hybrid_recall = tp_hybrid / (tp_hybrid + fn_hybrid) if (tp_hybrid + fn_hybrid) > 0 else 0

        # Détails par bin de confiance
        bins = np.linspace(0, 1, 11)
        deferral_details = []
        for i in range(10):
            mask = (self.ml_scores >= bins[i]) & (self.ml_scores < bins[i + 1])
            count = mask.sum()
            deferred = (mask & should_defer).sum()
            deferral_details.append({
                "confidence_bin": f"{bins[i]:.1f}-{bins[i+1]:.1f}",
                "count": int(count),
                "deferred": int(deferred),
            })

        return L2DResult(
            strategy=strategy,
            threshold=threshold,
            expert_capacity=expert_capacity,
            ml_decisions=ml_decisions,
            expert_reviews=expert_reviews,
            hybrid_accuracy=round(hybrid_accuracy, 4),
            ml_only_accuracy=round(ml_only_accuracy, 4),
            expert_only_accuracy=round(expert_only_accuracy, 4),
            synergy=round(synergy, 4),
            cost_ml=float(cost_ml),
            cost_expert=float(cost_expert),
            cost_hybrid=float(cost_hybrid),
            deferral_details=deferral_details,
            hybrid_recall=round(hybrid_recall, 4),
            ml_recall=round(ml_recall, 4),
            expert_recall=round(expert_recall, 4),
            cost_review=float(cost_review),
            should_defer=should_defer,
        )

    def compare_strategies(
        self,
        thresholds: list[float] | None = None,
        expert_capacity: float = 0.2,
        cost_review: float = 500.0,
    ) -> list[L2DResult]:
        """Compare les stratégies L2D avec plusieurs seuils."""
        if thresholds is None:
            thresholds = [0.3, 0.5, 0.7, 0.9]

        results = []
        for strategy in ["confidence", "disagreement", "cost_sensitive", "learned", "random"]:
            for threshold in thresholds:
                result = self.simulate(
                    strategy=strategy,
                    threshold=threshold,
                    expert_capacity=expert_capacity,
                    cost_review=cost_review,
                )
                results.append(result)

        return results
