from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Proposal
from .serializers import ProposalSerializer
from .services import ProposalService
from apps.users.permissions import IsFreelancer, IsJobOwner

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create']:
            return [IsFreelancer()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        proposal = self.get_object()
        try:
            ProposalService.accept_proposal(proposal, request.user)
            return Response({'status': 'proposal accepted, job is now in progress'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        proposal = self.get_object()
        try:
            ProposalService.reject_proposal(proposal, request.user)
            return Response({'status': 'proposal rejected'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        proposal = self.get_object()
        try:
            ProposalService.cancel_proposal(proposal, request.user)
            return Response({'status': 'proposal cancelled'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        # Ограничиваем видимость:
        # 1. Фрилансер видит свои отклики.
        # 2. Заказчик видит все отклики на свои заказы.
        # Теперь возвращаем объедененный набор.
        user = self.request.user
        from django.db.models import Q
        return Proposal.objects.filter(
            Q(freelancer=user) | Q(job__client=user)
        ).distinct()
