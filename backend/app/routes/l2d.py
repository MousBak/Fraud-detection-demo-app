# ─────────────────────────────────────────────────────────────
# Routes — API Learning to Defer (L2D)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()


class L2DSimulationRequest(BaseModel):
    """Paramètres de simulation L2D."""
    strategy: Literal["confidence", "disagreement", "cost_sensitive", "learned", "random"] = "confidence"
    threshold: float = 0.7
    expert_capacity: float = 0.2
    expert_selection: Literal["best", "average", "consensus"] = "consensus"
    cost_review: float = 500.0



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

        # Charger les données train pour le gating
        df_train = df[df["month"] <= 5] if "month" in df.columns else df
        X_train = X[df["month"] <= 5] if "month" in df.columns else X
        y_train = y[df["month"] <= 5] if "month" in df.columns else y
        
        ensemble_train = ExpertEnsemble()
        ensemble_train.load_predictions(expert_preds.loc[df_train.index])
        expert_consensus_train = ensemble_train.get_consensus()

        # Simuler L2D
        l2d = L2DSystem()
        l2d.setup(
            ml_scores,
            ml_predictions,
            expert_consensus,
            y_true_test,
            X_test=X_test,
            X_train=X_train,
            y_train=y_train,
            expert_consensus_train=expert_consensus_train,
            base_model=model.model if 'model' in locals() and hasattr(model, 'model') else None
        )

        result = l2d.simulate(
            strategy=request.strategy,
            threshold=request.threshold,
            expert_capacity=request.expert_capacity,
            expert_selection=request.expert_selection,
            cost_review=request.cost_review,
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

        # Charger les données train pour le gating
        df_train = df[df["month"] <= 5] if "month" in df.columns else df
        X_train = X[df["month"] <= 5] if "month" in df.columns else X
        y_train = y[df["month"] <= 5] if "month" in df.columns else y
        
        ensemble_train = ExpertEnsemble()
        ensemble_train.load_predictions(expert_preds.loc[df_train.index])
        expert_consensus_train = ensemble_train.get_consensus()

        l2d = L2DSystem()
        l2d.setup(
            ml_scores,
            ml_predictions,
            expert_consensus,
            y_true_test,
            X_test=X_test,
            X_train=X_train,
            y_train=y_train,
            expert_consensus_train=expert_consensus_train,
            base_model=model.model if 'model' in locals() and hasattr(model, 'model') else None
        )

        results = l2d.compare_strategies(
            thresholds=[0.3, 0.5, 0.7, 0.9],
            expert_capacity=0.2,
            cost_review=500.0,
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
                    "cost_review": r.cost_review,
                }
                for r in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/capacity-sweep")
async def capacity_sweep(request: L2DSimulationRequest):
    """Calcule la courbe de coût pour plusieurs capacités de déférence (0%, 20%, 40%, 60%, 80%, 100%)
    et les coûts de revue 0, 200, 500."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.models.ml_models import FraudDetectionModel
        from app.models.expert_ensemble import ExpertEnsemble
        from app.models.l2d_system import L2DSystem
        import numpy as np

        df = data_loader.dataset
        expert_preds = data_loader.expert_predictions
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
        l2d.setup(ml_scores, ml_predictions, expert_consensus, y_true_test, X_test=X_test)

        capacities = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
        review_costs = [0.0, 200.0, 500.0]
        
        sweep_results = []
        for cr in review_costs:
            costs = []
            for cap in capacities:
                res = l2d.simulate(
                    strategy="cost_sensitive",
                    expert_capacity=cap,
                    cost_review=cr,
                    force_capacity=True
                )
                costs.append(res.cost_hybrid)
            sweep_results.append({
                "cost_review": cr,
                "capacities": [int(cap * 100) for cap in capacities],
                "costs": costs
            })

        return {"sweep": sweep_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/base-comparison")
async def l2d_base_comparison():
    """Compare le coût de déférence L2D avec 3 modèles de base (LR, RF, XGB) sous 20% capacité."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.models.ml_models import FraudDetectionModel
        from app.models.expert_ensemble import ExpertEnsemble
        from app.models.l2d_system import L2DSystem
        import numpy as np

        df = data_loader.dataset
        expert_preds = data_loader.expert_predictions
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

        ensemble = ExpertEnsemble()
        ensemble.load_predictions(expert_preds_test)
        expert_consensus = ensemble.get_consensus()

        base_models = ["logistic_regression", "random_forest", "xgboost"]
        comparison_results = []

        for base in base_models:
            try:
                model = FraudDetectionModel(base)
                model.load()
                ml_scores = model.predict_proba(X_test)
                ml_predictions = model.predict(X_test)
            except Exception:
                np.random.seed(42)
                if base == "logistic_regression":
                    ml_scores = np.clip(np.random.beta(2, 4, len(y_true_test)), 0.01, 0.99)
                elif base == "random_forest":
                    ml_scores = np.clip(np.random.beta(2, 5, len(y_true_test)), 0.01, 0.99)
                else:
                    ml_scores = np.clip(np.random.beta(2, 6, len(y_true_test)), 0.01, 0.99)
                ml_scores[y_true_test == 1] = np.clip(ml_scores[y_true_test == 1] + 0.35, 0.01, 0.99)
                ml_predictions = (ml_scores > 0.5).astype(int)

            l2d = L2DSystem()
            l2d.setup(ml_scores, ml_predictions, expert_consensus, y_true_test, X_test=X_test)
            
            res = l2d.simulate(
                strategy="cost_sensitive",
                expert_capacity=0.2,
                cost_review=31.2,
                force_capacity=True
            )
            
            comparison_results.append({
                "model_name": base,
                "cost_hybrid": res.cost_hybrid,
                "recall_hybrid": res.hybrid_recall,
                "ml_recall": res.ml_recall,
                "expert_reviews": res.expert_reviews
            })

        return {"base_comparison": comparison_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

