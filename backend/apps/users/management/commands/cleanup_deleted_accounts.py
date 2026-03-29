from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from apps.users.models import User
from apps.chat.models import Message
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cleans up personal data for accounts deleted more than ACCOUNT_RETENTION_DAYS ago'

    def handle(self, *args, **options):
        from apps.administration.models import SystemSetting
        setting = SystemSetting.get_settings()
        
        if not setting.auto_delete_enabled:
            self.stdout.write(self.style.WARNING('Auto-deletion is currently disabled in system settings.'))
            return
            
        retention_days = setting.retention_days
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        # Find all users who are deleted and their deleted_at date is older than cutoff_date
        # We also want to skip users who have already been completely anonymized
        # We can detect this if they have no avatar, bio, or if first_name == ''
        # But to be safe and simple, we can run idempotently.
        from django.db.models import Q
        
        users_to_clean = User.objects.filter(
            is_deleted=True,
            deleted_at__isnull=False,
            deleted_at__lte=cutoff_date
        ).filter(
            ~Q(first_name='') | 
            ~Q(last_name='') | 
            ~Q(profile__phone_number='')
        ).distinct()
        
        count = users_to_clean.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No accounts to clean up at this time.'))
            return

        self.stdout.write(f"Found {count} accounts ready for permanent anonymization.")

        from apps.users.services import UserService

        for user in users_to_clean:
            try:
                UserService.anonymize_user(user)
                self.stdout.write(self.style.SUCCESS(f"Successfully anonymized user ID: {user.id}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to anonymize user {user.id}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS('Cleanup process completed.'))
