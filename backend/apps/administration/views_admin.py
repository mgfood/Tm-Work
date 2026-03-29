from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

from apps.users.models import User, AdminRole
from apps.users.permissions import IsSuperAdmin, HasAdminPermission
from apps.transactions.models import Transaction
from .serializers_admin import (
    AdminRoleSerializer, StaffUserSerializer, 
    AssignRoleSerializer, RevenueStatsSerializer
)


class AdminRoleListView(APIView):
    """
    GET /api/v1/admin/roles/
    List all available admin roles (for assignment dropdown)
    """
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        roles = AdminRole.objects.all()
        serializer = AdminRoleSerializer(roles, many=True)
        return Response(serializer.data)


class StaffListView(APIView):
    """
    GET /api/v1/admin/staff/
    List all staff members (SuperAdmin only)
    """
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        staff_users = User.objects.filter(is_staff=True).select_related('admin_role')
        serializer = StaffUserSerializer(staff_users, many=True)
        return Response(serializer.data)


class AssignAdminRoleView(APIView):
    """
    POST /api/v1/admin/assign-role/
    Assign or remove admin role from user
    Body: {"user_id": 123, "admin_role_id": 1}  # or null to remove
    """
    permission_classes = [IsSuperAdmin]
    
    def post(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = serializer.validated_data['user_id']
        admin_role_id = serializer.validated_data.get('admin_role_id')
        
        user = User.objects.get(id=user_id)
        
        if admin_role_id:
            admin_role = AdminRole.objects.get(id=admin_role_id)
            user.admin_role = admin_role
            user.is_staff = True
            message = f"Роль '{admin_role.name}' назначена пользователю {user.email}"
        else:
            user.admin_role = None
            user.is_staff = False
            message = f"Роль снята с пользователя {user.email}"
        
        user.save()
        
        return Response({
            "detail": message,
            "user": StaffUserSerializer(user).data
        })


class RevenueStatsView(APIView):
    """
    GET /api/v1/admin/revenue/
    Get revenue statistics (SuperAdmin and Finance Manager)
    """
    permission_classes = [HasAdminPermission]
    permission_required = 'can_manage_finance'
    
    def get(self, request):
        # Get system wallet user
        system_email = getattr(settings, 'SYSTEM_WALLET_EMAIL', 'system@tmwork.tm')
        try:
            system_user = User.objects.get(email=system_email)
            system_balance = system_user.profile.balance
        except User.DoesNotExist:
            system_balance = 0
        
        # Total revenue (all FEE transactions to system)
        total_revenue = Transaction.objects.filter(
            user__email=system_email,
            type=Transaction.Type.FEE
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Today's revenue
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_revenue = Transaction.objects.filter(
            user__email=system_email,
            type=Transaction.Type.FEE,
            created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # This month's revenue
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_revenue = Transaction.objects.filter(
            user__email=system_email,
            type=Transaction.Type.FEE,
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Total transactions
        total_transactions = Transaction.objects.filter(
            user__email=system_email,
            type=Transaction.Type.FEE
        ).count()
        
        data = {
            'total_revenue': total_revenue,
            'today_revenue': today_revenue,
            'month_revenue': month_revenue,
            'total_transactions': total_transactions,
            'system_balance': system_balance
        }
        
        serializer = RevenueStatsSerializer(data)
        return Response(serializer.data)


class SystemSettingsView(APIView):
    """
    GET /api/v1/admin/settings/
    PUT /api/v1/admin/settings/
    Manage system-wide configuration (SuperAdmin only)
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        from .models import SystemSetting
        setting = SystemSetting.get_settings()
        from .serializers_admin import SystemSettingSerializer
        serializer = SystemSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        from .models import SystemSetting
        setting = SystemSetting.get_settings()
        old_auto_delete = setting.auto_delete_enabled
        
        from .serializers_admin import SystemSettingSerializer
        serializer = SystemSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            new_setting = serializer.save()
            
            # If auto_delete was turned ON just now, reset timers for currently deleted users
            if not old_auto_delete and new_setting.auto_delete_enabled:
                from apps.users.models import User
                from django.db.models import Q
                
                # Update deleted_at to NOW for users who are currently soft-deleted but not yet anonymized.
                # A user is anonymized if their first_name is empty (based on cleanup script logic).
                User.objects.filter(
                    is_deleted=True,
                ).exclude(
                    first_name=''
                ).update(deleted_at=timezone.now())
                
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
