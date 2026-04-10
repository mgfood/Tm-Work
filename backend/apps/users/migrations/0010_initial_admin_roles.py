from django.db import migrations

def create_initial_roles(apps, schema_editor):
    AdminRole = apps.get_model('users', 'AdminRole')
    
    roles = [
        {
            'name': 'SuperAdmin',
            'codename': 'super_admin',
            'description': 'Полный доступ ко всем функциям системы',
            'can_manage_users': True,
            'can_manage_jobs': True,
            'can_manage_finance': True,
            'can_manage_content': True,
            'can_manage_vip': True,
            'can_manage_admins': True,
        },
        {
            'name': 'Модератор',
            'codename': 'moderator',
            'description': 'Управление пользователями, заданиями и контентом',
            'can_manage_users': True,
            'can_manage_jobs': True,
            'can_manage_content': True,
            'can_manage_finance': False,
            'can_manage_vip': False,
            'can_manage_admins': False,
        },
        {
            'name': 'Арбитр',
            'codename': 'arbiter',
            'description': 'Решение споров по сделкам Escrow',
            'can_manage_users': False,
            'can_manage_jobs': True,
            'can_manage_content': False,
            'can_manage_finance': False,
            'can_manage_vip': False,
            'can_manage_admins': False,
        },
        {
            'name': 'Фин. менеджер',
            'codename': 'finance_manager',
            'description': 'Просмотр отчетов и создание запросов на изменение баланса',
            'can_manage_users': False,
            'can_manage_jobs': False,
            'can_manage_content': False,
            'can_manage_finance': True,
            'can_manage_vip': False,
            'can_manage_admins': False,
        }
    ]
    
    for role_data in roles:
        AdminRole.objects.get_or_create(codename=role_data['codename'], defaults=role_data)

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0009_user_admin_role'),
    ]
    operations = [
        migrations.RunPython(create_initial_roles),
    ]
