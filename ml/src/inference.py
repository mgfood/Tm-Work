import joblib
import pandas as pd
from pathlib import Path

class MLManager:
    def __init__(self):
        self.root = Path(__file__).resolve().parent.parent
        # Загружаем модель ранжирования
        self.ranker_model = self._load('candidate_ranker.pkl')
        # Сюда в будущем добавим: self.category_model = self._load('category_classifier.pkl')

    def _load(self, name):
        path = self.root / "models" / name
        if path.exists():
            return joblib.load(path)
        print(f"⚠️ Файл модели {name} не найден!")
        return None

    def get_rankings(self, candidates_data):
        """Метод для ранжирования кандидатов"""
        if not self.ranker_model:
            return candidates_data

        df = pd.DataFrame(candidates_data)
        
        # Выбираем только нужные признаки для модели
        features = ['skills_match', 'experience_months', 'avg_rating', 'projects_completed', 'is_verified']
        
        # Предсказание
        df['ai_score'] = self.ranker_model.predict(df[features]).round(1)
        
        # Сортировка по убыванию рейтинга
        return df.sort_values(by='ai_score', ascending=False).to_dict('records')

# Создаем единый объект для импорта
ranker = MLManager()