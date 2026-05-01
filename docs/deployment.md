# 部署说明

## 环境要求

- Python 3.10+
- Node.js 18+
- Windows、macOS 或 Linux 均可本地运行

## 启动后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端默认地址为 `http://127.0.0.1:8000`。首次启动会自动读取 `data/jobs.json` 和 `data/resumes.json`，并生成 SQLite 数据库 `data/talent_graph.db`。

## 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认地址为 `http://127.0.0.1:5173`。

## 运行测试

```bash
cd backend
pytest
```

## 常用接口

- `GET /health`：健康检查。
- `POST /api/init`：重置并导入样例数据。
- `GET /api/dashboard`：首页统计。
- `GET /api/graph`：岗位能力图谱节点和边。
- `GET /api/discover`：新岗位发现结果。
- `GET /api/updates/{job_id}`：岗位能力动态更新。
- `POST /api/parse/resume`：简历解析。
- `POST /api/match`：人岗匹配诊断。
