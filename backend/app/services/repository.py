from __future__ import annotations

from app.database import fetch_all, fetch_one


def list_jobs() -> list[dict]:
    return fetch_all("SELECT * FROM jobs ORDER BY category, title")


def get_job(job_id: str) -> dict | None:
    return fetch_one("SELECT * FROM jobs WHERE id = ?", (job_id,))


def list_jd_records(job_id: str | None = None) -> list[dict]:
    if job_id:
        return fetch_all("SELECT * FROM jd_records WHERE job_id = ? ORDER BY date", (job_id,))
    return fetch_all("SELECT * FROM jd_records ORDER BY date")


def list_resumes() -> list[dict]:
    return fetch_all("SELECT * FROM resumes ORDER BY id")
