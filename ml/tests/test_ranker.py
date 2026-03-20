import sys
import os
from pathlib import Path

# Добавляем родительскую директорию (папку ml) в пути поиска Python
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Теперь этот импорт сработает
from src.inference import ranker

# Имитируем данные из базы данных Django
db_candidates = [
    {
        'skills_match': 0.1, 
        'experience_months': 2, 
        'avg_rating': 2.5, 
        'projects_completed': 1, 
        'is_verified': 0,
        'name': 'Новичок'
    },
    {
        'skills_match': 0.95, 
        'experience_months': 48, 
        'avg_rating': 4.9, 
        'projects_completed': 120, 
        'is_verified': 1,
        'name': 'Профи'
    },
    {
        'skills_match': 0.7, 
        'experience_months': 12, 
        'avg_rating': 4.0, 
        'projects_completed': 15, 
        'is_verified': 1,
        'name': 'Среднячок'
    }
]

print("--- Тестирование ранжирования TmWork AI ---")
results = ranker.get_rankings(db_candidates)

for i, res in enumerate(results, 1):
    print(f"{i}. {res['name']} | AI Score: {res['ai_score']} | Verified: {res['is_verified']}")