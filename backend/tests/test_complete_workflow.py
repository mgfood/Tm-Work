"""
Backend Integration Tests for TmWork Platform
Testing complete workflow: Registration -> Job Creation -> Proposal -> Escrow -> Completion -> Review
"""
import os
import sys
import django
from decimal import Decimal
from datetime import timedelta

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.profiles.models import Profile
from apps.jobs.models import Job, Category
from apps.proposals.models import Proposal
from apps.escrow.models import Escrow
from apps.escrow.services import EscrowService
from apps.reviews.models import Review
from apps.transactions.models import Transaction

User = get_user_model()


class CompleteWorkflowTest(TransactionTestCase):
    """
    Test complete user workflow from registration to completion
    """
    
    def setUp(self):
        """Set up test users and initial data"""
        # Create category
        self.category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        
        # Create client
        self.client_user = User.objects.create_user(
            email="client_test@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Client"
        )
        self.client_profile, _ = Profile.objects.get_or_create(user=self.client_user)
        self.client_profile.balance = Decimal("10000.00")
        self.client_profile.save()
        
        # Create freelancer
        self.freelancer_user = User.objects.create_user(
            email="freelancer_test@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Freelancer"
        )
        self.freelancer_profile, _ = Profile.objects.get_or_create(user=self.freelancer_user)
        self.freelancer_profile.balance = Decimal("0.00")
        self.freelancer_profile.save()
    
    def test_01_user_registration(self):
        """Test user can register successfully"""
        user = User.objects.create_user(
            email="newuser@test.com",
            password="Pass123!",
            first_name="New",
            last_name="User"
        )
        self.assertIsNotNone(user.id)
        self.assertEqual(user.email, "newuser@test.com")
        self.assertTrue(hasattr(user, 'profile'))
    
    def test_02_job_creation(self):
        """Test client can create a job"""
        job = Job.objects.create(
            client=self.client_user,
            title="Test Job Creation",
            description="Testing job creation workflow",
            budget=Decimal("1000.00"),
            deadline=timezone.now() + timedelta(days=7),
            category=self.category,
            status=Job.Status.PUBLISHED
        )
        
        self.assertIsNotNone(job.id)
        self.assertEqual(job.status, Job.Status.PUBLISHED)
        self.assertEqual(job.client, self.client_user)
    
    def test_03_proposal_submission(self):
        """Test freelancer can submit proposal"""
        job = Job.objects.create(
            client=self.client_user,
            title="Test Job",
            description="Test",
            budget=Decimal("1000.00"),
            deadline=timezone.now() + timedelta(days=7),
            category=self.category,
            status=Job.Status.PUBLISHED
        )
        
        proposal = Proposal.objects.create(
            job=job,
            freelancer=self.freelancer_user,
            message="I can do this job",
            proposed_price=Decimal("900.00"),
            estimated_days=5,
            status=Proposal.Status.PENDING
        )
        
        self.assertIsNotNone(proposal.id)
        self.assertEqual(proposal.status, Proposal.Status.PENDING)
        self.assertEqual(proposal.freelancer, self.freelancer_user)
    
    def test_04_proposal_acceptance_and_escrow(self):
        """Test proposal acceptance and escrow creation"""
        job = Job.objects.create(
            client=self.client_user,
            title="Test Job",
            description="Test",
            budget=Decimal("1000.00"),
            deadline=timezone.now() + timedelta(days=7),
            category=self.category,
            status=Job.Status.PUBLISHED
        )
        
        proposal = Proposal.objects.create(
            job=job,
            freelancer=self.freelancer_user,
            message="I can do this",
            proposed_price=Decimal("1000.00"),
            estimated_days=5
        )
        
        # Accept proposal
        proposal.status = Proposal.Status.ACCEPTED
        proposal.save()
        
        job.status = Job.Status.IN_PROGRESS
        job.freelancer = self.freelancer_user
        job.save()
        
        # Create escrow
        escrow = EscrowService.lock_funds(
            job=job,
            payer=self.client_user,
            payee=self.freelancer_user,
            amount=Decimal("1000.00")
        )
        
        self.assertEqual(escrow.status, Escrow.Status.FUNDS_LOCKED)
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.balance, Decimal("9000.00"))
    
    def test_05_escrow_release_and_commission(self):
        """Test escrow release and commission calculation"""
        job = Job.objects.create(
            client=self.client_user,
            title="Test Job",
            description="Test",
            budget=Decimal("1000.00"),
            deadline=timezone.now() + timedelta(days=7),
            category=self.category,
            status=Job.Status.IN_PROGRESS,
            freelancer=self.freelancer_user
        )
        
        # Create and lock escrow
        escrow = EscrowService.lock_funds(
            job=job,
            payer=self.client_user,
            payee=self.freelancer_user,
            amount=Decimal("1000.00")
        )
        
        # Release funds
        EscrowService.release_funds(escrow, self.client_user)
        
        # Check balances
        self.freelancer_profile.refresh_from_db()
        self.assertEqual(self.freelancer_profile.balance, Decimal("900.00"))  # After 10% commission
        
        # Check system wallet received commission
        system_user = User.objects.get(email="system@tmwork.tm")
        system_profile = Profile.objects.get(user=system_user)
        self.assertGreaterEqual(system_profile.balance, Decimal("100.00"))
    
    def test_06_review_submission(self):
        """Test review submission after job completion"""
        job = Job.objects.create(
            client=self.client_user,
            title="Test Job",
            description="Test",
            budget=Decimal("1000.00"),
            deadline=timezone.now() + timedelta(days=7),
            category=self.category,
            status=Job.Status.COMPLETED,
            freelancer=self.freelancer_user
        )
        
        review = Review.objects.create(
            job=job,
            reviewer=self.client_user,
            reviewee=self.freelancer_user,
            rating=5,
            comment="Excellent work!"
        )
        
        self.assertIsNotNone(review.id)
        self.assertEqual(review.rating, 5)
    
    def test_07_complete_workflow(self):
        """Test complete workflow from job creation to review"""
        # 1. Create job
        job = Job.objects.create(
            client=self.client_user,
            title="Complete Workflow Test",
            description="Testing complete workflow",
            budget=Decimal("1000.00"),
            deadline=timezone.now() + timedelta(days=7),
            category=self.category,
            status=Job.Status.PUBLISHED
        )
        
        # 2. Submit proposal
        proposal = Proposal.objects.create(
            job=job,
            freelancer=self.freelancer_user,
            message="I can complete this",
            proposed_price=Decimal("1000.00"),
            estimated_days=5
        )
        
        # 3. Accept proposal
        proposal.status = Proposal.Status.ACCEPTED
        proposal.save()
        
        job.status = Job.Status.IN_PROGRESS
        job.freelancer = self.freelancer_user
        job.save()
        
        # 4. Lock funds in escrow
        escrow = EscrowService.lock_funds(
            job=job,
            payer=self.client_user,
            payee=self.freelancer_user,
            amount=Decimal("1000.00")
        )
        
        # 5. Complete job
        job.status = Job.Status.SUBMITTED
        job.save()
        
        # 6. Approve and release funds
        job.status = Job.Status.COMPLETED
        job.save()
        
        EscrowService.release_funds(escrow, self.client_user)
        
        # 7. Leave review
        review = Review.objects.create(
            job=job,
            reviewer=self.client_user,
            reviewee=self.freelancer_user,
            rating=5,
            comment="Perfect!"
        )
        
        # Verify final state
        self.freelancer_profile.refresh_from_db()
        self.assertEqual(self.freelancer_profile.balance, Decimal("900.00"))
        self.assertEqual(review.rating, 5)
        self.assertEqual(job.status, Job.Status.COMPLETED)
    
    def test_08_admin_roles(self):
        """Test admin role assignment"""
        from apps.users.models import AdminRole
        
        # Create admin role
        role = AdminRole.objects.create(
            name="Test Moderator",
            codename="test_mod",
            can_manage_users=True
        )
        
        # Assign to user
        admin_user = User.objects.create_user(
            email="testadmin@test.com",
            password="Pass123!"
        )
        admin_user.admin_role = role
        admin_user.is_staff = True
        admin_user.save()
        
        self.assertEqual(admin_user.admin_role.codename, "test_mod")
        self.assertTrue(admin_user.is_staff)
    
    def test_09_transactions_audit(self):
        """Test transaction logging"""
        initial_count = Transaction.objects.count()
        
        # Create deposit transaction
        from apps.transactions.services import TransactionService
        
        TransactionService.process_transaction(
            user=self.client_user,
            amount=Decimal("500.00"),
            transaction_type=Transaction.Type.DEPOSIT,
            description="Test deposit"
        )
        
        self.assertEqual(Transaction.objects.count(), initial_count + 1)
        latest_tx = Transaction.objects.latest('created_at')
        self.assertEqual(latest_tx.amount, Decimal("500.00"))


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
