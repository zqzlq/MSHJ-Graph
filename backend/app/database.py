from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "talent_graph.db"


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _load_json(filename: str) -> dict:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as file:
        return json.load(file)


def init_db(force: bool = False) -> None:
    conn = get_connection()
    cur = conn.cursor()
    if force:
        cur.executescript(
            """
            DROP TABLE IF EXISTS jobs;
            DROP TABLE IF EXISTS jd_records;
            DROP TABLE IF EXISTS resumes;
            """
        )

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            level TEXT NOT NULL,
            definition TEXT NOT NULL,
            core_responsibilities TEXT NOT NULL,
            required_skills TEXT NOT NULL,
            bonus_skills TEXT NOT NULL,
            industry_scenarios TEXT NOT NULL,
            evidence_sources TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS jd_records (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            batch TEXT NOT NULL,
            source TEXT NOT NULL,
            date TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_job_id TEXT NOT NULL,
            text TEXT NOT NULL
        );
        """
    )

    count = cur.execute("SELECT COUNT(*) AS count FROM jobs").fetchone()["count"]
    if count == 0:
        jobs_data = _load_json("jobs.json")
        for job in jobs_data["jobs"]:
            cur.execute(
                """
                INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job["id"],
                    job["title"],
                    job["category"],
                    job["level"],
                    job["definition"],
                    _json(job["core_responsibilities"]),
                    _json(job["required_skills"]),
                    _json(job["bonus_skills"]),
                    _json(job["industry_scenarios"]),
                    _json(job["evidence_sources"]),
                ),
            )
        for record in jobs_data["jd_records"]:
            cur.execute(
                "INSERT INTO jd_records VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    record["id"],
                    record["job_id"],
                    record["batch"],
                    record["source"],
                    record["date"],
                    record["title"],
                    record["content"],
                ),
            )

        resumes_data = _load_json("resumes.json")
        for resume in resumes_data["resumes"]:
            cur.execute(
                "INSERT INTO resumes VALUES (?, ?, ?, ?)",
                (resume["id"], resume["name"], resume["target_job_id"], resume["text"]),
            )

    conn.commit()
    conn.close()


def decode_row(row: sqlite3.Row) -> dict:
    item = dict(row)
    for key in ["core_responsibilities", "required_skills", "bonus_skills", "industry_scenarios", "evidence_sources"]:
        if key in item:
            item[key] = json.loads(item[key])
    return item


def fetch_all(sql: str, params: tuple = ()) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [decode_row(row) for row in rows]


def fetch_one(sql: str, params: tuple = ()) -> dict | None:
    conn = get_connection()
    row = conn.execute(sql, params).fetchone()
    conn.close()
    return decode_row(row) if row else None
