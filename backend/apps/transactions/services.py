from django.db import transaction
from django.db.models import F
from .models import Transaction, WithdrawalRequest
from apps.profiles.models import Profile

class TransactionService:
    @staticmethod
    @transaction.atomic
    def process_transaction(user, amount, transaction_type, reference_id="", description=""):
        """
        Processes a transaction: updates profile balance and logs the transaction atomically.
        'amount' should be positive for additions and negative for deductions.
        """
        # 1. Update balance atomically using F Expression and SELECT FOR UPDATE
        profile = Profile.objects.select_for_update().get(user=user)
        # We don't use .update() here because we want to ensure the profile exists and potentially check for negative balance
        if amount < 0 and profile.balance < abs(amount):
            raise ValueError(f"Insufficient funds. Required: {abs(amount)} TMT, Available: {profile.balance} TMT")
        
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

    @staticmethod
    @transaction.atomic
    def process_auto_withdrawal(user, amount, withdrawal_request):
        """
        Atomically deducts balance for an auto-approved withdrawal.
        """
        # 1. Deduct balance
        TransactionService.process_transaction(
            user=user,
            amount=-amount,  # Deduct
            transaction_type=Transaction.Type.WITHDRAWAL,
            reference_id=f"WD-{withdrawal_request.id}",
            description="Автоматический вывод средств"
        )
        
        # 2. Mark request as completed
        withdrawal_request.status = WithdrawalRequest.Status.COMPLETED
        withdrawal_request.save()
        return withdrawal_request

    @staticmethod
    @transaction.atomic
    def approve_withdrawal(admin_user, withdrawal_request, comment=""):
        """
        Atomically approves a pending withdrawal and deducts funds.
        """
        user = withdrawal_request.user
        amount = withdrawal_request.amount
        
        # Double check balance with lock
        profile = Profile.objects.select_for_update().get(user=user)
        if profile.balance < amount:
            raise ValueError("Недостаточно средств на балансе пользователя.")
            
        # 1. Process money movement
        TransactionService.process_transaction(
            user=user,
            amount=-amount,
            transaction_type=Transaction.Type.WITHDRAWAL,
            reference_id=f"WD-{withdrawal_request.id}",
            description=f"Вывод одобрен администратором. {comment}"
        )
        
        # 2. Update request status
        withdrawal_request.status = WithdrawalRequest.Status.COMPLETED
        withdrawal_request.admin_comment = comment
        withdrawal_request.save()
        
        return withdrawal_request
