from __future__ import annotations


SKILL_ALIASES: dict[str, list[str]] = {
    # ── 编程语言 ──
    "Python": ["Python", "python", "Python3"],
    "Java": ["Java", "java", "Java8", "Java17"],
    "JavaScript": ["JavaScript", "javascript", "JS", "js"],
    "TypeScript": ["TypeScript", "typescript", "TS", "ts"],
    "Go": ["Go", "golang", "Golang"],
    "SQL": ["SQL", "sql"],
    "C++": ["C++", "cpp"],
    # ── 后端框架 ──
    "FastAPI": ["FastAPI", "fastapi"],
    "Spring Boot": ["Spring Boot", "SpringBoot", "spring boot", "springboot"],
    "Django": ["Django", "django"],
    "Flask": ["Flask", "flask"],
    "Express": ["Express", "express", "Express.js"],
    "gRPC": ["gRPC", "grpc", "gRpc"],
    # ── 前端框架 ──
    "React": ["React", "react", "React.js", "ReactJS"],
    "Vue": ["Vue", "vue", "Vue.js", "VueJS"],
    "Angular": ["Angular", "angular", "Angular.js"],
    "Next.js": ["Next.js", "NextJS", "next.js"],
    # ── 前端基础 ──
    "HTML/CSS": ["HTML", "CSS", "HTML/CSS", "html", "css"],
    "前端工程化": ["前端工程化", "Webpack", "Vite", "Babel", "ESLint"],
    "小程序": ["小程序", "微信小程序", "Mini Program"],
    # ── 数据存储 ──
    "MySQL": ["MySQL", "mysql"],
    "Redis": ["Redis", "redis"],
    "向量数据库": ["向量数据库", "向量检索", "Milvus", "FAISS", "Pinecone", "Chroma", "Weaviate"],
    "MongoDB": ["MongoDB", "mongodb", "mongo"],
    "Elasticsearch": ["Elasticsearch", "ES", "ElasticSearch", "elastic"],
    "PostgreSQL": ["PostgreSQL", "postgres", "pg"],
    # ── 大模型应用 ──
    "RAG": ["RAG", "检索增强", "知识库", "检索增强生成"],
    "大模型应用": ["大模型", "LLM", "大语言模型", "模型调用", "大模型应用"],
    "Prompt Engineering": ["Prompt", "提示词", "Prompt Engineering", "prompt engineering"],
    "工具调用": ["工具调用", "函数调用", "Function Calling", "function calling"],
    "多智能体协作": ["多智能体", "multi-agent", "Agentic", "多Agent", "Agent协作"],
    "LangChain": ["LangChain", "langchain", "LlamaIndex"],
    "模型微调": ["模型微调", "Fine-tuning", "fine-tuning", "LoRA", "SFT"],
    "模型部署": ["模型部署", "模型推理", "推理优化", "模型上线"],
    # ── AI/ML ──
    "深度学习": ["深度学习", "Deep Learning", "神经网络"],
    "机器学习": ["机器学习", "Machine Learning", "ML"],
    "NLP": ["NLP", "自然语言处理", "文本挖掘"],
    "计算机视觉": ["计算机视觉", "CV", "Computer Vision", "图像识别"],
    "PyTorch": ["PyTorch", "pytorch", "torch"],
    "TensorFlow": ["TensorFlow", "tensorflow", "TF"],
    "推荐系统": ["推荐系统", "推荐算法", "个性化推荐"],
    "特征工程": ["特征工程", "特征提取", "特征选择"],
    "模型评测": ["模型评测", "Agent 评测", "评测", "模型评估"],
    # ── 大数据 ──
    "Hadoop": ["Hadoop", "hadoop", "HDFS"],
    "Spark": ["Spark", "spark"],
    "Flink": ["Flink", "flink", "Apache Flink"],
    "Hive": ["Hive", "hive"],
    "数据仓库": ["数据仓库", "数仓", "Data Warehouse"],
    "数据治理": ["数据治理", "数据质量", "元数据管理", "数据血缘"],
    "ETL": ["ETL", "数据清洗", "数据集成", "数据管道"],
    # ── 云原生与架构 ──
    "Docker": ["Docker", "docker", "容器"],
    "Kubernetes": ["Kubernetes", "K8s", "k8s"],
    "云原生": ["云原生", "Cloud Native"],
    "微服务": ["微服务", "服务治理", "服务拆分"],
    "消息队列": ["消息队列", "Kafka", "RabbitMQ", "MQ", "RocketMQ"],
    "分布式系统": ["分布式系统", "分布式", "分布式架构", "一致性"],
    # ── 工程质量 ──
    "可观测性": ["可观测性", "监控", "链路追踪", "日志", "Prometheus", "Grafana"],
    "MLOps": ["MLOps", "模型监控", "自动化交付", "模型生命周期"],
    "CI/CD": ["CI/CD", "持续集成", "持续部署", "Jenkins", "GitHub Actions"],
    "性能调优": ["性能调优", "高并发", "性能优化", "压测"],
    "REST API": ["REST API", "RESTful", "接口联调", "REST"],
    "API 集成": ["API 集成", "企业 API", "接口集成"],
    "大模型 API 集成": ["大模型 API", "AI 服务", "模型接口"],
    # ── 知识工程 ──
    "知识图谱": ["知识图谱", "图谱", "Neo4j"],
    # ── 测试 ──
    "自动化测试": ["自动化测试", "Selenium", "Playwright", "Cypress"],
    "性能测试": ["性能测试", "JMeter", "LoadRunner", "压测工具"],
    "测试开发": ["测试开发", "测试框架", "测试平台"],
    # ── 安全 ──
    "网络安全": ["网络安全", "信息安全", "Web安全"],
    "渗透测试": ["渗透测试", "安全测试", "漏洞扫描"],
    # ── 产品与分析 ──
    "数据分析": ["数据分析", "数据可视化", "Tableau", "BI"],
    "用户研究": ["用户研究", "用户画像", "用户访谈"],
    "需求分析": ["需求分析", "需求管理", "PRD"],
    # ── 通用能力 ──
    "项目管理": ["项目管理", "敏捷开发", "Scrum", "Sprint"],
    "Linux": ["Linux", "linux", "Shell", "shell"],
    "Git": ["Git", "git", "版本控制"],
    "系统设计": ["系统设计", "架构设计", "技术方案", "概要设计"],
}


