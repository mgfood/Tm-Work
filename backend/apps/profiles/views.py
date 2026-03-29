from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Profile, Skill, PortfolioItem
from .serializers import (
    ProfileSerializer,
    PublicProfileSerializer,
    SkillSerializer,
    PortfolioItemSerializer
)
from .search import smart_filter_profiles
from apps.users.permissions import IsProfileOwner
from apps.users.models import User


class SkillViewSet(viewsets.ModelViewSet):
    """
    Skill list and management
    
    GET /api/v1/profiles/skills/ (Public)
    POST/PUT/DELETE /api/v1/profiles/skills/ (Admin only)
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProfileViewSet(viewsets.ModelViewSet):
    """
    Profile management
    
    GET /api/v1/profiles/me/ - get own profile
    PATCH /api/v1/profiles/me/ - update own profile
    GET /api/v1/profiles/{user_id}/ - get public profile
    """
    queryset = Profile.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'user_id'

    def get_serializer_class(self):
        if self.action == 'me' or (self.action in ['update', 'partial_update'] and self.get_object().user == self.request.user):
            return ProfileSerializer
        return PublicProfileSerializer

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)
        
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='delete-avatar')
    def delete_avatar(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if profile.avatar:
            profile.avatar.delete()
            # Django's FileField.delete() clears the attribute, but we want to be sure it's saved as None
            profile.avatar = None
            profile.save(update_fields=['avatar'])
        return Response({'status': 'avatar deleted'})

    @action(detail=True, methods=['post'], url_path='block')
    def block_user(self, request, user_id=None):
        target_user = generics.get_object_or_404(User, id=user_id)
        if target_user == request.user:
            return Response({"error": "Cannot block yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.blocked_users.add(target_user)
        return Response({"status": "user blocked"})

    @action(detail=False, methods=['post'], url_path='unblock')
    def unblock_user(self, request, user_id=None):
        target_user = generics.get_object_or_404(User, id=user_id)
        request.user.blocked_users.remove(target_user)
        return Response({"status": "user unblocked"})

    def get_queryset(self):
        """
        Exclude soft-deleted accounts from public views.
        Admins can still see everything.
        """
        qs = Profile.objects.select_related('user', 'category').prefetch_related('skills', 'portfolio_items')
        
        # Hide deleted users for everyone except superusers/staff
        if not (self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser)):
            qs = qs.filter(user__is_deleted=False)
            
        return qs

    @action(detail=False, methods=['delete'], url_path='delete-account')
    def delete_account(self, request):
        """Soft delete user and profile"""
        user = request.user
        
        # Free up the email address by appending the user's ID
        # Format: deleted_1234_oldemail@domain.com
        user.email = f"deleted_{user.id}_{user.email}"
        
        user.is_deleted = True
        user.is_active = False  # Deactivate login
        user.deleted_at = timezone.now()
        user.save()
        return Response({"status": "account deactivated"}, status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        # Allow viewing any public profile
        instance = self.get_object()
        serializer = PublicProfileSerializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().filter(user__roles__name='FREELANCER')

        # Exclude self from list if logged in
        if request.user.is_authenticated:
            queryset = queryset.exclude(user=request.user)

        # --- Optional filters (applied before search) ---
        category = request.query_params.get('category', '').strip()
        if category:
            queryset = queryset.filter(category_id=category)

        min_rating_raw = request.query_params.get('min_rating', '0').strip()
        try:
            min_rating = float(min_rating_raw)
        except (ValueError, TypeError):
            min_rating = 0
        if min_rating > 0:
            queryset = queryset.filter(freelancer_rating__gte=min_rating)

        skills_raw = request.query_params.get('skills', '').strip()
        if skills_raw:
            skill_ids = [s for s in skills_raw.split(',') if s.isdigit()]
            if skill_ids:
                queryset = queryset.filter(skills__id__in=skill_ids).distinct()

        search_query = request.query_params.get('search', '').strip()

        if search_query:
            # smart_filter_profiles returns a sorted list (Levenshtein re-ranked)
            # when a query is present; queryset otherwise.
            profiles = smart_filter_profiles(queryset, search_query)

            page = self.paginate_queryset(profiles)
            if page is not None:
                serializer = PublicProfileSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = PublicProfileSerializer(profiles, many=True)
            return Response(serializer.data)

        # No search — apply DB-level sorting and paginate queryset directly
        sort_param = request.query_params.get('sort', 'relevance')
        if sort_param == 'rating':
            queryset = queryset.order_by('-is_vip', '-freelancer_rating')
        elif sort_param == 'completed_works':
            queryset = queryset.order_by('-is_vip', '-completed_works_count')
        else:
            queryset = queryset.order_by('-is_vip', '-freelancer_rating', '-user_id')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PublicProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PublicProfileSerializer(queryset, many=True)
        return Response(serializer.data)



class PortfolioItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for portfolio items
    """
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsProfileOwner()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)

    def get_queryset(self):
        # Filtering by profile if user_id is provided in query params
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return self.queryset.filter(profile__user_id=user_id)
        return self.queryset
