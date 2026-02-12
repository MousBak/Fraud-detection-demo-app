# ─────────────────────────────────────────────────────────────
# ORM Models — Modèles de Base de Données
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func

from app.database.db import Base


class TrainingRun(Base):
    """Historique des entraînements de modèles."""
    __tablename__ = "training_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    auc_roc = Column(Float)
    auc_pr = Column(Float)
    training_time = Column(String)
    parameters = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PredictionLog(Base):
    """Log des prédictions effectuées."""
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)
    fraud_probability = Column(Float)
    prediction = Column(Integer)
    risk_level = Column(String)
    features = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class L2DSimulation(Base):
    """Historique des simulations L2D."""
    __tablename__ = "l2d_simulations"

    id = Column(Integer, primary_key=True, index=True)
    strategy = Column(String, nullable=False)
    threshold = Column(Float)
    expert_capacity = Column(Float)
    hybrid_accuracy = Column(Float)
    ml_only_accuracy = Column(Float)
    expert_only_accuracy = Column(Float)
    synergy = Column(Float)
    ml_decisions = Column(Integer)
    expert_reviews = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
