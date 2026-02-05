from django.db import transaction
from .models import Transaction

class TransactionService:
    @staticmethod
    def log_transaction(user, amount, transaction_type, reference_id="", description=""):
        """
        Создает запись о движении средств. 
        Записи иммутабельны (защита на уровне модели).
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
        Processes a deposit: updates profile balance and logs transaction.
        """
        profile = user.profile
        profile.balance += amount
        profile.save()

        return Transaction.objects.create(
            user=user,
            amount=amount,
            type=Transaction.Type.DEPOSIT,
            description=description or f"Deposit of {amount} TMT"
        )
