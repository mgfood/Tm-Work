import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.vip.models import VIPPlan, GlobalSettings

def seed_vip():
    # 1. Global Settings
    settings = GlobalSettings.get_settings()
    settings.regular_commission = 10.00
    settings.vip_commission = 5.00
    settings.save()
    print("Initial GlobalSettings created.")

    # 2. VIP Plans
    plans = [
        {
            "name": "PRO-1",
            "months": 1,
            "price_per_month": 100.00,
            "discount_percentage": 0,
            "badge_icon": "Award",
            "badge_color": "#f59e0b" # Amber/Gold
        },
        {
            "name": "PRO-3",
            "months": 3,
            "price_per_month": 90.00,
            "discount_percentage": 10,
            "badge_icon": "ShieldCheck",
            "badge_color": "#3b82f6" # Blue
        },
        {
            "name": "PRO-12",
            "months": 12,
            "price_per_month": 70.00,
            "discount_percentage": 30,
            "badge_icon": "Zap",
            "badge_color": "#a855f7" # Purple
        }
    ]

    for p in plans:
        VIPPlan.objects.get_or_create(name=p["name"], defaults=p)
        print(f"Plan {p['name']} created/updated.")

if __name__ == "__main__":
    seed_vip()
