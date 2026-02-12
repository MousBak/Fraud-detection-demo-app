# ─────────────────────────────────────────────────────────────
# Metrics Calculator — Calcul de Métriques Avancées
# ─────────────────────────────────────────────────────────────

import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve, fbeta_score,
)


class MetricsCalculator:
    """Calcule les métriques de performance des modèles et experts."""

    @staticmethod
    def compute_classification_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_proba: np.ndarray | None = None,
    ) -> dict:
        """Calcule un ensemble complet de métriques de classification."""
        metrics = {
            "accuracy": round(accuracy_score(y_true, y_pred), 4),
            "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
            "recall": round(recall_score(y_true, y_pred, zero_division=0), 4),
            "f1": round(f1_score(y_true, y_pred, zero_division=0), 4),
            "f2": round(fbeta_score(y_true, y_pred, beta=2, zero_division=0), 4),
        }

        # Matrice de confusion
        cm = confusion_matrix(y_true, y_pred)
        metrics["confusion_matrix"] = {
            "tn": int(cm[0, 0]),
            "fp": int(cm[0, 1]),
            "fn": int(cm[1, 0]),
            "tp": int(cm[1, 1]),
        }

        # FPR, FNR
        tn, fp, fn, tp = cm.ravel()
        metrics["fpr"] = round(fp / (fp + tn) if (fp + tn) > 0 else 0, 4)
        metrics["fnr"] = round(fn / (fn + tp) if (fn + tp) > 0 else 0, 4)
        metrics["tpr"] = round(tp / (tp + fn) if (tp + fn) > 0 else 0, 4)

        if y_proba is not None:
            metrics["auc_roc"] = round(roc_auc_score(y_true, y_proba), 4)
            metrics["auc_pr"] = round(average_precision_score(y_true, y_proba), 4)

            # Courbe ROC
            fpr_curve, tpr_curve, _ = roc_curve(y_true, y_proba)
            metrics["roc_curve"] = {
                "fpr": fpr_curve.tolist(),
                "tpr": tpr_curve.tolist(),
            }

            # Courbe PR
            prec_curve, rec_curve, _ = precision_recall_curve(y_true, y_proba)
            metrics["pr_curve"] = {
                "precision": prec_curve.tolist(),
                "recall": rec_curve.tolist(),
            }

        return metrics

    @staticmethod
    def compute_fairness_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        protected_attribute: np.ndarray,
    ) -> dict:
        """Calcule les métriques d'équité par groupe."""
        groups = np.unique(protected_attribute)
        group_metrics = {}

        for group in groups:
            mask = protected_attribute == group
            if mask.sum() == 0:
                continue

            y_t = y_true[mask]
            y_p = y_pred[mask]

            cm = confusion_matrix(y_t, y_p, labels=[0, 1])
            tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

            group_metrics[str(group)] = {
                "size": int(mask.sum()),
                "accuracy": round(accuracy_score(y_t, y_p), 4),
                "fpr": round(fp / (fp + tn) if (fp + tn) > 0 else 0, 4),
                "fnr": round(fn / (fn + tp) if (fn + tp) > 0 else 0, 4),
                "positive_rate": round((tp + fp) / len(y_t) if len(y_t) > 0 else 0, 4),
            }

        # Métriques globales d'équité
        rates = [m["positive_rate"] for m in group_metrics.values() if m["positive_rate"] > 0]
        dp_ratio = min(rates) / max(rates) if rates and max(rates) > 0 else 0

        fprs = [m["fpr"] for m in group_metrics.values() if m["fpr"] > 0]
        eo_fpr = min(fprs) / max(fprs) if fprs and max(fprs) > 0 else 0

        return {
            "group_metrics": group_metrics,
            "demographic_parity": round(dp_ratio, 4),
            "equalized_odds_fpr": round(eo_fpr, 4),
        }
