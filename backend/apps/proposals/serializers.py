from rest_framework import serializers
from .models import Proposal
from apps.jobs.models import Job

class ProposalSerializer(serializers.ModelSerializer):
    freelancer = serializers.PrimaryKeyRelatedField(read_only=True)
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all())
    freelancer_email = serializers.EmailField(source='freelancer.email', read_only=True)
    freelancer_name = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_budget = serializers.DecimalField(source='job.budget', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'job', 'job_title', 'job_budget', 'freelancer', 'freelancer_email', 'freelancer_name',
            'message', 'price', 'deadline_days', 'status', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

    def get_freelancer_name(self, obj):
        return obj.freelancer.get_full_name()

    def validate(self, data):
        # Проверка на существование отклика от того же фрилансера
        user = self.context['request'].user
        job = data.get('job')
        
        if job:
            if Proposal.objects.filter(job=job, freelancer=user).exists():
                raise serializers.ValidationError("You have already submitted a proposal for this job.")
                
            if job.status != Job.Status.PUBLISHED:
                raise serializers.ValidationError("You can only submit proposals to published jobs.")
                
            if job.client == user:
                raise serializers.ValidationError("You cannot submit a proposal to your own job.")
            
        return data
