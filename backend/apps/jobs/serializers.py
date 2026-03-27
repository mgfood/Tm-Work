from rest_framework import serializers
from .models import Job, JobFile, Category, JobSubmission
from apps.users.models import User

class JobFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobFile
        fields = ['id', 'file', 'uploaded_by', 'created_at']
        read_only_fields = ['uploaded_by', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    jobs_count = serializers.IntegerField(read_only=True)
    specialists_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'name_ru', 'name_tk', 'slug', 'icon', 'custom_icon', 'jobs_count', 'specialists_count']
        read_only_fields = ['slug', 'jobs_count', 'specialists_count']
        extra_kwargs = {
            'icon': {'required': False, 'allow_null': True},
            'custom_icon': {'required': False, 'allow_null': True}
        }


    def validate_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget must be positive.")
        return value


class JobSubmissionSerializer(serializers.ModelSerializer):
    files = JobFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = JobSubmission
        fields = ['id', 'job', 'content', 'files', 'created_at']
        read_only_fields = ['job', 'created_at']


class JobSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    freelancer_email = serializers.EmailField(source='freelancer.email', read_only=True)
    freelancer_name = serializers.CharField(source='freelancer.get_full_name', read_only=True)
    files = JobFileSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        source='category', 
        write_only=True,
        required=False,
        allow_null=True
    )
    submission = JobSubmissionSerializer(read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'budget', 'deadline', 
            'status', 'category', 'category_id', 'client', 'client_email', 'client_name',
            'freelancer', 'freelancer_email', 'freelancer_name', 'files', 'submission', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'client', 'freelancer', 'created_at', 'updated_at']

    def validate_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget must be positive.")
        return value
