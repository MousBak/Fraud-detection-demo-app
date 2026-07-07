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
        should_defer: np.ndarray | None = None,
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

        # Ajouter le taux de déférence par groupe
        group_metrics = fairness["group_metrics"]
        for group in group_metrics:
            mask = protected_attribute == group
            if should_defer is not None:
                deferred_group = should_defer[mask]
                defer_rate = deferred_group.mean() if len(deferred_group) > 0 else 0.0
                group_metrics[group]["deferral_rate"] = round(float(defer_rate), 4)
            else:
                group_metrics[group]["deferral_rate"] = 0.0

        # Calculer l'intervalle de confiance bootstrap pour le ratio min/max de FPR
        bootstrap_ci = self.compute_bootstrap_fpr_ratio_ci(y_true, y_pred, protected_attribute)
        fairness["bootstrap_ci"] = bootstrap_ci

        # Ajouter la piste d'atténuation recommandée
        fairness["mitigation_strategy"] = (
            "Pour atténuer ces disparités de taux d'erreur, une piste d'atténuation consiste à "
            "introduire des contraintes d'équité lors de l'apprentissage du score de déférence (gating) "
            "ou d'utiliser des seuils de décision différenciés par groupe d'âge afin de satisfaire l'égalité "
            "des chances ou l'égalité des taux de faux positifs (Hardt et al., 2016)."
        )

        return fairness

    def compute_bootstrap_fpr_ratio_ci(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        protected_attribute: np.ndarray,
        n_bootstrap: int = 300,
    ) -> dict:
        """
        Calcule l'intervalle de confiance bootstrap à 95% pour le ratio min/max de FPR
        entre les groupes de taille >= 100.
        """
        if hasattr(protected_attribute, "values"):
            protected_attribute = protected_attribute.values
        else:
            protected_attribute = np.asarray(protected_attribute)

        groups = np.unique(protected_attribute)
        valid_groups = []
        for g in groups:
            mask = protected_attribute == g
            if mask.sum() >= 100:
                valid_groups.append(g)
                
        if len(valid_groups) < 2:
            return {"ratio_mean": 1.0, "ci_lower": 1.0, "ci_upper": 1.0}
            
        ratios = []
        n = len(y_true)
        np.random.seed(42)
        
        for _ in range(n_bootstrap):
            boot_idx = np.random.choice(n, size=n, replace=True)
            boot_y_true = y_true[boot_idx]
            boot_y_pred = y_pred[boot_idx]
            boot_attr = protected_attribute[boot_idx]
            
            group_fprs = []
            for g in valid_groups:
                g_mask = boot_attr == g
                y_t = boot_y_true[g_mask]
                y_p = boot_y_pred[g_mask]
                
                # Faux positifs / Négatifs réels
                neg_mask = y_t == 0
                n_neg = neg_mask.sum()
                if n_neg > 0:
                    fp = ((y_p == 1) & neg_mask).sum()
                    fpr = fp / n_neg
                    group_fprs.append(fpr)
                else:
                    group_fprs.append(0.0)
                    
            if group_fprs:
                min_fpr = min(group_fprs)
                max_fpr = max(group_fprs)
                ratio = min_fpr / max_fpr if max_fpr > 0 else 0.0
                ratios.append(ratio)
                
        if not ratios:
            return {"ratio_mean": 1.0, "ci_lower": 1.0, "ci_upper": 1.0}
            
        ci_lower = float(np.percentile(ratios, 2.5))
        ci_upper = float(np.percentile(ratios, 97.5))
        ratio_mean = float(np.mean(ratios))
        
        return {
            "ratio_mean": round(ratio_mean, 4),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4)
        }

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
