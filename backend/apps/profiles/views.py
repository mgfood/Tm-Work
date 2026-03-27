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

    @action(detail=True, methods=['post'], url_path='unblock')
    def unblock_user(self, request, user_id=None):
        target_user = generics.get_object_or_404(User, id=user_id)
        request.user.blocked_users.remove(target_user)
        return Response({"status": "user unblocked"})

    def retrieve(self, request, *args, **kwargs):
        # Allow viewing any public profile
        instance = self.get_object()
        serializer = PublicProfileSerializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        # Allow listing freelancers for search
        queryset = self.get_queryset().filter(user__roles__name='FREELANCER')

        search_query = request.query_params.get('search', '').strip()
        if search_query:
            from django.db.models import Q

            # Build a set of search terms: the original + transliterated variant
            search_terms = {search_query}

            # Latin → Cyrillic transliteration table
            LATIN_TO_CYR = {
                'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д',
                'e': 'е', 'yo': 'ё', 'zh': 'ж', 'z': 'з', 'i': 'и',
                'j': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
                'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т',
                'u': 'у', 'f': 'ф', 'kh': 'х', 'ts': 'ц', 'ch': 'ч',
                'sh': 'ш', 'shch': 'щ', 'y': 'ы', 'yu': 'ю', 'ya': 'я',
            }

            # Greedy longest-match transliteration: latin → cyrillic
            def transliterate_to_cyr(text):
                result = []
                text = text.lower()
                i = 0
                while i < len(text):
                    matched = False
                    for length in (4, 3, 2, 1):
                        chunk = text[i:i+length]
                        if chunk in LATIN_TO_CYR:
                            result.append(LATIN_TO_CYR[chunk])
                            i += length
                            matched = True
                            break
                    if not matched:
                        result.append(text[i])
                        i += 1
                return ''.join(result)

            transliterated = transliterate_to_cyr(search_query)
            search_terms.add(transliterated)

            q_filter = Q()
            for term in search_terms:
                q_filter |= (
                    Q(user__first_name__icontains=term) |
                    Q(user__last_name__icontains=term) |
                    Q(user__email__icontains=term) |
                    Q(bio__icontains=term) |
                    Q(profession__icontains=term) |
                    Q(skills__name__icontains=term)
                )

            queryset = queryset.filter(q_filter).distinct()

        # Sorting
        sort_param = request.query_params.get('sort', 'relevance')
        if sort_param == 'rating':
            queryset = queryset.order_by('-is_vip', '-freelancer_rating')
        elif sort_param == 'completed_works':
            queryset = queryset.order_by('-is_vip', '-completed_works_count')
        else:
            queryset = queryset.order_by('-is_vip', '-freelancer_rating', '-user_id')

        queryset = queryset.distinct()

        # Exclude self from list if logged in
        if request.user.is_authenticated:
            queryset = queryset.exclude(user=request.user)

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
