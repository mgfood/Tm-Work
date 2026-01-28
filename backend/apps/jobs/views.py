from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job
from .serializers import JobSerializer
from .services import JobService
from apps.users.permissions import IsClient, IsJobOwner

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create']:
            return [IsClient()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsJobOwner()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        job = self.get_object()
        try:
            JobService.change_status(job, Job.Status.PUBLISHED, request.user)
            return Response({'status': 'job published'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        job = self.get_object()
        try:
            JobService.change_status(job, Job.Status.CANCELLED, request.user)
            return Response({'status': 'job cancelled'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
