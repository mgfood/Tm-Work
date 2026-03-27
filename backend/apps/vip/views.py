from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db import transaction, models
from decimal import Decimal
from .models import VIPPlan, GlobalSettings, VIPSubscription
from .serializers import VIPPlanSerializer, GlobalSettingsSerializer, VIPSubscriptionSerializer
from apps.transactions.services import TransactionService
from apps.transactions.models import Transaction

from django.db.models import ProtectedError

class VIPViewSet(viewsets.ModelViewSet):
    queryset = VIPPlan.objects.all()
    serializer_class = VIPPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Regular users only see active plans.
        # Admins see all plans if they are managing them (detail actions) or request ?all=true
        if self.request.user.is_staff:
            if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'toggle_active']:
                return VIPPlan.objects.all()
            if self.request.query_params.get('all') == 'true':
                return VIPPlan.objects.all()
        return VIPPlan.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_active']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Нельзя удалить тариф, так как у него есть активные подписки. Пожалуйста, сначала скройте его."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        plan = self.get_object()
        plan.is_active = not plan.is_active
        plan.save(update_fields=['is_active'])
        return Response({
            'status': 'success',
            'is_active': plan.is_active
        })

    @action(detail=True, methods=['post'])
    def buy(self, request, pk=None):
        plan = self.get_object()
        user = request.user
        profile = getattr(user, 'profile', None)
        
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
        total_price = plan.total_price
        
        if profile.balance < total_price:
            difference = (total_price - profile.balance).quantize(Decimal('0.01'))
            return Response({
                'error': f'Недостаточно средств. Вам нужно еще {difference} TMT.',
                'needed': difference,
                'current_balance': profile.balance,
                'price': total_price
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if already has active VIP
        active_sub = VIPSubscription.objects.filter(
            user=user, 
            end_date__gt=timezone.now()
        ).exists()
        
        if active_sub:
            return Response(
                {'error': 'У вас уже есть активный VIP-статус. Дождитесь его завершения для продления.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        with transaction.atomic():
            # 1. Deduct balance from user
            TransactionService.process_transaction(
                user=user,
                amount=-total_price,
                transaction_type=Transaction.Type.PURCHASE_VIP,
                description=f"Purchase VIP Plan: {plan.name}"
            )
            
            # 2. Add revenue to system global settings
            settings = GlobalSettings.get_settings()
            settings.total_revenue = models.F('total_revenue') + total_price
            settings.save(update_fields=['total_revenue'])
            
            # 3. Create subscription
            start_date = timezone.now()
            # Duration based on actual months (approx 30 days)
            end_date = start_date + timedelta(days=plan.months * 30)
            
            sub = VIPSubscription.objects.create(
                user=user,
                plan=plan,
                start_date=start_date,
                end_date=end_date
            )
            
            profile.is_vip = True
            profile.save(update_fields=['is_vip'])
            
        profile.refresh_from_db()
            
        return Response({
            'status': 'VIP activated',
            'plan_name': plan.name,
            'end_date': end_date,
            'new_balance': profile.balance
        })

class GlobalSettingsViewSet(viewsets.ModelViewSet):
    """Admin only viewset for global settings."""
    queryset = GlobalSettings.objects.all()
    serializer_class = GlobalSettingsSerializer
    
    def get_permissions(self):
        # Only admins can edit global financial settings
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_object(self):
        return GlobalSettings.get_settings()

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
