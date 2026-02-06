from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)


class PasswordResetRequestView(APIView):
    """
    Request a password reset code
    POST /api/v1/auth/password-reset/request/
    Body: {"email": "user@example.com"}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate random 6-digit code
        import random
        code = str(random.randint(100000, 999999))
        
        # Create record
        from .models import PasswordResetCode
        PasswordResetCode.objects.create(user=user, code=code)
        
        # Send email
        from django.core.mail import send_mail
        from django.conf import settings
        
        subject = 'TmWork: Код для сброса пароля'
        message = f'Ваш код для сброса пароля: {code}. Он действителен в течение 15 минут.'
        recipient_list = [email]
        
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
        
        return Response({
            'message': 'Код подтверждения отправлен на вашу электронную почту.',
            'email': email
        })


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with code
    POST /api/v1/auth/password-reset/confirm/
    Body: {"email": "...", "code": "...", "password": "...", "password_confirm": "..."}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reset_code = serializer.validated_data['reset_code']
        user = reset_code.user
        
        # Update password
        user.set_password(serializer.validated_data['password'])
        user.save()
        
        # Mark code as used
        reset_code.is_used = True
        reset_code.save()
        
        return Response({'message': 'Пароль успешно изменен.'})


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint
    
    POST /api/v1/auth/register/
    Body: {
        "email": "user@example.com",
        "password": "password123",
        "password_confirm": "password123",
        "first_name": "John",
        "last_name": "Doe"
    }
    
    Returns: User data + JWT tokens
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    from django_ratelimit.decorators import ratelimit
    from django.utils.decorators import method_decorator
    
    @method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=True))
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Return user data with tokens
        user_serializer = UserSerializer(user)
        
        return Response({
            'user': user_serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    User login endpoint
    
    POST /api/v1/auth/login/
    Body: {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Returns: JWT tokens
    """
    permission_classes = [permissions.AllowAny]
    
    from django_ratelimit.decorators import ratelimit
    from django.utils.decorators import method_decorator
    
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        if not serializer.is_valid():
            # If it's a field error (like missing fields), wrap it in 'error' for frontend
            error_data = serializer.errors
            if 'error' not in error_data:
                # Join field errors into a single string
                msg = "; ".join([f"{k}: {', '.join(v)}" for k, v in error_data.items()])
                error_data = {'error': msg}
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        
        # Check if user is blocked
        if user.blocked_until and user.blocked_until > timezone.now():
            time_left = user.blocked_until - timezone.now()
            hours = int(time_left.total_seconds() // 3600)
            minutes = int((time_left.total_seconds() % 3600) // 60)
            reason = user.block_reason or "без объяснения причин"
            return Response({
                'error': f'Ваш аккаунт заблокирован до {user.blocked_until.strftime("%d.%m.%Y %H:%M")}. Причина: {reason}.'
            }, status=status.HTTP_403_FORBIDDEN)

        if not user.is_active:
             return Response({
                'error': f'Ваш аккаунт заблокирован администратором. Причина: {user.block_reason or "не указана"}.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Sync VIP status on login
        if hasattr(user, 'profile'):
            user.profile.sync_vip_status()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Return user data with tokens
        user_serializer = UserSerializer(user)
        
        return Response({
            'user': user_serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })


class LogoutView(APIView):
    """
    User logout endpoint (blacklists refresh token)
    
    POST /api/v1/auth/logout/
    Body: {
        "refresh": "refresh_token_here"
    }
    
    Returns: Success message
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(generics.RetrieveAPIView):
    """
    Get current authenticated user
    
    GET /api/v1/auth/me/
    
    Returns: Current user data
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


from rest_framework import viewsets
from rest_framework.decorators import action

class UserViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for user management
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        from apps.jobs.models import Job
        from apps.escrow.models import Escrow
        from apps.users.models import Role
        from django.db.models import Sum, Avg
        
        total_users = User.objects.count()
        active_jobs = Job.objects.exclude(status__in=['DRAFT', 'CANCELLED']).count()
        disputes = Job.objects.filter(status='DISPUTE').count()
        
        # Calculate total platform volume (sum of all non-draft/cancelled budgets)
        total_volume = Job.objects.exclude(status__in=['DRAFT', 'CANCELLED']).aggregate(Sum('budget'))['budget__sum'] or 0
        
        # Average project price
        avg_budget = Job.objects.exclude(status__in=['DRAFT', 'CANCELLED']).aggregate(Avg('budget'))['budget__avg'] or 0
        
        # Escrow funds (currently locked)
        escrow_total = Escrow.objects.filter(status='FUNDS_LOCKED').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Freelancers count
        freelancers_count = User.objects.filter(roles__name='FREELANCER').count()
        
        return Response({
            'total_users': total_users,
            'active_jobs': active_jobs,
            'total_escrow': f"{escrow_total} TMT",
            'disputes': disputes,
            'total_volume': f"{total_volume} TMT",
            'avg_budget': f"{round(avg_budget, 2)} TMT",
            'freelancers_count': freelancers_count,
            'platform_fee_total': "0 TMT"
        })

    def update(self, request, *args, **kwargs):
        """
        Update user data (admin only)
        PATCH /api/v1/users/{id}/
        
        Allowed fields: first_name, last_name, email
        """
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Updated fields: {', '.join(request.data.keys())}"
        )
        
        return Response(serializer.data)

    def get_permissions(self):
        """
        Granular permissions for admin actions:
        - Support: Can view only
        - Moderator: Can block/unblock, verify users
        - FinancialAdmin: Can adjust balances, view transactions
        - Superuser/Staff: Full access
        """
        from apps.administration.permissions import IsModerator, IsFinancialAdmin
        
        if self.action in ['toggle_role']:
            return [permissions.IsAuthenticated()]
        
        # Financial operations require FinancialAdmin role
        if self.action in ['adjust_balance']:
            return [IsFinancialAdmin()]
        
        # Moderator actions
        if self.action in ['block', 'unblock', 'temp_block', 'toggle_verify', 'toggle_vip']:
            return [IsModerator()]
        
        # Default: require staff/superuser
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post'], url_path='toggle-role')
    def toggle_role(self, request):
        from apps.users.models import Role
        role_type = request.data.get('role')
        if role_type not in [Role.Type.CLIENT, Role.Type.FREELANCER]:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        if user.has_role(role_type):
            user.remove_role(role_type)
            msg = f"Role {role_type} removed"
        else:
            user.add_role(role_type)
            msg = f"Role {role_type} added"
        
        return Response({
            'status': msg,
            'roles': [r.name for r in user.roles.all()]
        })

    @action(detail=True, methods=['get'], url_path='details')
    def details(self, request, pk=None):
        user = self.get_object()
        from .serializers import AdminUserDetailSerializer
        # We only want recent 5 transactions for the detail view
        user.recent_transactions = user.transactions.all().order_by('-created_at')[:5]
        return Response(AdminUserDetailSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='adjust-balance')
    def adjust_balance(self, request, pk=None):
        user = self.get_object()
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Manual adjustment by admin')
        
        if amount is None:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from decimal import Decimal
            amount = Decimal(str(amount))
            
            from django.db import transaction
            from django.db.models import F
            from apps.profiles.models import Profile
            
            with transaction.atomic():
                # Lock profile and update atomically
                profile_qs = Profile.objects.select_for_update().filter(user=user)
                # We need to check if balance would be negative after F update.
                # Since F() is executed in DB, we check the result after or use a constraint.
                # For safety, let's fetch current balance first WITH lock.
                profile = profile_qs.get()
                if profile.balance + amount < 0:
                     return Response({'error': 'Balance cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
                
                profile_qs.update(balance=F('balance') + amount)

                # Log transaction
                from apps.transactions.models import Transaction
                from apps.transactions.services import TransactionService
                TransactionService.log_transaction(
                    user=user,
                    amount=amount,
                    transaction_type=Transaction.Type.DEPOSIT if amount > 0 else Transaction.Type.WITHDRAWAL,
                    description=f"Admin adjustment: {reason}"
                )

                # Log admin action
                from apps.administration.models import log_admin_action, AdminLog
                log_admin_action(
                    admin=request.user,
                    action_type=AdminLog.ActionType.ADJUST_BALANCE,
                    target_info=f"User ID: {user.id}",
                    comment=f"Amount: {amount}. Reason: {reason}"
                )

            return Response({'status': 'balance adjusted', 'new_balance': user.profile.balance})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='temp-block')
    def temp_block(self, request, pk=None):
        user = self.get_object()
        hours = request.data.get('hours')
        reason = request.data.get('reason', 'Temporary security block')
        
        if not hours:
            return Response({'error': 'Duration (hours) is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from django.utils import timezone
            from datetime import timedelta
            user.blocked_until = timezone.now() + timedelta(hours=int(hours))
            user.block_reason = reason
            user.save()
            
            from apps.administration.models import log_admin_action, AdminLog
            log_admin_action(
                admin=request.user,
                action_type=AdminLog.ActionType.BLOCK_USER,
                target_info=f"User ID: {user.id} (Temp)",
                comment=f"Duration: {hours}h. Reason: {reason}"
            )
            return Response({'status': 'user temporarily blocked', 'until': user.blocked_until})
        except ValueError:
            return Response({'error': 'Invalid duration format'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='block')
    def block(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.block_reason = request.data.get('reason', 'Violation of terms')
        user.save()
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.BLOCK_USER,
            target_info=f"User ID: {user.id}",
            comment=user.block_reason
        )
        return Response({'status': 'user permanently blocked'})

    @action(detail=True, methods=['post'], url_path='unblock')
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.blocked_until = None
        user.block_reason = ""
        user.save()
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UNBLOCK_USER,
            target_info=f"User ID: {user.id}",
            comment=request.data.get('reason', 'Administrator unblocked')
        )
        return Response({'status': 'user unblocked'})

    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id}",
            comment="Password reset by administrator"
        )
        return Response({'status': 'password updated'})

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user_id = user.id
        email = user.email
        
        # Check if it's not the last superuser
        if user.is_superuser and request.user.id == user.id:
            return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)

        response = super().destroy(request, *args, **kwargs)
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.BLOCK_USER, # We don't have DELETE_USER yet, use block for now or add it
            target_info=f"User ID: {user_id} ({email})",
            comment="User permanently deleted from system"
        )
        return response

    @action(detail=True, methods=['post'], url_path='toggle-verify')
    def toggle_verify(self, request, pk=None):
        user = self.get_object()
        # Auto-create profile if missing
        if not hasattr(user, 'profile'):
            from apps.profiles.models import Profile
            Profile.objects.create(user=user)
            
        user.profile.is_verified = not user.profile.is_verified
        user.profile.save()
        status_msg = 'verified' if user.profile.is_verified else 'unverified'
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.VERIFY_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Status: {status_msg}"
        )
        return Response({'status': f'User {status_msg}', 'is_verified': user.profile.is_verified})

    @action(detail=True, methods=['post'], url_path='toggle-vip')
    def toggle_vip(self, request, pk=None):
        user = self.get_object()
        if not hasattr(user, 'profile'):
            from apps.profiles.models import Profile
            Profile.objects.create(user=user)
            
        user.profile.is_vip = not user.profile.is_vip
        user.profile.save()
        status_msg = 'VIP' if user.profile.is_vip else 'Regular'
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.VIP_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Status: {status_msg}"
        )
        return Response({'status': f'User is now {status_msg}', 'is_vip': user.profile.is_vip})

    @action(detail=True, methods=['post'], url_path='assign-role')
    def assign_role(self, request, pk=None):
        """Assign role to user (CLIENT or FREELANCER)"""
        user = self.get_object()
        role_name = request.data.get('role')
        
        from apps.users.models import Role
        if role_name not in [Role.Type.CLIENT, Role.Type.FREELANCER]:
            return Response({'error': 'Invalid role. Use CLIENT or FREELANCER'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.has_role(role_name):
            return Response({'error': f'User already has {role_name} role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.add_role(role_name)
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Assigned role: {role_name}"
        )
        
        return Response({
            'status': f'Role {role_name} assigned',
            'roles': [r.name for r in user.roles.all()]
        })

    @action(detail=True, methods=['post'], url_path='remove-role')
    def remove_role(self, request, pk=None):
        """Remove role from user"""
        user = self.get_object()
        role_name = request.data.get('role')
        
        from apps.users.models import Role
        if role_name not in [Role.Type.CLIENT, Role.Type.FREELANCER]:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.has_role(role_name):
            return Response({'error': f'User does not have {role_name} role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.remove_role(role_name)
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Removed role: {role_name}"
        )
        
        return Response({
            'status': f'Role {role_name} removed',
            'roles': [r.name for r in user.roles.all()]
        })

    @action(detail=True, methods=['post'], url_path='assign-group')
    def assign_group(self, request, pk=None):
        """Assign admin group to user (superuser only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Only superusers can assign admin groups'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        group_name = request.data.get('group')
        
        if group_name not in ['Support', 'Moderator', 'FinancialAdmin']:
            return Response({'error': 'Invalid group'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth.models import Group
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            return Response({'error': f'Group {group_name} does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        if group in user.groups.all():
            return Response({'error': f'User already in {group_name} group'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.groups.add(group)
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Assigned to group: {group_name}"
        )
        
        return Response({
            'status': f'User assigned to {group_name} group',
            'groups': [g.name for g in user.groups.all()]
        })

    @action(detail=True, methods=['post'], url_path='remove-group')
    def remove_group(self, request, pk=None):
        """Remove admin group from user (superuser only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Only superusers can remove admin groups'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        group_name = request.data.get('group')
        
        from django.contrib.auth.models import Group
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            return Response({'error': f'Group {group_name} does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        if group not in user.groups.all():
            return Response({'error': f'User not in {group_name} group'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.groups.remove(group)
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Removed from group: {group_name}"
        )
        
        return Response({
            'status': f'User removed from {group_name} group',
            'groups': [g.name for g in user.groups.all()]
        })
