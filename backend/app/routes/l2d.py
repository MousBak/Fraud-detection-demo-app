# ─────────────────────────────────────────────────────────────
# Routes — API Learning to Defer (L2D)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()


class L2DSimulationRequest(BaseModel):
    """Paramètres de simulation L2D."""
    strategy: Literal["confidence", "disagreement", "cost_sensitive", "random"] = "confidence"
    threshold: float = 0.7
    expert_capacity: float = 0.2
    expert_selection: Literal["best", "average", "consensus"] = "consensus"


@router.post("/simulate")
async def simulate_l2d(request: L2DSimulationRequest):
    """Simule une stratégie L2D avec les paramètres donnés."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.models.ml_models import FraudDetectionModel
        from app.models.expert_ensemble import ExpertEnsemble
        from app.models.l2d_system import L2DSystem
        import numpy as np

        # Charger les données
        df = data_loader.dataset
        expert_preds = data_loader.expert_predictions

        fraud_col = None
        for col in ["fraud_bool", "fraud", "is_fraud"]:
            if col in df.columns:
                fraud_col = col
                break

        if not fraud_col:
            raise HTTPException(status_code=400, detail="Colonne de fraude non trouvée")

        # Préparer scores ML
        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)

        if "month" in df.columns:
            test_mask = df["month"] > 5
            df_test = df[test_mask]
            X_test = X[test_mask]
            y_test = y[test_mask]
            expert_preds_test = expert_preds.loc[df_test.index]
        else:
            df_test = df
            X_test = X
            y_test = y
            expert_preds_test = expert_preds

        y_true_test = y_test.values

        try:
            model = FraudDetectionModel("xgboost")
            model.load()
            ml_scores = model.predict_proba(X_test)
            ml_predictions = model.predict(X_test)
        except Exception:
            # Si pas de modèle entraîné, utiliser des scores simulés
            np.random.seed(42)
            ml_scores = np.clip(np.random.beta(2, 5, len(y_true_test)), 0.01, 0.99)
            ml_scores[y_true_test == 1] = np.clip(ml_scores[y_true_test == 1] + 0.4, 0.01, 0.99)
            ml_predictions = (ml_scores > 0.5).astype(int)

        # Préparer experts
        ensemble = ExpertEnsemble()
        ensemble.load_predictions(expert_preds_test)
        expert_consensus = ensemble.get_consensus()

        # Simuler L2D
        l2d = L2DSystem()
        l2d.setup(ml_scores, ml_predictions, expert_consensus, y_true_test)

        result = l2d.simulate(
            strategy=request.strategy,
            threshold=request.threshold,
            expert_capacity=request.expert_capacity,
            expert_selection=request.expert_selection,
        )

        return {
            "strategy": result.strategy,
            "threshold": result.threshold,
            "expert_capacity": result.expert_capacity,
            "ml_decisions": result.ml_decisions,
            "expert_reviews": result.expert_reviews,
            "hybrid_accuracy": result.hybrid_accuracy,
            "ml_only_accuracy": result.ml_only_accuracy,
            "expert_only_accuracy": result.expert_only_accuracy,
            "synergy": result.synergy,
            "cost_ml": result.cost_ml,
            "cost_expert": result.cost_expert,
            "cost_hybrid": result.cost_hybrid,
            "hybrid_recall": result.hybrid_recall,
            "ml_recall": result.ml_recall,
            "expert_recall": result.expert_recall,
            "deferral_details": result.deferral_details,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare")
async def compare_strategies():
    """Compare les 3 stratégies L2D sur le test set."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.models.ml_models import FraudDetectionModel
        from app.models.expert_ensemble import ExpertEnsemble
        from app.models.l2d_system import L2DSystem
        import numpy as np

        df = data_loader.dataset
        expert_preds = data_loader.expert_predictions

        fraud_col = None
        for col in ["fraud_bool", "fraud", "is_fraud"]:
            if col in df.columns:
                fraud_col = col
                break

        if not fraud_col:
            raise HTTPException(status_code=400, detail="Colonne de fraude non trouvée")

        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)

        if "month" in df.columns:
            test_mask = df["month"] > 5
            df_test = df[test_mask]
            X_test = X[test_mask]
            y_test = y[test_mask]
            expert_preds_test = expert_preds.loc[df_test.index]
        else:
            df_test = df
            X_test = X
            y_test = y
            expert_preds_test = expert_preds

        y_true_test = y_test.values

        try:
            model = FraudDetectionModel("xgboost")
            model.load()
            ml_scores = model.predict_proba(X_test)
            ml_predictions = model.predict(X_test)
        except Exception:
            np.random.seed(42)
            ml_scores = np.clip(np.random.beta(2, 5, len(y_true_test)), 0.01, 0.99)
            ml_scores[y_true_test == 1] = np.clip(ml_scores[y_true_test == 1] + 0.4, 0.01, 0.99)
            ml_predictions = (ml_scores > 0.5).astype(int)

        ensemble = ExpertEnsemble()
        ensemble.load_predictions(expert_preds_test)
        expert_consensus = ensemble.get_consensus()

        l2d = L2DSystem()
        l2d.setup(ml_scores, ml_predictions, expert_consensus, y_true_test)

        results = l2d.compare_strategies(
            thresholds=[0.3, 0.5, 0.7, 0.9],
            expert_capacity=0.2,
        )

        return {
            "comparisons": [
                {
                    "strategy": r.strategy,
                    "threshold": r.threshold,
                    "hybrid_accuracy": r.hybrid_accuracy,
                    "ml_only_accuracy": r.ml_only_accuracy,
                    "expert_only_accuracy": r.expert_only_accuracy,
                    "synergy": r.synergy,
                    "expert_reviews": r.expert_reviews,
                    "cost_ml": r.cost_ml,
                    "cost_expert": r.cost_expert,
                    "cost_hybrid": r.cost_hybrid,
                    "hybrid_recall": r.hybrid_recall,
                    "ml_recall": r.ml_recall,
                    "expert_recall": r.expert_recall,
                }
                for r in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
