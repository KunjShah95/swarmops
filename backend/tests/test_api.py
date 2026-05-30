from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app"] == "Autonomous DevOps Swarm"


def test_start_run_and_fetch_summary():
    response = client.post(
        "/api/runs",
        json={
            "issue": {
                "title": "Fix typo in config",
                "body": "DATABASE_URL spelling is wrong",
                "number": 42,
                "repository": {"owner": "demo", "name": "swarm-repo"},
            }
        },
    )
    assert response.status_code == 202
    run = response.json()["run"]
    assert run["status"] in {"queued", "running", "succeeded"}
    assert run["issue"]["title"] == "Fix typo in config"

    summary = client.get(f"/api/runs/{run['run_id']}")
    assert summary.status_code == 200
    assert summary.json()["run"]["run_id"] == run["run_id"]
