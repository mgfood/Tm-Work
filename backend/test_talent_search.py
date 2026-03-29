
import sys
import os

# Allow running as a standalone script (no Django)
sys.path.insert(0, os.path.dirname(__file__))

from apps.core.search import score_document, tokenize

def test_talents():
    print("--- Talent Search Verification ---")
    
    # Case Talent: 'ivon' finding 'Иван Петров'
    query = "ivon"
    corpus = "Иван Петров Python разработчик"
    score = score_document(tokenize(query), corpus)
    print(f"Query: '{query}' -> Score: {score:.4f} (Threshold 0.45)")
    
    # Case Grammar: 'сандау' (sandau) vs 'Санжар' (Sanshar) - prefix
    # Wait, 'sand' vs 'san'
    query2 = "lag"
    corpus2 = "Санжар Логотипов Дизайнер"
    score2 = score_document(tokenize(query2), corpus2)
    print(f"Query: '{query2}' -> Score: {score2:.4f}")

if __name__ == "__main__":
    test_talents()
