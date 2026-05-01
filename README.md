# 多源异构数据驱动岗位和能力图谱 MVP

这是面向赛题“多源异构数据驱动岗位和能力图谱构建与动态演化分析研究”的可运行 MVP。系统覆盖样例 JD 导入、岗位能力图谱、新岗位发现、既有岗位能力更新、简历解析、人岗匹配与学习路径建议。

## 技术栈

- 后端：Python、FastAPI、SQLite、NetworkX
- 前端：React、Vite、TypeScript
- 数据：内置 JD、简历、技能词典和图谱样例

## 快速启动

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

前端：

```bash
cd frontend
npm install
npm run dev
```

访问前端页面后，系统会默认请求 `http://127.0.0.1:8000` 的后端接口。

## 核心能力

- 新岗位发现：从多批次 JD 中识别 AI Agent、RAG、工具调用等新兴技能组合。
- 既有岗位更新：对比 Java 开发工程师历史与当前 JD，标注新增、删除和增强技能。
- 能力图谱：展示岗位、技能、技术栈、场景之间的结构化关系。
- 简历解析：从文本简历中抽取技能、项目经验和证据片段。
- 人岗匹配：输出匹配分、关键缺口、证据和学习路径。

详细说明见 `docs/`。
