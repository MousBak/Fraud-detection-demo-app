# ─────────────────────────────────────────────────────────────
# Routes — API Modèles ML
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Singleton trainer (lazy init)
_trainer = None


def get_trainer():
    global _trainer
    if _trainer is None:
        from app.models.trainer import ModelTrainer
        _trainer = ModelTrainer()
    return _trainer


class TrainRequest(BaseModel):
    """Configuration d'entraînement."""
    model_types: list[str] = ["logistic_regression", "random_forest", "xgboost"]
    test_size: float = 0.2
    use_feature_engineering: bool = True


@router.post("/train")
async def train_models(request: TrainRequest):
    """Entraîne les modèles spécifiés sur le dataset."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.services.feature_engineering import FeatureEngineer

        trainer = get_trainer()

        # Charger et préparer les données
        df = data_loader.dataset

        if request.use_feature_engineering:
            fe = FeatureEngineer()
            df = fe.add_features(df)

        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)

        # Préparer les données train/test
        trainer.prepare_data(X, y, test_size=request.test_size)

        # Entraîner les modèles
        results = {}
        for model_type in request.model_types:
            result = trainer.train_single_model(model_type)
            results[model_type] = {
                "accuracy": result.accuracy,
                "precision": result.precision,
                "recall": result.recall,
                "f1": result.f1,
                "auc_roc": result.auc_roc,
                "auc_pr": result.auc_pr,
                "training_time": result.training_time,
            }

        return {
            "status": "success",
            "models_trained": list(results.keys()),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_models():
    """Liste les modèles entraînés disponibles."""
    from app.config import settings
    import os

    models = []
    models_dir = settings.MODELS_DIR
    if models_dir.exists():
        for f in models_dir.glob("*.joblib"):
            models.append({
                "name": f.stem,
                "file": f.name,
                "size_mb": round(os.path.getsize(f) / 1e6, 2),
            })

    return {"models": models}


@router.get("/metrics/{model_type}")
async def get_model_metrics(model_type: str):
    """Retourne les métriques d'un modèle entraîné."""
    trainer = get_trainer()
    if model_type not in trainer.results:
        raise HTTPException(status_code=404, detail=f"Modèle '{model_type}' non trouvé dans les résultats.")

    result = trainer.results[model_type]
    return {
        "name": result.name,
        "accuracy": result.accuracy,
        "precision": result.precision,
        "recall": result.recall,
        "f1": result.f1,
        "auc_roc": result.auc_roc,
        "auc_pr": result.auc_pr,
        "confusion_matrix": result.confusion_matrix,
        "roc_curve": result.roc_curve,
        "pr_curve": result.pr_curve,
        "feature_importance": result.feature_importance,
        "training_time": result.training_time,
    }


@router.get("/compare")
async def compare_models():
    """Compare tous les modèles entraînés."""
    trainer = get_trainer()
    if not trainer.results:
        raise HTTPException(status_code=404, detail="Aucun modèle entraîné.")
    return {"comparison": trainer.get_comparison()}
