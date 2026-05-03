from app.database import init_db
from app.services.analysis import analyze_job_updates, discover_emerging_jobs, match_resume_to_job
from app.services.graph import build_capability_graph


def setup_module():
    init_db(force=True)


def test_discover_emerging_jobs_finds_ai_agent():
    discoveries = discover_emerging_jobs()

    assert discoveries
    assert discoveries[0]["job_id"] == "ai_agent_engineer"
    assert discoveries[0]["confidence"] >= 0.8


def test_analyze_existing_job_updates():
    update = analyze_job_updates("java_backend_engineer")

    assert "Kubernetes" in update["added"]
    assert "可观测性" in update["added"]
    assert update["baseline_batch"] == "2023Q4"
    assert update["current_batch"] == "2026Q2"


def test_match_resume_to_job_scores_required_skills():
    result = match_resume_to_job(
        "java_backend_engineer",
        "熟悉 Java、Spring Boot、MySQL、Redis、微服务、消息队列、Docker 和 REST API。",
    )

    assert result["score"] >= 80
    assert not result["missing_required"]


def test_graph_contains_jobs_and_skills():
    graph = build_capability_graph()
    node_ids = {node["id"] for node in graph["nodes"]}

    assert "job:ai_agent_engineer" in node_ids
    assert "skill:RAG" in node_ids
    assert graph["metrics"]["edge_count"] > 0
