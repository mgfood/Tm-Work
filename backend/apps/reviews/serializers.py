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
        read_only_fields = ['id', 'author', 'created_at', 'author_detail']

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        job = attrs.get('job')
        
        # Check if job is completed
        if job.status != 'COMPLETED':
            raise serializers.ValidationError("Reviews can only be left for completed jobs.")
            
        # Check if user is participant
        if job.client != user and job.freelancer != user:
            raise serializers.ValidationError("You must be a participant in this job to leave a review.")
            
        # Determine the receiver
        if job.client == user:
            attrs['receiver'] = job.freelancer
        else:
            attrs['receiver'] = job.client
            
        if not attrs['receiver']:
            raise serializers.ValidationError("Cannot leave review: no freelancer assigned to this job.")
            
        return attrs

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
