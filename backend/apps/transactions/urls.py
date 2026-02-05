from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, WalletSummaryView, DepositTestView

router = DefaultRouter()
router.register(r'', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('summary/', WalletSummaryView.as_view(), name='wallet-summary'),
    path('deposit-test/', DepositTestView.as_view(), name='deposit-test'),
    path('', include(router.urls)),
]
