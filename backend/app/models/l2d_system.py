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

    def setup(
        self,
        ml_scores: np.ndarray,
        ml_predictions: np.ndarray,
        expert_consensus: np.ndarray,
        y_true: np.ndarray,
    ):
        """Configure le système avec les données nécessaires."""
        self.ml_scores = ml_scores
        self.ml_predictions = ml_predictions
        self.expert_consensus = expert_consensus
        self.y_true = y_true

    def simulate(
        self,
        strategy: Literal["confidence", "disagreement", "cost_sensitive", "random"] = "confidence",
        threshold: float = 0.7,
        expert_capacity: float = 0.2,
        expert_selection: Literal["best", "average", "consensus"] = "consensus",
    ) -> L2DResult:
        """
        Simule une stratégie L2D.
        
        Args:
            strategy: Stratégie de déférence.
            threshold: Seuil pour la stratégie choisie.
            expert_capacity: Fraction des cas pouvant être envoyés aux experts.
            expert_selection: Méthode de sélection de la décision experte.
        
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
            defer_scores = expected_cost / expected_cost.max()
        elif strategy == "random":
            np.random.seed(42)
            defer_scores = np.random.rand(n)
        else:
            raise ValueError(f"Stratégie inconnue : {strategy}")

        # Sélectionner les cas à déférer (les scores les plus élevés)
        should_defer = defer_scores >= (1 - threshold)

        # Appliquer la contrainte de capacité
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

        # ── Calculs des Coûts Réels (FP * 100 + FN * 5000) ──
        cost_fp_unit, cost_fn_unit = 100, 5000
        
        # 1. Coût ML seul
        fp_ml = int(((self.ml_predictions == 1) & (self.y_true == 0)).sum())
        fn_ml = int(((self.ml_predictions == 0) & (self.y_true == 1)).sum())
        cost_ml = fp_ml * cost_fp_unit + fn_ml * cost_fn_unit

        # 2. Coût Expert seul
        fp_exp = int(((expert_decisions == 1) & (self.y_true == 0)).sum())
        fn_exp = int(((expert_decisions == 0) & (self.y_true == 1)).sum())
        cost_expert = fp_exp * cost_fp_unit + fn_exp * cost_fn_unit

        # 3. Coût Hybride L2D
        fp_hybrid = int(((y_pred_hybrid == 1) & (self.y_true == 0)).sum())
        fn_hybrid = int(((y_pred_hybrid == 0) & (self.y_true == 1)).sum())
        cost_hybrid = fp_hybrid * cost_fp_unit + fn_hybrid * cost_fn_unit

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
        )

    def compare_strategies(
        self,
        thresholds: list[float] | None = None,
        expert_capacity: float = 0.2,
    ) -> list[L2DResult]:
        """Compare les 3 stratégies L2D avec plusieurs seuils."""
        if thresholds is None:
            thresholds = [0.3, 0.5, 0.7, 0.9]

        results = []
        for strategy in ["confidence", "disagreement", "cost_sensitive", "random"]:
            for threshold in thresholds:
                result = self.simulate(
                    strategy=strategy,
                    threshold=threshold,
                    expert_capacity=expert_capacity,
                )
                results.append(result)

        return results
