from __future__ import annotations

import math
from collections import Counter

from app.services.repository import list_jobs
from app.services.taxonomy import all_skills, SKILL_CATEGORY


def _skill_vector(skills: list[str], skill_list: list[str]) -> list[int]:
    skill_set = set(skills)
    return [1 if s in skill_set else 0 for s in skill_list]


def _cosine_similarity(a: list[int], b: list[int]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _kmeans(vectors: list[list[int]], k: int, max_iter: int = 50) -> list[int]:
    n = len(vectors)
    if n <= k:
        return list(range(n))

    centroids = [vectors[i * n // k] for i in range(k)]
    labels = [0] * n

    for _ in range(max_iter):
        for i, v in enumerate(vectors):
            best = 0
            best_sim = -1
            for j, c in enumerate(centroids):
                sim = _cosine_similarity(v, c)
                if sim > best_sim:
                    best_sim = sim
                    best = j
            labels[i] = best

        new_centroids = [[0] * len(vectors[0]) for _ in range(k)]
        counts = [0] * k
        for i, label in enumerate(labels):
            counts[label] += 1
            for j in range(len(vectors[0])):
                new_centroids[label][j] += vectors[i][j]

        for j in range(k):
            if counts[j] > 0:
                new_centroids[j] = [x / counts[j] for x in new_centroids[j]]

        if new_centroids == centroids:
            break
        centroids = new_centroids

    return labels


def _pca_2d(vectors: list[list[int]]) -> list[tuple[float, float]]:
    n = len(vectors)
    dim = len(vectors[0])
    if n < 2:
        return [(0.0, 0.0)] * n

    means = [sum(v[i] for v in vectors) / n for i in range(dim)]
    centered = [[v[i] - means[i] for i in range(dim)] for v in vectors]

    cov = [[0.0] * dim for _ in range(dim)]
    for v in centered:
        for i in range(dim):
            for j in range(dim):
                cov[i][j] += v[i] * v[j]
    for i in range(dim):
        for j in range(dim):
            cov[i][j] /= n

    def power_iter(matrix, iterations=100):
        vec = [1.0 / math.sqrt(dim)] * dim
        for _ in range(iterations):
            new_vec = [sum(matrix[i][j] * vec[j] for j in range(dim)) for i in range(dim)]
            norm = math.sqrt(sum(x * x for x in new_vec))
            if norm > 0:
                vec = [x / norm for x in new_vec]
        eigenvalue = sum(sum(matrix[i][j] * vec[j] for j in range(dim)) * vec[i] for i in range(dim))
        return vec, eigenvalue

    vec1, _ = power_iter(cov)
    proj1 = [sum(v[i] * vec1[i] for i in range(dim)) for v in centered]

    eigenvalue1 = sum(sum(cov[i][j] * vec1[j] for j in range(dim)) * vec1[i] for i in range(dim))
    deflation = [[cov[i][j] - eigenvalue1 * vec1[i] * vec1[j] for j in range(dim)] for i in range(dim)]
    vec2, _ = power_iter(deflation)
    proj2 = [sum(v[i] * vec2[i] for i in range(dim)) for v in centered]

    return list(zip(proj1, proj2))


def run_clustering(n_clusters: int = 3) -> dict:
    jobs = list_jobs()
    skill_list = all_skills()

    vectors = []
    for job in jobs:
        all_job_skills = job["required_skills"] + job["bonus_skills"]
        vectors.append(_skill_vector(all_job_skills, skill_list))

    labels = _kmeans(vectors, n_clusters)
    coords = _pca_2d(vectors)

    categories = list(SKILL_CATEGORY.values())
    category_counts = Counter(categories)
    top_categories = [cat for cat, _ in category_counts.most_common(10)]

    clusters = {}
    for i, job in enumerate(jobs):
        cid = labels[i]
        if cid not in clusters:
            clusters[cid] = {
                "id": cid,
                "jobs": [],
                "center": coords[i],
                "dominant_skills": Counter(),
            }
        clusters[cid]["jobs"].append({
            "id": job["id"],
            "title": job["title"],
            "category": job["category"],
            "coords": {"x": round(coords[i][0], 4), "y": round(coords[i][1], 4)},
        })
        for skill in job["required_skills"]:
            clusters[cid]["dominant_skills"][skill] += 1

    for cid in clusters:
        top = clusters[cid]["dominant_skills"].most_common(5)
        clusters[cid]["top_skills"] = [{"name": s, "count": c} for s, c in top]
        del clusters[cid]["dominant_skills"]
        cx = sum(j["coords"]["x"] for j in clusters[cid]["jobs"]) / len(clusters[cid]["jobs"])
        cy = sum(j["coords"]["y"] for j in clusters[cid]["jobs"]) / len(clusters[cid]["jobs"])
        clusters[cid]["center"] = {"x": round(cx, 4), "y": round(cy, 4)}

    similarity_matrix = []
    for i, job_i in enumerate(jobs):
        for j in range(i + 1, len(jobs)):
            sim = _cosine_similarity(vectors[i], vectors[j])
            if sim > 0.1:
                similarity_matrix.append({
                    "source": job_i["id"],
                    "target": jobs[j]["id"],
                    "similarity": round(sim, 4),
                })

    return {
        "n_clusters": n_clusters,
        "n_jobs": len(jobs),
        "clusters": list(clusters.values()),
        "similarity_edges": sorted(similarity_matrix, key=lambda e: -e["similarity"])[:30],
    }
