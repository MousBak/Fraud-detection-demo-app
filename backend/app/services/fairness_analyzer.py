# ─────────────────────────────────────────────────────────────
# Fairness Analyzer — Analyse d'Équité des Modèles
# ─────────────────────────────────────────────────────────────

import numpy as np
import pandas as pd
from typing import Optional

from app.services.metrics_calculator import MetricsCalculator


class FairnessAnalyzer:
    """
    Analyse l'équité des modèles et des experts
    par rapport aux attributs protégés (âge, genre, origine...).
    """

    def __init__(self):
        self.metrics_calculator = MetricsCalculator()

    def analyze(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        protected_attribute: np.ndarray,
        attribute_name: str = "foreign_request",
    ) -> dict:
        """
        Analyse complète de l'équité pour un attribut protégé.
        
        Returns:
            Dictionnaire avec métriques par groupe et métriques globales.
        """
        fairness = self.metrics_calculator.compute_fairness_metrics(
            y_true, y_pred, protected_attribute
        )

        fairness["attribute"] = attribute_name

        # Score global (0-10, 10 = parfaitement équitable)
        dp = fairness.get("demographic_parity", 0)
        eo = fairness.get("equalized_odds_fpr", 0)
        fairness["overall_score"] = round((dp + eo) / 2 * 10, 1)

        return fairness

    def analyze_multiple_attributes(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        df: pd.DataFrame,
        attributes: list[str],
    ) -> list[dict]:
        """Analyse l'équité pour plusieurs attributs protégés."""
        results = []
        for attr in attributes:
            if attr in df.columns:
                result = self.analyze(
                    y_true, y_pred,
                    df[attr].values,
                    attribute_name=attr,
                )
                results.append(result)
        return results

    def get_bias_summary(self, results: list[dict]) -> dict:
        """Résumé des biais détectés."""
        issues = []
        for r in results:
            score = r.get("overall_score", 10)
            if score < 7:
                issues.append({
                    "attribute": r["attribute"],
                    "score": score,
                    "severity": "high" if score < 5 else "medium",
                })

        return {
            "total_attributes_analyzed": len(results),
            "issues_found": len(issues),
            "issues": issues,
            "avg_fairness_score": round(
                sum(r.get("overall_score", 0) for r in results) / max(len(results), 1), 1
            ),
        }
