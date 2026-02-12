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
        strategy: Literal["confidence", "disagreement", "cost_sensitive"] = "confidence",
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
        if self.ml_scores is None:
            raise RuntimeError("Le système n'est pas configuré. Appelez setup() d'abord.")

        n = len(self.ml_scores)
        max_expert_reviews = int(n * expert_capacity)

        # Décisions experts
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
            expected_cost = (
                self.ml_scores * cost_fp * (1 - self.ml_scores) +
                (1 - self.ml_scores) * cost_fn * self.ml_scores
            )
            defer_scores = expected_cost / expected_cost.max()
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

        for i in range(n):
            if should_defer[i]:
                expert_reviews += 1
                if expert_decisions[i] == self.y_true[i]:
                    hybrid_correct += 1
            else:
                ml_decisions += 1
                if self.ml_predictions[i] == self.y_true[i]:
                    hybrid_correct += 1

        hybrid_accuracy = hybrid_correct / n
        synergy = hybrid_accuracy - max(ml_only_accuracy, expert_only_accuracy)

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
            cost_ml=round(n * 0.5),
            cost_expert=round(expert_reviews * settings.DEFERRAL_COST),
            cost_hybrid=round(n * 0.5 + expert_reviews * settings.DEFERRAL_COST),
            deferral_details=deferral_details,
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
        for strategy in ["confidence", "disagreement", "cost_sensitive"]:
            for threshold in thresholds:
                result = self.simulate(
                    strategy=strategy,
                    threshold=threshold,
                    expert_capacity=expert_capacity,
                )
                results.append(result)

        return results
