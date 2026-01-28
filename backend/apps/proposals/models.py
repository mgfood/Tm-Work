from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from apps.jobs.models import Job


class Proposal(models.Model):
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='proposals'
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='proposals'
    )
    
    message = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    deadline_days = models.PositiveIntegerField(
        help_text="Expected duration in days"
    )
    
    is_accepted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'proposals'
        verbose_name = 'Proposal'
        verbose_name_plural = 'Proposals'
        # Один фрилансер — один отклик на заказ
        unique_together = ('job', 'freelancer')
        ordering = ['-created_at']

    def __str__(self):
        return f"Proposal from {self.freelancer.email} for {self.job.title}"
