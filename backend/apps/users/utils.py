from .models import User

def get_system_user():
    """
    Get or create the official system user.
    """
    email = "system@tmwork.com"
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'TmWork',
            'last_name': 'Official',
            'is_active': False,  # System user cannot login
            'is_staff': False,
            'is_superuser': False,
        }
    )
    return user
