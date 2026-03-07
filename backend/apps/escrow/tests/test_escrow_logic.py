import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from apps.escrow.models import Escrow
from apps.escrow.services import EscrowService
from apps.transactions.models import Transaction
from tests.factories import JobFactory, ProfileFactory, UserFactory

@pytest.mark.django_db
class TestEscrowLogic:
    def test_lock_funds_success(self, client_user, freelancer_user):
        job = JobFactory(client=client_user, budget=Decimal('500.00'))
        
        escrow = EscrowService.lock_funds(
            job=job,
            payer=client_user,
            payee=freelancer_user,
            amount=Decimal('500.00')
        )
        
        assert escrow.status == Escrow.Status.FUNDS_LOCKED
        client_user.profile.refresh_from_db()
        # Initial was 1000.00 in factory
        assert client_user.profile.balance == Decimal('500.00')
        
        # Check transaction log
        assert Transaction.objects.filter(
            user=client_user, 
            type=Transaction.Type.ESCROW_LOCK
        ).exists()

    def test_release_funds_with_commission(self, client_user, freelancer_user):
        job = JobFactory(client=client_user, budget=Decimal('500.00'))
        escrow = EscrowService.lock_funds(job, client_user, freelancer_user, Decimal('500.00'))
        
        # Initial freelancer balance is 0.00
        EscrowService.release_funds(escrow, client_user)
        
        escrow.refresh_from_db()
        assert escrow.status == Escrow.Status.RELEASED
        
        freelancer_user.profile.refresh_from_db()
        # Default commission is 10% (from global settings usually, let's assume it works)
        # 500 - 10% = 450
        assert freelancer_user.profile.balance > 0
        assert Transaction.objects.filter(
            user=freelancer_user, 
            type=Transaction.Type.ESCROW_RELEASE
        ).exists()

    def test_refund_funds(self, client_user, freelancer_user):
        job = JobFactory(client=client_user, budget=Decimal('500.00'))
        escrow = EscrowService.lock_funds(job, client_user, freelancer_user, Decimal('500.00'))
        
        EscrowService.refund_funds(escrow, client_user)
        
        escrow.refresh_from_db()
        assert escrow.status == Escrow.Status.REFUNDED
        client_user.profile.refresh_from_db()
        assert client_user.profile.balance == Decimal('1000.00')

    def test_unauthorized_release(self, freelancer_user, client_user):
        job = JobFactory(client=client_user, budget=Decimal('500.00'))
        escrow = EscrowService.lock_funds(job, client_user, freelancer_user, Decimal('500.00'))
        
        from django.core.exceptions import ValidationError
        with pytest.raises(ValidationError, match="Only payer or admin can release funds"):
            EscrowService.release_funds(escrow, freelancer_user)
