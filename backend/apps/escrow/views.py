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
        if escrow.payer != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Only the payer (client) can release funds.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            EscrowService.release_funds(escrow)
            return Response({'status': 'Funds released successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='refund')
    def refund(self, request, pk=None):
        """Refund funds to client (Admin or resolution)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can manually trigger refunds.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        escrow = self.get_object()
        try:
            EscrowService.refund_funds(escrow)
            return Response({'status': 'Funds refunded successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
