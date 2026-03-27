from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from apps.users.models import User
from apps.transactions.models import Transaction
from apps.jobs.models import Job
from apps.escrow.models import Escrow
from apps.vip.models import GlobalSettings
import decimal

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats():
        """
        Calculate extended statistics for the admin dashboard.
        """
        last_30_days = timezone.now() - timedelta(days=30)
        
        # 1. Registrations trend
        registrations = User.objects.filter(date_joined__gte=last_30_days) \
            .annotate(date=TruncDate('date_joined')) \
            .values('date') \
            .annotate(count=Count('id')) \
            .order_by('date')

        # 2. Transaction volume trend (Deposits + Escrow Releases)
        volume = Transaction.objects.filter(
            created_at__gte=last_30_days,
            type__in=[Transaction.Type.DEPOSIT, Transaction.Type.ESCROW_RELEASE]
        ).annotate(date=TruncDate('created_at')) \
         .values('date') \
         .annotate(amount=Sum('amount')) \
         .order_by('date')

        # 3. Completion rate
        total_jobs = Job.objects.exclude(status=Job.Status.DRAFT).count()
        completed_jobs = Job.objects.filter(status=Job.Status.COMPLETED).count()
        completion_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0

        # 4. Revenue calculation
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_revenue = Transaction.objects.filter(
            created_at__gte=today_start,
            type__in=[Transaction.Type.FEE, Transaction.Type.PURCHASE_VIP]
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Amount in PURCHASE_VIP is negative (deduction from user), so we take absolute for revenue
        # Wait, if amount is negative in transaction, we should be careful.
        # Actually, TransactionService.process_transaction uses amount as is.
        # In VIP buy, amount is -total_price. So revenue = abs(amount).
        
        # Let's recalibrate: Revenue = Sum of abs(amount) for FEE and PURCHASE_VIP
        # Since we use amount=-total_price, we sum the negative values and multiply by -1.
        
        month_revenue_raw = Transaction.objects.filter(
            created_at__gte=last_30_days,
            type__in=[Transaction.Type.FEE, Transaction.Type.PURCHASE_VIP]
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # platform_settings = GlobalSettings.get_settings()
        total_revenue = GlobalSettings.get_settings().total_revenue
        
        # 5. System balance (liquid assets in system wallet)
        system_balance = total_revenue # Fallback
        try:
            from django.conf import settings as django_settings
            system_email = getattr(django_settings, 'SYSTEM_WALLET_EMAIL', 'system@tmwork.tm')
            system_user = User.objects.filter(email=system_email).first()
            if system_user and hasattr(system_user, 'profile'):
                system_balance = system_user.profile.balance
        except Exception:
            pass

        return {
            'trends': {
                'registrations': list(registrations),
                'volume': list(volume),
            },
            'completion_rate': round(completion_rate, 2),
            'summary': {
                'total_users': User.objects.count(),
                'active_jobs': Job.objects.filter(status=Job.Status.IN_PROGRESS).count(),
                'total_escrow': Escrow.objects.filter(status=Escrow.Status.FUNDS_LOCKED).aggregate(Sum('amount'))['amount__sum'] or 0,
                'total_revenue': float(total_revenue),
                'today_revenue': float(abs(today_revenue)),
                'month_revenue': float(abs(month_revenue_raw)),
                'system_balance': float(system_balance)
            }
        }

    @staticmethod
    def get_management_stats():
        """
        Calculate summary stats for the user management view.
        """
        # Reusing logic from UserViewSet.stats
        total_users = User.objects.count()
        active_jobs = Job.objects.exclude(status__in=['DRAFT', 'CANCELLED']).count()
        disputes = Job.objects.filter(status='DISPUTE').count()
        
        total_volume = Job.objects.exclude(status__in=['DRAFT', 'CANCELLED']).aggregate(Sum('budget'))['budget__sum'] or 0
        from django.db.models import Avg
        avg_budget = Job.objects.exclude(status__in=['DRAFT', 'CANCELLED']).aggregate(Avg('budget'))['budget__avg'] or 0
        escrow_total = Escrow.objects.filter(status='FUNDS_LOCKED').aggregate(Sum('amount'))['amount__sum'] or 0
        freelancers_count = User.objects.filter(roles__name='FREELANCER').count()
        
        platform_settings = GlobalSettings.get_settings()
        
        return {
            'total_users': total_users,
            'active_jobs': active_jobs,
            'total_escrow': f"{escrow_total} TMT",
            'disputes': disputes,
            'total_volume': f"{total_volume} TMT",
            'avg_budget': f"{round(avg_budget, 2)} TMT",
            'freelancers_count': freelancers_count,
            'platform_fee_total': f"{platform_settings.total_revenue} TMT"
        }
