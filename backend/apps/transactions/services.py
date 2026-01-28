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
