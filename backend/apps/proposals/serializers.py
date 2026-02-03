from rest_framework import serializers
from .models import Proposal
from apps.jobs.models import Job

class ProposalSerializer(serializers.ModelSerializer):
    freelancer_email = serializers.EmailField(source='freelancer.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_budget = serializers.DecimalField(source='job.budget', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'job', 'job_title', 'job_budget', 'freelancer', 'freelancer_email', 
            'message', 'price', 'deadline_days', 'status', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['freelancer', 'status', 'created_at', 'updated_at']

    def validate(self, data):
        # Проверка на существование отклика от того же фрилансера будет на уровне БД (unique_together),
        # но мы можем добавить дополнительную проверку здесь для более чистого ответа API.
        user = self.context['request'].user
        job = data['job']
        
        if Proposal.objects.filter(job=job, freelancer=user).exists():
            raise serializers.ValidationError("You have already submitted a proposal for this job.")
            
        if job.client == user:
            raise serializers.ValidationError("You cannot submit a proposal to your own job.")
            
        return data
