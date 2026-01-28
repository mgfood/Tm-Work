from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Profile, Skill
from .serializers import ProfileSerializer, PublicProfileSerializer, SkillSerializer


class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Skill list and retrieval (read-only)
    
    GET /api/v1/profiles/skills/
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]


class ProfileViewSet(viewsets.ModelViewSet):
    """
    Profile management
    
    GET /api/v1/profiles/me/ - get own profile
    PATCH /api/v1/profiles/me/ - update own profile
    GET /api/v1/profiles/{user_id}/ - get public profile
    """
    queryset = Profile.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'user_id'

    def get_serializer_class(self):
        if self.action == 'me' or (self.action in ['update', 'partial_update'] and self.get_object().user == self.request.user):
            return ProfileSerializer
        return PublicProfileSerializer

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)
        
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        # Allow viewing any public profile
        instance = self.get_object()
        serializer = PublicProfileSerializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        # Allow listing freelancers for search
        queryset = self.get_queryset().filter(user__roles__name='FREELANCER').distinct()
        
        # Exclude self from list if logged in
        if request.user.is_authenticated:
            queryset = queryset.exclude(user=request.user)
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PublicProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PublicProfileSerializer(queryset, many=True)
        return Response(serializer.data)
