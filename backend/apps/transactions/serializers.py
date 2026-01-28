from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model (read-only)"""
    class Meta:
        model = Transaction
        fields = [
            'id',
            'user',
            'amount',
            'type',
            'reference_id',
            'description',
            'created_at'
        ]
        read_only_fields = fields
