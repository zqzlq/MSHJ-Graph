from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.schemas import MatchRequest, ResumeParseRequest
from app.services.analysis import analyze_job_updates, discover_emerging_jobs, match_resume_to_job
from app.services.graph import build_capability_graph
from app.services.parser import parse_resume
from app.services.repository import get_job, list_jd_records, list_jobs, list_resumes


app = FastAPI(title="岗位能力图谱 MVP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/init")
def initialize() -> dict:
    init_db(force=True)
    return {"status": "initialized"}


@app.get("/api/dashboard")
def dashboard() -> dict:
    jobs = list_jobs()
    records = list_jd_records()
    graph = build_capability_graph()
    return {
        "job_count": len(jobs),
        "jd_count": len(records),
        "resume_count": len(list_resumes()),
        "graph_metrics": graph["metrics"],
        "jobs": jobs,
    }


@app.get("/api/jobs")
def jobs() -> list[dict]:
    return list_jobs()


@app.get("/api/jobs/{job_id}")
def job_detail(job_id: str) -> dict:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return {**job, "jd_records": list_jd_records(job_id)}


@app.get("/api/graph")
def graph() -> dict:
    return build_capability_graph()


@app.get("/api/discover")
def discover() -> list[dict]:
    return discover_emerging_jobs()


@app.get("/api/updates/{job_id}")
def updates(job_id: str) -> dict:
    try:
        return analyze_job_updates(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/resumes")
def resumes() -> list[dict]:
    return list_resumes()


@app.post("/api/parse/resume")
def parse_resume_api(payload: ResumeParseRequest) -> dict:
    return parse_resume(payload.text)


@app.post("/api/match")
def match(payload: MatchRequest) -> dict:
    try:
        return match_resume_to_job(payload.job_id, payload.resume_text)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
