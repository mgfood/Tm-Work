import random
from decimal import Decimal
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status

from .models import User, PasswordResetCode, Role
from apps.profiles.models import Profile
from apps.transactions.models import Transaction
from apps.transactions.services import TransactionService
from apps.administration.models import log_admin_action, AdminLog

class UserService:
    @staticmethod
    def adjust_balance(user, amount, reason, admin_user):
        """
        Adjust user balance atomically and log all actions.
        """
        try:
            amount = Decimal(str(amount))
            
            with transaction.atomic():
                # Lock profile and update atomically
                profile_qs = Profile.objects.select_for_update().filter(user=user)
                profile = profile_qs.get()
                
                if profile.balance + amount < 0:
                    raise ValueError('Balance cannot be negative')
                
                profile_qs.update(balance=F('balance') + amount)

                # Log transaction
                TransactionService.log_transaction(
                    user=user,
                    amount=amount,
                    transaction_type=Transaction.Type.DEPOSIT if amount > 0 else Transaction.Type.WITHDRAWAL,
                    description=f"Admin adjustment: {reason}"
                )

                # Log admin action
                log_admin_action(
                    admin=admin_user,
                    action_type=AdminLog.ActionType.ADJUST_BALANCE,
                    target_info=f"User ID: {user.id}",
                    comment=f"Amount: {amount}. Reason: {reason}"
                )
                
                # Fetch fresh profile for return
                profile.refresh_from_db()
                return profile.balance
                
        except Exception as e:
            raise e

    @staticmethod
    def temp_block(user, hours, reason, admin_user):
        """ Temporarily block a user for N hours. """
        try:
            blocked_until = timezone.now() + timedelta(hours=int(hours))
            user.blocked_until = blocked_until
            user.block_reason = reason
            user.save()
            
            log_admin_action(
                admin=admin_user,
                action_type=AdminLog.ActionType.BLOCK_USER,
                target_info=f"User ID: {user.id} (Temp)",
                comment=f"Duration: {hours}h. Reason: {reason}"
            )
            return blocked_until
        except (ValueError, TypeError):
            raise ValueError('Invalid duration format')

    @staticmethod
    def block_user(user, reason, admin_user):
        """ Permanently block a user. """
        user.is_active = False
        user.block_reason = reason or 'Violation of terms'
        user.save()
        
        log_admin_action(
            admin=admin_user,
            action_type=AdminLog.ActionType.BLOCK_USER,
            target_info=f"User ID: {user.id}",
            comment=user.block_reason
        )

    @staticmethod
    def unblock_user(user, admin_user):
        """ Unblock a user. """
        user.is_active = True
        user.blocked_until = None
        user.block_reason = ""
        user.save()
        
        log_admin_action(
            admin=admin_user,
            action_type=AdminLog.ActionType.UNBLOCK_USER,
            target_info=f"User ID: {user.id}",
            comment="Administrator unblocked"
        )

    @staticmethod
    def toggle_verify(user, admin_user):
        """ Toggle user verification status. """
        if not hasattr(user, 'profile'):
            Profile.objects.create(user=user)
            
        user.profile.is_verified = not user.profile.is_verified
        user.profile.save()
        status_msg = 'verified' if user.profile.is_verified else 'unverified'
        
        log_admin_action(
            admin=admin_user,
            action_type=AdminLog.ActionType.VERIFY_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Status: {status_msg}"
        )
        return user.profile.is_verified

    @staticmethod
    def toggle_vip(user, admin_user):
        """ Toggle user VIP status manually. """
        if not hasattr(user, 'profile'):
            Profile.objects.create(user=user)
            
        user.profile.is_vip = not user.profile.is_vip
        user.profile.save()
        status_msg = 'VIP' if user.profile.is_vip else 'Regular'
        
        log_admin_action(
            admin=admin_user,
            action_type=AdminLog.ActionType.VIP_USER,
            target_info=f"User ID: {user.id}",
            comment=f"Status: {status_msg}"
        )
        return user.profile.is_vip

class AuthService:
    @staticmethod
    def request_password_reset(email):
        """ Generate code and send email for password reset. """
        try:
            user = User.objects.get(email=email)
            code = str(random.randint(100000, 999999))
            
            # Create record
            PasswordResetCode.objects.create(user=user, code=code)
            
            # Send email
            subject = 'TmWork: Код для сброса пароля'
            message = f'Ваш код для сброса пароля: {code}. Он действителен в течение 15 минут.'
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            
            return True
        except User.DoesNotExist:
            # We don't want to leak user existence, but for internal logic we return false or handle in view
            return False

    @staticmethod
    def confirm_password_reset(reset_code, new_password):
        """ Reset password using the code. """
        user = reset_code.user
        user.set_password(new_password)
        user.save()
        
        # Mark code as used
        reset_code.is_used = True
        reset_code.save()
        return True
