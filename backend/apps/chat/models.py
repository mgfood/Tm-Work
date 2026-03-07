from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import os
import uuid
from django.utils.text import slugify
from apps.jobs.models import Job

def get_chat_attachment_path(instance, filename):
    ext = filename.split('.')[-1]
    # Get base filename without extension
    name_without_ext = '.'.join(filename.split('.')[:-1])
    # Slugify to remove special chars, but Cyrillic might be lost or long
    # We'll use a mix of slugified name and UUID to ensure uniqueness and reasonable length
    clean_name = slugify(name_without_ext, allow_unicode=True)[:50]
    if not clean_name:
        clean_name = "attachment"
    
    filename = f"{clean_name}_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('chat_attachments/', filename)

class Thread(models.Model):
    class ThreadType(models.TextChoices):
        SUPPORT = 'SUPPORT', _('Support')
        JOB = 'JOB', _('Job')
        PERSONAL = 'PERSONAL', _('Personal')
        SYSTEM = 'SYSTEM', _('System')

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
    hidden_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='hidden_threads',
        blank=True
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
    content = models.TextField(blank=True)  # Allow blank if attachment is present
    attachment = models.FileField(upload_to=get_chat_attachment_path, null=True, blank=True, max_length=500)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} in thread {self.thread_id}"
