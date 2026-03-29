from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from rest_framework_simplejwt.settings import api_settings

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication to support Admin God Mode (Impersonation).
    Allows an admin to authenticate as an inactive (soft-deleted) user 
    only if the token has the 'is_impersonation' claim.
    """
    
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(_("Token contained no recognizable user identification"))

        try:
            user = self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed(_("User not found"), code="user_not_found")

        is_impersonation = validated_token.get('is_impersonation', False)
        
        # If it's a regular token, verify that the user is active 
        # using the default simplejwt rule.
        if not is_impersonation and not api_settings.USER_AUTHENTICATION_RULE(user):
            raise AuthenticationFailed(_("User is inactive or deleted"), code="user_inactive")

        return user
