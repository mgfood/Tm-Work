import pandas as pd
import numpy as np
import os
from pathlib import Path

# Определяем пути относительно этого файла
ML_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ML_ROOT / "data"

def generate_dataset(n_samples=1500):
    DATA_DIR.mkdir(exist_ok=True)
    np.random.seed(42)
    
    data = {
        'skills_match': np.random.uniform(0, 1, n_samples),      # 0.0 - 1.0
        'experience_months': np.random.randint(0, 120, n_samples), # 0 - 10 лет
        'avg_rating': np.random.uniform(1, 5, n_samples),        # 1.0 - 5.0
        'projects_completed': np.random.randint(0, 200, n_samples),
        'is_verified': np.random.choice([0, 1], n_samples)       # Галочка верификации
    }
    
    df = pd.DataFrame(data)
    
    # Создаем целевую переменную 'score' (0-100)
    # Навыки дают 40%, рейтинг 20%, опыт и проекты по 15%, верификация 10%
    df['score'] = (
        df['skills_match'] * 40 + 
        (df['avg_rating'] / 5) * 20 + 
        (df['experience_months'] / 120) * 15 + 
        (df['projects_completed'] / 200) * 15 + 
        df['is_verified'] * 10 +
        np.random.normal(0, 2, n_samples) # Небольшой шум для реализма
    ).clip(0, 100)
    
    df.to_csv(DATA_DIR / "candidates.csv", index=False)
    print(f"✅ Датасет создан: {DATA_DIR / 'candidates.csv'}")

if __name__ == "__main__":
    generate_dataset()