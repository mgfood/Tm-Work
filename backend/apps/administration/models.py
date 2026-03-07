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
