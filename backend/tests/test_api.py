# ─────────────────────────────────────────────────────────────
# Tests — Backend API
# ─────────────────────────────────────────────────────────────

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Teste le endpoint de santé."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_root():
    """Teste le endpoint racine."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_get_dataset_stats():
    """Teste le endpoint de statistiques du dataset."""
    response = client.get("/api/v1/data/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_rows" in data


def test_get_data_sample():
    """Teste le endpoint d'échantillonnage."""
    response = client.get("/api/v1/data/sample?n=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 10


def test_get_columns():
    """Teste le endpoint des colonnes."""
    response = client.get("/api/v1/data/columns")
    assert response.status_code == 200
    data = response.json()
    assert "columns" in data


def test_list_experts():
    """Teste le endpoint de listing des experts."""
    response = client.get("/api/v1/experts/list")
    assert response.status_code == 200
    data = response.json()
    assert "total_experts" in data
    assert data["total_experts"] == 50


def test_l2d_simulate():
    """Teste la simulation L2D."""
    response = client.post("/api/v1/l2d/simulate", json={
        "strategy": "confidence",
        "threshold": 0.7,
        "expert_capacity": 0.2,
        "expert_selection": "consensus",
    })
    assert response.status_code == 200
    data = response.json()
    assert "hybrid_accuracy" in data
    assert "ml_only_accuracy" in data


def test_analytics_overview():
    """Teste le endpoint analytics."""
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "dataset" in data
