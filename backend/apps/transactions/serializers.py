from decimal import Decimal
from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user_email', 'amount', 'type', 'description', 'created_at']
        read_only_fields = fields

class WalletSummarySerializer(serializers.Serializer):
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    recent_transactions = TransactionSerializer(many=True)

class DepositTestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))


from .models import WithdrawalRequest

class WithdrawalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'amount', 'bank_details', 'status', 
            'admin_comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'admin_comment', 'created_at', 'updated_at']

    def validate_amount(self, value):
        from decimal import Decimal
        if value < Decimal('50.00'):
            raise serializers.ValidationError("Минимальная сумма для вывода — 50 TMT.")
        return value
