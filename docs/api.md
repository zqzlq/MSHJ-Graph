# API 说明

## 数据对象

岗位对象包含：

- `id`：岗位 ID。
- `title`：岗位名称。
- `category`：`emerging` 或 `existing`。
- `definition`：岗位定义。
- `required_skills`：必备技能。
- `bonus_skills`：加分技能。
- `industry_scenarios`：典型行业场景。

## 人岗匹配请求

```json
{
  "job_id": "ai_agent_engineer",
  "resume_text": "熟悉 Python、FastAPI、RAG、Prompt Engineering、向量数据库和 API 集成。"
}
```

## 人岗匹配响应

```json
{
  "job_id": "ai_agent_engineer",
  "job_title": "AI Agent 应用工程师",
  "score": 80.0,
  "covered_required": ["Python", "RAG"],
  "missing_required": ["工具调用"],
  "covered_bonus": ["LangChain"],
  "diagnosis": "匹配度较高，建议补齐关键工程化能力。",
  "learning_path": [
    {
      "skill": "工具调用",
      "steps": ["掌握函数调用协议", "设计工具 Schema", "增加失败重试与权限控制"]
    }
  ]
}
```

## 图谱响应

`GET /api/graph` 返回：

- `nodes`：岗位、技能、技能类别、行业场景。
- `edges`：`required`、`bonus`、`belongs_to`、`applies_to` 等关系。
- `metrics`：节点数、边数和图密度。
