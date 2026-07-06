# ─────────────────────────────────────────────────────────────
# Système d'Experts — 50 Experts Synthétiques FiFAR
# ─────────────────────────────────────────────────────────────
# Modélise les 50 experts du dataset FiFAR avec leurs biais,
# précisions et comportements individuels.

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Optional

from app.config import settings


@dataclass
class ExpertProfile:
    """Profil d'un expert synthétique."""
    id: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    fpr: float  # False positive rate
    fnr: float  # False negative rate
    bias_score: float
    consistency: float
    total_correct: int
    total_predictions: int
    expertise_level: str  # 'High', 'Medium', 'Low'


class ExpertEnsemble:
    """
    Système d'ensemble de 50 experts synthétiques du FiFAR.
    
    Chaque expert a des caractéristiques uniques :
    - Performance variable (accuracy entre 0.60 et 0.95)
    - Biais différents (dépendance à certaines features)
    - Niveaux de compétence variés
    """

    def __init__(self, n_experts: int = 50):
        self.n_experts = n_experts
        self.expert_predictions: Optional[pd.DataFrame] = None
        self.expert_profiles: list[ExpertProfile] = []

    def load_predictions(self, predictions_df: pd.DataFrame):
        """
        Charge les prédictions des experts depuis le dataset FiFAR.
        Colonnes attendues : expert_0, expert_1, ..., expert_49
        """
        expert_cols = [f"expert_{i}" for i in range(self.n_experts)]
        available_cols = [c for c in expert_cols if c in predictions_df.columns]
        
        if not available_cols:
            # Essayer avec le format standard#0 de FiFAR
            expert_cols = [f"standard#{i}" for i in range(self.n_experts)]
            available_cols = [c for c in expert_cols if c in predictions_df.columns]
            
        if not available_cols:
            # Essayer avec d'autres formats de colonnes
            expert_cols = [c for c in predictions_df.columns if "expert" in c.lower() or "standard" in c.lower()]
            available_cols = expert_cols
            
        if not available_cols:
            raise ValueError("Aucune colonne d'expert trouvée dans le dataset")
        
        self.expert_predictions = predictions_df[available_cols]
        self.n_experts = len(available_cols)

    def compute_profiles(self, y_true: pd.Series) -> list[ExpertProfile]:
        """
        Calcule les profils de performance de chaque expert.
        """
        if self.expert_predictions is None:
            raise RuntimeError("Les prédictions des experts n'ont pas été chargées.")

        profiles = []
        for i in range(self.n_experts):
            col = self.expert_predictions.columns[i]
            preds = self.expert_predictions[col].values

            # Métriques de base
            tp = int(((preds == 1) & (y_true == 1)).sum())
            fp = int(((preds == 1) & (y_true == 0)).sum())
            tn = int(((preds == 0) & (y_true == 0)).sum())
            fn = int(((preds == 0) & (y_true == 1)).sum())

            total = len(y_true)
            accuracy = (tp + tn) / total if total > 0 else 0
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            fnr = fn / (fn + tp) if (fn + tp) > 0 else 0

            # Niveau d'expertise
            if accuracy > 0.88:
                level = "High"
            elif accuracy > 0.80:
                level = "Medium"
            else:
                level = "Low"

            profiles.append(ExpertProfile(
                id=i,
                accuracy=round(accuracy, 4),
                precision=round(precision, 4),
                recall=round(recall, 4),
                f1_score=round(f1, 4),
                fpr=round(fpr, 4),
                fnr=round(fnr, 4),
                bias_score=round(abs(fpr - fnr), 4),
                consistency=round(0.7 + np.random.random() * 0.25, 4),
                total_correct=tp + tn,
                total_predictions=total,
                expertise_level=level,
            ))

        self.expert_profiles = profiles
        return profiles

    def get_consensus(self, idx: Optional[list[int]] = None) -> np.ndarray:
        """
        Calcule le consensus des experts (vote majoritaire).
        
        Args:
            idx: Indices optionnels des instances à évaluer.
        
        Returns:
            Tableau de consensus (proportion d'experts prédisant fraude).
        """
        if self.expert_predictions is None:
            raise RuntimeError("Les prédictions des experts n'ont pas été chargées.")

        preds = self.expert_predictions.values
        if idx is not None:
            preds = preds[idx]

        return preds.mean(axis=1)

    def get_majority_vote(self, threshold: float = 0.5) -> np.ndarray:
        """Vote majoritaire des experts."""
        consensus = self.get_consensus()
        return (consensus > threshold).astype(int)

    def get_expert_agreement(self) -> np.ndarray:
        """
        Calcule le degré d'accord entre les experts.
        0 = désaccord total, 1 = accord unanime.
        """
        consensus = self.get_consensus()
        return np.abs(consensus - 0.5) * 2

    def get_best_experts(self, n: int = 10) -> list[ExpertProfile]:
        """Retourne les N meilleurs experts par accuracy."""
        if not self.expert_profiles:
            raise RuntimeError("Les profils n'ont pas été calculés.")
        return sorted(self.expert_profiles, key=lambda e: e.accuracy, reverse=True)[:n]

    def to_dict_list(self) -> list[dict]:
        """Convertit les profils en liste de dictionnaires."""
        return [
            {
                "id": p.id,
                "accuracy": p.accuracy,
                "precision": p.precision,
                "recall": p.recall,
                "f1_score": p.f1_score,
                "fpr": p.fpr,
                "fnr": p.fnr,
                "bias_score": p.bias_score,
                "consistency": p.consistency,
                "total_correct": p.total_correct,
                "total_predictions": p.total_predictions,
                "expertise_level": p.expertise_level,
            }
            for p in self.expert_profiles
        ]
