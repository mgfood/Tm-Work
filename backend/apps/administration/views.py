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

from .services import AnalyticsService

class AdministrationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        """
        Extended statistics for the dashboard.
        """
        return Response(AnalyticsService.get_dashboard_stats())

    @action(detail=False, methods=['get'], url_path='revenue')
    def get_revenue(self, request):
        """
        Stats focused on revenue for the RevenueTab.
        """
        stats = AnalyticsService.get_dashboard_stats()
        # Return just the summary part which contains the revenue fields
        return Response(stats['summary'])

    @action(detail=False, methods=['get'], url_path='logs')
    def get_logs(self, request):
        """
        Audit trail for admin actions.
        """
        logs = AdminLog.objects.all().order_by('-created_at')[:100] # Latest 100 logs
        serializer = AdminLogSerializer(logs, many=True)
        return Response(serializer.data)
