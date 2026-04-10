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
    path('settings/', views_admin.SystemSettingsView.as_view(), name='system-settings'),
    
    # Balance Adjustment Requests
    path('balance-requests/', views_admin.BalanceAdjustmentRequestView.as_view(), name='balance-requests'),
    path('balance-requests/<int:pk>/review/', views_admin.BalanceAdjustmentReviewView.as_view(), name='admin-balance-request-review'),
    
    # Contact Messages
    path('contact/', views_admin.ContactMessageCreateView.as_view(), name='contact-create'),
    path('contact-messages/', views_admin.ContactMessageListView.as_view(), name='admin-contact-messages'),
    
    # Withdrawal Management
    path('withdrawals/', views_admin.AdminWithdrawalRequestListView.as_view(), name='admin-withdrawals'),
    path('withdrawals/<int:pk>/review/', views_admin.AdminWithdrawalRequestReviewView.as_view(), name='admin-withdrawal-review'),
]
