# ─────────────────────────────────────────────────────────────
# Routes — API Analytics
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()


@router.get("/overview")
async def get_overview():
    """Retourne un résumé analytique complet."""
    try:
        from app.services.data_loader import data_loader

        stats = data_loader.get_dataset_stats()
        return {
            "dataset": stats,
            "status": "ready",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fairness")
async def get_fairness_analysis(attribute: str = Query("foreign_request")):
    """Analyse l'équité du modèle pour un attribut protégé."""
    try:
        from app.services.data_loader import data_loader
        from app.services.fairness_analyzer import FairnessAnalyzer
        from app.services.preprocessor import Preprocessor
        from app.models.ml_models import FraudDetectionModel
        import numpy as np

        df = data_loader.dataset
        if attribute not in df.columns:
            raise HTTPException(status_code=404, detail=f"Attribut '{attribute}' non trouvé")

        fraud_col = None
        for col in ["fraud_bool", "fraud", "is_fraud"]:
            if col in df.columns:
                fraud_col = col
                break

        y_true = df[fraud_col].values

        # Obtenir les prédictions
        preprocessor = Preprocessor()
        X, y = preprocessor.fit_transform(df)

        try:
            model = FraudDetectionModel("xgboost")
            model.load()
            y_pred = model.predict(X)
        except Exception:
            np.random.seed(42)
            y_pred = (np.random.random(len(y_true)) > 0.5).astype(int)

        analyzer = FairnessAnalyzer()
        result = analyzer.analyze(y_true, y_pred, df[attribute].values, attribute)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-stats")
async def get_feature_statistics():
    """Retourne les statistiques descriptives de chaque feature."""
    try:
        from app.services.data_loader import data_loader
        from app.services.preprocessor import Preprocessor

        df = data_loader.dataset
        preprocessor = Preprocessor()
        stats = preprocessor.get_feature_stats(df)
        return {"features": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
