from rest_framework import serializers
from .models import Profile, Skill
from apps.users.serializers import UserSerializer


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill model"""
    class Meta:
        model = Skill
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing other users' public profiles"""
    user = UserSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user',
            'avatar',
            'bio',
            'skills',
            'freelancer_rating',
            'client_rating',
            'freelancer_reviews_count',
            'client_reviews_count'
        ]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for managing own profile (includes private data)"""
    user = UserSerializer(read_only=True)
    skills_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        source='skills'
    )
    skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user',
            'avatar',
            'bio',
            'skills',
            'skills_ids',
            'freelancer_rating',
            'client_rating',
            'phone_number',
            'birth_date',
            'location',
            'freelancer_reviews_count',
            'client_reviews_count'
        ]
        read_only_fields = [
            'user', 
            'freelancer_rating', 
            'client_rating',
            'freelancer_reviews_count',
            'client_reviews_count'
        ]
