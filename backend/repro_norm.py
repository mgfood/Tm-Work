
import sys
import os

# Allow running as a standalone script (no Django)
sys.path.insert(0, os.path.dirname(__file__))

from apps.core.search import score_document, tokenize

def test_repro():
    print("--- Normalization Verification ---")
    
    # Case 4: 'lag' (Lat) vs 'логотип' (Cyr)
    query_4 = "lag"
    corpus_4 = "Создать логотип для сайта"
    score_4 = score_document(tokenize(query_4), corpus_4)
    print(f"Query 4: '{query_4}' -> Score: {score_4:.4f} (Threshold 0.4)")
    
    # Case 5: 'саздать' (Grammar error) vs 'создать'
    query_5 = "саздать"
    score_5 = score_document(tokenize(query_5), corpus_4)
    print(f"Query 5: '{query_5}' -> Score: {score_5:.4f}")

    # Case 6: 'лагатип' vs 'логотип'
    query_6 = "лагатип"
    score_6 = score_document(tokenize(query_6), corpus_4)
    print(f"Query 6: '{query_6}' -> Score: {score_6:.4f}")

if __name__ == "__main__":
    test_repro()
