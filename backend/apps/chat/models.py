from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.jobs.models import Job

class Thread(models.Model):
    class ThreadType(models.TextChoices):
        SUPPORT = 'SUPPORT', _('Support')
        JOB = 'JOB', _('Job')
        PERSONAL = 'PERSONAL', _('Personal')

    type = models.CharField(
        max_length=20,
        choices=ThreadType.choices,
        default=ThreadType.PERSONAL
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_threads'
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_threads'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.type} thread ({self.pk})"

class Message(models.Model):
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} in thread {self.thread_id}"
