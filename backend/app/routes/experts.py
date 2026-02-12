# ─────────────────────────────────────────────────────────────
# Routes — API Experts
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

_expert_ensemble = None


def get_expert_ensemble():
    global _expert_ensemble
    if _expert_ensemble is None:
        from app.models.expert_ensemble import ExpertEnsemble
        from app.services.data_loader import data_loader

        _expert_ensemble = ExpertEnsemble()
        expert_preds = data_loader.expert_predictions
        _expert_ensemble.load_predictions(expert_preds)

        # Calculer les profils
        df = data_loader.dataset
        fraud_col = None
        for col in ["fraud_bool", "fraud", "is_fraud", "label", "target"]:
            if col in df.columns:
                fraud_col = col
                break
        if fraud_col:
            y_true = df[fraud_col]
            _expert_ensemble.compute_profiles(y_true)

    return _expert_ensemble


@router.get("/list")
async def list_experts():
    """Retourne la liste des 50 experts avec leurs profils."""
    try:
        ensemble = get_expert_ensemble()
        return {
            "total_experts": ensemble.n_experts,
            "experts": ensemble.to_dict_list(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{expert_id}")
async def get_expert(expert_id: int):
    """Retourne le profil détaillé d'un expert."""
    ensemble = get_expert_ensemble()
    if expert_id < 0 or expert_id >= ensemble.n_experts:
        raise HTTPException(status_code=404, detail=f"Expert {expert_id} non trouvé")

    profile = ensemble.expert_profiles[expert_id]
    return {
        "id": profile.id,
        "accuracy": profile.accuracy,
        "precision": profile.precision,
        "recall": profile.recall,
        "f1_score": profile.f1_score,
        "fpr": profile.fpr,
        "fnr": profile.fnr,
        "bias_score": profile.bias_score,
        "expertise_level": profile.expertise_level,
    }


@router.get("/ranking/top")
async def get_top_experts(n: int = Query(10, ge=1, le=50)):
    """Retourne les N meilleurs experts."""
    ensemble = get_expert_ensemble()
    top = ensemble.get_best_experts(n)
    return {
        "top_experts": [
            {"id": e.id, "accuracy": e.accuracy, "expertise_level": e.expertise_level}
            for e in top
        ]
    }


@router.get("/analysis/consensus")
async def get_consensus_analysis():
    """Analyse le consensus des experts."""
    import numpy as np

    ensemble = get_expert_ensemble()
    consensus = ensemble.get_consensus()
    agreement = ensemble.get_expert_agreement()

    return {
        "mean_consensus": round(float(np.mean(consensus)), 4),
        "std_consensus": round(float(np.std(consensus)), 4),
        "mean_agreement": round(float(np.mean(agreement)), 4),
        "high_agreement_pct": round(float((agreement > 0.7).mean()), 4),
        "low_agreement_pct": round(float((agreement < 0.3).mean()), 4),
    }
