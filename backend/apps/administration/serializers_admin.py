from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import serializers

from apps.transactions.models import Transaction, WithdrawalRequest
from apps.users.models import AdminRole
from .models import BalanceAdjustmentRequest, ContactMessage, SystemSetting

User = get_user_model()


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
            'is_staff', 'is_superuser', 'is_active', 'admin_role', 'date_joined', 'last_login'
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


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = [
            'auto_delete_enabled', 'retention_days', 'auto_approve_withdrawals',
            'delete_name', 'delete_email', 'delete_bio', 'delete_skills',
            'delete_social_links', 'delete_avatar', 'delete_portfolio', 'delete_messages'
        ]


class BalanceAdjustmentRequestSerializer(serializers.ModelSerializer):
    requester_email = serializers.EmailField(source='requester.email', read_only=True)
    target_user_email = serializers.EmailField(source='target_user.email', read_only=True)
    approver_email = serializers.EmailField(source='approver.email', read_only=True, allow_null=True)
    
    class Meta:
        model = BalanceAdjustmentRequest
        fields = [
            'id', 'requester_email', 'target_user', 'target_user_email',
            'amount', 'reason', 'status', 'approver_email',
            'admin_comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'approver_email']

    def validate_amount(self, value):
        if value == 0:
            raise serializers.ValidationError("Сумма не может быть равна нулю")
        return value


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'message', 
            'status', 'admin_comment', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']


class AdminWithdrawalRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user_email', 'full_name', 'amount', 
            'bank_details', 'status', 'admin_comment', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_email', 'full_name', 'amount', 
            'bank_details', 'created_at', 'updated_at'
        ]
