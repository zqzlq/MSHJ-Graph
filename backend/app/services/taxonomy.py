from __future__ import annotations


SKILL_ALIASES: dict[str, list[str]] = {
    "Python": ["Python", "python"],
    "FastAPI": ["FastAPI", "fastapi"],
    "大模型应用": ["大模型", "LLM", "大语言模型", "模型调用"],
    "Prompt Engineering": ["Prompt", "提示词", "Prompt Engineering"],
    "RAG": ["RAG", "检索增强", "知识库"],
    "向量数据库": ["向量数据库", "向量检索", "Milvus", "FAISS"],
    "工具调用": ["工具调用", "函数调用", "Function Calling"],
    "API 集成": ["API 集成", "企业 API", "接口集成", "API"],
    "LangChain": ["LangChain", "langchain"],
    "多智能体协作": ["多智能体", "multi-agent", "Agentic"],
    "模型评测": ["模型评测", "Agent 评测", "评测"],
    "MLOps": ["MLOps", "模型监控", "自动化交付"],
    "知识图谱": ["知识图谱", "图谱"],
    "Java": ["Java", "java"],
    "Spring Boot": ["Spring Boot", "SpringBoot"],
    "MySQL": ["MySQL", "mysql"],
    "Redis": ["Redis", "redis"],
    "微服务": ["微服务", "服务治理"],
    "消息队列": ["消息队列", "Kafka", "RabbitMQ", "MQ"],
    "Docker": ["Docker", "docker", "容器"],
    "REST API": ["REST API", "RESTful", "接口联调"],
    "Kubernetes": ["Kubernetes", "K8s", "k8s"],
    "可观测性": ["可观测性", "监控", "链路追踪", "日志"],
    "云原生": ["云原生", "Cloud Native"],
    "大模型 API 集成": ["大模型 API", "AI 服务", "模型接口"],
    "性能调优": ["性能调优", "高并发", "性能优化"],
}


SKILL_CATEGORY: dict[str, str] = {
    "Python": "编程语言",
    "Java": "编程语言",
    "FastAPI": "后端框架",
    "Spring Boot": "后端框架",
    "MySQL": "数据存储",
    "Redis": "数据存储",
    "向量数据库": "数据存储",
    "RAG": "大模型应用",
    "大模型应用": "大模型应用",
    "Prompt Engineering": "大模型应用",
    "工具调用": "大模型应用",
    "多智能体协作": "大模型应用",
    "模型评测": "工程质量",
    "MLOps": "工程质量",
    "知识图谱": "知识工程",
    "微服务": "架构能力",
    "消息队列": "架构能力",
    "Docker": "云原生",
    "Kubernetes": "云原生",
    "云原生": "云原生",
    "可观测性": "工程质量",
    "REST API": "接口能力",
    "API 集成": "接口能力",
    "大模型 API 集成": "接口能力",
    "性能调优": "工程质量",
    "LangChain": "开发工具",
}


LEARNING_PATHS: dict[str, list[str]] = {
    "RAG": ["学习向量检索基础", "实现文档切分与召回", "加入重排与答案证据引用"],
    "工具调用": ["掌握函数调用协议", "设计工具 Schema", "增加失败重试与权限控制"],
    "Prompt Engineering": ["掌握角色、约束和示例写法", "建立提示词评测集", "结合业务知识迭代模板"],
    "Kubernetes": ["学习 Pod、Deployment、Service", "部署 Java 服务", "加入弹性伸缩和灰度发布"],
    "可观测性": ["建设日志、指标、链路追踪", "定义核心 SLI", "建立告警和排障面板"],
    "大模型 API 集成": ["熟悉模型接口参数", "封装调用网关", "增加限流、审计和降级策略"],
}


def normalize_skill(raw: str) -> str | None:
    raw_lower = raw.lower()
    for skill, aliases in SKILL_ALIASES.items():
        if raw == skill or raw_lower == skill.lower():
            return skill
        if any(alias.lower() == raw_lower for alias in aliases):
            return skill
    return None


def all_skills() -> list[str]:
    return list(SKILL_ALIASES.keys())
