from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.transactions.models import Transaction
from apps.jobs.models import Job
from apps.escrow.models import Escrow
from .models import AdminLog, log_admin_action
from .serializers import AdminLogSerializer

class AdministrationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        """
        Extended statistics for the dashboard.
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

        # 4. Basic counters (reusing some from users/views if needed, or here for all-in-one)
        return Response({
            'trends': {
                'registrations': list(registrations),
                'volume': list(volume),
            },
            'completion_rate': round(completion_rate, 2),
            'summary': {
                'total_users': User.objects.count(),
                'active_jobs': Job.objects.filter(status=Job.Status.IN_PROGRESS).count(),
                'total_escrow': Escrow.objects.filter(status=Escrow.Status.FUNDS_LOCKED).aggregate(Sum('amount'))['amount__sum'] or 0,
            }
        })

    @action(detail=False, methods=['get'], url_path='logs')
    def get_logs(self, request):
        """
        Audit trail for admin actions.
        """
        logs = AdminLog.objects.all()[:100] # Latest 100 logs
        serializer = AdminLogSerializer(logs, many=True)
        return Response(serializer.data)
