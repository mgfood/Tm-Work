from rest_framework import serializers
from .models import Proposal
from apps.jobs.models import Job

class ProposalSerializer(serializers.ModelSerializer):
    freelancer_email = serializers.EmailField(source='freelancer.email', read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'job', 'freelancer', 'freelancer_email', 
            'message', 'price', 'deadline_days', 'is_accepted', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['freelancer', 'is_accepted', 'created_at', 'updated_at']

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
