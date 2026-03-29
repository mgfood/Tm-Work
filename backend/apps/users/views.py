from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, PasswordResetCode
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    AdminUserDetailSerializer
)
from .services import UserService, AuthService


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
        AuthService.request_password_reset(email)
        
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
        AuthService.confirm_password_reset(reset_code, serializer.validated_data['password'])
        
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
    
    @method_decorator(ratelimit(key='ip', rate='100/h', method='POST', block=True))
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
    
    @method_decorator(ratelimit(key='ip', rate='100/m', method='POST', block=True))
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
        
        if user.is_deleted:
            # Mask soft-deleted as invalid credentials to prevent email enumeration
            return Response({
                'error': 'Неверный email или пароль.'
            }, status=status.HTTP_401_UNAUTHORIZED)

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
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        status_filter = self.request.query_params.get('status')
        if status_filter == 'anonymized':
            qs = qs.filter(is_anonymized=True)
        elif status_filter == 'deleted':
            qs = qs.filter(is_deleted=True, is_anonymized=False)
        elif status_filter == 'active':
            qs = qs.filter(is_deleted=False)
        return qs

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        from apps.administration.services import AnalyticsService
        return Response(AnalyticsService.get_management_stats())

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
        
        from apps.administration.models import AdminLog, log_admin_action
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
            new_balance = UserService.adjust_balance(user, amount, reason, request.user)
            return Response({'status': 'balance adjusted', 'new_balance': new_balance})
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
            until = UserService.temp_block(user, hours, reason, request.user)
            return Response({'status': 'user temporarily blocked', 'until': until})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='block')
    def block(self, request, pk=None):
        user = self.get_object()
        UserService.block_user(user, request.data.get('reason'), request.user)
        return Response({'status': 'user permanently blocked'})

    @action(detail=True, methods=['post'], url_path='unblock')
    def unblock(self, request, pk=None):
        user = self.get_object()
        UserService.unblock_user(user, request.user)
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

        from apps.administration.models import log_admin_action, AdminLog

        if user.is_deleted:
            # We no longer hard-delete to keep the Anonymized 'leftovers' accessible
            from .services import UserService
            UserService.anonymize_user(user)
            log_admin_action(
                admin=request.user,
                action_type=AdminLog.ActionType.DELETE_USER if hasattr(AdminLog.ActionType, 'DELETE_USER') else AdminLog.ActionType.BLOCK_USER,
                target_info=f"User ID: {user_id} ({email})",
                comment="User permanently scrubbed (anonymized) by administrator"
            )
            return Response(
                {'status': 'Пользовательские данные безвозвратно стерты (анонимизированы) согласно политике. Остаток сохранен для финансового аудита.'}, 
                status=status.HTTP_200_OK
            )

        # Perform soft delete instead of physical delete (FinTech requirement)
        user.is_deleted = True
        user.is_active = False
        user.deleted_at = timezone.now()
        
        if not user.email.startswith('deleted_'):
            user.email = f"deleted_{user.id}_{user.email}"
            
        user.save()
        
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.DELETE_USER if hasattr(AdminLog.ActionType, 'DELETE_USER') else AdminLog.ActionType.BLOCK_USER,
            target_info=f"User ID: {user_id} ({email})",
            comment="User soft-deleted by administrator"
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='impersonate')
    def impersonate(self, request, pk=None):
        """ Allow superuser to generate access tokens and login as the targeted user """
        if not request.user.is_superuser:
            return Response({'error': 'Только суперадмины могут входить в чужие аккаунты'}, status=status.HTTP_403_FORBIDDEN)
            
        user = self.get_object()
        
        if getattr(user, 'is_anonymized', False):
            return Response({'error': 'Невозможно войти в полностью анонимизированный аккаунт, данные уже стерты'}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id} ({user.email})",
            comment="Admin impersonated user session"
        )
        
        # We need to manually sync their role before generating token if they are VIP, etc
        if hasattr(user, 'profile'):
            user.profile.sync_vip_status()
            
        # Generate JWT tokens for the target user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        user = self.get_object()
        
        if not user.is_deleted:
            return Response({'error': 'Пользователь не удален'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.is_deleted = False
        user.is_active = True
        user.deleted_at = None
        
        # Remove the deleted_<id>_ prefix if it exists
        prefix = f"deleted_{user.id}_"
        if user.email.startswith(prefix):
            user.email = user.email[len(prefix):]
            
        user.save()
        
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,
            target_info=f"User ID: {user.id} ({user.email})",
            comment="User restored by administrator"
        )
        return Response({'status': 'Пользователь восстановлен'})

    @action(detail=True, methods=['post'], url_path='toggle-verify')
    def toggle_verify(self, request, pk=None):
        user = self.get_object()
        is_verified = UserService.toggle_verify(user, request.user)
        status_msg = 'verified' if is_verified else 'unverified'
        return Response({'status': f'User {status_msg}', 'is_verified': is_verified})

    @action(detail=True, methods=['post'], url_path='toggle-vip')
    def toggle_vip(self, request, pk=None):
        user = self.get_object()
        is_vip = UserService.toggle_vip(user, request.user)
        status_msg = 'VIP' if is_vip else 'Regular'
        return Response({'status': f'User is now {status_msg}', 'is_vip': is_vip})

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
