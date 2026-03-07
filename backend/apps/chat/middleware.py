from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Close old database connections to prevent usage of timed out connections
        # close_old_connections()
        
        # Get the token from query string
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token")
        
        if token:
            token = token[0]
            try:
                # This will decode and validate the token
                access_token = AccessToken(token)
                user_id = access_token.payload.get('user_id')
                scope['user'] = await get_user(user_id)
            except Exception as e:
                print(f"WebSocket Auth Error: {e}")
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
