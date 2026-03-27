from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job, JobFile, Category
from .serializers import JobSerializer, JobFileSerializer, CategorySerializer
from .services import JobService
from apps.users.permissions import IsClient, IsJobOwner
from django.db import models # Added this import for models.Q

from django.db.models import Count, Q
from .models import Job, JobFile, Category

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.annotate(
            jobs_count=Count(
                'jobs',
                filter=Q(jobs__status=Job.Status.PUBLISHED),
                distinct=True
            ),
            specialists_count=Count(
                'profiles',
                filter=Q(profiles__user__roles__name='FREELANCER'),
                distinct=True
            )
        )

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='global-stats')
    def global_stats(self, request):
        from apps.users.models import User
        total_freelancers = User.objects.filter(roles__name='FREELANCER').distinct().count()
        total_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).count()
        total_completed = Job.objects.filter(status=Job.Status.COMPLETED).count()
        return Response({
            'total_freelancers': total_freelancers,
            'total_jobs': total_jobs,
            'total_completed': total_completed,
        })


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Job visibility logic:
        1. Drafts are ONLY visible to their creators (and staff).
        2. In 'list' action, drafts are hidden unless filtering by client (profile view).
        """
        user = self.request.user
        queryset = Job.objects.all()

        # Filtering by params
        status_param = self.request.query_params.get('status')
        client_param = self.request.query_params.get('client')
        freelancer_param = self.request.query_params.get('freelancer')
        category_param = self.request.query_params.get('category')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if client_param:
            queryset = queryset.filter(client_id=client_param)
        if freelancer_param:
            queryset = queryset.filter(freelancer_id=freelancer_param)
        if category_param:
            queryset = queryset.filter(category_id=category_param)

        if user.is_staff:
            return queryset

        # Visibility restrictions
        public_statuses = [
            Job.Status.PUBLISHED, 
            Job.Status.IN_PROGRESS, 
            Job.Status.SUBMITTED,
            Job.Status.COMPLETED,
            Job.Status.DISPUTE,
            Job.Status.CANCELLED
        ]
        
        if self.action == 'list':
            # Hide drafts from public list even for owner
            # Use 'client' param as a proxy for "I am viewing my own jobs"
            if not client_param:
                return queryset.filter(status__in=public_statuses)
            
            # If client_param is set, allow owner to see their drafts
            return queryset.filter(
                models.Q(status__in=public_statuses) |
                models.Q(client=user, status=Job.Status.DRAFT)
            )

        # Retrieve/Update/Delete
        if user.is_authenticated:
            return queryset.filter(
                models.Q(status__in=public_statuses) |
                models.Q(client=user) |
                models.Q(freelancer=user)
            )
        return queryset.filter(status__in=public_statuses)

    def get_permissions(self):
        if self.action in ['create']:
            return [IsClient()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsJobOwner()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def perform_destroy(self, instance):
        if instance.status not in [Job.Status.DRAFT, Job.Status.PUBLISHED, Job.Status.CANCELLED]:
            raise ValidationError("Cannot delete a job that is in progress or completed.")
        instance.delete()

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

    @action(detail=True, methods=['post'], url_path='upload-file')
    def upload_file(self, request, pk=None):
        job = self.get_object()
        if job.client != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        job_file = JobFile.objects.create(
            job=job,
            file=file,
            uploaded_by=request.user
        )
        serializer = JobFileSerializer(job_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='delete-file/(?P<file_id>[^/.]+)')
    def delete_file(self, request, pk=None, file_id=None):
        job = self.get_object()
        if job.client != request.user and not request.user.is_staff:
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            job_file = JobFile.objects.get(id=file_id, job=job)
            job_file.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except JobFile.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='submit-work')
    def submit_work(self, request, pk=None):
        job = self.get_object()
        content = request.data.get('content')
        file_ids = request.data.get('file_ids', [])
        
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file ownership (IDOR protection)
        if file_ids:
            valid_files = JobFile.objects.filter(
                id__in=file_ids,
                job=job,
                uploaded_by=request.user
            )
            if valid_files.count() != len(file_ids):
                return Response({
                    'error': 'Some files do not belong to this job or were not uploaded by you'
                }, status=status.HTTP_403_FORBIDDEN)
            
        try:
            submission = JobService.submit_work(job, request.user, content, file_ids)
            from .serializers import JobSubmissionSerializer
            return Response(JobSubmissionSerializer(submission).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='approve-work')
    def approve_work(self, request, pk=None):
        job = self.get_object()
        try:
            JobService.approve_work(job, request.user)
            return Response({'status': 'job completed and funds released'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='request-revision')
    def request_revision(self, request, pk=None):
        job = self.get_object()
        try:
            JobService.change_status(job, Job.Status.IN_PROGRESS, request.user)
            return Response({'status': 'job returned for revision'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='force-status', permission_classes=[permissions.IsAdminUser])
    def force_status(self, request, pk=None):
        """
        Force status change (admin only)
        POST /api/v1/jobs/{id}/force-status/
        Body: {"status": "PUBLISHED|IN_PROGRESS|SUBMITTED|COMPLETED|DISPUTE|CANCELLED", "reason": "..."}
        """
        job = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason', 'Admin forced status change')
        
        valid_statuses = [s[0] for s in Job.Status.choices]
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Valid options: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = job.status
        job.status = new_status
        job.save()
        
        # Логирование в аудит системы
        from apps.administration.models import log_admin_action, AdminLog
        log_admin_action(
            admin=request.user,
            action_type=AdminLog.ActionType.UPDATE_USER,  # Мы можем добавить UPDATE_JOB позже
            target_info=f"Job ID: {job.id}",
            comment=f"Status changed from {old_status} to {new_status}. Reason: {reason}"
        )

        # Логирование в историю заказа
        from .models import JobStatusLog
        JobStatusLog.objects.create(
            job=job,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            comment=f"FORCE STATUS CHANGE by Admin: {reason}"
        )
        
        return Response({
            'status': 'Job status updated',
            'old_status': old_status,
            'new_status': new_status
        })
