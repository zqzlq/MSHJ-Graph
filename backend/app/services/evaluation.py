from __future__ import annotations

import json
from pathlib import Path

from app.services.analysis import discover_emerging_jobs, match_resume_to_job
from app.services.parser import extract_skills, parse_jd, parse_resume

DATA_DIR = Path(__file__).resolve().parents[3] / "data"


def _load_test_cases() -> dict:
    with (DATA_DIR / "test_cases.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def _prf(expected: set, predicted: set) -> dict:
    tp = len(expected & predicted)
    fp = len(predicted - expected)
    fn = len(expected - predicted)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def evaluate_skill_extraction() -> dict:
    cases = _load_test_cases()
    results = []

    for case in cases["jd_parse_cases"]:
        parsed = parse_jd(case["input"])
        predicted = {s["name"] for s in parsed["skills"]}
        expected = set(case["expected_skills"])
        metrics = _prf(expected, predicted)
        results.append({
            "case_id": case["id"],
            "type": "jd",
            **metrics,
            "expected": sorted(expected),
            "predicted": sorted(predicted),
            "missing": sorted(expected - predicted),
            "extra": sorted(predicted - expected),
        })

    for case in cases["resume_parse_cases"]:
        parsed = parse_resume(case["input"])
        predicted = {s["name"] for s in parsed["skills"]}
        expected = set(case["expected_skills"])
        metrics = _prf(expected, predicted)
        results.append({
            "case_id": case["id"],
            "type": "resume",
            **metrics,
            "expected": sorted(expected),
            "predicted": sorted(predicted),
            "missing": sorted(expected - predicted),
            "extra": sorted(predicted - expected),
        })

    total_tp = sum(r["tp"] for r in results)
    total_fp = sum(r["fp"] for r in results)
    total_fn = sum(r["fn"] for r in results)
    macro_precision = sum(r["precision"] for r in results) / len(results) if results else 0
    macro_recall = sum(r["recall"] for r in results) / len(results) if results else 0
    macro_f1 = sum(r["f1"] for r in results) / len(results) if results else 0
    micro_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) else 0
    micro_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) else 0
    micro_f1 = 2 * micro_precision * micro_recall / (micro_precision + micro_recall) if (micro_precision + micro_recall) else 0

    return {
        "metric": "skill_extraction",
        "total_cases": len(results),
        "macro_avg": {
            "precision": round(macro_precision, 4),
            "recall": round(macro_recall, 4),
            "f1": round(macro_f1, 4),
        },
        "micro_avg": {
            "precision": round(micro_precision, 4),
            "recall": round(micro_recall, 4),
            "f1": round(micro_f1, 4),
        },
        "details": results,
    }


def evaluate_matching() -> dict:
    cases = _load_test_cases()
    results = []

    for case in cases["match_cases"]:
        match_result = match_resume_to_job(case["job_id"], case["resume_text"])
        score = match_result["score"]
        expected_min = case["expected_min_score"]
        passed = score >= expected_min
        results.append({
            "case_id": case["id"],
            "job_id": case["job_id"],
            "score": score,
            "expected_min_score": expected_min,
            "passed": passed,
            "covered_required": match_result["covered_required"],
            "missing_required": match_result["missing_required"],
            "diagnosis": match_result["diagnosis"],
        })

    passed_count = sum(1 for r in results if r["passed"])
    accuracy = passed_count / len(results) if results else 0

    return {
        "metric": "matching_accuracy",
        "total_cases": len(results),
        "passed": passed_count,
        "failed": len(results) - passed_count,
        "accuracy": round(accuracy, 4),
        "details": results,
    }


def evaluate_discovery() -> dict:
    discoveries = discover_emerging_jobs()
    emerging_jobs = [d for d in discoveries if d["confidence"] >= 0.8]
    all_discoveries = len(discoveries)

    return {
        "metric": "job_discovery",
        "total_discoveries": all_discoveries,
        "high_confidence_count": len(emerging_jobs),
        "discoveries": [
            {
                "job_id": d["job_id"],
                "title": d["title"],
                "confidence": d["confidence"],
                "signal_count": d["signal_count"],
                "skills_count": len(d["required_skills"]),
            }
            for d in discoveries
        ],
    }


def run_full_evaluation() -> dict:
    extraction = evaluate_skill_extraction()
    matching = evaluate_matching()
    discovery = evaluate_discovery()

    return {
        "summary": {
            "skill_extraction_f1": extraction["micro_avg"]["f1"],
            "skill_extraction_precision": extraction["micro_avg"]["precision"],
            "skill_extraction_recall": extraction["micro_avg"]["recall"],
            "matching_accuracy": matching["accuracy"],
            "matching_passed": f"{matching['passed']}/{matching['total_cases']}",
            "discovery_count": discovery["total_discoveries"],
            "high_confidence_discoveries": discovery["high_confidence_count"],
        },
        "skill_extraction": extraction,
        "matching": matching,
        "discovery": discovery,
    }
