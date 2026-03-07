import pytest
from django.urls import reverse
from rest_framework import status
from apps.proposals.models import Proposal
from apps.jobs.models import Job
from tests.factories import JobFactory, ProposalFactory, UserFactory
from decimal import Decimal

@pytest.mark.django_db
class TestProposals:
    def test_create_proposal_success(self, authenticated_client, freelancer_user, client_user):
        job = JobFactory(client=client_user, status=Job.Status.PUBLISHED)
        url = reverse('proposal-list')
        data = {
            'job': job.id,
            'message': 'I can do this!',
            'price': '400.00',
            'deadline_days': 3
        }
        
        authenticated_client.force_authenticate(user=freelancer_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Proposal.objects.filter(job=job, freelancer=freelancer_user).exists()

    def test_cannot_propose_to_own_job(self, authenticated_client, client_user):
        job = JobFactory(client=client_user, status=Job.Status.PUBLISHED)
        url = reverse('proposal-list')
        data = {
            'job': job.id,
            'message': 'Me too!',
            'price': '400.00',
            'deadline_days': 3
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_accept_proposal_success(self, authenticated_client, client_user, freelancer_user):
        job = JobFactory(client=client_user, status=Job.Status.PUBLISHED)
        proposal = ProposalFactory(job=job, freelancer=freelancer_user)
        
        url = reverse('proposal-accept', kwargs={'pk': proposal.id})
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        proposal.refresh_from_db()
        job.refresh_from_db()
        assert proposal.status == Proposal.Status.ACCEPTED
        assert job.status == Job.Status.IN_PROGRESS
        assert job.freelancer == freelancer_user

    def test_other_proposals_rejected_on_accept(self, client_user, freelancer_user):
        from apps.proposals.services import ProposalService
        job = JobFactory(client=client_user, status=Job.Status.PUBLISHED)
        p1 = ProposalFactory(job=job, freelancer=freelancer_user)
        
        other_freelancer = UserFactory()
        p2 = ProposalFactory(job=job, freelancer=other_freelancer)
        
        ProposalService.accept_proposal(p1, client_user)
        
        p2.refresh_from_db()
        assert p2.status == Proposal.Status.REJECTED

    def test_cannot_propose_to_non_published_job(self, authenticated_client, freelancer_user):
        job = JobFactory(status=Job.Status.DRAFT)
        url = reverse('proposal-list')
        data = {
            'job': job.id,
            'message': 'No!',
            'price': '100.00',
            'deadline_days': 1
        }
        
        authenticated_client.force_authenticate(user=freelancer_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