SKILL_CATEGORY: dict[str, str] = {
    # 编程语言
    "Python": "编程语言", "Java": "编程语言", "JavaScript": "编程语言",
    "TypeScript": "编程语言", "Go": "编程语言", "SQL": "编程语言", "C++": "编程语言",
    # 后端框架
    "FastAPI": "后端框架", "Spring Boot": "后端框架", "Django": "后端框架",
    "Flask": "后端框架", "Express": "后端框架", "gRPC": "后端框架",
    # 前端框架
    "React": "前端框架", "Vue": "前端框架", "Angular": "前端框架", "Next.js": "前端框架",
    # 前端基础
    "HTML/CSS": "前端基础", "前端工程化": "前端基础", "小程序": "前端基础",
    # 数据存储
    "MySQL": "数据存储", "Redis": "数据存储", "向量数据库": "数据存储",
    "MongoDB": "数据存储", "Elasticsearch": "数据存储", "PostgreSQL": "数据存储",
    # 大模型应用
    "RAG": "大模型应用", "大模型应用": "大模型应用", "Prompt Engineering": "大模型应用",
    "工具调用": "大模型应用", "多智能体协作": "大模型应用", "LangChain": "大模型应用",
    "模型微调": "大模型应用", "模型部署": "大模型应用",
    # AI/ML
    "深度学习": "AI/ML", "机器学习": "AI/ML", "NLP": "AI/ML", "计算机视觉": "AI/ML",
    "PyTorch": "AI/ML", "TensorFlow": "AI/ML", "推荐系统": "AI/ML",
    "特征工程": "AI/ML", "模型评测": "AI/ML",
    # 大数据
    "Hadoop": "大数据", "Spark": "大数据", "Flink": "大数据", "Hive": "大数据",
    "数据仓库": "大数据", "数据治理": "大数据", "ETL": "大数据",
    # 云原生与架构
    "Docker": "云原生", "Kubernetes": "云原生", "云原生": "云原生",
    "微服务": "架构能力", "消息队列": "架构能力", "分布式系统": "架构能力",
    # 工程质量
    "可观测性": "工程质量", "MLOps": "工程质量", "CI/CD": "工程质量",
    "性能调优": "工程质量", "REST API": "接口能力", "API 集成": "接口能力",
    "大模型 API 集成": "接口能力",
    # 知识工程
    "知识图谱": "知识工程",
    # 测试
    "自动化测试": "测试能力", "性能测试": "测试能力", "测试开发": "测试能力",
    # 安全
    "网络安全": "安全能力", "渗透测试": "安全能力",
    # 产品与分析
    "数据分析": "产品能力", "用户研究": "产品能力", "需求分析": "产品能力",
    # 通用能力
    "项目管理": "通用能力", "Linux": "通用能力", "Git": "通用能力", "系统设计": "架构能力",
}


