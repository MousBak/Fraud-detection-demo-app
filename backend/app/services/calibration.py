# ─────────────────────────────────────────────────────────────
# Calibration Service — Calibration des scores du modèle ML
# ─────────────────────────────────────────────────────────────

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss

def get_calibration_data(X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series, base_model) -> dict:
    """
    Calcule le Brier Score avant et après calibration isotonique,
    ainsi que les courbes de fiabilité et la zone d'incertitude [0.3, 0.7].
    """
    # 1. Split train (mois 3-5) en 70% fit / 30% calibration
    X_fit, X_calib, y_fit, y_calib = train_test_split(
        X_train, y_train, test_size=0.3, random_state=42, stratify=y_train
    )
    
    # 2. Entraîner le modèle de base sur les 70%
    scale_pos_weight = float((y_fit == 0).sum() / (y_fit == 1).sum()) if (y_fit == 1).sum() > 0 else 20.0
    xgb_fit = XGBClassifier(
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
    xgb_fit.fit(X_fit, y_fit)
    
    # 3. Évaluer le modèle non calibré (qui est le modèle entraîné sur le train complet)
    y_prob_uncalib = base_model.predict_proba(X_test)
    brier_uncalib = brier_score_loss(y_test, y_prob_uncalib)
    
    # 4. Entraîner la calibration isotonique sur les 30%
    calib_model = CalibratedClassifierCV(estimator=xgb_fit, cv="prefit", method="isotonic")
    calib_model.fit(X_calib, y_calib)
    
    y_prob_calib = calib_model.predict_proba(X_test)[:, 1]
    brier_calib = brier_score_loss(y_test, y_prob_calib)
    
    # 5. Courbes de fiabilité (calibration curves)
    true_prob_uncal, pred_prob_uncal = calibration_curve(y_test, y_prob_uncalib, n_bins=10, strategy="quantile")
    true_prob_cal, pred_prob_cal = calibration_curve(y_test, y_prob_calib, n_bins=10, strategy="quantile")
    
    # 6. Nombre de cas dans la zone d'incertitude [0.3, 0.7]
    unc_uncalib = int(((y_prob_uncalib >= 0.3) & (y_prob_uncalib <= 0.7)).sum())
    unc_calib = int(((y_prob_calib >= 0.3) & (y_prob_calib <= 0.7)).sum())
    
    return {
        "uncalibrated": {
            "brier": round(float(brier_uncalib), 4),
            "uncertainty_count": unc_uncalib,
            "true_probabilities": true_prob_uncal.tolist(),
            "pred_probabilities": pred_prob_uncal.tolist(),
        },
        "calibrated": {
            "brier": round(float(brier_calib), 4),
            "uncertainty_count": unc_calib,
            "true_probabilities": true_prob_cal.tolist(),
            "pred_probabilities": pred_prob_cal.tolist(),
        }
    }
