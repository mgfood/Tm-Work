from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Thread, Message
from .serializers import ThreadSerializer, MessageSerializer
from apps.users.models import User

def broadcast_message(thread_id, message_data):
    """Отправка сообщения в WebSocket группу треда"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{thread_id}',
        {
            'type': 'chat_message',
            'message': message_data
        }
    )

def broadcast_user_update(user_id, update_data):
    """Отправка уведомления конкретному пользователю (например, для обновления списка чатов)"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{user_id}',
        {
            'type': 'user_update',
            'data': update_data
        }
    )

class ThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Thread.objects.filter(participants=self.request.user).exclude(hidden_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        thread = self.get_object()
        thread.hidden_by.add(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        thread_type = request.query_params.get('type')
        if thread_type not in Thread.ThreadType.values:
            return Response({"error": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST)
        
        threads = self.get_queryset().filter(type=thread_type).exclude(hidden_by=request.user)
        serializer = self.get_serializer(threads, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def clear_history(self, request, pk=None):
        thread = self.get_object()
        thread.messages.all().delete()
        
        # Информируем участников об очистке
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{thread.id}',
            {
                'type': 'history_cleared',
            }
        )
        return Response({"status": "History cleared"})

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        thread_id = self.request.query_params.get('thread')
        if thread_id:
            # Check if user is participant, even if hidden
            return Message.objects.filter(thread_id=thread_id, thread__participants=self.request.user)
        return Message.objects.filter(thread__participants=self.request.user)

    def perform_create(self, serializer):
        thread_id = self.request.data.get('thread')
        thread = Thread.objects.get(id=thread_id, participants=self.request.user)
        
        # Проверка блокировки
        other_participant = thread.participants.exclude(id=self.request.user.id).first()
        if other_participant and other_participant.blocked_users.filter(id=self.request.user.id).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are blocked by this user.")

        # Prevent replying to SYSTEM threads
        if thread.type == Thread.ThreadType.SYSTEM and not self.request.user.is_staff:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot reply to system notifications.")

        serializer.save(sender=self.request.user, thread=thread)
        
        # Broadcast to WebSockets (in-chat)
        broadcast_message(thread.id, serializer.data)
        
        # Notify participants via personal group (to update sidebar/notifications)
        for participant in thread.participants.all():
            broadcast_user_update(participant.id, {
                'type': 'thread_list_update',
                'thread_id': thread.id,
                'last_message': serializer.data
            })

        # Unhide for all participants
        thread.hidden_by.clear() 
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
        else:
            # If thread exists but was hidden, unhide it for the requester
            if thread.hidden_by.filter(id=request.user.id).exists():
                thread.hidden_by.remove(request.user)
                # Очищаем историю при восстановлении "удаленного" чата
                thread.messages.all().delete()
                # Уведомляем другого участника, что чат восстановлен (опционально)
                broadcast_user_update(receiver.id, {
                    'type': 'thread_restored',
                    'thread_id': thread.id
                })
        
        serializer = ThreadSerializer(thread, context={'request': request})
        return Response(serializer.data)

class AdminBroadcastView(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['post'])
    def broadcast(self, request):
        from apps.users.utils import get_system_user
        
        message_content = request.data.get('message')
        target_type = request.data.get('target_type', 'ALL') # 'ALL' or 'SELECTED'
        user_ids = request.data.get('user_ids', [])

        if not message_content:
            return Response({"error": "Message content is required"}, status=status.HTTP_400_BAD_REQUEST)

        system_user = get_system_user()
        
        if target_type == 'ALL':
            recipients = User.objects.filter(is_active=True).exclude(id=system_user.id)
        elif target_type == 'CLIENTS':
            recipients = User.objects.filter(is_active=True, roles__name='CLIENT').exclude(id=system_user.id)
        elif target_type == 'FREELANCERS':
            recipients = User.objects.filter(is_active=True, roles__name='FREELANCER').exclude(id=system_user.id)
        elif target_type == 'VIP':
            recipients = User.objects.filter(is_active=True, profile__is_vip=True).exclude(id=system_user.id)
        elif target_type == 'EMAILS':
            emails = request.data.get('emails', [])
            recipients = User.objects.filter(email__in=emails)
        else:
            recipients = User.objects.filter(id__in=user_ids)

        broadcast_count = 0
        for recipient in recipients:
            # Get or create SYSTEM thread for this recipient
            thread = Thread.objects.filter(
                type=Thread.ThreadType.SYSTEM,
                participants=recipient
            ).filter(participants=system_user).first()

            if not thread:
                thread = Thread.objects.create(type=Thread.ThreadType.SYSTEM)
                thread.participants.add(system_user, recipient)
            
            # Create message
            msg = Message.objects.create(
                thread=thread,
                sender=system_user,
                content=message_content
            )
            
            # Broadcast to WebSockets
            broadcast_message(thread.id, MessageSerializer(msg).data)

            # Notify via Notification app too (optional but recommended in TOC)
            from apps.notifications.utils import create_notification
            create_notification(
                user=recipient,
                title="Системное сообщение",
                message=message_content,
                link="/chat"
            )
            broadcast_count += 1

        return Response({"status": f"Broadcast sent to {broadcast_count} users"})
