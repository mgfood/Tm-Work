import pytest
from django.urls import reverse
from rest_framework import status
from apps.users.models import User

@pytest.mark.django_db
class TestAuthentication:
    def test_registration_success(self, api_client):
        url = reverse('register')
        data = {
            'email': 'testuser@example.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
            'roles': ['CLIENT']
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='testuser@example.com').exists()
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_success(self, api_client, user):
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'password123' # Factory password by default
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_invalid_credentials(self, api_client, user):
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_me_details(self, authenticated_client, user):
        url = reverse('current_user')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
