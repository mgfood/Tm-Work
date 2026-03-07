from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from .models import Escrow
from .services import EscrowService

@admin.register(Escrow)
class EscrowAdmin(admin.ModelAdmin):
    list_display = ['job', 'amount', 'status', 'payer', 'payee', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['job__title', 'payer__email', 'payee__email']
    readonly_fields = ['created_at', 'updated_at']
    
    actions = ['admin_release_funds', 'admin_refund_funds']

    def admin_release_funds(self, request, queryset):
        """Арбитраж: Принудительная выплата через админку"""
        for escrow in queryset:
            try:
                EscrowService.release_funds(escrow, actor=request.user)
                self.message_user(request, f"Funds released for {escrow.job.title}")
            except ValidationError as e:
                self.message_user(request, f"Error: {e.message}", level=messages.ERROR)
    
    admin_release_funds.short_description = "Force Release (Arbitration)"

    def admin_refund_funds(self, request, queryset):
        """Арбитраж: Принудительный возврат через админку"""
        for escrow in queryset:
            try:
                EscrowService.refund_funds(escrow, actor=request.user)
                self.message_user(request, f"Funds refunded for {escrow.job.title}")
            except ValidationError as e:
                self.message_user(request, f"Error: {e.message}", level=messages.ERROR)

    admin_refund_funds.short_description = "Force Refund (Arbitration)"
