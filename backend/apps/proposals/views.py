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
        # Limit visibility:
        # 1. Freelancer sees their own proposals.
        # 2. Client sees all proposals for their jobs.
        user = self.request.user
        if not user.is_authenticated:
            return Proposal.objects.none()

        from django.db.models import Q
        queryset = Proposal.objects.filter(
            Q(freelancer=user) | (Q(job__client=user) & Q(freelancer__is_deleted=False))
        ).distinct()

        # Filter by job
        job_id = self.request.query_params.get('job')
        if job_id:
            queryset = queryset.filter(job_id=job_id)

        # Filter by type (sent/received)
        filter_type = self.request.query_params.get('type')
        if filter_type == 'sent':
            queryset = queryset.filter(freelancer=user)
        elif filter_type == 'received':
            queryset = queryset.filter(job__client=user)
        
        return queryset
