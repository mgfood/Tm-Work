from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VIPViewSet, GlobalSettingsViewSet

router = DefaultRouter()
router.register('plans', VIPViewSet, basename='vip-plans')
router.register('settings', GlobalSettingsViewSet, basename='global-settings')

urlpatterns = [
    path('', include(router.urls)),
]
