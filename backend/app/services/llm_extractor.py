from __future__ import annotations

import json
import logging

from openai import OpenAI

from app.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
from app.services.taxonomy import SKILL_ALIASES, SKILL_CATEGORY, normalize_skill

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个岗位技能抽取专家。从给定的 JD 或简历文本中提取技能清单。

规则：
1. 只提取明确提到的技术技能、工具、框架、方法论
2. 返回标准技能名称，不要返回别名或缩写
3. 每个技能附带置信度（0-1）和原文证据片段
4. 不要猜测或推断未明确出现的技能

返回 JSON 格式：
{
  "skills": [
    {"name": "技能名称", "confidence": 0.95, "evidence": "原文句子"}
  ],
  "responsibilities": ["职责描述1", "职责描述2"],
  "scenarios": ["场景1", "场景2"]
}"""

ALLOWED_SKILLS = set(SKILL_ALIASES.keys())


def _get_client() -> OpenAI | None:
    if not LLM_API_KEY:
        return None
    return OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)


def extract_with_llm(text: str, text_type: str = "jd") -> dict | None:
    client = _get_client()
    if not client:
        return None

    user_prompt = f"请从以下{'JD文本' if text_type == 'jd' else '简历文本'}中提取技能：\n\n{text}"

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        return _validate_and_normalize(result)
    except Exception as e:
        logger.warning("LLM extraction failed: %s", e)
        return None


def _validate_and_normalize(result: dict) -> dict:
    validated_skills = []
    seen = set()

    for skill in result.get("skills", []):
        name = skill.get("name", "")
        normalized = normalize_skill(name)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        validated_skills.append({
            "name": normalized,
            "category": SKILL_CATEGORY.get(normalized, "其他"),
            "confidence": min(0.99, max(0.5, skill.get("confidence", 0.7))),
            "evidence": [skill.get("evidence", "")] if skill.get("evidence") else [],
        })

    return {
        "skills": sorted(validated_skills, key=lambda s: -s["confidence"]),
        "responsibilities": result.get("responsibilities", [])[:5],
        "scenarios": result.get("scenarios", []),
    }
