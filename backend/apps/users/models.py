from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(email, password, **extra_fields)


class Permission(models.Model):
    name = models.CharField(max_length=100)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'

    def __str__(self):
        return self.name


class Role(models.Model):
    class Type(models.TextChoices):
        CLIENT = 'CLIENT', 'Client'
        FREELANCER = 'FREELANCER', 'Freelancer'

    name = models.CharField(max_length=50, unique=True, choices=Type.choices)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.get_name_display()


class AdminRole(models.Model):
    """
    Roles for administrative staff with granular permissions.
    SuperAdmin has all rights and can assign roles to other admins.
    """
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    # Permissions
    can_manage_users = models.BooleanField(default=False, help_text='Can view/edit regular users')
    can_manage_jobs = models.BooleanField(default=False, help_text='Can manage jobs and disputes')
    can_manage_finance = models.BooleanField(default=False, help_text='Can view financial reports and transactions')
    can_manage_content = models.BooleanField(default=False, help_text='Can manage categories, skills')
    can_manage_vip = models.BooleanField(default=False, help_text='Can manage VIP plans and subscriptions')
    can_manage_admins = models.BooleanField(default=False, help_text='Can assign admin roles (SuperAdmin only)')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_roles'
        verbose_name = 'Admin Role'
        verbose_name_plural = 'Admin Roles'

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    roles = models.ManyToManyField(Role, related_name='users', blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    is_anonymized = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    blocked_until = models.DateTimeField(null=True, blank=True, help_text="User is blocked until this time")
    block_reason = models.TextField(blank=True, help_text="Reason for blocking")
    blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        if self.is_deleted:
            return "Удаленный Аккаунт"
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def get_short_name(self):
        if self.is_deleted:
            return "Удаленный"
        return self.first_name or self.email

    def has_role(self, role_name):
        return self.roles.filter(name=role_name).exists()

    def has_permission(self, perm_codename):
        if self.is_superuser:
            return True
        return self.roles.filter(permissions__codename=perm_codename).exists()

    def add_role(self, role_name):
        role, _ = Role.objects.get_or_create(name=role_name)
        self.roles.add(role)

    def remove_role(self, role_name):
        role = Role.objects.filter(name=role_name).first()
        if role:
            self.roles.remove(role)


class PasswordResetCode(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reset_codes'
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_codes'
        verbose_name = 'Password Reset Code'
        verbose_name_plural = 'Password Reset Codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Code for {self.user.email} created at {self.created_at}"

    def is_expired(self):
        # Code is valid for 15 minutes
        expiration_time = self.created_at + timezone.timedelta(minutes=15)
        return timezone.now() > expiration_time
