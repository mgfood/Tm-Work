import pytest
from django.urls import reverse
from rest_framework import status
from django.core.exceptions import ValidationError
from apps.jobs.models import Job, JobStatusLog
from apps.jobs.services import JobService
from tests.factories import JobFactory, CategoryFactory, UserFactory
from decimal import Decimal

@pytest.mark.django_db
class TestJobLifecycle:
    def test_create_job_client_success(self, authenticated_client, client_user):
        category = CategoryFactory()
        url = reverse('job-list')
        data = {
            'title': 'New Test Job',
            'description': 'Description for test job',
            'budget': '300.00',
            'deadline': '2026-12-31T23:59:59Z',
            'category': category.id,
            'status': 'DRAFT'
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Job.objects.filter(title='New Test Job', client=client_user).exists()

    def test_freelancer_cannot_create_job(self, authenticated_client, freelancer_user):
        # Only users with CLIENT role should create jobs
        category = CategoryFactory()
        url = reverse('job-list')
        data = {
            'title': 'Forbidden Job',
            'budget': '100.00',
            'category': category.id
        }
        
        authenticated_client.force_authenticate(user=freelancer_user)
        response = authenticated_client.post(url, data, format='json')
        
        # The system correctly enforces roles: freelancers cannot create jobs.
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_service_status_transition_success(self, client_user):
        job = JobFactory(client=client_user, status=Job.Status.DRAFT)
        
        # DRAFT -> PUBLISHED (by client)
        JobService.change_status(job, Job.Status.PUBLISHED, client_user)
        assert job.status == Job.Status.PUBLISHED
        assert JobStatusLog.objects.filter(job=job, to_status=Job.Status.PUBLISHED).exists()

    def test_service_status_transition_invalid(self, client_user):
        job = JobFactory(client=client_user, status=Job.Status.DRAFT)
        
        # DRAFT -> COMPLETED (Invalid)
        with pytest.raises(ValidationError, match="Transition from DRAFT to COMPLETED is not allowed"):
            JobService.change_status(job, Job.Status.COMPLETED, client_user)

    def test_service_permission_violation(self, client_user, freelancer_user):
        job = JobFactory(client=client_user, status=Job.Status.DRAFT)
        
        # Freelancer cannot publish client's job
        with pytest.raises(ValidationError, match="Only the client can publish the job"):
            JobService.change_status(job, Job.Status.PUBLISHED, freelancer_user)

    def test_complete_job_side_effects(self, client_user, freelancer_user):
        # Setup: PUBLISHED -> IN_PROGRESS -> SUBMITTED -> COMPLETED
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.SUBMITTED)
        
        initial_count = freelancer_user.profile.completed_works_count
        
        JobService.change_status(job, Job.Status.COMPLETED, client_user)
        
        freelancer_user.profile.refresh_from_db()
        assert freelancer_user.profile.completed_works_count == initial_count + 1
        assert job.status == Job.Status.COMPLETED

    def test_approve_work_integration(self, client_user, freelancer_user):
        from apps.escrow.services import EscrowService
        from apps.vip.models import GlobalSettings
        
        # Ensure settings exist
        GlobalSettings.get_settings()
        
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.IN_PROGRESS)
        # Lock funds first
        escrow = EscrowService.lock_funds(job, client_user, freelancer_user, Decimal('100.00'))
        
        # Move to SUBMITTED
        JobService.change_status(job, Job.Status.SUBMITTED, freelancer_user)
        
        # Approve work (should release funds)
        JobService.approve_work(job, client_user)
        
        job.refresh_from_db()
        escrow.refresh_from_db()
        assert job.status == Job.Status.COMPLETED
        assert escrow.status == 'RELEASED'
