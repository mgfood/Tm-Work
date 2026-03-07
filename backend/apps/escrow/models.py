from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.jobs.models import Job

class Escrow(models.Model):
    class Status(models.TextChoices):
        CREATED = 'CREATED', _('Created')
        FUNDS_LOCKED = 'FUNDS_LOCKED', _('Funds Locked')
        RELEASED = 'RELEASED', _('Released')
        REFUNDED = 'REFUNDED', _('Refunded')

    job = models.OneToOneField(
        Job,
        on_delete=models.PROTECT,
        related_name='escrow'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED
    )
    
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='escrow_payments'
    )
    payee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='escrow_receipts'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'escrow'
        verbose_name = _('Escrow')
        verbose_name_plural = _('Escrows')
        ordering = ['-created_at']

    def __str__(self):
        return f"Escrow for {self.job.title} ({self.status})"
