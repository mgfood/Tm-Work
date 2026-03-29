import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.users.models import User
from apps.profiles.models import Profile
from apps.profiles.serializers import ProfileSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def test_profile_update_names():
    # 1. Setup a test user and profile
    user = User.objects.filter(email='test_update@example.com').first()
    if user:
        user.delete()
    
    user = User.objects.create_user(
        email='test_update@example.com',
        password='password123',
        first_name='OldFirst',
        last_name='OldLast'
    )
    profile, _ = Profile.objects.get_or_create(user=user)
    
    print(f"Initial: {user.first_name} {user.last_name}")
    
    # 2. Prepare update data
    data = {
        'first_name': 'NewFirst',
        'last_name': 'NewLast',
        'profession': 'Software Optimizer'
    }
    
    # 3. Use serializer to update
    serializer = ProfileSerializer(instance=profile, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        user.refresh_from_db()
        print(f"Updated: {user.first_name} {user.last_name}")
        
        if user.first_name == 'NewFirst' and user.last_name == 'NewLast':
            print("SUCCESS: Profile names updated correctly.")
        else:
            print("FAILURE: Names were not updated.")
    else:
        print(f"SERIALIZER ERRORS: {serializer.errors}")

if __name__ == "__main__":
    test_profile_update_names()
