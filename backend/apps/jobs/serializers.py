from rest_framework import serializers
from .models import Job, JobFile, Category
from apps.users.models import User

class JobFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobFile
        fields = ['id', 'file', 'uploaded_by', 'created_at']
        read_only_fields = ['uploaded_by', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class JobSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source='client.email', read_only=True)
    freelancer_email = serializers.EmailField(source='freelancer.email', read_only=True)
    files = JobFileSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        source='category', 
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'budget', 'deadline', 
            'status', 'category', 'category_id', 'client', 'client_email', 'freelancer', 
            'freelancer_email', 'files', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'client', 'freelancer', 'created_at', 'updated_at']

    def validate_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget must be positive.")
        return value
