import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Thread, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs'].get('thread_id')
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # Check if user is participant of the thread (if thread_id provided)
        if self.thread_id:
            if not await self.is_participant(self.thread_id, self.user):
                await self.close()
                return
            self.room_group_name = f'chat_{self.thread_id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

        self.user_group_name = f'user_{self.user.id}'
        
        # Join user group (for sidebar updates/notifications)
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        # Leave user group
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        command = text_data_json.get('command')
        
        if command == 'send_message':
            message_content = text_data_json.get('message')
            if message_content:
                # Save message to DB
                new_msg = await self.save_message(self.thread_id, self.user, message_content)
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': new_msg
                    }
                )
        elif command == 'mark_read':
             # Logic to mark messages as read could go here, 
             # currently handled by REST API mostly, but good to have hooks
             pass

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    async def history_cleared(self, event):
        await self.send(text_data=json.dumps({
            'type': 'history_cleared'
        }))

    async def user_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def is_participant(self, thread_id, user):
        try:
            thread = Thread.objects.get(id=thread_id)
            return thread.participants.filter(id=user.id).exists()
        except Thread.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, thread_id, user, content):
        # Use existing ChatService if suitable, or create manually to avoid async issues with Service layer if it's not async-ready.
        # However, calling sync service from sync_to_async is fine.
        from .serializers import MessageSerializer
        
        thread = Thread.objects.get(id=thread_id)
        
        # Проверка блокировки
        other_participant = thread.participants.exclude(id=user.id).first()
        if other_participant and other_participant.blocked_users.filter(id=user.id).exists():
            # Мы не можем выкинуть PermissionDenied здесь легко в WS, отправим ошибку клиенту
            return {"error": "blocked"}

        msg = Message.objects.create(thread=thread, sender=user, content=content)
        
        # Serialize immediately for sending
        return MessageSerializer(msg).data
