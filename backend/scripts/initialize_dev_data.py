import os
import django
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.jobs.models import Category
from apps.profiles.models import Profile

User = get_user_model()

def run():
    print("Initializing development data...")

    # 1. Create Categories
    categories = [
        "Разработка ПО", 
        "Дизайн", 
        "Маркетинг", 
        "Копирайтинг", 
        "Переводы"
    ]
    for cat_name in categories:
        Category.objects.get_or_create(name=cat_name)
    print(f"Created {len(categories)} categories.")

    # 2. Ensure Superuser (from user request)
    su_email = "mgurbanmuradow2010@gmail.com"
    if not User.objects.filter(email=su_email).exists():
        User.objects.create_superuser(
            email=su_email,
            password="meylis2010aprel",
            first_name="Admin",
            last_name="Super"
        )
        print(f"Superuser {su_email} created.")
    else:
        print(f"Superuser {su_email} already exists.")

    # 3. Create Test Client
    client_email = "client@example.com"
    if not User.objects.filter(email=client_email).exists():
        client = User.objects.create_user(
            email=client_email,
            password="TestPass123!",
            first_name="Test",
            last_name="Client"
        )
        # Handle M2M roles
        from apps.users.models import Role
        client_role, _ = Role.objects.get_or_create(name='CLIENT')
        client.roles.set([client_role])
        print(f"Test Client {client_email} created.")
    
    # 4. Create Test Freelancer
    freelancer_email = "freelancer@example.com"
    if not User.objects.filter(email=freelancer_email).exists():
        freelancer = User.objects.create_user(
            email=freelancer_email,
            password="TestPass123!",
            first_name="Test",
            last_name="Freelancer"
        )
        # Handle M2M roles
        from apps.users.models import Role
        freelancer_role, _ = Role.objects.get_or_create(name='FREELANCER')
        freelancer.roles.set([freelancer_role])
        # Ensure profile exists and has some info
        profile, _ = Profile.objects.get_or_create(user=freelancer)
        profile.bio = "I am a professional developer for testing."
        profile.location = "Ashgabat"
        profile.save()
        print(f"Test Freelancer {freelancer_email} created.")

    print("Development data initialization complete!")

if __name__ == "__main__":
    run()
