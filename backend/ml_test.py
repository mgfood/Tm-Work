from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. Текст заказа (из описания вакансии)
job_desc = ["Нужен дизайнер для создания логотипа и фирменного стиля в векторе (AI, SVG)."]

# 2. Список откликов или био фрилансеров
candidates = [
    "Я пишу код на Python и Django, создаю сайты",             # Вообще не то
    "Занимаюсь графическим дизайном, рисую лого в Adobe Illustrator", # Отличный мэтч
    "Переведу ваши тексты на туркменский и русский языки",     # Не подходит
    "Рисую баннеры, векторные иконки и занимаюсь стилем"       # Тоже неплохо
]

# Создаем инструмент для превращения текста в числа
vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))

# Обучаем на всех текстах
tfidf_matrix = vectorizer.fit_transform(job_desc + candidates)

# Считаем сходство (первый элемент с остальными)
scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

# Выводим результат
print("--- Рейтинг кандидатов ---")
for i, score in enumerate(scores):
    print(f"Кандидат №{i+1}: Сходство {score:.2f} | Текст: {candidates[i][:50]}...")