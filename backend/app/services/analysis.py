from __future__ import annotations

from collections import Counter

from app.services.parser import extract_skills, parse_jd, parse_resume
from app.services.repository import get_job, list_jd_records, list_jobs
from app.services.taxonomy import LEARNING_PATHS


def discover_emerging_jobs() -> list[dict]:
    records = list_jd_records()
    emerging_signals = ["Agent", "RAG", "工具调用", "多智能体", "大模型", "向量数据库", "模型评测"]
    candidates: list[dict] = []

    for job in list_jobs():
        job_records = [record for record in records if record["job_id"] == job["id"]]
        combined = "。".join(record["content"] for record in job_records)
        signal_count = sum(1 for signal in emerging_signals if signal.lower() in combined.lower())
        if job["category"] == "emerging" or signal_count >= 3:
            parsed = parse_jd(combined, job["title"])
            candidates.append(
                {
                    "job_id": job["id"],
                    "title": job["title"],
                    "definition": job["definition"],
                    "evidence_sources": job["evidence_sources"],
                    "signal_count": signal_count,
                    "confidence": min(0.98, 0.68 + signal_count * 0.05 + len(parsed["skills"]) * 0.02),
                    "required_skills": job["required_skills"],
                    "bonus_skills": job["bonus_skills"],
                    "industry_scenarios": job["industry_scenarios"],
                }
            )

    return sorted(candidates, key=lambda item: item["confidence"], reverse=True)


def analyze_job_updates(job_id: str) -> dict:
    job = get_job(job_id)
    if not job:
        raise ValueError("job not found")

    records = list_jd_records(job_id)
    batches = sorted({record["batch"] for record in records})
    if len(batches) < 2:
        skills = [skill["name"] for record in records for skill in extract_skills(record["content"])]
        return {
            "job_id": job_id,
            "title": job["title"],
            "baseline_batch": batches[0] if batches else None,
            "current_batch": batches[-1] if batches else None,
            "added": sorted(set(skills)),
            "removed": [],
            "strengthened": [],
            "summary": "该岗位以新兴岗位样例呈现，当前阶段主要用于定义生成和能力固化。",
            "sources": [record["source"] for record in records],
        }

    baseline = [record for record in records if record["batch"] == batches[0]]
    current = [record for record in records if record["batch"] == batches[-1]]
    baseline_skills = Counter(skill["name"] for record in baseline for skill in extract_skills(record["content"]))
    current_skills = Counter(skill["name"] for record in current for skill in extract_skills(record["content"]))

    added = sorted(set(current_skills) - set(baseline_skills))
    removed = sorted(set(baseline_skills) - set(current_skills))
    strengthened = sorted(
        skill for skill in set(current_skills) & set(baseline_skills) if current_skills[skill] > baseline_skills[skill]
    )

    return {
        "job_id": job_id,
        "title": job["title"],
        "baseline_batch": batches[0],
        "current_batch": batches[-1],
        "added": added,
        "removed": removed,
        "strengthened": strengthened,
        "summary": f"{job['title']} 从 {batches[0]} 到 {batches[-1]} 的能力要求更加偏向云原生、工程质量和 AI 服务集成。",
        "sources": [record["source"] for record in records],
    }


def match_resume_to_job(job_id: str, resume_text: str) -> dict:
    job = get_job(job_id)
    if not job:
        raise ValueError("job not found")

    parsed_resume = parse_resume(resume_text)
    resume_skills = {skill["name"]: skill for skill in parsed_resume["skills"]}
    required = set(job["required_skills"])
    bonus = set(job["bonus_skills"])

    covered_required = sorted(required & set(resume_skills))
    missing_required = sorted(required - set(resume_skills))
    covered_bonus = sorted(bonus & set(resume_skills))
    score = round((len(covered_required) / max(len(required), 1)) * 80 + min(len(covered_bonus) * 4, 20), 1)

    learning_path = [
        {
            "skill": skill,
            "steps": LEARNING_PATHS.get(skill, [f"完成 {skill} 基础学习", f"做一个与目标岗位相关的 {skill} 小项目"]),
        }
        for skill in missing_required[:5]
    ]

    return {
        "job_id": job_id,
        "job_title": job["title"],
        "score": min(score, 100),
        "covered_required": covered_required,
        "missing_required": missing_required,
        "covered_bonus": covered_bonus,
        "resume_skills": list(resume_skills),
        "learning_path": learning_path,
        "diagnosis": "匹配度较高，建议补齐关键工程化能力。" if score >= 75 else "存在关键技能缺口，应优先补齐必备技能。",
        "parsed_resume": parsed_resume,
    }
