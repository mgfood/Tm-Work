from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import AdminRole

User = get_user_model()

from django.db.models import Sum
from apps.transactions.models import Transaction


class AdminRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminRole
        fields = [
            'id', 'name', 'codename', 'description',
            'can_manage_users', 'can_manage_jobs', 'can_manage_finance',
            'can_manage_content', 'can_manage_vip', 'can_manage_admins',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffUserSerializer(serializers.ModelSerializer):
    admin_role = AdminRoleSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'is_staff', 'is_active', 'admin_role', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class AssignRoleSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    admin_role_id = serializers.IntegerField(allow_null=True, required=False)
    
    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Пользователь не найден")
        return value
    
    def validate_admin_role_id(self, value):
        if value and not AdminRole.objects.filter(id=value).exists():
            raise serializers.ValidationError("Роль не найдена")
        return value


class RevenueStatsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    month_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = serializers.IntegerField()
    system_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
