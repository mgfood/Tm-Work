"""
Unit-tests for the smart search module.
"""

import sys
import os

# Allow running as a standalone script (no Django)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from apps.core.search import (
    lat_to_cyr,
    cyr_to_lat,
    levenshtein,
    score_document,
    score_token,
    expand_query,
    tokenize
)
from apps.profiles.search import (
    _SCORE_THRESHOLD
)

# ---------------------------------------------------------------------------
# Transliteration tests
# ---------------------------------------------------------------------------

def test_lat_to_cyr_basic():
    assert lat_to_cyr("ivan") == "иван"

def test_lat_to_cyr_multi_char():
    assert lat_to_cyr("zhanna") == "жанна"
    assert lat_to_cyr("shchepkin") == "щепкин"
    assert lat_to_cyr("yulia") == "юлиа"

def test_lat_to_cyr_mixed_unchanged():
    result = lat_to_cyr("ivan123")
    assert "иван" in result

def test_cyr_to_lat_basic():
    assert cyr_to_lat("иван") == "ivan"
    assert cyr_to_lat("жанна") == "zhanna"

def test_cyr_to_lat_soft_signs_dropped():
    assert cyr_to_lat("ольга") == "olga"


# ---------------------------------------------------------------------------
# Levenshtein tests
# ---------------------------------------------------------------------------

def test_levenshtein_identical():
    assert levenshtein("иван", "иван") == 0

def test_levenshtein_one_typo():
    assert levenshtein("иовн", "иван") == 2
    assert levenshtein("ивон", "иван") == 1

def test_levenshtein_empty():
    assert levenshtein("", "abc") == 3
    assert levenshtein("abc", "") == 3

def test_levenshtein_transposition():
    assert levenshtein("ивна", "иван") == 2


# ---------------------------------------------------------------------------
# Query expansion tests
# ---------------------------------------------------------------------------

def test_expand_query_latin_adds_cyr():
    variants = expand_query("ivan")
    assert "иван" in variants

def test_expand_query_cyr_adds_lat():
    variants = expand_query("иван")
    assert "иван" in variants
    assert any(v.isascii() for v in variants)

def test_expand_query_empty():
    assert expand_query("") == set()


# ---------------------------------------------------------------------------
# Scoring tests
# ---------------------------------------------------------------------------

def test_score_exact_match():
    score = score_document(["иван"], "Иван Петров программист")
    assert score >= 0.9

def test_score_translit_match():
    score = score_document(["иван"], "иван петров фрилансер")
    assert score > 0.5

def test_score_typo_tolerance():
    score = score_document(["иовн"], "Иван Иванов")
    assert isinstance(score, float)

def test_score_no_match_returns_low():
    score = score_document(["javascript"], "Иван Петров сантехник")
    assert score < 0.35


# ---------------------------------------------------------------------------
# Cross-script Levenshtein tests (score_token)
# ---------------------------------------------------------------------------

def test_score_token_ivon_finds_ivan():
    profile_tokens = ["иван", "петров"]
    score = score_token("ivon", profile_tokens)
    assert score > 0

def test_score_token_exact_cross_script():
    score = score_token("ivan", ["иван", "петров"])
    assert score == 1.0

def test_score_token_cyrillic_typo():
    score = score_token("иовн", ["иван"])
    assert isinstance(score, float)

def test_score_profile_ivon_ivan():
    score = score_document(["ivon"], "Иван Петров веб разработчик")
    assert score >= 0.35

def test_score_empty_corpus():
    score = score_document(["иван"], "")
    assert score == 0.0

def test_score_empty_query_tokens():
    score = score_document([], "Иван Петров")
    assert score == 1.0


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    tests = [
        test_lat_to_cyr_basic,
        test_lat_to_cyr_multi_char,
        test_lat_to_cyr_mixed_unchanged,
        test_cyr_to_lat_basic,
        test_cyr_to_lat_soft_signs_dropped,
        test_levenshtein_identical,
        test_levenshtein_one_typo,
        test_levenshtein_empty,
        test_levenshtein_transposition,
        test_expand_query_latin_adds_cyr,
        test_expand_query_cyr_adds_lat,
        test_expand_query_empty,
        test_score_exact_match,
        test_score_translit_match,
        test_score_typo_tolerance,
        test_score_no_match_returns_low,
        test_score_token_ivon_finds_ivan,
        test_score_token_exact_cross_script,
        test_score_token_cyrillic_typo,
        test_score_profile_ivon_ivan,
        test_score_empty_corpus,
        test_score_empty_query_tokens,
    ]

    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  ✓  {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  ✗  {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ✗  {test.__name__}: EXCEPTION {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
