from rest_framework import serializers
from .models import Profile, Skill, PortfolioItem
from apps.users.serializers import UserSerializer


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill model"""
    class Meta:
        model = Skill
        fields = ['id', 'name', 'name_ru', 'name_tk', 'slug']


class PortfolioItemSerializer(serializers.ModelSerializer):
    """Serializer for PortfolioItem model"""
    class Meta:
        model = PortfolioItem
        fields = ['id', 'title', 'description', 'image', 'url', 'created_at']
        read_only_fields = ['id', 'created_at']


class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing other users' public profiles"""
    user = UserSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    portfolio_items = PortfolioItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user',
            'avatar',
            'profession',
            'bio',
            'skills',
            'portfolio_items',
            'freelancer_rating',
            'client_rating',
            'freelancer_reviews_count',
            'client_reviews_count',
            'hourly_rate',
            'experience_years',
            'languages',
            'social_links',
            'completed_works_count'
        ]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for managing own profile (includes private data)"""
    user = UserSerializer(read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        is_admin = request and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)
        
        if instance.user.is_deleted and not is_admin:
            ret['first_name'] = "Удаленный"
            ret['last_name'] = "Аккаунт"
        return ret
    
    from apps.jobs.serializers import CategorySerializer
    category = CategorySerializer(read_only=True)
    from apps.jobs.models import Category
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )

    skills_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        source='skills'
    )
    skills = SkillSerializer(many=True, read_only=True)
    portfolio_items = PortfolioItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user',
            'first_name',
            'last_name',
            'avatar',
            'profession',
            'category',
            'category_id',
            'bio',
            'skills',
            'portfolio_items',
            'skills_ids',
            'freelancer_rating',
            'client_rating',
            'phone_number',
            'birth_date',
            'location',
            'freelancer_reviews_count',
            'client_reviews_count',
            'is_verified',
            'hourly_rate',
            'experience_years',
            'languages',
            'social_links',
            'completed_works_count',
            'balance'
        ]
        read_only_fields = [
            'user', 
            'freelancer_rating', 
            'client_rating',
            'freelancer_reviews_count',
            'client_reviews_count',
            'completed_works_count',
            'balance'
        ]

    def update(self, instance, validated_data):
        # Handle nested user data (first_name, last_name)
        user_data = validated_data.pop('user', {})
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')
        
        user_updated = False
        if first_name is not None:
            instance.user.first_name = first_name
            user_updated = True
        if last_name is not None:
            instance.user.last_name = last_name
            user_updated = True
            
        if user_updated:
            instance.user.save()
            
        return super().update(instance, validated_data)
