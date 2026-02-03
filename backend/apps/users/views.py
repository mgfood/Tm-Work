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
    UserSerializer
)


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
    
    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Update last login
        user.last_login = user.date_joined.__class__.now()
        user.save(update_fields=['last_login'])
        
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

    def get_permissions(self):
        if self.action in ['toggle_role']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

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

    @action(detail=True, methods=['post'], url_path='block')
    def block(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'user blocked'})

    @action(detail=True, methods=['post'], url_path='unblock')
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'user unblocked'})

    @action(detail=True, methods=['post'], url_path='toggle-verify')
    def toggle_verify(self, request, pk=None):
        user = self.get_object()
        # Verify related profile
        if hasattr(user, 'profile'):
            user.profile.is_verified = not user.profile.is_verified
            user.profile.save()
            status_msg = 'verified' if user.profile.is_verified else 'unverified'
            return Response({'status': f'User {status_msg}', 'is_verified': user.profile.is_verified})
        return Response({'error': 'User has no profile'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='toggle-vip')
    def toggle_vip(self, request, pk=None):
        user = self.get_object()
        # Toggle VIP on related profile
        if hasattr(user, 'profile'):
            user.profile.is_vip = not user.profile.is_vip
            user.profile.save()
            status_msg = 'VIP' if user.profile.is_vip else 'Regular'
            return Response({'status': f'User is now {status_msg}', 'is_vip': user.profile.is_vip})
        return Response({'error': 'User has no profile'}, status=status.HTTP_404_NOT_FOUND)
