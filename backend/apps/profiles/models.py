from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'skills'
        verbose_name = 'Skill'
        verbose_name_plural = 'Skills'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            import urllib.parse
            # We allow +, #, . and other symbols by quoting or just using common sense
            # But the user asked for C++, C#, .NET specifically.
            # Let's just make it simple: slugify but keep these symbols.
            from django.utils.text import slugify
            # Custom slugify logic for skills
            self.slug = self.name.lower().replace(' ', '-')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    # --- Public Section ---
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    profession = models.CharField(max_length=255, blank=True)
    bio = models.TextField(max_length=1000, blank=True)
    skills = models.ManyToManyField(Skill, related_name='profiles', blank=True)
    
    # --- Ratings (Separate) ---
    freelancer_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    client_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    
    # --- Private Section (Dashboard/Cabinet) ---
    phone_number = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)
    is_vip = models.BooleanField(default=False)
    
    # --- New Fields ---
    hourly_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    experience_years = models.PositiveIntegerField(default=0)
    languages = models.CharField(max_length=255, blank=True, help_text="e.g. Turkmen, Russian, English")
    social_links = models.JSONField(default=dict, blank=True, help_text="e.g. {'telegram': '@user', 'instagram': '@user'}")
    
    # Count stats
    freelancer_reviews_count = models.PositiveIntegerField(default=0)
    client_reviews_count = models.PositiveIntegerField(default=0)
    completed_works_count = models.PositiveIntegerField(default=0)
    
    balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)]
    )

    @property
    def check_vip_status(self):
        """
        Checks if the user has an active subscription and updates the is_vip flag.
        This can be called during login or profile fetch for auto-sync.
        """
        from apps.vip.models import VIPSubscription
        from django.utils import timezone
        
        is_active = VIPSubscription.objects.filter(
            user=self.user,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).exists()
        
        if self.is_vip != is_active:
            self.is_vip = is_active
            self.save(update_fields=['is_vip'])
        
        return is_active

    @property
    def currently_active_subscription(self):
        from apps.vip.models import VIPSubscription
        from django.utils import timezone
        sub = VIPSubscription.objects.filter(
            user=self.user,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).first()

        # Update flag as side effect when checking
        is_active = sub is not None
        if self.is_vip != is_active:
            self.is_vip = is_active
            self.save(update_fields=['is_vip'])
            
        return sub

    class Meta:
        db_table = 'profiles'
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'

    def __str__(self):
        return f"Profile for {self.user.email}"


class PortfolioItem(models.Model):
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='portfolio_items'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='portfolio/%Y/%m/%d/')
    url = models.URLField(blank=True, null=True, help_text="Link to the live project")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'portfolio_items'
        verbose_name = 'Portfolio Item'
        verbose_name_plural = 'Portfolio Items'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.profile.user.email})"
