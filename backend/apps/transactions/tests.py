from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.profiles.models import Profile
from apps.jobs.models import Job, Category
from apps.escrow.models import Escrow
from apps.escrow.services import EscrowService
from apps.transactions.models import Transaction
from apps.vip.models import GlobalSettings
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

class BalanceIntegrityTest(TestCase):
    def setUp(self):
        # Setup Global Settings
        GlobalSettings.objects.create(
            regular_commission=10,
            vip_commission=5
        )
        
        # Create Users
        self.client_user = User.objects.create_user(email='client@example.com', password='password123')
        self.freelancer_user = User.objects.create_user(email='freelancer@example.com', password='password123')
        
        # Ensure profiles exist (signals might not fire in test)
        self.client_profile, _ = Profile.objects.get_or_create(user=self.client_user)
        self.freelancer_profile, _ = Profile.objects.get_or_create(user=self.freelancer_user)
        
        # Set initial balances
        self.client_profile.balance = Decimal('1000.00')
        self.client_profile.save()
        
        self.freelancer_profile = self.freelancer_user.profile
        self.freelancer_profile.balance = Decimal('0.00')
        self.freelancer_profile.save()
        
        # Create Category and Job
        self.category = Category.objects.create(name='Test Cat', slug='test-cat')
        self.job = Job.objects.create(
            client=self.client_user,
            title='Test Job',
            budget=Decimal('500.00'),
            deadline=timezone.now() + timezone.timedelta(days=7),
            category=self.category,
            status=Job.Status.PUBLISHED
        )

    def test_escrow_lifecycle_balance_updates(self):
        amount = Decimal('500.00')
        
        # 1. Lock Funds
        escrow = EscrowService.lock_funds(self.job, self.client_user, self.freelancer_user, amount)
        
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.balance, Decimal('500.00'))
        
        lock_tx = Transaction.objects.get(type=Transaction.Type.ESCROW_LOCK, user=self.client_user)
        self.assertEqual(lock_tx.amount, -amount)
        
        # 2. Release Funds (Client confirming)
        # Using 10% commission (regular)
        EscrowService.release_funds(escrow, self.client_user)
        
        self.freelancer_profile.refresh_from_db()
        # 500 - 10% = 450
        self.assertEqual(self.freelancer_profile.balance, Decimal('450.00'))
        
        release_tx = Transaction.objects.get(type=Transaction.Type.ESCROW_RELEASE, user=self.freelancer_user)
        self.assertEqual(release_tx.amount, Decimal('450.00'))

    def test_escrow_refund_balance_updates(self):
        amount = Decimal('500.00')
        
        # 1. Lock Funds
        escrow = EscrowService.lock_funds(self.job, self.client_user, self.freelancer_user, amount)
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.balance, Decimal('500.00'))
        
        # 2. Refund Funds (Admin action)
        EscrowService.refund_funds(escrow, self.client_user) # In our service client can also refund if authorized
        
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.balance, Decimal('1000.00'))
        
        refund_tx = Transaction.objects.get(type=Transaction.Type.ESCROW_REFUND, user=self.client_user)
        self.assertEqual(refund_tx.amount, amount)
