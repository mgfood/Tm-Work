
import sys
import os

# Allow running as a standalone script (no Django)
sys.path.insert(0, os.path.dirname(__file__))

from apps.core.search import score_document, tokenize

def normalize_simple(text: str) -> str:
    # Unify o/a and e/i/yo/ye
    text = text.lower()
    text = text.replace('о', 'а').replace('ё', 'е').replace('и', 'е').replace('ы', 'и')
    # Latin versions too?
    text = text.replace('o', 'a').replace('e', 'i').replace('y', 'i')
    return text

def test_normalization():
    print("--- Normalization Idea Test ---")
    
    q = "lag"
    doc = "логотип"
    
    q_norm = normalize_simple(q)
    doc_norm = normalize_simple(doc)
    
    print(f"Original: '{q}' vs '{doc}'")
    print(f"Normalized: '{q_norm}' vs '{doc_norm}'")
    print(f"Starts with? {doc_norm.startswith(q_norm)}")
    
    # Check 'саздать' vs 'создать'
    q2 = "саздать"
    doc2 = "создать"
    print(f"\nOriginal: '{q2}' vs '{doc2}'")
    print(f"Normalized: '{normalize_simple(q2)}' vs '{normalize_simple(doc2)}'")
    print(f"Equal? {normalize_simple(q2) == normalize_simple(doc2)}")

if __name__ == "__main__":
    test_normalization()
