from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import uuid

class Transaction(models.Model):
    class Type(models.TextChoices):
        DEPOSIT = 'DEPOSIT', _('Deposit')
        WITHDRAWAL = 'WITHDRAWAL', _('Withdrawal')
        ESCROW_LOCK = 'ESCROW_LOCK', _('Escrow Lock')
        ESCROW_RELEASE = 'ESCROW_RELEASE', _('Escrow Release')
        ESCROW_REFUND = 'ESCROW_REFUND', _('Escrow Refund')
        FEE = 'FEE', _('Fee')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=Type.choices)
    
    reference_id = models.CharField(max_length=255, db_index=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        db_table = 'transactions'
        verbose_name = _('Transaction')
        verbose_name_plural = _('Transactions')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} - {self.amount} ({self.user.email})"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise PermissionError("Transactions are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("Transactions cannot be deleted.")
