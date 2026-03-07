import pytest
from django.urls import reverse
from rest_framework import status
from apps.administration.models import log_admin_action, AdminLog
from tests.factories import UserFactory

@pytest.mark.django_db
class TestAdministration:
    def test_get_stats_success(self, authenticated_client):
        admin = UserFactory(is_staff=True)
        url = reverse('admin-actions-get-stats')
        
        authenticated_client.force_authenticate(user=admin)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'trends' in response.data
        assert 'completion_rate' in response.data
        assert 'summary' in response.data

    def test_get_logs_success(self, authenticated_client):
        admin = UserFactory(is_staff=True)
        log_admin_action(admin, AdminLog.ActionType.BROADCAST, "Global", "Test log")
        
        url = reverse('admin-actions-get-logs')
        authenticated_client.force_authenticate(user=admin)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['action_type'] == AdminLog.ActionType.BROADCAST

    def test_regular_user_denied_access(self, authenticated_client):
        user = UserFactory(is_staff=False)
        url_stats = reverse('admin-actions-get-stats')
        url_logs = reverse('admin-actions-get-logs')
        
        authenticated_client.force_authenticate(user=user)
        
        response_stats = authenticated_client.get(url_stats)
        assert response_stats.status_code == status.HTTP_403_FORBIDDEN
        
        response_logs = authenticated_client.get(url_logs)
        assert response_logs.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_logging_utility(self):
        admin = UserFactory(is_staff=True)
        log = log_admin_action(admin, AdminLog.ActionType.BLOCK_USER, "User:1", "SPAM")
        
        assert AdminLog.objects.filter(id=log.id).exists()
        assert log.admin == admin
        assert log.action_type == AdminLog.ActionType.BLOCK_USER
