import pytest
from django.urls import reverse
from rest_framework import status
from apps.vip.models import VIPPlan, VIPSubscription, GlobalSettings
from apps.profiles.models import Profile
from apps.escrow.services import EscrowService
from tests.factories import UserFactory, VIPPlanFactory, JobFactory, EscrowFactory
from decimal import Decimal

@pytest.mark.django_db
class TestVIPSystem:
    def test_buy_vip_plan_success(self, authenticated_client, client_user):
        # Setup: Plan and balance
        plan = VIPPlanFactory(price_per_month=Decimal('100.00'), months=1)
        client_user.profile.balance = Decimal('500.00')
        client_user.profile.save()
        
        url = reverse('vip-plans-buy', kwargs={'pk': plan.id})
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        client_user.profile.refresh_from_db()
        assert client_user.profile.balance == Decimal('400.00')
        assert client_user.profile.is_vip is True
        assert VIPSubscription.objects.filter(user=client_user).exists()

    def test_cannot_buy_if_insufficient_balance(self, authenticated_client, client_user):
        plan = VIPPlanFactory(price_per_month=Decimal('1000.00'), months=1)
        client_user.profile.balance = Decimal('100.00')
        client_user.profile.save()
        
        url = reverse('vip-plans-buy', kwargs={'pk': plan.id})
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_vip_commission_integration(self, client_user, freelancer_user):
        # Setup Global Settings
        gs = GlobalSettings.get_settings()
        gs.regular_commission = Decimal('10.00')
        gs.vip_commission = Decimal('5.00')
        gs.save()
        
        # Setup VIP Plan and Subscription for Freelancer
        from tests.factories import VIPSubscriptionFactory
        VIPSubscriptionFactory(user=freelancer_user)
        
        # Explicitly set initial balance
        freelancer_user.profile.balance = Decimal('1000.00')
        freelancer_user.profile.save()
        
        # Setup Escrow
        amount = Decimal('1000.00')
        escrow = EscrowFactory(
            job=JobFactory(client=client_user, freelancer=freelancer_user),
            amount=amount
        )
        
        # Release funds and check commission
        EscrowService.release_funds(escrow, client_user)
        
        freelancer_user.profile.refresh_from_db()
        assert freelancer_user.profile.balance == Decimal('1950.00')

    def test_admin_toggle_plan_activity(self, authenticated_client):
        admin = UserFactory(is_staff=True)
        plan = VIPPlanFactory(is_active=True)
        
        url = reverse('vip-plans-toggle-active', kwargs={'pk': plan.id})
        authenticated_client.force_authenticate(user=admin)
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        plan.refresh_from_db()
        assert plan.is_active is False
