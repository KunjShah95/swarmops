"""Tests for the production SwarmOps API (main.py — used by Docker and uvicorn)."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "SwarmOps" in response.json()["message"]


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "swarmops-backend"
    assert "llm" in payload


def test_list_runs():
    response = client.get("/api/runs")
    assert response.status_code == 200
    payload = response.json()
    assert "runs" in payload
    assert isinstance(payload["runs"], list)
