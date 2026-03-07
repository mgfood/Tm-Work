from rest_framework import serializers
from .models import AdminLog

class AdminLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    
    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_email', 'action_type', 'target_info', 'comment', 'created_at']
        read_only_fields = ['id', 'admin', 'created_at']
