
import sys
import os

# Allow running as a standalone script (no Django)
sys.path.insert(0, os.path.dirname(__file__))

from apps.core.search import score_document, tokenize

def test_repro():
    print("--- Search Logic Debugging ---")
    
    # Case 1: Gibberish (should be 0.0)
    query_1 = "sozdat fmsfdslkjflsafjlskflsjflamfdslddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
    corpus_1 = "Создать логотип для сайта"
    score_1 = score_document(tokenize(query_1), corpus_1)
    print(f"Query 1: '{query_1[:30]}...' -> Score: {score_1:.4f} (Threshold 0.4)")
    
    # Case 2: 'лагтип' vs 'логотип'
    query_2 = "лагтип"
    corpus_2 = "Создать логотип для сайта"
    score_2 = score_document(tokenize(query_2), corpus_2)
    print(f"Query 2: '{query_2}' -> Score: {score_2:.4f} (Threshold 0.4)")

    # Case 3: 'lagtip' (translit) vs 'логотип'
    query_3 = "lagtip"
    score_3 = score_document(tokenize(query_3), corpus_2)
    print(f"Query 3: '{query_3}' -> Score: {score_3:.4f}")

if __name__ == "__main__":
    test_repro()
