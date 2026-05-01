from __future__ import annotations

import networkx as nx

from app.services.repository import list_jobs
from app.services.taxonomy import SKILL_CATEGORY


def build_capability_graph() -> dict:
    graph = nx.Graph()

    for job in list_jobs():
        job_node = f"job:{job['id']}"
        graph.add_node(
            job_node,
            id=job_node,
            label=job["title"],
            type="job",
            category=job["category"],
            level=job["level"],
        )

        for skill in job["required_skills"]:
            skill_node = f"skill:{skill}"
            category = SKILL_CATEGORY.get(skill, "其他")
            category_node = f"category:{category}"
            graph.add_node(skill_node, id=skill_node, label=skill, type="skill", category=category)
            graph.add_node(category_node, id=category_node, label=category, type="skill_category")
            graph.add_edge(job_node, skill_node, relation="required", weight=2)
            graph.add_edge(skill_node, category_node, relation="belongs_to", weight=1)

        for skill in job["bonus_skills"]:
            skill_node = f"skill:{skill}"
            category = SKILL_CATEGORY.get(skill, "其他")
            graph.add_node(skill_node, id=skill_node, label=skill, type="skill", category=category)
            graph.add_edge(job_node, skill_node, relation="bonus", weight=1)

        for scenario in job["industry_scenarios"]:
            scenario_node = f"scenario:{scenario}"
            graph.add_node(scenario_node, id=scenario_node, label=scenario, type="scenario")
            graph.add_edge(job_node, scenario_node, relation="applies_to", weight=1)

    return {
        "nodes": [data for _, data in graph.nodes(data=True)],
        "edges": [
            {"source": source, "target": target, **data}
            for source, target, data in graph.edges(data=True)
        ],
        "metrics": {
            "node_count": graph.number_of_nodes(),
            "edge_count": graph.number_of_edges(),
            "density": round(nx.density(graph), 4) if graph.number_of_nodes() > 1 else 0,
        },
    }
