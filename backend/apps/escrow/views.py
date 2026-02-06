from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Escrow
from .serializers import EscrowSerializer
from .services import EscrowService


class EscrowViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Escrow management (read-only for users, custom actions for operations)
    
    GET /api/v1/escrow/
    """
    queryset = Escrow.objects.all()
    serializer_class = EscrowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see only escrows where they are payer or payee
        user = self.request.user
        if user.is_staff:
            return Escrow.objects.all()
        return Escrow.objects.filter(payer=user) | Escrow.objects.filter(payee=user)

    @action(detail=True, methods=['post'], url_path='release')
    def release(self, request, pk=None):
        """Release funds to freelancer (Client only)"""
        escrow = self.get_object()
        
        try:
            EscrowService.release_funds(escrow, request.user)
            
            # Log admin action if it was staff
            if request.user.is_staff:
                from apps.administration.models import log_admin_action, AdminLog
                log_admin_action(
                    admin=request.user,
                    action_type=AdminLog.ActionType.FORCE_ESCROW_RELEASE,
                    target_info=f"Escrow ID: {escrow.id}",
                    comment=request.data.get('reason', 'Forced release by admin')
                )
                
            return Response({'status': 'Funds released successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='refund')
    def refund(self, request, pk=None):
        """Refund funds to client (Admin or resolution)"""
        escrow = self.get_object()
        try:
            EscrowService.refund_funds(escrow, request.user)
            
            # Log admin action (refund is admin-only anyway per service logic usually)
            from apps.administration.models import log_admin_action, AdminLog
            log_admin_action(
                admin=request.user,
                action_type=AdminLog.ActionType.FORCE_ESCROW_REFUND,
                target_info=f"Escrow ID: {escrow.id}",
                comment=request.data.get('reason', 'Refunded by admin')
            )
            
            return Response({'status': 'Funds refunded successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
