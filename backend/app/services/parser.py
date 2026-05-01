from __future__ import annotations

import re

from app.services.taxonomy import SKILL_ALIASES, SKILL_CATEGORY


def _sentences(text: str) -> list[str]:
    parts = re.split(r"[。；;\n]", text)
    return [part.strip() for part in parts if part.strip()]


def extract_skills(text: str) -> list[dict]:
    results: list[dict] = []
    lowered = text.lower()
    sentences = _sentences(text)

    for skill, aliases in SKILL_ALIASES.items():
        matched_aliases = [alias for alias in aliases if alias.lower() in lowered]
        if not matched_aliases:
            continue

        evidence = [
            sentence
            for sentence in sentences
            if any(alias.lower() in sentence.lower() for alias in aliases)
        ][:3]
        results.append(
            {
                "name": skill,
                "category": SKILL_CATEGORY.get(skill, "其他"),
                "evidence": evidence,
                "confidence": min(0.99, 0.72 + 0.08 * len(evidence) + 0.04 * len(matched_aliases)),
            }
        )

    return sorted(results, key=lambda item: (-item["confidence"], item["name"]))


def parse_jd(text: str, title: str = "") -> dict:
    skills = extract_skills(text)
    responsibilities = [
        sentence
        for sentence in _sentences(text)
        if any(keyword in sentence for keyword in ["负责", "设计", "构建", "开发", "优化", "落地"])
    ][:5]
    scenarios = [
        word
        for word in ["智能客服", "企业知识助手", "研发提效", "办公自动化", "企业应用", "金融科技", "电商平台", "数据中台"]
        if word in text
    ]
    return {
        "title": title,
        "responsibilities": responsibilities,
        "skills": skills,
        "industry_scenarios": scenarios,
        "skill_count": len(skills),
    }


def parse_resume(text: str) -> dict:
    skills = extract_skills(text)
    project_sentences = [
        sentence
        for sentence in _sentences(text)
        if any(keyword in sentence for keyword in ["项目", "系统", "平台", "助手", "负责", "参与"])
    ]
    years_match = re.search(r"(\d+)\s*年", text)
    return {
        "skills": skills,
        "projects": project_sentences[:5],
        "years": int(years_match.group(1)) if years_match else None,
        "raw_text_length": len(text),
    }
