import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

ML_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ML_ROOT / "data" / "candidates.csv"
MODEL_PATH = ML_ROOT / "models" / "candidate_ranker.pkl"

def train():
    if not DATA_PATH.exists():
        print("❌ Файл данных не найден! Сначала запусти generate_data.py")
        return

    # 1. Загрузка
    df = pd.read_csv(DATA_PATH)
    X = df.drop('score', axis=1)
    y = df['score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 2. Создание Pipeline (Масштабирование + Модель)
    model_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('rf', RandomForestRegressor(n_estimators=100, random_state=42))
    ])

    # 3. Обучение
    print("⏳ Обучение модели...")
    model_pipeline.fit(X_train, y_train)

    # 4. Проверка точности
    preds = model_pipeline.predict(X_test)
    error = mean_absolute_error(y_test, preds)
    print(f"📊 Средняя ошибка модели: {error:.2f} баллов из 100")

    # 5. Сохранение
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(model_pipeline, MODEL_PATH)
    print(f"💾 Модель сохранена в: {MODEL_PATH}")

if __name__ == "__main__":
    train()