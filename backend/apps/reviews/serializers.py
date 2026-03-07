from rest_framework import serializers
from .models import Review
from apps.users.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'job', 'author', 'receiver', 'rating', 
            'comment', 'created_at', 'author_detail'
        ]
        read_only_fields = ['id', 'author', 'receiver', 'created_at', 'author_detail']

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        job = attrs.get('job')
        
        if job:
            # Check if job is in a state where review is allowed
            allowed_statuses = ['IN_PROGRESS', 'SUBMITTED', 'COMPLETED']
            if job.status not in allowed_statuses:
                raise serializers.ValidationError(f"Reviews can only be left for jobs in status: {', '.join(allowed_statuses)}.")

            if Review.objects.filter(job=job, author=user).exists():
                raise serializers.ValidationError("You have already left a review for this job.")
            
            # Check if user is participant
            if job.client != user and job.freelancer != user:
                raise serializers.ValidationError("You must be a participant in this job to leave a review.")
            
        return attrs

    def create(self, validated_data):
        job = validated_data['job']
        user = self.context['request'].user
        
        # Determine the receiver
        if job.client == user:
            receiver = job.freelancer
        else:
            receiver = job.client
            
        if not receiver:
            raise serializers.ValidationError("Cannot leave review: no freelancer assigned to this job.")
            
        validated_data['author'] = user
        validated_data['receiver'] = receiver
        return super().create(validated_data)
