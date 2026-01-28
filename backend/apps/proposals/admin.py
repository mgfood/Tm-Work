from django.contrib import admin
from .models import Proposal


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['id', 'job', 'freelancer', 'price', 'is_accepted', 'created_at']
    list_filter = ['is_accepted', 'created_at']
    search_fields = ['job__title', 'freelancer__email', 'message']
    readonly_fields = ['created_at', 'updated_at']
    
    actions = ['accept_selected_proposals']

    def accept_selected_proposals(self, request, queryset):
        from .services import ProposalService
        from django.core.exceptions import ValidationError
        from django.contrib import messages

        for proposal in queryset:
            try:
                ProposalService.accept_proposal(proposal, request.user)
                self.message_user(request, f"Proposal {proposal.id} accepted successfully.")
            except ValidationError as e:
                self.message_user(request, f"Error accepting proposal {proposal.id}: {e.message}", level=messages.ERROR)
    
    accept_selected_proposals.short_description = "Accept selected proposals"
