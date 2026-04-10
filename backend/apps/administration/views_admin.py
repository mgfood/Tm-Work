from datetime import timedelta
from django.conf import settings
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.users.models import User, AdminRole
from apps.users.permissions import IsSuperAdmin, HasAdminPermission
from apps.transactions.models import Transaction, WithdrawalRequest
from apps.transactions.services import TransactionService
from .models import AdminLog, BalanceAdjustmentRequest, ContactMessage, log_admin_action, SystemSetting
from .serializers_admin import (
    AdminRoleSerializer, StaffUserSerializer, 
    AssignRoleSerializer, RevenueStatsSerializer,
    BalanceAdjustmentRequestSerializer, ContactMessageSerializer,
    AdminWithdrawalRequestSerializer, SystemSettingSerializer
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
        # Включаем и сотрудников, и суперпользователей
        staff_users = User.objects.filter(
            Q(is_staff=True) | Q(is_superuser=True)
        ).select_related('admin_role').distinct()
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
        
        # Защита от самоувольнения
        if user == request.user:
            return Response(
                {"detail": "Вы не можете изменить свою собственную роль или уволить себя через этот интерфейс."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if admin_role_id:
            admin_role = AdminRole.objects.get(id=admin_role_id)
            user.admin_role = admin_role
            user.is_staff = True
            if admin_role.codename == 'super_admin':
                user.is_superuser = True
            else:
                user.is_superuser = False
            message = f"Роль '{admin_role.name}' назначена пользователю {user.email}"
        else:
            user.admin_role = None
            user.is_staff = False
            user.is_superuser = False
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
        setting = SystemSetting.get_settings()
        serializer = SystemSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting = SystemSetting.get_settings()
        old_auto_delete = setting.auto_delete_enabled
        
        serializer = SystemSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            new_setting = serializer.save()
            
            # If auto_delete was turned ON just now, reset timers for currently deleted users
            if not old_auto_delete and new_setting.auto_delete_enabled:
                # Update deleted_at to NOW for users who are currently soft-deleted but not yet anonymized.
                # A user is anonymized if their first_name is empty (based on cleanup script logic).
                User.objects.filter(
                    is_deleted=True,
                ).exclude(
                    first_name=''
                ).update(deleted_at=timezone.now())
                
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BalanceAdjustmentRequestView(APIView):
    """
    GET /api/v1/admin/balance-requests/
    POST /api/v1/admin/balance-requests/
    """
    permission_classes = [HasAdminPermission]
    permission_required = 'can_manage_finance'

    def get(self, request):
        status_filter = request.query_params.get('status')
        requests = BalanceAdjustmentRequest.objects.all().select_related('requester', 'target_user', 'approver')
        if status_filter:
            requests = requests.filter(status=status_filter)
        
        serializer = BalanceAdjustmentRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BalanceAdjustmentRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(requester=request.user)
            log_admin_action(
                request.user,
                AdminLog.ActionType.UPDATE_USER,
                f"Balance Adjustment Request for User ID: {serializer.validated_data['target_user'].id}",
                f"Requested amount: {serializer.validated_data['amount']}. Reason: {serializer.validated_data['reason']}"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BalanceAdjustmentReviewView(APIView):
    """
    POST /api/v1/admin/balance-requests/<id>/review/
    Body: {"action": "APPROVE" | "REJECT", "comment": "..."}
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            adj_request = BalanceAdjustmentRequest.objects.get(pk=pk)
        except BalanceAdjustmentRequest.DoesNotExist:
            return Response({"detail": "Запрос не найден"}, status=status.HTTP_404_NOT_FOUND)

        if adj_request.status != BalanceAdjustmentRequest.Status.PENDING:
            return Response({"detail": "Запрос уже обработан"}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        comment = request.data.get('comment', '')

        if action == 'APPROVE':
            # CORE LOGIC: Adjust user balance using service
            old_balance = adj_request.target_user.profile.balance
            
            TransactionService.process_transaction(
                user=adj_request.target_user,
                amount=adj_request.amount,
                type=Transaction.Type.TOPUP if adj_request.amount > 0 else Transaction.Type.WITHDRAWAL,
                description=f"Административная корректировка баланса (ID: {adj_request.id}). Причина: {adj_request.reason}"
            )
            
            adj_request.status = BalanceAdjustmentRequest.Status.APPROVED
            adj_request.approver = request.user
            adj_request.admin_comment = comment
            adj_request.save()

            log_admin_action(
                request.user,
                AdminLog.ActionType.ADJUST_BALANCE,
                f"User ID: {adj_request.target_user.id}",
                f"Balance adjusted from {old_balance}. Request ID: {adj_request.id}"
            )
            
        elif action == 'REJECT':
            adj_request.status = BalanceAdjustmentRequest.Status.REJECTED
            adj_request.approver = request.user
            adj_request.admin_comment = comment
            adj_request.save()
        else:
            return Response({"detail": "Некорректное действие (APPROVE/REJECT)"}, status=status.HTTP_400_BAD_REQUEST)

        adj_request.save()
        return Response(BalanceAdjustmentRequestSerializer(adj_request).data)


class ContactMessageCreateView(APIView):
    """
    POST /api/v1/administration/contact/
    Public endpoint to send a contact message
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactMessageListView(generics.ListAPIView):
    """
    GET /api/v1/administration/contact-messages/
    List all contact messages (Staff only)
    """
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [HasAdminPermission]
    permission_required = 'can_manage_content'


class AdminWithdrawalRequestListView(generics.ListAPIView):
    """
    GET /api/v1/admin/withdrawals/
    List all withdrawal requests (SuperAdmin and Finance Manager)
    """
    permission_classes = [HasAdminPermission]
    permission_required = 'can_manage_finance'
    serializer_class = AdminWithdrawalRequestSerializer

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        queryset = WithdrawalRequest.objects.all().select_related('user')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminWithdrawalRequestReviewView(APIView):
    """
    POST /api/v1/admin/withdrawals/<id>/review/
    Body: {"action": "APPROVE" | "REJECT", "comment": "..."}
    """
    permission_classes = [IsSuperAdmin] # Только суперадмин может окончательно одобрять выплаты

    def post(self, request, pk):
        try:
            withdraw_req = WithdrawalRequest.objects.get(pk=pk)
        except WithdrawalRequest.DoesNotExist:
            return Response({"detail": "Заявка не найдена"}, status=status.HTTP_404_NOT_FOUND)

        if withdraw_req.status != WithdrawalRequest.Status.PENDING:
            return Response({"detail": "Заявка уже обработана"}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        comment = request.data.get('comment', '')

        if action == 'APPROVE':
            try:
                # Use service for atomic approval
                TransactionService.approve_withdrawal(request.user, withdraw_req, comment)
                
                log_admin_action(
                    request.user,
                    AdminLog.ActionType.UPDATE_USER,
                    f"Withdrawal Approved: User ID {withdraw_req.user.id}, Req ID {withdraw_req.id}",
                    f"Amount: {withdraw_req.amount}. Comment: {comment}"
                )
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        elif action == 'REJECT':
            withdraw_req.status = WithdrawalRequest.Status.REJECTED
            withdraw_req.admin_comment = comment
            withdraw_req.save()

            log_admin_action(
                request.user,
                AdminLog.ActionType.UPDATE_USER,
                f"Withdrawal Rejected: User ID {withdraw_req.user.id}, Req ID {withdraw_req.id}",
                f"Reason: {comment}"
            )
        else:
            return Response({"detail": "Некорректное действие (APPROVE/REJECT)"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AdminWithdrawalRequestSerializer(withdraw_req).data)

