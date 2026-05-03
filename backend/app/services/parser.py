from __future__ import annotations

import re

from app.services.taxonomy import SKILL_ALIASES, SKILL_CATEGORY


def _merge_skills(rule_skills: list[dict], llm_skills: list[dict]) -> list[dict]:
    merged = {}
    for skill in rule_skills:
        merged[skill["name"]] = skill
    for skill in llm_skills:
        name = skill["name"]
        if name not in merged:
            merged[name] = skill
        else:
            existing = merged[name]
            existing["confidence"] = min(0.99, max(existing["confidence"], skill["confidence"]))
            if skill["evidence"]:
                for ev in skill["evidence"]:
                    if ev not in existing["evidence"]:
                        existing["evidence"].append(ev)
    return sorted(merged.values(), key=lambda s: (-s["confidence"], s["name"]))


def _sentences(text: str) -> list[str]:
    parts = re.split(r"[。；;\n]", text)
    return [part.strip() for part in parts if part.strip()]


def _alias_in_text(alias: str, text_lower: str) -> bool:
    alias_lower = alias.lower()
    if len(alias_lower) <= 3:
        pattern = r'(?<![a-zA-Z])' + re.escape(alias_lower) + r'(?![a-zA-Z])'
        return bool(re.search(pattern, text_lower))
    return alias_lower in text_lower


def extract_skills(text: str) -> list[dict]:
    results: list[dict] = []
    lowered = text.lower()
    sentences = _sentences(text)

    for skill, aliases in SKILL_ALIASES.items():
        matched_aliases = [alias for alias in aliases if _alias_in_text(alias, lowered)]
        if not matched_aliases:
            continue

        evidence = [
            sentence
            for sentence in sentences
            if any(_alias_in_text(alias, sentence.lower()) for alias in aliases)
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


def extract_skills_dual(text: str, text_type: str = "jd") -> tuple[list[dict], bool]:
    rule_skills = extract_skills(text)
    try:
        from app.services.llm_extractor import extract_with_llm
        llm_result = extract_with_llm(text, text_type)
        if llm_result and llm_result["skills"]:
            return _merge_skills(rule_skills, llm_result["skills"]), True
    except Exception:
        pass
    return rule_skills, False


def parse_jd(text: str, title: str = "", use_llm: bool = False) -> dict:
    skills, llm_used = extract_skills_dual(text, "jd") if use_llm else (extract_skills(text), False)
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
        "llm_used": llm_used,
    }


def parse_resume(text: str, use_llm: bool = False) -> dict:
    skills, llm_used = extract_skills_dual(text, "resume") if use_llm else (extract_skills(text), False)
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
        "llm_used": llm_used,
    }
