from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True, allow_unicode=True)
    icon = models.CharField(max_length=50, null=True, blank=True, help_text="Lucide icon name")
    custom_icon = models.ImageField(upload_to='category_icons/', null=True, blank=True)

    class Meta:
        db_table = 'categories'
        verbose_name = _('Category')
        verbose_name_plural = _('Categories')
        ordering = ['name']
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Job(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        PUBLISHED = 'PUBLISHED', _('Published')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        SUBMITTED = 'SUBMITTED', _('Submitted')
        COMPLETED = 'COMPLETED', _('Completed')
        DISPUTE = 'DISPUTE', _('Dispute')
        CANCELLED = 'CANCELLED', _('Cancelled')

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_jobs'
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='freelancer_jobs',
        null=True,
        blank=True
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name='jobs',
        null=True,
        blank=True
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    
    budget = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    deadline = models.DateTimeField()
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'jobs'
        verbose_name = _('Job')
        verbose_name_plural = _('Jobs')
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class JobFile(models.Model):
    job = models.ForeignKey(
        Job, 
        on_delete=models.CASCADE, 
        related_name='files'
    )
    file = models.FileField(upload_to='jobs/files/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_files'


class JobSubmission(models.Model):
    job = models.OneToOneField(
        Job,
        on_delete=models.CASCADE,
        related_name='submission'
    )
    content = models.TextField(help_text="Description or links to the work results")
    files = models.ManyToManyField(JobFile, related_name='submissions', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_submissions'
        verbose_name = _('Job Submission')
        verbose_name_plural = _('Job Submissions')

    def __str__(self):
        return f"Submission for {self.job.title}"
