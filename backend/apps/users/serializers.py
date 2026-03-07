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
    balance = serializers.DecimalField(source='profile.balance', max_digits=12, decimal_places=2, read_only=True)
    
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
            'balance',
            'blocked_users',
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
        
        # Create profile
        from apps.profiles.models import Profile
        Profile.objects.get_or_create(user=user, defaults={'balance': 5000})
        
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
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')
        
        if email and password:
            # We lookup the user manually to distinguish between "not found" 
            # and "inactive/blocked" in the view.
            from .models import User
            user = User.objects.filter(email=email).first()
            
            if not user or not user.check_password(password):
                raise serializers.ValidationError({
                    "error": "Неверный email или пароль."
                })
            
            # Note: We return the user even if is_active=False.
            # The LoginView will perform is_active and blocked_until checks
            # to return a 403 Forbidden with a clear explanation.
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError({
                "error": "Введите email и пароль."
            })


class AdminUserDetailSerializer(UserSerializer):
    """Detailed user serializer for admin God Mode"""
    from apps.transactions.serializers import TransactionSerializer
    from apps.jobs.serializers import JobSerializer
    from apps.reviews.serializers import ReviewSerializer
    
    recent_transactions = TransactionSerializer(source='transactions', many=True, read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['recent_transactions', 'stats']

    def get_stats(self, obj):
        return {
            'jobs_count': obj.client_jobs.count() + obj.freelancer_jobs.count(),
            'reviews_avg': obj.profile.freelancer_rating if hasattr(obj, 'profile') else 0,
            'balance': obj.profile.balance if hasattr(obj, 'profile') else 0,
        }


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset code"""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email не найден.")
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for resetting password using a code"""
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)
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

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Пароли не совпадают."})
        
        from .models import PasswordResetCode
        reset_code = PasswordResetCode.objects.filter(
            user__email=attrs['email'].lower(),
            code=attrs['code'],
            is_used=False
        ).order_by('-created_at').first()

        if not reset_code:
            raise serializers.ValidationError({"code": "Неверный код подтверждения."})
        
        if reset_code.is_expired():
            raise serializers.ValidationError({"code": "Срок действия кода истек."})
            
        attrs['reset_code'] = reset_code
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset code"""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email не найден.")
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for resetting password using a code"""
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)
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

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Пароли не совпадают."})
        
        from .models import PasswordResetCode
        reset_code = PasswordResetCode.objects.filter(
            user__email=attrs['email'].lower(),
            code=attrs['code'],
            is_used=False
        ).first()

        if not reset_code:
            raise serializers.ValidationError({"code": "Неверный код подтверждения."})
        
        if reset_code.is_expired():
            raise serializers.ValidationError({"code": "Срок действия кода истек."})
            
        attrs['reset_code'] = reset_code
        return attrs
