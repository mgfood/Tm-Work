import pytest
from django.urls import reverse
from rest_framework import status
from apps.notifications.models import Notification
from apps.jobs.models import Job
from apps.chat.models import Thread, Message
from tests.factories import UserFactory, JobFactory, ProposalFactory

@pytest.mark.django_db
class TestNotifications:
    def test_unread_count(self, authenticated_client, client_user):
        # Setup: Some notifications
        Notification.objects.create(user=client_user, title="T1", message="M1")
        Notification.objects.create(user=client_user, title="T2", message="M2", is_read=True)
        
        url = reverse('notification-unread-count')
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_mark_as_read(self, authenticated_client, client_user):
        n = Notification.objects.create(user=client_user, title="T1", message="M1")
        
        url = reverse('notification-mark-as-read', kwargs={'pk': n.id})
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        n.refresh_from_db()
        assert n.is_read is True

    def test_mark_all_read(self, authenticated_client, client_user):
        Notification.objects.create(user=client_user, title="T1", message="M1")
        Notification.objects.create(user=client_user, title="T2", message="M2")
        
        url = reverse('notification-mark-all-read')
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.filter(user=client_user, is_read=False).count() == 0

    def test_proposal_signal_creates_notification(self, client_user, freelancer_user):
        job = JobFactory(client=client_user, status=Job.Status.PUBLISHED)
        
        # Creating a proposal should trigger a notification for the client
        ProposalFactory(job=job, freelancer=freelancer_user)
        
        assert Notification.objects.filter(user=client_user, title="Новый отклик").exists()

    def test_message_signal_creates_notification(self, client_user, freelancer_user):
        thread = Thread.objects.create(type='PERSONAL')
        thread.participants.add(client_user, freelancer_user)
        
        # Message from freelancer to client
        Message.objects.create(thread=thread, sender=freelancer_user, content="Hey")
        
        assert Notification.objects.filter(user=client_user, title="Новое сообщение").exists()

    def test_job_status_signal_creates_notification(self, client_user, freelancer_user):
        job = JobFactory(client=client_user, freelancer=freelancer_user, status=Job.Status.IN_PROGRESS)
        
        # Change status to SUBMITTED
        job.status = Job.Status.SUBMITTED
        job.save()
        
        assert Notification.objects.filter(user=client_user, title="Работа сдана").exists()
