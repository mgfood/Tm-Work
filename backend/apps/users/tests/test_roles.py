import pytest
from django.urls import reverse
from rest_framework import status
from apps.users.models import Role

@pytest.mark.django_db
class TestUserRoles:
    def test_toggle_role_success(self, authenticated_client, user, client_role):
        url = reverse('users-toggle-role')
        data = {'role': 'CLIENT'}
        
        # Initial state (should not have role unless factory did it)
        assert not user.roles.filter(name='CLIENT').exists()
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert user.roles.filter(name='CLIENT').exists()

    def test_assign_role_admin(self, authenticated_client, user, freelancer_role):
        # Test admin action assign-role if user is staff
        user.is_staff = True
        user.save()
        
        url = reverse('users-assign-role', kwargs={'pk': user.id})
        data = {'role': 'FREELANCER'}
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert user.roles.filter(name='FREELANCER').exists()
