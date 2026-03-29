"""
Smart search module for jobs.
Uses core search utilities.
"""

from __future__ import annotations
from apps.core.search import (
    tokenize,
    score_document
)

# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _build_job_corpus(job) -> str:
    """
    Concatenate all searchable text fields of a job into one string.
    Fields: title, description, category name (with translations).
    """
    parts = [
        job.title or "",
        job.description or ""
    ]
    
    # Category (localized names if available)
    if job.category:
        parts.append(job.category.name or "")
        parts.append(job.category.name_ru or "")
        parts.append(job.category.name_tk or "")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

_SCORE_THRESHOLD = 0.40  # increased from 0.25


def smart_filter_jobs(queryset, query: str):
    """
    Apply intelligent fuzzy search to a Job queryset.
    Returns a sorted list (not queryset) when query is non-empty.
    """
    query = query.strip()
    if not query:
        return queryset

    query_tokens = tokenize(query)
    if not query_tokens:
        return queryset

    scored: list[tuple[float, object]] = []
    
    # Optimization: select_related category for faster corpus building
    for job in queryset.select_related("category"):
        corpus = _build_job_corpus(job)
        score = score_document(query_tokens, corpus)
        if score >= _SCORE_THRESHOLD:
            scored.append((score, job))

    # Sort: highest score first; then by date (newest first)
    scored.sort(key=lambda x: (x[0], x[1].created_at), reverse=True)

    return [job for _, job in scored]
