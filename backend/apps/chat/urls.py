from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThreadViewSet, MessageViewSet, AdminBroadcastView

router = DefaultRouter()
router.register(r'threads', ThreadViewSet, basename='thread')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'admin-broadcast', AdminBroadcastView, basename='admin-broadcast')

urlpatterns = [
    path('', include(router.urls)),
]
