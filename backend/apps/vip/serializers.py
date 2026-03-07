from rest_framework import serializers
from .models import VIPPlan, GlobalSettings, VIPSubscription

class GlobalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSettings
        fields = ['regular_commission', 'vip_commission', 'updated_at']

class VIPPlanSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = VIPPlan
        fields = [
            'id', 'name', 'months', 'price_per_month', 
            'discount_percentage', 'total_price', 
            'badge_icon', 'badge_color', 'is_active'
        ]

class VIPSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    is_active = serializers.BooleanField(source='is_currently_active', read_only=True)
    
    class Meta:
        model = VIPSubscription
        fields = ['id', 'plan_name', 'start_date', 'end_date', 'is_active']
