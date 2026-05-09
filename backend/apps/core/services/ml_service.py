import sys
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Путь к ML модулю (внешний прототип — опционален)
ML_PATH = str(settings.BASE_DIR.parent / 'ml')
if ML_PATH not in sys.path:
    sys.path.append(ML_PATH)

# Попытка загрузить обученную sklearn-модель из прототипа (опционально)
_trained_ranker = None
try:
    from src.inference import ranker as _trained_ranker
    logger.info("ML Module loaded successfully (trained sklearn model active).")
except Exception as e:
    logger.info(f"Trained ML model not available ({e}). Using built-in heuristic ranker.")


def _heuristic_rank(features: list) -> list:
    """
    Встроенный эвристический ранжировщик.
    Работает полностью без внешних зависимостей.

    Веса (сумма = 100):
      - skills_match       40% — совпадение навыков (ключевое)
      - avg_rating         25% — рейтинг фрилансера
      - experience_months  15% — опыт
      - projects_completed 10% — кол-во завершенных проектов
      - is_verified        10% — верификация аккаунта
    """
    MAX_EXPERIENCE_MONTHS = 120.0   # 10 лет
    MAX_PROJECTS = 200.0
    MAX_RATING = 5.0

    def score(item: dict) -> float:
        skills    = min(float(item.get('skills_match', 0)), 1.0) * 40.0
        rating    = (min(float(item.get('avg_rating', 0)), MAX_RATING) / MAX_RATING) * 25.0
        exp       = (min(float(item.get('experience_months', 0)), MAX_EXPERIENCE_MONTHS) / MAX_EXPERIENCE_MONTHS) * 15.0
        projects  = (min(float(item.get('projects_completed', 0)), MAX_PROJECTS) / MAX_PROJECTS) * 10.0
        verified  = float(bool(item.get('is_verified', 0))) * 10.0
        return skills + rating + exp + projects + verified

    return sorted(features, key=score, reverse=True)


class MLRecommendationService:
    """
    Двухконтурная система ИИ для TmWork.

    1. Feed Recommender  — персонализация ленты заказов для фрилансера.
    2. Search Ranker     — умное ранжирование результатов поиска по ключевым словам.

    Приоритет движков:
      1. Обученная sklearn-модель из /ml/ (если загружена)
      2. Встроенный эвристический алгоритм (всегда доступен, без зависимостей)
    """

    @staticmethod
    def _prepare_features(user, jobs: list) -> list | None:
        """Подготовка вектора признаков для каждого заказа."""
        profile = getattr(user, 'profile', None)
        if not profile:
            return None

        user_skills = set(
            profile.skills.values_list('name', flat=True)
        ) if hasattr(profile, 'skills') else set()
        # Нормализуем навыки пользователя
        user_skills_lower = {s.lower() for s in user_skills}

        candidates = []
        for job in jobs:
            job_keywords = set()
            if job.category:
                job_keywords.add(job.category.name.lower())
            job_keywords.update(job.title.lower().split())

            matches = len(user_skills_lower.intersection(job_keywords))
            skills_match = min(1.0, matches * 0.25)

            candidates.append({
                'job_id':             job.id,
                'skills_match':       float(skills_match),
                'experience_months':  float(getattr(profile, 'experience_years', 0)) * 12,
                'avg_rating':         float(getattr(profile, 'freelancer_rating', 0)),
                'projects_completed': int(getattr(profile, 'completed_works_count', 0)),
                'is_verified':        1 if getattr(profile, 'is_verified', False) else 0,
            })
        return candidates

    @staticmethod
    def _rank(features: list) -> list:
        """Единая точка ранжирования: сначала пробуем обученную модель, иначе — эвристика."""
        if _trained_ranker is not None:
            try:
                return _trained_ranker.get_rankings(features)
            except Exception as e:
                logger.warning(f"Trained ranker failed, falling back to heuristic: {e}")
        return _heuristic_rank(features)

    @staticmethod
    def get_feed_recommendations(user, jobs_queryset):
        """
        AI контур №1: Рекомендатель для ленты.
        Ориентируется на совпадение навыков и профессиональный профиль.
        """
        if not user.is_authenticated:
            return jobs_queryset.order_by('-created_at')

        jobs = list(jobs_queryset.order_by('-created_at')[:100])
        if not jobs:
            return jobs_queryset

        features = MLRecommendationService._prepare_features(user, jobs)
        if not features:
            return jobs_queryset

        try:
            ranked = MLRecommendationService._rank(features)
            job_map = {job.id: job for job in jobs}
            return [job_map[item['job_id']] for item in ranked if item['job_id'] in job_map]
        except Exception as e:
            logger.error(f"Feed Recommender error: {e}")
            return jobs_queryset

    @staticmethod
    def get_search_recommendations(user, search_results):
        """
        AI контур №2: Поисковый ранжировщик.
        На входе — уже отфильтрованные по ключевым словам заказы.
        ИИ лишь переставляет их по релевантности профилю пользователя.
        """
        if not user.is_authenticated or not search_results:
            return search_results

        features = MLRecommendationService._prepare_features(user, search_results)
        if not features:
            return search_results

        try:
            ranked = MLRecommendationService._rank(features)
            job_map = {job.id: job for job in search_results}
            return [job_map[item['job_id']] for item in ranked if item['job_id'] in job_map]
        except Exception as e:
            logger.error(f"Search Ranker error: {e}")
            return search_results
