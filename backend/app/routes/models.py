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
        # Essayer de charger les modèles pré-entraînés
        try:
            from app.models.ml_models import FraudDetectionModel
            from app.services.data_loader import data_loader
            from app.services.preprocessor import Preprocessor
            df = data_loader.dataset
            preprocessor = Preprocessor()
            X, y = preprocessor.fit_transform(df)
            trainer.prepare_data(X, y)
            for m_type in ["logistic_regression", "random_forest", "xgboost"]:
                if m_type not in trainer.results:
                    m = FraudDetectionModel(m_type)
                    m.load()
                    trainer.models[m_type] = m
                    trainer.results[m_type] = m.evaluate(trainer.X_test, trainer.y_test)
        except Exception:
            raise HTTPException(status_code=404, detail="Aucun modèle entraîné en mémoire et échec du chargement.")
    return {"comparison": trainer.get_comparison()}


@router.get("/calibration")
async def get_calibration():
    """Calcule le Brier score et la recalibration isotonique pour XGBoost."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.models.ml_models import FraudDetectionModel
        from app.services.calibration import get_calibration_data
        
        trainer = get_trainer()
        if "xgboost" in trainer.models:
            model = trainer.models["xgboost"]
        else:
            model = FraudDetectionModel("xgboost")
            model.load()
            trainer.models["xgboost"] = model
            
        df = data_loader.dataset
        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)
        
        if "month" in df.columns:
            train_mask = df["month"] <= 5
            test_mask = df["month"] > 5
            
            X_train = X[train_mask]
            y_train = y[train_mask]
            X_test = X[test_mask]
            y_test = y[test_mask]
        else:
            from sklearn.model_selection import train_test_split
            from app.config import settings
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=settings.RANDOM_STATE, stratify=y
            )
            
        metrics = get_calibration_data(X_train, y_train, X_test, y_test, model)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/precision-at-k/{model_type}")
async def get_precision_recall_at_k(model_type: str):
    """Calcule Precision@k et Recall@k pour un modèle."""
    try:
        from app.models.ml_models import FraudDetectionModel
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from app.services.metrics_calculator import MetricsCalculator
        
        trainer = get_trainer()
        if model_type in trainer.models:
            model = trainer.models[model_type]
        else:
            model = FraudDetectionModel(model_type)
            model.load()
            trainer.models[model_type] = model
            
        df = data_loader.dataset
        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)
        
        if "month" in df.columns:
            test_mask = df["month"] > 5
            X_test = X[test_mask]
            y_test = y[test_mask]
        else:
            X_test = X
            y_test = y
            
        y_proba = model.predict_proba(X_test)
        y_true = y_test.values
        
        metrics = MetricsCalculator.compute_precision_recall_at_k(y_true, y_proba)
        return {"model_type": model_type, "precision_recall_at_k": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rolling-validation")
async def get_rolling_validation():
    """Calcule la validation par fenêtre glissante pour XGBoost."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor
        from xgboost import XGBClassifier
        from sklearn.metrics import recall_score, roc_auc_score, average_precision_score
        
        df = data_loader.dataset
        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)
        
        results = []
        folds = [
            {"train": [3, 4], "test": [5], "name": "Mois 3-4 → Mois 5"},
            {"train": [3, 4, 5], "test": [6], "name": "Mois 3-5 → Mois 6"},
            {"train": [3, 4, 5, 6], "test": [7], "name": "Mois 3-6 → Mois 7"}
        ]
        
        for fold in folds:
            train_mask = df["month"].isin(fold["train"])
            test_mask = df["month"].isin(fold["test"])
            
            X_tr, y_tr = X[train_mask], y[train_mask]
            X_te, y_te = X[test_mask], y[test_mask]
            
            scale_pos_weight = float((y_tr == 0).sum() / (y_tr == 1).sum()) if (y_tr == 1).sum() > 0 else 20.0
            
            xgb = XGBClassifier(
                n_estimators=300,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                scale_pos_weight=scale_pos_weight,
                eval_metric="aucpr",
                use_label_encoder=False,
            )
            xgb.fit(X_tr, y_tr)
            
            y_prob = xgb.predict_proba(X_te)[:, 1]
            y_pred = (y_prob >= 0.5).astype(int)
            
            recall = recall_score(y_te, y_pred, zero_division=0)
            auc_roc = roc_auc_score(y_te, y_prob)
            auc_pr = average_precision_score(y_te, y_prob)
            
            results.append({
                "fold": fold["name"],
                "recall": round(float(recall), 4),
                "auc_roc": round(float(auc_roc), 4),
                "auc_pr": round(float(auc_pr), 4),
                "train_size": len(X_tr),
                "test_size": len(X_te),
            })
            
        return {"rolling_validation": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
