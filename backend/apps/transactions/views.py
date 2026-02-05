from rest_framework import viewsets, permissions
from .models import Transaction
from .serializers import TransactionSerializer


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

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import WalletSummarySerializer, DepositTestSerializer
from .services import TransactionService

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
