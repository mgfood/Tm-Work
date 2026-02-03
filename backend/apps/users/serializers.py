from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model"""
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (read-only for responses)"""
    roles = RoleSerializer(many=True, read_only=True)
    is_verified = serializers.BooleanField(source='profile.is_verified', read_only=True)
    is_vip = serializers.BooleanField(source='profile.is_vip', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'roles',
            'is_verified',
            'is_vip',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'is_active', 'is_staff', 'is_superuser']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name'
        ]
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value.lower()
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Passwords do not match."
            })
        return attrs
    
    def create(self, validated_data):
        """Create new user with default roles"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Add default roles (Client and Freelancer)
        user.add_role(Role.Type.CLIENT)
        user.add_role(Role.Type.FREELANCER)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )
    
    def validate(self, attrs):
        """Validate credentials and return user"""
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    "Unable to log in with provided credentials."
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    "User account is disabled."
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                "Must include 'email' and 'password'."
            )
