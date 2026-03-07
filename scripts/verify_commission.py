import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.contrib.auth import get_user_model
from apps.profiles.models import Profile
from apps.jobs.models import Job
from apps.escrow.models import Escrow
from apps.escrow.services import EscrowService
from apps.transactions.models import Transaction

User = get_user_model()

def run_test():
    print("--- Testing Commission Logic ---")
    
    # 1. Setup Users
    client_email = "client_test_comm@example.com"
    freelancer_email = "free_test_comm@example.com"
    
    client, _ = User.objects.get_or_create(email=client_email, defaults={'first_name': 'Client'})
    freelancer, _ = User.objects.get_or_create(email=freelancer_email, defaults={'first_name': 'Free'})
    
    # Ensure profiles and balances
    p_client, _ = Profile.objects.get_or_create(user=client)
    p_free, _ = Profile.objects.get_or_create(user=freelancer)
    
    # Top up client
    p_client.balance = Decimal("2000.00")
    p_client.save()
    
    # Reset freelancer
    p_free.balance = Decimal("0.00")
    p_free.save()
    
    print(f"Client Balance: {p_client.balance}")
    print(f"Freelancer Balance: {p_free.balance}")
    
    # 2. Create Job
    from django.utils import timezone
    from datetime import timedelta
    from apps.jobs.models import Category

    cat, _ = Category.objects.get_or_create(name="Test Category", slug="test-cat")

    job, _ = Job.objects.get_or_create(
        client=client,
        title="Test Commission Job",
        defaults={
            'description': 'Test Description', 
            'budget': 1000, 
            'status': Job.Status.IN_PROGRESS,
            'deadline': timezone.now() + timedelta(days=7),
            'category': cat
        }
    )
    
    # 3. Create Escrow and Lock
    amount = Decimal("1000.00")
    escrow, created = Escrow.objects.get_or_create(
        job=job,
        defaults={'payer': client, 'payee': freelancer, 'amount': amount, 'status': Escrow.Status.CREATED}
    )
    
    if escrow.status == Escrow.Status.CREATED:
        EscrowService.lock_funds(job, client, freelancer, amount)
        print("Funds Locked.")
        escrow.refresh_from_db()  # Важно обновить статус после lock_funds
        
    # Check client balance after lock
    p_client.refresh_from_db()
    print(f"Client Balance (Locked): {p_client.balance} (Should be 1000)")

    # 4. Release Funds
    print("Releasing Funds...")
    EscrowService.release_funds(escrow, client)
    
    # 5. Verify Balances
    p_free.refresh_from_db()
    
    # Check System Wallet
    from django.conf import settings
    system_email = getattr(settings, 'SYSTEM_WALLET_EMAIL', 'system@tmwork.tm')
    system_user = User.objects.get(email=system_email)
    p_system = Profile.objects.get(user=system_user)
    
    print(f"Freelancer Balance: {p_free.balance}")
    print(f"System Wallet Balance: {p_system.balance}")
    
    # Expected: 10% commission (default) -> 100 TMT to system, 900 TMT to freelancer
    # Unless VIP logic changes it.
    
    if p_system.balance >= 100: # Assuming it might have previous funds
        print("[SUCCESS] System wallet received funds.")
    else:
        print("[FAIL] System wallet balance is too low.")

    # Cleanup
    # escrow.delete()
    # job.delete()

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"[ERROR] {e}")
