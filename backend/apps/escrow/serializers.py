from rest_framework import serializers
from .models import Escrow


class EscrowSerializer(serializers.ModelSerializer):
    """Serializer for Escrow model"""
    class Meta:
        model = Escrow
        fields = [
            'id',
            'job',
            'amount',
            'status',
            'payer',
            'payee',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
