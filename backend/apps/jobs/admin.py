from django.contrib import admin
from .models import Job, JobFile, Category



@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ru', 'name_tk', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}


class JobFileInline(admin.TabularInline):
    model = JobFile
    extra = 1


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'freelancer', 'status', 'budget', 'category', 'created_at']
    list_filter = ['status', 'category', 'created_at', 'deadline']
    search_fields = ['title', 'description', 'client__email', 'freelancer__email']
    inlines = [JobFileInline]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'category', 'status')}),
        ('Parties', {'fields': ('client', 'freelancer')}),
        ('Finances & Deadlines', {'fields': ('budget', 'deadline')}),
        ('Metadata', {'fields': ('created_at', 'updated_at')}),
    )
