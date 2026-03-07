import pytest
from django.urls import reverse
from rest_framework import status
from apps.reviews.models import Review
from apps.jobs.models import Job
from tests.factories import JobFactory, UserFactory, ReviewFactory

@pytest.mark.django_db
class TestReviews:
    def test_client_reviews_freelancer_success(self, authenticated_client, client_user, freelancer_user):
        # Setup: Completed job with freelancer assigned
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.COMPLETED)
        
        url = reverse('review-list')
        data = {
            'job': job.id,
            'rating': 5,
            'comment': 'Great work!'
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify signal worked: freelancer profile should be updated
        freelancer_user.profile.refresh_from_db()
        assert freelancer_user.profile.freelancer_rating == 5.0
        assert freelancer_user.profile.freelancer_reviews_count == 1

    def test_freelancer_reviews_client_success(self, authenticated_client, client_user, freelancer_user):
        # Setup: Completed job
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.COMPLETED)
        
        url = reverse('review-list')
        data = {
            'job': job.id,
            'rating': 4,
            'comment': 'Good client.'
        }
        
        authenticated_client.force_authenticate(user=freelancer_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify signal worked: client profile should be updated
        client_user.profile.refresh_from_db()
        assert client_user.profile.client_rating == 4.0
        assert client_user.profile.client_reviews_count == 1

    def test_cannot_review_incomplete_job(self, authenticated_client, client_user, freelancer_user):
        # Setup: Job still in progress
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.IN_PROGRESS)
        
        url = reverse('review-list')
        data = {
            'job': job.id,
            'rating': 5,
            'comment': 'Too early!'
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Reviews can only be left for completed jobs' in str(response.data)

    def test_cannot_review_non_participant(self, authenticated_client, client_user, freelancer_user):
        # Setup: Completed job
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.COMPLETED)
        
        random_user = UserFactory()
        url = reverse('review-list')
        data = {
            'job': job.id,
            'rating': 1,
            'comment': 'I am not even here.'
        }
        
        authenticated_client.force_authenticate(user=random_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'You must be a participant' in str(response.data)

    def test_duplicate_review_prevention(self, authenticated_client, client_user, freelancer_user):
        # Setup: Job with an existing review from client
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.COMPLETED)
        Review.objects.create(job=job, author=client_user, receiver=freelancer_user, rating=5, comment="First")
        
        url = reverse('review-list')
        data = {
            'job': job.id,
            'rating': 5,
            'comment': 'Second'
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        # Depending on how unique_together is handled, it could be 400 from serializer or IntegrityError
        # DRF usually handles non_field_errors for unique_together
        assert response.status_code == status.HTTP_400_BAD_REQUEST
