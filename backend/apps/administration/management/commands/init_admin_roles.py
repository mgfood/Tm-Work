from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Initialize admin roles (Support, Moderator, FinancialAdmin)'

    def handle(self, *args, **options):
        # Define roles and their permissions
        roles_config = {
            'Support': {
                'description': 'Can view users, jobs, chats. No financial or destructive actions.',
                'permissions': [
                    # View permissions
                    ('users', 'user', 'view'),
                    ('profiles', 'profile', 'view'),
                    ('jobs', 'job', 'view'),
                    ('chat', 'thread', 'view'),
                    ('chat', 'message', 'view'),
                    ('reviews', 'review', 'view'),
                ]
            },
            'Moderator': {
                'description': 'Can block users, manage categories, hide jobs. No financial access.',
                'permissions': [
                    # All Support permissions
                    ('users', 'user', 'view'),
                    ('profiles', 'profile', 'view'),
                    ('jobs', 'job', 'view'),
                    ('chat', 'thread', 'view'),
                    ('chat', 'message', 'view'),
                    ('reviews', 'review', 'view'),
                    # Additional moderator permissions
                    ('users', 'user', 'change'),  # For blocking
                    ('jobs', 'job', 'change'),  # For hiding/editing
                    ('jobs', 'category', 'add'),
                    ('jobs', 'category', 'change'),
                    ('jobs', 'category', 'delete'),
                    ('profiles', 'skill', 'add'),
                    ('profiles', 'skill', 'change'),
                    ('profiles', 'skill', 'delete'),
                ]
            },
            'FinancialAdmin': {
                'description': 'Can view transactions, adjust balances, manage escrow. No user deletion.',
                'permissions': [
                    # View permissions
                    ('users', 'user', 'view'),
                    ('profiles', 'profile', 'view'),
                    ('transactions', 'transaction', 'view'),
                    ('escrow', 'escrow', 'view'),
                    ('escrow', 'escrow', 'change'),  # For refunds/releases
                    ('profiles', 'profile', 'change'),  # For balance adjustment
                ]
            },
        }

        for role_name, config in roles_config.items():
            group, created = Group.objects.get_or_create(name=role_name)
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created group: {role_name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Group already exists: {role_name}'))
                # Clear existing permissions
                group.permissions.clear()

            # Add permissions
            for app_label, model_name, perm_type in config['permissions']:
                try:
                    content_type = ContentType.objects.get(app_label=app_label, model=model_name)
                    permission = Permission.objects.get(
                        content_type=content_type,
                        codename=f'{perm_type}_{model_name}'
                    )
                    group.permissions.add(permission)
                    self.stdout.write(f'  Added permission: {perm_type}_{model_name}')
                except ContentType.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'  ContentType not found: {app_label}.{model_name}'))
                except Permission.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'  Permission not found: {perm_type}_{model_name}'))

        self.stdout.write(self.style.SUCCESS('\nAdmin roles initialized successfully!'))
        self.stdout.write('\nRole descriptions:')
        for role_name, config in roles_config.items():
            self.stdout.write(f'  {role_name}: {config["description"]}')
