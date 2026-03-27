from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class GlobalSettings(models.Model):
    """Singleton model for platform settings like commissions."""
    regular_commission = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=10.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    vip_commission = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=5.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    total_revenue = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0.00,
        help_text="Total revenue accumulated by the platform (VIP, commissions, etc.)"
    )

    class Meta:
        db_table = 'global_settings'
        verbose_name = _('Global Settings')
        verbose_name_plural = _('Global Settings')

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Global Platform Settings"

class VIPPlan(models.Model):
    name = models.CharField(max_length=100)
    months = models.PositiveIntegerField(help_text="Duration in months")
    price_per_month = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    class BadgeIcon(models.TextChoices):
        AWARD = 'Award', 'Award'
        ZAP = 'Zap', 'Zap'
        SHIELD = 'ShieldCheck', 'ShieldCheck'
        STAR = 'Star', 'Star'
        CROWN = 'Crown', 'Crown'

    badge_icon = models.CharField(
        max_length=50, 
        choices=BadgeIcon.choices,
        default=BadgeIcon.AWARD, 
        help_text="Lucide icon name"
    )
    badge_color = models.CharField(max_length=20, default='#f59e0b', help_text="Hex code or CSS class")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vip_plans'
        verbose_name = _('VIP Plan')
        verbose_name_plural = _('VIP Plans')
        ordering = ['months', 'price_per_month']

    def __str__(self):
        return f"{self.name} ({self.months} months)"

    @property
    def total_price(self):
        base = self.price_per_month * self.months
        if self.discount_percentage > 0:
            return base * (1 - self.discount_percentage / 100)
        return base

class VIPSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='vip_subscriptions'
    )
    plan = models.ForeignKey(VIPPlan, on_delete=models.PROTECT)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vip_subscriptions'
        verbose_name = _('VIP Subscription')
        verbose_name_plural = _('VIP Subscriptions')

    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"

    @property
    def is_currently_active(self):
        return self.start_date <= timezone.now() <= self.end_date
