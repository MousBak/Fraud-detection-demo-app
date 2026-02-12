# ─────────────────────────────────────────────────────────────
# Routes — API Prédictions
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PredictionRequest(BaseModel):
    """Corps de requête pour une prédiction."""
    features: dict[str, float | int | str]
    model_type: str = "xgboost"


class BatchPredictionRequest(BaseModel):
    """Corps de requête pour des prédictions en lot."""
    data: list[dict[str, float | int | str]]
    model_type: str = "xgboost"


@router.post("/predict")
async def predict_single(request: PredictionRequest):
    """Prédit la probabilité de fraude pour une transaction."""
    try:
        import pandas as pd
        from app.models.ml_models import FraudDetectionModel

        model = FraudDetectionModel(request.model_type)
        model.load()

        df = pd.DataFrame([request.features])
        proba = model.predict_proba(df)
        pred = model.predict(df)

        return {
            "prediction": int(pred[0]),
            "fraud_probability": round(float(proba[0]), 4),
            "model_type": request.model_type,
            "risk_level": (
                "critical" if proba[0] > 0.85 else
                "high" if proba[0] > 0.65 else
                "medium" if proba[0] > 0.4 else "low"
            ),
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Modèle '{request.model_type}' non trouvé. Entraînez-le d'abord."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/batch")
async def predict_batch(request: BatchPredictionRequest):
    """Prédit la probabilité de fraude pour un lot de transactions."""
    try:
        import pandas as pd
        from app.models.ml_models import FraudDetectionModel

        model = FraudDetectionModel(request.model_type)
        model.load()

        df = pd.DataFrame(request.data)
        probas = model.predict_proba(df)
        preds = model.predict(df)

        results = [
            {
                "index": i,
                "prediction": int(preds[i]),
                "fraud_probability": round(float(probas[i]), 4),
            }
            for i in range(len(preds))
        ]

        return {
            "model_type": request.model_type,
            "total": len(results),
            "fraud_detected": int(sum(preds)),
            "results": results,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Modèle non trouvé.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