LEARNING_PATHS: dict[str, list[str]] = {
    # 大模型应用
    "RAG": ["学习向量检索基础与 Embedding 模型选型", "实现文档切分、召回与重排管线", "接入业务知识库并加入答案证据引用"],
    "工具调用": ["掌握 Function Calling 协议与工具描述规范", "设计工具 Schema 并实现调用编排", "增加失败重试、权限控制和审计日志"],
    "Prompt Engineering": ["掌握角色设定、约束条件和 Few-shot 示例写法", "建立提示词评测集并量化效果", "结合业务知识迭代模板并做 A/B 测试"],
    "LangChain": ["学习 LangChain 核心概念：Chain、Agent、Memory", "实现 RAG Pipeline 和 Tool Agent", "优化 Token 消耗、缓存策略和异常处理"],
    "多智能体协作": ["理解单 Agent 架构与 ReAct 模式", "设计多 Agent 通信协议与任务分配", "实现监督者模式和冲突解决机制"],
    "模型微调": ["掌握 LoRA / QLoRA 微调原理", "准备高质量训练数据并做数据清洗", "评估微调效果并防止过拟合"],
    "大模型应用": ["学习主流大模型 API 的调用方式与参数", "实现 Prompt 管理、上下文窗口控制", "构建评测集并持续迭代优化"],
    # AI/ML
    "深度学习": ["掌握 CNN / RNN / Transformer 基础架构", "使用 PyTorch 实现经典模型", "学习分布式训练和模型压缩"],
    "机器学习": ["掌握经典算法：线性回归、决策树、SVM、聚类", "学习特征工程和模型选择策略", "在真实数据集上完成端到端项目"],
    "NLP": ["学习文本预处理、词向量和语言模型", "实现文本分类、命名实体识别等任务", "掌握 Transformer 和预训练模型微调"],
    "推荐系统": ["理解协同过滤和内容推荐原理", "学习深度推荐模型（DeepFM、DIN）", "搭建完整的召回-粗排-精排管线"],
    # 大数据
    "Spark": ["学习 Spark Core 和 RDD 编程模型", "掌握 Spark SQL 和 DataFrame 操作", "优化 Shuffle、缓存和数据倾斜"],
    "Flink": ["理解流处理与批处理统一模型", "学习窗口、水印和状态管理", "实现端到端的实时数据管线"],
    "数据仓库": ["学习维度建模（星型/雪花模型）", "掌握分层架构：ODS-DWD-DWS-ADS", "设计数据质量监控和血缘追踪"],
    # 云原生
    "Kubernetes": ["学习 Pod、Deployment、Service 核心概念", "部署 Java/Python 服务到 K8s 集群", "加入弹性伸缩、灰度发布和 Helm 管理"],
    "Docker": ["掌握 Dockerfile 编写和镜像构建", "学习 Docker Compose 多服务编排", "优化镜像体积和构建缓存"],
    "微服务": ["理解服务拆分原则和领域驱动设计", "实现服务注册、发现、网关和熔断", "学习分布式事务和数据一致性方案"],
    # 工程质量
    "可观测性": ["建设日志、指标、链路追踪三大支柱", "定义核心 SLI/SLO 并建立告警规则", "搭建排障面板和根因分析流程"],
    "性能调优": ["掌握 Profiling 工具定位瓶颈", "优化数据库查询、缓存策略和并发模型", "建立性能基线和自动化压测"],
    "CI/CD": ["搭建 GitLab CI / GitHub Actions 流水线", "实现自动化测试、构建和部署", "加入代码质量检查和安全扫描"],
    # 安全
    "网络安全": ["学习 OWASP Top 10 漏洞原理", "掌握 Web 安全防护：XSS、CSRF、SQL注入", "建立安全编码规范和代码审计流程"],
    # 前端
    "React": ["掌握 JSX、组件、Hooks 和状态管理", "学习 React Router 和数据请求", "优化渲染性能和代码分割"],
    "Vue": ["掌握模板语法、组件化和响应式原理", "学习 Vue Router 和 Pinia 状态管理", "实现 SSR（Nuxt.js）和性能优化"],
    "TypeScript": ["掌握类型系统：基础类型、泛型、工具类型", "学习类型体操和类型推断", "在 React/Vue 项目中实践 TS"],
    # 通用
    "系统设计": ["学习经典架构模式：分层、微服务、事件驱动", "掌握容量估算、缓存、消息队列设计", "完成高并发、高可用系统设计实战"],
    "数据分析": ["掌握 SQL 和 Python 数据处理（Pandas）", "学习统计分析和数据可视化", "建立业务指标体系和 AB 测试方法论"],
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
