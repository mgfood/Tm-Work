from django.db import transaction
from django.core.exceptions import ValidationError
from apps.transactions.services import TransactionService
from apps.transactions.models import Transaction
from .models import Escrow

class EscrowService:
    @staticmethod
    @transaction.atomic
    def lock_funds(job, payer, payee, amount):
        """
        Заморозка средств для начала работы над заказом.
        """
        escrow, created = Escrow.objects.get_or_create(
            job=job,
            defaults={'payer': payer, 'payee': payee, 'amount': amount}
        )
        
        if not created and escrow.status != Escrow.Status.CREATED:
            raise ValidationError("Funds are already locked or escrow is in final state.")

        escrow.status = Escrow.Status.FUNDS_LOCKED
        escrow.save()

        # Логирование операции
        TransactionService.log_transaction(
            user=payer,
            amount=-amount,  # Отрицательное для плательщика
            transaction_type=Transaction.Type.ESCROW_LOCK,
            reference_id=str(escrow.id),
            description=f"Funds locked for job: {job.title}"
        )
        
        return escrow

    @staticmethod
    @transaction.atomic
    def release_funds(escrow, actor):
        """
        Выплата средств исполнителю после завершения работы.
        """
        if escrow.status != Escrow.Status.FUNDS_LOCKED:
            raise ValidationError("Funds must be locked before release.")

        # Только заказчик или админ может подтвердить выплату
        if not (actor == escrow.payer or actor.is_staff):
            raise ValidationError("Only payer or admin can release funds.")

        escrow.status = Escrow.Status.RELEASED
        escrow.save()

        # Начисление средств на баланс исполнителя
        profile = escrow.payee.profile
        profile.balance += escrow.amount
        profile.save(update_fields=['balance'])

        # Логирование выплаты исполнителю
        TransactionService.log_transaction(
            user=escrow.payee,
            amount=escrow.amount,
            transaction_type=Transaction.Type.ESCROW_RELEASE,
            reference_id=str(escrow.id),
            description=f"Funds released for job: {escrow.job.title}"
        )
        
        return escrow

    @staticmethod
    @transaction.atomic
    def refund_funds(escrow, actor):
        """
        Возврат средств заказчику (отмена заказа или арбитраж).
        """
        if escrow.status != Escrow.Status.FUNDS_LOCKED:
            raise ValidationError("Funds must be locked before refund.")

        # Только админ может принудительно вернуть средства в спорных ситуациях
        # В случае отмены заказа до начала работ это может сделать клиент (по правилам JobService)
        if not (actor == escrow.payer or actor.is_staff):
            raise ValidationError("Unauthorized refund attempt.")

        escrow.status = Escrow.Status.REFUNDED
        escrow.save()

        # Логирование возврата плательщику
        TransactionService.log_transaction(
            user=escrow.payer,
            amount=escrow.amount,
            transaction_type=Transaction.Type.ESCROW_REFUND,
            reference_id=str(escrow.id),
            description=f"Funds refunded for job: {escrow.job.title}"
        )
        
        return escrow
