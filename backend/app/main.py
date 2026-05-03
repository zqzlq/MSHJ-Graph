from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.schemas import MatchRequest, ResumeParseRequest
from app.config import LLM_ENABLED, LLM_MODEL
from app.services.analysis import analyze_job_updates, discover_emerging_jobs, match_resume_to_job
from app.services.clustering import run_clustering
from app.services.evaluation import run_full_evaluation
from app.services.graph import build_capability_graph, find_path
from app.services.parser import parse_resume, parse_pdf_resume
from app.services.repository import get_job, list_jd_records, list_jobs, list_resumes


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="岗位能力图谱 MVP", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "llm_enabled": LLM_ENABLED, "llm_model": LLM_MODEL if LLM_ENABLED else None}


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


@app.get("/api/evaluation")
def evaluation() -> dict:
    return run_full_evaluation()


@app.get("/api/clustering")
def clustering(n_clusters: int = 3) -> dict:
    return run_clustering(n_clusters)


@app.post("/api/upload/resume")
async def upload_resume(file: UploadFile = File(...)) -> dict:
    content = await file.read()
    filename = file.filename or ""
    if filename.lower().endswith(".pdf"):
        return parse_pdf_resume(content)
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("gbk", errors="ignore")
    return parse_resume(text)


@app.get("/api/graph/path")
def graph_path(source: str, target: str) -> dict:
    return find_path(source, target)
