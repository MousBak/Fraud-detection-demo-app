# ─────────────────────────────────────────────────────────────
# Routes — API Données
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Query, HTTPException
from app.services.data_loader import data_loader

router = APIRouter()


@router.get("/stats")
async def get_dataset_stats():
    """Retourne les statistiques du dataset."""
    try:
        return data_loader.get_dataset_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sample")
async def get_data_sample(n: int = Query(100, ge=1, le=5000)):
    """Retourne un échantillon du dataset."""
    try:
        return data_loader.get_sample(n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/columns")
async def get_columns():
    """Retourne la liste des colonnes du dataset."""
    df = data_loader.dataset
    return {
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "shape": list(df.shape),
    }


@router.get("/distribution/{column}")
async def get_column_distribution(column: str, bins: int = Query(20, ge=5, le=100)):
    """Retourne la distribution d'une colonne numérique."""
    df = data_loader.dataset
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Colonne '{column}' non trouvée")

    import numpy as np

    if df[column].dtype in [np.float64, np.int64, float, int]:
        hist, edges = np.histogram(df[column].dropna(), bins=bins)
        return {
            "column": column,
            "type": "numeric",
            "histogram": {
                "counts": hist.tolist(),
                "edges": edges.tolist(),
            },
            "stats": {
                "mean": round(float(df[column].mean()), 4),
                "std": round(float(df[column].std()), 4),
                "min": round(float(df[column].min()), 4),
                "max": round(float(df[column].max()), 4),
            },
        }
    else:
        counts = df[column].value_counts().to_dict()
        return {
            "column": column,
            "type": "categorical",
            "counts": counts,
        }
