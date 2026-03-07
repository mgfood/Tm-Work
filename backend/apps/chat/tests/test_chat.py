import pytest
from django.urls import reverse
from rest_framework import status
from apps.chat.models import Thread, Message
from tests.factories import JobFactory, UserFactory

@pytest.mark.django_db
class TestChat:
    def test_create_thread_success(self, authenticated_client, client_user):
        other_user = UserFactory()
        url = reverse('message-get-or-create-thread')
        data = {
            'receiver_id': other_user.id,
            'type': 'PERSONAL'
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert Thread.objects.filter(participants=client_user).filter(participants=other_user).exists()

    def test_send_message_success(self, authenticated_client, client_user):
        other_user = UserFactory()
        thread = Thread.objects.create(type='PERSONAL')
        thread.participants.add(client_user, other_user)
        
        url = reverse('message-list')
        data = {
            'thread': thread.id,
            'content': 'Hello!'
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Message.objects.filter(thread=thread, sender=client_user, content='Hello!').exists()

    def test_cannot_message_self(self, authenticated_client, client_user):
        url = reverse('message-get-or-create-thread')
        data = {
            'receiver_id': client_user.id
        }
        
        authenticated_client.force_authenticate(user=client_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_broadcast(self, authenticated_client):
        admin_user = UserFactory(is_staff=True)
        u1 = UserFactory(is_active=True)
        u2 = UserFactory(is_active=True)
        
        url = reverse('admin-broadcast-broadcast')
        data = {
            'message': 'System update!',
            'target_type': 'ALL'
        }
        
        authenticated_client.force_authenticate(user=admin_user)
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        # Check if messages created in SYSTEM threads
        assert Message.objects.filter(content='System update!').count() >= 2
