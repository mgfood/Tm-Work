from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        queryset = Review.objects.all()
        receiver_id = self.request.query_params.get('receiver_id')
        if receiver_id:
            queryset = queryset.filter(receiver_id=receiver_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save()
