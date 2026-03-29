"""
Shared search utilities for fuzzy matching and transliteration.
Used by Jobs and Profiles apps.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Transliteration tables
# ---------------------------------------------------------------------------

# Latin → Cyrillic (longest-match, greedy)
_LAT_TO_CYR: list[tuple[str, str]] = [
    ("shch", "щ"), ("sch", "щ"),
    ("zh", "ж"), ("kh", "х"), ("ts", "ц"),
    ("ch", "ч"), ("sh", "ш"), ("yu", "ю"),
    ("ya", "я"), ("yo", "ё"),
    ("a", "а"), ("b", "б"), ("v", "в"), ("g", "г"), ("d", "д"),
    ("e", "е"), ("z", "з"), ("i", "и"), ("j", "й"), ("k", "к"),
    ("l", "л"), ("m", "м"), ("n", "н"), ("o", "о"), ("p", "п"),
    ("r", "р"), ("s", "с"), ("t", "т"), ("u", "у"), ("f", "ф"),
    ("y", "ы"), ("x", "кс"), ("q", "к"), ("w", "в"), ("c", "с"),
]

# Cyrillic → Latin
_CYR_TO_LAT: dict[str, str] = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d",
    "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i",
    "й": "j", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch",
    "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "",
    "э": "e", "ю": "yu", "я": "ya",
}


def lat_to_cyr(text: str) -> str:
    """Greedy longest-match Latin → Cyrillic transliteration."""
    result: list[str] = []
    text = text.lower()
    i = 0
    while i < len(text):
        matched = False
        for lat, cyr in _LAT_TO_CYR:
            if text[i:i + len(lat)] == lat:
                result.append(cyr)
                i += len(lat)
                matched = True
                break
        if not matched:
            result.append(text[i])
            i += 1
    return "".join(result)


def cyr_to_lat(text: str) -> str:
    """Character-by-character Cyrillic → Latin transliteration."""
    return "".join(_CYR_TO_LAT.get(ch, ch) for ch in text.lower())


def is_cyrillic(text: str) -> bool:
    return any("\u0400" <= ch <= "\u04ff" for ch in text)


def is_latin(text: str) -> bool:
    return any("a" <= ch <= "z" for ch in text.lower())


# ---------------------------------------------------------------------------
# Levenshtein distance
# ---------------------------------------------------------------------------

def levenshtein(s1: str, s2: str) -> int:
    """Classic Levenshtein edit distance O(n*m)."""
    n, m = len(s1), len(s2)
    if n == 0: return m
    if m == 0: return n

    prev = list(range(m + 1))
    curr = [0] * (m + 1)

    for i in range(1, n + 1):
        curr[0] = i
        for j in range(1, m + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            curr[j] = min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost,
            )
        prev, curr = curr, prev

    return prev[m]


def max_distance_for(token: str) -> int:
    """Allowed edit distance based on token length."""
    length = len(token)
    if length < 3: return 0
    if length < 5: return 1
    return 2


def expand_query(raw: str) -> set[str]:
    """
    Return a set of normalized query variants:
    original + transliterated alternatives + capitalized forms.
    Useful for SQLite's case-insensitivity limitations with Cyrillic.
    """
    q = raw.lower().strip()
    if not q:
        return set()

    base_variants: set[str] = {q}

    cyr = lat_to_cyr(q)
    lat = cyr_to_lat(q)
    if is_latin(q) and cyr:
        base_variants.add(cyr)
    if is_cyrillic(q) and lat:
        base_variants.add(lat)

    # Always add both directions for mixed-script queries
    if cyr: base_variants.add(cyr)
    if lat: base_variants.add(lat)

    expanded: set[str] = set()
    for variant in base_variants:
        if variant:
            expanded.add(variant)
            expanded.add(variant.capitalize())
            expanded.add(variant.title())
            expanded.add(variant.upper())

    return {v for v in expanded if v}


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def tokenize(text: str) -> list[str]:
    """Split text into lowercase tokens."""
    return [t for t in text.lower().split() if t]


def normalize_vowels(text: str) -> str:
    """
    Unify confusing vowels (o/a, e/i) for phonetic comparison.
    Useful for users with poor grammar (e.g., 'лагатип' vs 'логотип').
    """
    text = text.lower()
    # Unify Cyrillic
    text = text.replace('о', 'а').replace('ё', 'и').replace('е', 'и').replace('э', 'и').replace('ы', 'и')
    # Unify Latin (also covers common translit confusion)
    text = text.replace('o', 'a').replace('e', 'i').replace('y', 'i')
    return text


def score_token(q_tok: str, document_tokens: list[str]) -> float:
    """
    Score one query token against all document tokens,
    trying both original and transliterated variants.
    """
    # Build variants
    q_variants: set[str] = {q_tok}
    cyr = lat_to_cyr(q_tok)
    lat = cyr_to_lat(q_tok)
    if cyr: q_variants.add(cyr)
    if lat: q_variants.add(lat)

    best_score = 0.0
    
    # 0. Specialized check: Normalized prefix/exact (for grammar errors)
    norm_q_vars = {normalize_vowels(v) for v in q_variants if v}
    norm_doc_toks = [(t, normalize_vowels(t)) for t in document_tokens]
    
    for q_norm in norm_q_vars:
        for p_orig, p_norm in norm_doc_toks:
            if p_norm == q_norm:
                return 1.0 # Exact match after vowel normalization
            if p_norm.startswith(q_norm):
                # High score for prefix match (normalized)
                len_diff = len(p_norm) - len(q_norm)
                score = 0.90 - (len_diff * 0.05)
                score = max(0.6, score)
                if score > best_score:
                    best_score = score

    for q_var in q_variants:
        if not q_var: continue
        
        # 1. Check for exact/prefix match (Predictive)
        for p_tok in document_tokens:
            if p_tok.startswith(q_var):
                # Higher score for small difference in length
                len_diff = len(p_tok) - len(q_var)
                score = 0.95 - (len_diff * 0.05)
                score = max(0.6, score) # min 0.6 for prefix
                if score > best_score:
                    best_score = score
        
        # 2. Check for fuzzy match (Levenshtein)
        max_dist = max_distance_for(q_var)
        for p_tok in document_tokens:
            dist = levenshtein(q_var, p_tok)
            if dist == 0: return 1.0
            if dist <= max_dist:
                # 1 typo = 0.8, 2 typos = 0.6
                score = 1.0 - (dist * 0.2)
                if score > best_score:
                    best_score = score

    return best_score


def score_document(query_tokens: list[str], document_text: str) -> float:
    """
    Return average similarity score [0..1] for all query tokens.
    Strict logic: requires at least 50% of tokens to match something.
    Penalizes unrelated (zero-score) tokens heavily.
    """
    if not query_tokens: return 1.0
    doc_tokens = tokenize(document_text)
    if not doc_tokens: return 0.0

    token_scores = [score_token(tok, doc_tokens) for tok in query_tokens]
    
    # Requirement: majority of tokens must match (fixes gibberish issue)
    match_count = sum(1 for s in token_scores if s > 0)
    if len(query_tokens) > 1 and match_count < (len(query_tokens) / 2.0):
        return 0.0

    # Average score
    final_score = sum(token_scores) / len(query_tokens)
    
    # Penalty for unmatched words in multi-token queries
    if len(query_tokens) > 1:
        for s in token_scores:
            if s == 0:
                final_score *= 0.5 # Penalty for each junk word
                
    return final_score
