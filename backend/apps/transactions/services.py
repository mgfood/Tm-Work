from django.db import transaction
from .models import Transaction

class TransactionService:
    @staticmethod
    @transaction.atomic
    def process_transaction(user, amount, transaction_type, reference_id="", description=""):
        """
        Processes a transaction: updates profile balance and logs the transaction atomically.
        'amount' should be positive for additions and negative for deductions.
        """
        from django.db.models import F
        from apps.profiles.models import Profile
        
        # 1. Update balance atomically using F Expression and SELECT FOR UPDATE
        profile = Profile.objects.select_for_update().get(user=user)
        # We don't use .update() here because we want to ensure the profile exists and potentially check for negative balance
        profile.balance = F('balance') + amount
        profile.save(update_fields=['balance'])

        # 2. Log the transaction
        return Transaction.objects.create(
            user=user,
            amount=amount,
            type=transaction_type,
            reference_id=reference_id,
            description=description
        )

    @staticmethod
    def log_transaction(user, amount, transaction_type, reference_id="", description=""):
        """
        Informational only. DOES NOT update balance.
        Use process_transaction for real money movements.
        """
        return Transaction.objects.create(
            user=user,
            amount=amount,
            type=transaction_type,
            reference_id=reference_id,
            description=description
        )

    @staticmethod
    @transaction.atomic
    def process_deposit(user, amount, description=None):
        """
        Processes a deposit using the unified process_transaction method.
        """
        return TransactionService.process_transaction(
            user=user,
            amount=amount,
            transaction_type=Transaction.Type.DEPOSIT,
            description=description or f"Deposit of {amount} TMT"
        )
