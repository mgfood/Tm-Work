from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
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

        # Calculate commission
        from apps.vip.models import GlobalSettings
        settings = GlobalSettings.get_settings()
        
        # Check if payee has active VIP subscription
        is_vip = False
        from apps.vip.models import VIPSubscription
        active_sub = VIPSubscription.objects.filter(
            user=escrow.payee,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).exists()
        
        if active_sub:
            is_vip = True
        
        commission_percent = settings.vip_commission if is_vip else settings.regular_commission
        commission_amount = (escrow.amount * commission_percent) / 100
        net_amount = escrow.amount - commission_amount

        # Начисление средств на баланс исполнителя (за вычетом комиссии)
        profile = escrow.payee.profile
        profile.balance += net_amount
        profile.save(update_fields=['balance'])

        # Логирование выплаты исполнителю (Net)
        TransactionService.log_transaction(
            user=escrow.payee,
            amount=net_amount,
            transaction_type=Transaction.Type.ESCROW_RELEASE,
            reference_id=str(escrow.id),
            description=f"Funds released for job: {escrow.job.title} (Net after {commission_percent}% fee)"
        )

        # Логирование комиссии (Platform Fee)
        if commission_amount > 0:
            # We log it as a withdrawal or a special type if available. 
            # In our system, the payer already lost the full 'amount'. 
            # The payee receives 'net_amount'. The 'commission_amount' stays in the system.
            # We create a log for audit.
            TransactionService.log_transaction(
                user=escrow.payee, # Associated with this payee's job
                amount=0, # It's an informational record or we can log it with a special type
                transaction_type=Transaction.Type.WITHDRAWAL, # Or a new type FEE
                reference_id=str(escrow.id),
                description=f"Platform Fee {commission_percent}%: {commission_amount} TMT"
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
