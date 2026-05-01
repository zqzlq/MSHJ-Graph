from app.services.parser import parse_jd, parse_resume


def test_parse_jd_extracts_agent_skills():
    text = "负责 AI Agent 应用开发，要求 Python、RAG、Prompt Engineering、向量数据库、工具调用和 API 集成。"
    parsed = parse_jd(text, "AI Agent 应用工程师")
    skills = {skill["name"] for skill in parsed["skills"]}

    assert {"Python", "RAG", "Prompt Engineering", "向量数据库", "工具调用", "API 集成"} <= skills


def test_parse_resume_extracts_projects_and_years():
    text = "3 年 Java 后端经验，参与电商平台项目，熟悉 Spring Boot、MySQL、Redis、Docker。"
    parsed = parse_resume(text)
    skills = {skill["name"] for skill in parsed["skills"]}

    assert parsed["years"] == 3
    assert {"Java", "Spring Boot", "MySQL", "Redis", "Docker"} <= skills
    assert parsed["projects"]
