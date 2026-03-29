from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename']
    search_fields = ['name', 'codename']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']
    filter_horizontal = ['permissions']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'is_active', 'is_deleted', 'date_joined']
    list_filter = ['is_active', 'is_deleted', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    filter_horizontal = ['roles']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'roles')}),
        ('Status', {'fields': ('is_active', 'is_deleted', 'deleted_at', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Blocks', {'fields': ('blocked_until', 'block_reason', 'blocked_users')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login', 'deleted_at']
