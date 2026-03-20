import joblib
import os

class ModelPredictor:
    def __init__(self):
        # Путь к сохраненной модели
        model_path = os.path.join(os.path.dirname(__file__), '../models/my_model.pkl')
        self.model = joblib.load(model_path)

    def predict(self, data):
        # Здесь логика предобработки и предсказания
        result = self.model.predict([data])
        return result[0]

# Создаем экземпляр для импорта
predictor = ModelPredictor()