import factory
from factory.django import DjangoModelFactory
from apps.users.models import User, Role
from apps.profiles.models import Profile, Skill
from apps.jobs.models import Job, Category
from apps.proposals.models import Proposal
from apps.transactions.models import Transaction
from apps.escrow.models import Escrow
from apps.reviews.models import Review
from apps.vip.models import VIPPlan, VIPSubscription
from decimal import Decimal
from django.utils import timezone

class RoleFactory(DjangoModelFactory):
    class Meta:
        model = Role
        django_get_or_create = ('name',)

    name = Role.Type.CLIENT
    description = factory.Faker('sentence')

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('email',)

    email = factory.Faker('email')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        password = extracted or 'password123'
        self.set_password(password)
        self.save()

    @factory.post_generation
    def roles(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for role in extracted:
                self.roles.add(role)

class ProfileFactory(DjangoModelFactory):
    class Meta:
        model = Profile
        django_get_or_create = ('user',)

    user = factory.SubFactory(UserFactory)
    profession = factory.Faker('job')
    bio = factory.Faker('paragraph')
    balance = Decimal('1000.00')

class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = Category
        django_get_or_create = ('name',)

    name = factory.Faker('word')
    slug = factory.LazyAttribute(lambda o: o.name.lower())

class JobFactory(DjangoModelFactory):
    class Meta:
        model = Job

    client = factory.SubFactory(UserFactory)
    category = factory.SubFactory(CategoryFactory)
    title = factory.Faker('sentence')
    description = factory.Faker('paragraph')
    budget = Decimal('500.00')
    deadline = factory.Faker('future_datetime', tzinfo=timezone.get_current_timezone())
    status = Job.Status.PUBLISHED

class ProposalFactory(DjangoModelFactory):
    class Meta:
        model = Proposal

    job = factory.SubFactory(JobFactory)
    freelancer = factory.SubFactory(UserFactory)
    message = factory.Faker('paragraph')
    price = Decimal('450.00')
    deadline_days = 5
    status = Proposal.Status.PENDING

class EscrowFactory(DjangoModelFactory):
    class Meta:
        model = Escrow

    job = factory.SubFactory(JobFactory)
    payer = factory.LazyAttribute(lambda o: o.job.client)
    payee = factory.LazyAttribute(lambda o: o.job.freelancer)
    amount = Decimal('450.00')
    status = Escrow.Status.FUNDS_LOCKED

class ReviewFactory(DjangoModelFactory):
    class Meta:
        model = Review

    job = factory.SubFactory(JobFactory)
    author = factory.SubFactory(UserFactory)
    receiver = factory.SubFactory(UserFactory)
    rating = factory.Faker('random_int', min=1, max=5)
    comment = factory.Faker('paragraph')

class VIPPlanFactory(DjangoModelFactory):
    class Meta:
        model = VIPPlan
        django_get_or_create = ('name',)

    name = factory.Faker('word')
    months = 1
    price_per_month = Decimal('50.00')
    is_active = True

class VIPSubscriptionFactory(DjangoModelFactory):
    class Meta:
        model = VIPSubscription

    user = factory.SubFactory(UserFactory)
    plan = factory.SubFactory(VIPPlanFactory)
    start_date = factory.LazyFunction(timezone.now)
    end_date = factory.LazyAttribute(lambda o: o.start_date + timezone.timedelta(days=30))
