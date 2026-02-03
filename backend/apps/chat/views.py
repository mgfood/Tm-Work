from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Thread, Message
from .serializers import ThreadSerializer, MessageSerializer
from apps.users.models import User

class ThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Thread.objects.filter(participants=self.request.user)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        thread_type = request.query_params.get('type')
        if thread_type not in Thread.ThreadType.values:
            return Response({"error": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
        
        threads = self.get_queryset().filter(type=thread_type)
        serializer = self.get_serializer(threads, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        thread_id = self.request.query_params.get('thread')
        if thread_id:
            return Message.objects.filter(thread_id=thread_id, thread__participants=self.request.user)
        return Message.objects.filter(thread__participants=self.request.user)

    def perform_create(self, serializer):
        thread_id = self.request.data.get('thread')
        thread = Thread.objects.get(id=thread_id, participants=self.request.user)
        serializer.save(sender=self.request.user, thread=thread)
        # Update thread timestamp
        thread.save()

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        thread_id = request.data.get('thread')
        Message.objects.filter(
            thread_id=thread_id, 
            thread__participants=request.user
        ).exclude(sender=request.user).update(is_read=True)
        return Response({"status": "messages marked as read"})

    @action(detail=False, methods=['post'])
    def get_or_create_thread(self, request):
        """
        Инициация чата. Если чат существует - возвращает его, если нет - создает.
        """
        receiver_id = request.data.get('receiver_id')
        job_id = request.data.get('job_id')
        thread_type = request.data.get('type', Thread.ThreadType.PERSONAL)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if receiver == request.user:
            return Response({"error": "Cannot chat with yourself"}, status=status.HTTP_400_BAD_REQUEST)

        # Поиск существующего чата
        threads = Thread.objects.filter(participants=request.user).filter(participants=receiver).filter(type=thread_type)
        if job_id:
            threads = threads.filter(job_id=job_id)
        
        thread = threads.first()
        if not thread:
            thread = Thread.objects.create(type=thread_type, job_id=job_id)
            thread.participants.add(request.user, receiver)
            # Если это поддержка, можно добавить системное сообщение
        
        serializer = ThreadSerializer(thread, context={'request': request})
        return Response(serializer.data)
