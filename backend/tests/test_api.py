from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dashboard_endpoint_after_init():
    client.post("/api/init")
    response = client.get("/api/dashboard")
    data = response.json()

    assert response.status_code == 200
    assert data["job_count"] >= 2
    assert data["graph_metrics"]["node_count"] > 0


def test_match_endpoint():
    client.post("/api/init")
    response = client.post(
        "/api/match",
        json={
            "job_id": "ai_agent_engineer",
            "resume_text": "熟悉 Python、FastAPI、RAG、Prompt Engineering、向量数据库、工具调用和 API 集成。",
        },
    )
    data = response.json()

    assert response.status_code == 200
    assert data["score"] >= 70
    assert "RAG" in data["covered_required"]
