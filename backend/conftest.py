import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from tests.factories import UserFactory, RoleFactory, ProfileFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def client_role(db):
    return RoleFactory(name='CLIENT')

@pytest.fixture
def freelancer_role(db):
    return RoleFactory(name='FREELANCER')

@pytest.fixture
def user(db):
    return UserFactory()

@pytest.fixture
def authenticated_client(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def client_user(db, client_role):
    u = UserFactory(roles=[client_role])
    ProfileFactory(user=u, balance=1000.00)
    return u

@pytest.fixture
def freelancer_user(db, freelancer_role):
    u = UserFactory(roles=[freelancer_role])
    ProfileFactory(user=u, balance=0.00)
    return u
