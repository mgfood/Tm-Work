from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class AdminLog(models.Model):
    class ActionType(models.TextChoices):
        BLOCK_USER = 'BLOCK_USER', _('Block User')
        UNBLOCK_USER = 'UNBLOCK_USER', _('Unblock User')
        ADJUST_BALANCE = 'ADJUST_BALANCE', _('Adjust Balance')
        FORCE_ESCROW_RELEASE = 'FORCE_ESCROW_RELEASE', _('Force Escrow Release')
        FORCE_ESCROW_REFUND = 'FORCE_ESCROW_REFUND', _('Force Escrow Refund')
        VERIFY_USER = 'VERIFY_USER', _('Verify User')
        VIP_USER = 'VIP_USER', _('VIP User')
        UPDATE_USER = 'UPDATE_USER', _('Update User')
        DELETE_USER = 'DELETE_USER', _('Delete User')
        BROADCAST = 'BROADCAST', _('System Broadcast')

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_actions'
    )
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    target_info = models.CharField(max_length=255, help_text="e.g. User ID: 5, Job ID: 10")
    comment = models.TextField(blank=True, help_text="Reason for the action")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_logs'
        verbose_name = _('Admin Log')
        verbose_name_plural = _('Admin Logs')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.admin.email} - {self.action_type} - {self.created_at}"

def log_admin_action(admin, action_type, target_info, comment=""):
    """Utility to create an admin log entry."""
    return AdminLog.objects.create(
        admin=admin,
        action_type=action_type,
        target_info=target_info,
        comment=comment
    )

class SystemSetting(models.Model):
    """Singleton model for platform dynamic settings"""
    auto_delete_enabled = models.BooleanField(
        default=True, 
        help_text="If enabled, soft-deleted accounts will be automatically permanently anonymized."
    )
    retention_days = models.PositiveIntegerField(
        default=30, 
        help_text="Number of days to keep a soft-deleted account before anonymizing."
    )

    # Granular Privacy Deletion Settings
    delete_name = models.BooleanField(default=True, help_text="Erase first and last name")
    delete_email = models.BooleanField(default=False, help_text="Completely obfuscate email address (e.g., deleted_1_user@domain becomes deleted_1@archived.local)")
    delete_bio = models.BooleanField(default=True, help_text="Erase profile biography, profession, location, and phone number")
    delete_skills = models.BooleanField(default=True, help_text="Remove skills, languages, and experience years")
    delete_social_links = models.BooleanField(default=True, help_text="Remove linked social network profiles")
    delete_avatar = models.BooleanField(default=True, help_text="Delete profile avatar from storage")
    delete_portfolio = models.BooleanField(default=True, help_text="Delete all portfolio items and their media")
    delete_messages = models.BooleanField(default=True, help_text="Delete all chat messages sent by the user (including attachments)")

    class Meta:
        db_table = 'system_settings'
        verbose_name = _('System Setting')
        verbose_name_plural = _('System Settings')

    @classmethod
    def get_settings(cls):
        setting, _ = cls.objects.get_or_create(id=1)
        return setting

    def __str__(self):
        return "Global System Settings"
