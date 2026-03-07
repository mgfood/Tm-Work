from django.core.management.base import BaseCommand
from apps.users.models import AdminRole


class Command(BaseCommand):
    help = 'Initialize default admin roles'

    def handle(self, *args, **options):
        roles_data = [
            {
                'name': 'Супер-Администратор',
                'codename': 'super_admin',
                'description': 'Полный доступ ко всем функциям платформы',
                'can_manage_users': True,
                'can_manage_jobs': True,
                'can_manage_finance': True,
                'can_manage_content': True,
                'can_manage_vip': True,
                'can_manage_admins': True,
            },
            {
                'name': 'Менеджер по спорам',
                'codename': 'dispute_manager',
                'description': 'Может решать споры между фрилансерами и клиентами',
                'can_manage_users': False,
                'can_manage_jobs': True,  # Доступ к заказам для решения споров
                'can_manage_finance': False,
                'can_manage_content': False,
                'can_manage_vip': False,
                'can_manage_admins': False,
            },
            {
                'name': 'Финансовый менеджер',
                'codename': 'finance_manager',
                'description': 'Может просматривать отчеты и транзакции',
                'can_manage_users': False,
                'can_manage_jobs': False,
                'can_manage_finance': True,
                'can_manage_content': False,
                'can_manage_vip': False,
                'can_manage_admins': False,
            },
            {
                'name': 'Контент-менеджер',
                'codename': 'content_manager',
                'description': 'Управляет категориями, навыками, VIP-планами',
                'can_manage_users': False,
                'can_manage_jobs': False,
                'can_manage_finance': False,
                'can_manage_content': True,
                'can_manage_vip': True,
                'can_manage_admins': False,
            },
            {
                'name': 'Модератор',
                'codename': 'moderator',
                'description': 'Может блокировать пользователей и просматривать контент',
                'can_manage_users': True,  # Только блокировка/разблокировка
                'can_manage_jobs': False,
                'can_manage_finance': False,
                'can_manage_content': False,
                'can_manage_vip': False,
                'can_manage_admins': False,
            },
        ]

        for role_data in roles_data:
            role, created = AdminRole.objects.get_or_create(
                codename=role_data['codename'],
                defaults=role_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Создана роль: {role.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'  Роль уже существует: {role.name}'))

        self.stdout.write(self.style.SUCCESS('\\nГотово! Роли администраторов инициализированы.'))
