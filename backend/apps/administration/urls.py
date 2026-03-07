from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdministrationViewSet
from . import views_admin

router = DefaultRouter()
router.register('', AdministrationViewSet, basename='admin-actions')

urlpatterns = [
    path('', include(router.urls)),
    
    # Admin Role Management
    path('roles/', views_admin.AdminRoleListView.as_view(), name='admin-roles'),
    path('staff/', views_admin.StaffListView.as_view(), name='staff-list'),
    path('assign-role/', views_admin.AssignAdminRoleView.as_view(), name='assign-role'),
    path('revenue/', views_admin.RevenueStatsView.as_view(), name='revenue-stats'),
]
