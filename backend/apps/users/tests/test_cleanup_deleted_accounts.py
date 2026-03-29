from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.core.management import call_command
from apps.users.models import User
from apps.profiles.models import Profile

class CleanupDeletedAccountsTest(TestCase):
    def setUp(self):
        # Create a user to be deleted
        self.user1 = User.objects.create(
            email="to_delete@tmwork.tm",
            first_name="John",
            last_name="Doe",
            is_deleted=True,
            deleted_at=timezone.now() - timedelta(days=35)
        )
        self.profile1 = Profile.objects.create(
            user=self.user1,
            phone_number="123456789",
            bio="Some bio"
        )
        
        # Create a user that was deleted recently (should NOT be cleaned up)
        self.user2 = User.objects.create(
            email="recent_delete@tmwork.tm",
            first_name="Jane",
            last_name="Doe",
            is_deleted=True,
            deleted_at=timezone.now() - timedelta(days=5)
        )
        self.profile2 = Profile.objects.create(user=self.user2, bio="Recently deleted")

        # Create a normal active user (should NOT be cleaned up)
        self.user3 = User.objects.create(
            email="active@tmwork.tm",
            first_name="Active",
            last_name="User",
            is_deleted=False
        )
        self.profile3 = Profile.objects.create(user=self.user3, bio="I am active")

    def test_cleanup_command(self):
        # Run cleanup command
        call_command('cleanup_deleted_accounts')

        # Check self.user1 (should be anonymized)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.first_name, '')
        self.assertEqual(self.user1.last_name, '')
        self.profile1.refresh_from_db()
        self.assertEqual(self.profile1.phone_number, '')
        self.assertEqual(self.profile1.bio, '')

        # Check self.user2 (should be untouched)
        self.user2.refresh_from_db()
        self.assertEqual(self.user2.first_name, 'Jane')
        self.profile2.refresh_from_db()
        self.assertEqual(self.profile2.bio, 'Recently deleted')

        # Check self.user3 (should be untouched)
        self.user3.refresh_from_db()
        self.assertEqual(self.user3.first_name, 'Active')
        self.profile3.refresh_from_db()
        self.assertEqual(self.profile3.bio, 'I am active')
