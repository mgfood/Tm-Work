import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append('f:/TmWork/backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import User
from apps.jobs.models import Job, Category
from apps.proposals.models import Proposal
from apps.jobs.services import JobService
from apps.proposals.services import ProposalService

from django.utils import timezone

def run_verification():
    print("Starting verification...")

    # 1. Create Users
    client_email = "verify_client@test.com"
    freelancer_email = "verify_freelancer@test.com"
    
    User.objects.filter(email__in=[client_email, freelancer_email]).delete()
    
    client = User.objects.create_user(email=client_email, password="password123")
    client.roles_list = ['CLIENT']
    client.save()
    
    freelancer = User.objects.create_user(email=freelancer_email, password="password123")
    freelancer.roles_list = ['FREELANCER']
    freelancer.save()
    
    print(f"Users created: {client.email}, {freelancer.email}")

    # Create Profiles
    from apps.profiles.models import Profile
    Profile.objects.create(user=client, balance=Decimal("1000.00"))
    Profile.objects.create(user=freelancer)
    print("Profiles created and balance added.")

    # Create Category
    category, created = Category.objects.get_or_create(name="Test Category", defaults={"icon": "test"})
    print(f"Category: {category.name}")

    # 2. Create Job
    job = Job.objects.create(
        client=client,
        title="Verification Job",
        description="Test description",
        budget=Decimal("100.00"),
        status=Job.Status.PUBLISHED,
        category=category,
        deadline=timezone.now() + timezone.timedelta(days=7)
    )
    print(f"Job created: {job.title} (Status: {job.status})")

    # 3. Create Proposal (Freelancer)
    proposal = ProposalService.create_proposal(
        job=job,
        freelancer=freelancer,
        price=Decimal("90.00"),
        message="I can do this!",
        deadline_days=5
    )
    print(f"Proposal created: {proposal.id} (Status: {proposal.status})")

    # 4. Reject Proposal (Client)
    try:
        ProposalService.reject_proposal(proposal, client)
        print(f"Proposal rejected: {proposal.id} (Status: {proposal.status})")
    except Exception as e:
        print(f"FAILED to reject proposal: {e}")
        return

    # 5. Create New Proposal (Freelancer)
    # First delete the old rejected one due to unique_together constraint
    proposal.delete()
    print("Deleted rejected proposal to allow new one.")

    proposal_2 = ProposalService.create_proposal(
        job=job,
        freelancer=freelancer,
        price=Decimal("95.00"),
        message="Second chance?",
        deadline_days=4
    )
    print(f"Second proposal created: {proposal_2.id}")

    # 6. Accept Proposal (Client)
    try:
        ProposalService.accept_proposal(proposal_2, client)
        job.refresh_from_db()
        print(f"Proposal accepted. Job status: {job.status} (Expected: IN_PROGRESS)")
    except Exception as e:
        print(f"FAILED to accept proposal: {e}")
        return

    # 7. Submit Work (Freelancer)
    try:
        JobService.submit_work(job, freelancer, "Here is the work", [])
        job.refresh_from_db()
        print(f"Work submitted. Job status: {job.status} (Expected: SUBMITTED)")
    except Exception as e:
        print(f"FAILED to submit work: {e}")
        return

    # 8. Request Revision (Client)
    try:
        JobService.change_status(job, Job.Status.IN_PROGRESS, client)
        job.refresh_from_db()
        print(f"Revision requested. Job status: {job.status} (Expected: IN_PROGRESS)")
    except Exception as e:
        print(f"FAILED to request revision: {e}")
        return

    # 9. Submit Work Again (Freelancer)
    try:
        JobService.submit_work(job, freelancer, "Fixed work", [])
        job.refresh_from_db()
        print(f"Work resubmitted. Job status: {job.status} (Expected: SUBMITTED)")
    except Exception as e:
        print(f"FAILED to resubmit work: {e}")
        return

    # 10. Approve Work (Client)
    try:
        JobService.approve_work(job, client)
        job.refresh_from_db()
        print(f"Work approved. Job status: {job.status} (Expected: COMPLETED)")
    except Exception as e:
        print(f"FAILED to approve work: {e}")
        return

    print("VERIFICATION SUCCESSFUL!")

if __name__ == "__main__":
    run_verification()
