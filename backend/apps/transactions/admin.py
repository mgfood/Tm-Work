from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'type', 'reference_id', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['user__email', 'reference_id', 'description']
    readonly_fields = ['id', 'user', 'amount', 'type', 'reference_id', 'description', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
