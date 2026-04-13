import sys
import os
import logging
import pandas as pd
from django.conf import settings
from pathlib import Path

logger = logging.getLogger(__name__)

# Путь к ML модулю
ML_PATH = str(settings.BASE_DIR.parent / 'ml')
if ML_PATH not in sys.path:
    sys.path.append(ML_PATH)

try:
    from src.inference import ranker
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML Module not found at {ML_PATH}: {e}")
    ML_AVAILABLE = False

class MLRecommendationService:
    """
    Двухконтурная система ИИ для TmWork.
    1. Feed Recommender: Персонализация ленты на основе навыков и опыта.
    2. Search Ranker: Умное ранжирование результатов поиска по ключевым словам.
    """

    @staticmethod
    def _prepare_ml_features(user, jobs):
        """Подготовка признаков для загрузки в модель"""
        profile = getattr(user, 'profile', None)
        if not profile:
            return None

        user_skills = set(profile.skills.values_list('name', flat=True)) if hasattr(profile, 'skills') else set()
        
        candidates_data = []
        for job in jobs:
            # Расчет совпадения навыков (Heuristic)
            job_keywords = set([job.category.name.lower()] if job.category else [])
            job_keywords.update(job.title.lower().split())
            
            matches = len(user_skills.intersection(job_keywords))
            skills_match = min(1.0, (matches * 0.25)) # Приводим к 0-1
            
            candidates_data.append({
                'job_id': job.id,
                'skills_match': float(skills_match),
                'experience_months': float(profile.experience_years * 12) if hasattr(profile, 'experience_years') else 0.0,
                'avg_rating': float(profile.freelancer_rating) if hasattr(profile, 'freelancer_rating') else 0.0,
                'projects_completed': int(profile.completed_works_count) if hasattr(profile, 'completed_works_count') else 0,
                'is_verified': 1 if getattr(profile, 'is_verified', False) else 0
            })
        return candidates_data

    @staticmethod
    def get_feed_recommendations(user, jobs_queryset):
        """
        AI контур №1: Рекомендатель для ленты.
        Ориентируется на 'предпочтения' и 'совместимость'.
        """
        if not ML_AVAILABLE or not user.is_authenticated:
            return jobs_queryset.order_by('-created_at')

        # Берем последние 100 активных заказов для ранжирования
        jobs = list(jobs_queryset.order_by('-created_at')[:100])
        if not jobs: return jobs_queryset

        features = MLRecommendationService._prepare_ml_features(user, jobs)
        if not features: return jobs_queryset

        try:
            ranked_results = ranker.get_rankings(features)
            job_map = {job.id: job for job in jobs}
            
            return [job_map[item['job_id']] for item in ranked_results if item['job_id'] in job_map]
        except Exception as e:
            logger.error(f"Feed AI Error: {e}")
            return jobs_queryset

    @staticmethod
    def get_search_recommendations(user, search_results):
        """
        AI контур №2: Поисковый ранжировщик.
        На входе - уже отфильтрованные по словам заказы.
        На выходе - они же, но с учетом 'профессионального попадания'.
        """
        if not ML_AVAILABLE or not user.is_authenticated or not search_results:
            return search_results

        # Здесь мы не меняем состав выборки, только порядок внутри неё.
        features = MLRecommendationService._prepare_ml_features(user, search_results)
        if not features: return search_results

        try:
            ranked_results = ranker.get_rankings(features)
            job_map = {job.id: job for job in search_results}
            
            # Сохраняем логику: Ключевые слова важны, поэтому ИИ лишь 'подправляет' веса.
            # (Но в текущей реализации ranker.get_rankings полностью пересортирует).
            return [job_map[item['job_id']] for item in ranked_results if item['job_id'] in job_map]
        except Exception as e:
            logger.error(f"Search AI Error: {e}")
            return search_results
