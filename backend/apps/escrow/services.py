from decimal import Decimal
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

        # Проверка баланса плательщика
        from apps.profiles.models import Profile
        profile = Profile.objects.get(user=payer)
        if profile.balance < amount:
            raise ValidationError(f"Insufficient funds. Required: {amount} TMT, Available: {profile.balance} TMT")

        escrow.status = Escrow.Status.FUNDS_LOCKED
        escrow.save()

        # Логирование операции и списание средств
        TransactionService.process_transaction(
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
        
        commission_percent = Decimal(str(settings.vip_commission if is_vip else settings.regular_commission))
        commission_amount = (escrow.amount * commission_percent) / Decimal('100.00')
        net_amount = escrow.amount - commission_amount

        # Начисление средств на баланс исполнителя (за вычетом комиссии)
        # Мы используем процесс транзакции, который обновит баланс профиля
        TransactionService.process_transaction(
            user=escrow.payee,
            amount=net_amount,
            transaction_type=Transaction.Type.ESCROW_RELEASE,
            reference_id=str(escrow.id),
            description=f"Funds released for job: {escrow.job.title} (Net after {commission_percent}% fee)"
        )

        # 3. Перевод комиссии на счет платформы (System Wallet)
        if commission_amount > 0:
            from django.contrib.auth import get_user_model
            from django.conf import settings as django_settings
            
            User = get_user_model()
            system_email = getattr(django_settings, 'SYSTEM_WALLET_EMAIL', 'system@tmwork.tm')
            
            # Получаем или создаем системного пользователя
            system_user, created = User.objects.get_or_create(
                email=system_email,
                defaults={
                    'first_name': 'TmWork',
                    'last_name': 'System',
                    'is_staff': True, # Чтобы видеть админку
                    'is_active': True 
                }
            )
            
            if created:
                system_user.set_password('SystemWalletSecurePassword123!')
                system_user.save()
                # Создаем профиль если его нет (хотя сигналы должны отработать)
                from apps.profiles.models import Profile
                if not hasattr(system_user, 'profile'):
                    Profile.objects.create(user=system_user)

            TransactionService.process_transaction(
                user=system_user,
                amount=commission_amount,
                transaction_type=Transaction.Type.FEE, # Или DEPOSIT, но FEE логичнее для дохода
                reference_id=str(escrow.id),
                description=f"Revenue from job: {escrow.job.title} ({commission_percent}%)"
            )

            # 4. Update total revenue in global settings
            settings.total_revenue = models.F('total_revenue') + commission_amount
            settings.save(update_fields=['total_revenue'])
        
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

        # Возврат средств плательщику
        TransactionService.process_transaction(
            user=escrow.payer,
            amount=escrow.amount,
            transaction_type=Transaction.Type.ESCROW_REFUND,
            reference_id=str(escrow.id),
            description=f"Funds refunded for job: {escrow.job.title}"
        )
        
        return escrow
