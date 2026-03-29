"""
Smart search module for profile/talent discovery.
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

def _build_profile_corpus(profile) -> str:
    """
    Concatenate all searchable text fields of a profile into one string.
    """
    user = profile.user
    parts = [
        user.first_name or "",
        user.last_name or "",
        user.email or "",
        profile.profession or "",
        profile.bio or "",
    ]
    
    # Category (localized names if available)
    if profile.category:
        parts.append(profile.category.name or "")
        parts.append(profile.category.name_ru or "")
        parts.append(profile.category.name_tk or "")

    for skill in profile.skills.all():
        parts.append(skill.name)

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

_SCORE_THRESHOLD = 0.45  # increased from 0.35


def smart_filter_profiles(queryset, query: str):
    """
    Apply intelligent fuzzy search to a Profile queryset.
    Returns a sorted list (not queryset) when query is non-empty.
    """
    query = query.strip()
    if not query:
        return queryset

    query_tokens = tokenize(query)
    if not query_tokens:
        return queryset

    scored: list[tuple[float, object]] = []
    # Optimization: prefetch related for faster corpus building
    for profile in queryset.select_related("user").prefetch_related("skills"):
        corpus = _build_profile_corpus(profile)
        score = score_document(query_tokens, corpus)
        if score >= _SCORE_THRESHOLD:
            scored.append((score, profile))

    # Sort: VIP first, then by score descending
    scored.sort(key=lambda x: (x[1].is_vip, x[0]), reverse=True)

    return [profile for _, profile in scored]
