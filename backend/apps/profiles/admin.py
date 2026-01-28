from django.contrib import admin
from .models import Profile, Skill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'freelancer_rating', 'client_rating', 'freelancer_reviews_count', 'client_reviews_count']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    list_filter = ['freelancer_rating', 'client_rating']
    filter_horizontal = ['skills']
    readonly_fields = ['freelancer_reviews_count', 'client_reviews_count']
    
    fieldsets = (
        ('User Link', {'fields': ('user',)}),
        ('Public Info', {'fields': ('avatar', 'bio', 'skills')}),
        ('Ratings', {'fields': ('freelancer_rating', 'freelancer_reviews_count', 'client_rating', 'client_reviews_count')}),
        ('Private Info', {'fields': ('phone_number', 'birth_date', 'location')}),
    )
