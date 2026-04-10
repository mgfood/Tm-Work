from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.administration.models import SystemSetting
from .models import Transaction, WithdrawalRequest
from .serializers import (
    TransactionSerializer, WalletSummarySerializer, 
    DepositTestSerializer, WithdrawalRequestSerializer
)
from .services import TransactionService


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Transaction history (read-only)
    
    GET /api/v1/transactions/
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see only their own transactions
        user = self.request.user
        if user.is_staff:
            return Transaction.objects.all()
        return Transaction.objects.filter(user=user)


class WalletSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        balance = user.profile.balance
        recent_transactions = Transaction.objects.filter(user=user)[:10]
        
        serializer = WalletSummarySerializer({
            'balance': balance,
            'recent_transactions': recent_transactions
        })
        return Response(serializer.data)


class DepositTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DepositTestSerializer(data=request.data)
        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            TransactionService.process_deposit(
                user=request.user,
                amount=amount,
                description="Test deposit (Stub)"
            )
            return Response(
                {"detail": "Balance successfully topped up (Test mode)"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WithdrawalRequestView(generics.ListCreateAPIView):
    """
    POST /api/v1/transactions/withdrawals/ - Create request
    GET /api/v1/transactions/withdrawals/ - List own requests
    """
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WithdrawalRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        amount = serializer.validated_data['amount']

        # 1. Check current balance
        if user.profile.balance < amount:
            raise ValidationError("Недостаточно средств на балансе.")

        # 2. Check weekly limit (10,000 TMT)
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        # Sum of Pending and Completed requests in last 7 days
        weekly_total = WithdrawalRequest.objects.filter(
            user=user,
            status__in=[WithdrawalRequest.Status.PENDING, WithdrawalRequest.Status.COMPLETED],
            created_at__gte=seven_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0

        if weekly_total + amount > 10000:
            raise ValidationError(f"Превышен еженедельный лимит вывода. Вы уже вывели/запросили {weekly_total} TMT за последние 7 дней. Лимит: 10,000 TMT.")

        # 3. Check auto-approve setting
        settings = SystemSetting.get_settings()
        
        if settings.auto_approve_withdrawals:
            # Auto-approve flow using service
            withdrawal_req = serializer.save(user=user)
            TransactionService.process_auto_withdrawal(user, amount, withdrawal_req)
        else:
            # Manual approval flow
            # Note: We don't deduct money yet! 
            # Money will be deducted when admin APPROVES (COMPLETES) the request.
            # This prevents locking money if the request is rejected.
            serializer.save(user=user)
