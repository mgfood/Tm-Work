"""
Unit-tests for the smart search module for Jobs.
"""

import sys
import os

# Allow running as a standalone script (no Django)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from apps.jobs.search import smart_filter_jobs
from apps.core.search import score_document, tokenize

class MockCategory:
    def __init__(self, name, name_ru=None, name_tk=None):
        self.name = name
        self.name_ru = name_ru
        self.name_tk = name_tk

class MockJob:
    def __init__(self, id, title, description, category=None, created_at=None):
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.created_at = created_at

def test_score_job_basic():
    job = MockJob(1, "Python Developer", "Looking for a senior developer")
    doc = f"{job.title} {job.description}"
    score = score_document(tokenize("python"), doc)
    assert score == 1.0

def test_score_job_typo():
    # 'pyton' vs 'python'
    score = score_document(tokenize("pyton"), "Python Developer")
    assert score > 0.5 

def test_score_job_translit():
    # 'razrabotchik' (lat) vs 'разработчик' (cyr)
    score = score_document(tokenize("razrabotchik"), "Python разработчик")
    assert score == 1.0

def test_score_job_category():
    cat = MockCategory("Design", "Дизайн", "Dizaýn")
    job = MockJob(1, "UI/UX", "Need a hero", category=cat)
    # Search for cyrillic category name
    corpus = f"{job.title} {job.description} {cat.name} {cat.name_ru} {cat.name_tk}"
    score = score_document(tokenize("дизайн"), corpus)
    assert score == 1.0

if __name__ == "__main__":
    tests = [
        test_score_job_basic,
        test_score_job_typo,
        test_score_job_translit,
        test_score_job_category,
    ]
    
    passed = 0
    for test in tests:
        try:
            test()
            print(f"  ✓  {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"  ✗  {test.__name__}: {e}")
            
    print(f"\n{passed} tests passed.")
    sys.exit(0 if passed == len(tests) else 1)
