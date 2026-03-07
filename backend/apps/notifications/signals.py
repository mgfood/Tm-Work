from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.proposals.models import Proposal
from apps.chat.models import Message, Thread
from apps.jobs.models import Job
from apps.transactions.models import Transaction
from .utils import create_notification

@receiver(post_save, sender=Proposal)
def proposal_created_notification(sender, instance, created, **kwargs):
    if created:
        # Notify the job client about a new proposal
        create_notification(
            user=instance.job.client,
            title="Новый отклик",
            message=f"Вы получили новый отклик на заказ '{instance.job.title}'",
            link=f"/jobs/{instance.job.id}"
        )

@receiver(post_save, sender=Message)
def message_created_notification(sender, instance, created, **kwargs):
    if created:
        # Notify the other participant in the thread
        recipient = instance.thread.participants.exclude(id=instance.sender.id).first()
        if recipient:
            create_notification(
                user=recipient,
                title="Новое сообщение",
                message=f"У вас новое сообщение в чате от {instance.sender.email}",
                link="/chat"
            )

@receiver(post_save, sender=Job)
def job_status_changed_notification(sender, instance, created, **kwargs):
    if not created:
        if instance.status == Job.Status.SUBMITTED:
            # Notify client that work is submitted
            create_notification(
                user=instance.client,
                title="Работа сдана",
                message=f"Фрилансер сдал работу по заказу '{instance.title}'",
                link=f"/jobs/{instance.id}"
            )
        elif instance.status == Job.Status.IN_PROGRESS and instance.freelancer:
            # Notify freelancer that work is returned for revision or accepted
            create_notification(
                user=instance.freelancer,
                title="Статус заказа обновлен",
                message=f"Статус заказа '{instance.title}' изменен на 'В работе'",
                link=f"/jobs/{instance.id}"
            )

@receiver(post_save, sender=Transaction)
def transaction_created_notification(sender, instance, created, **kwargs):
    if created:
        if instance.type == 'DEPOSIT':
            create_notification(
                user=instance.user,
                title="Баланс пополнен",
                message=f"Ваш баланс пополнен на {instance.amount} TMT",
                link="/wallet"
            )
        elif instance.type == 'ESCROW_RELEASE':
            create_notification(
                user=instance.user,
                title="Средства получены",
                message=f"Вам перечислено {instance.amount} TMT за выполненную работу",
                link="/wallet"
            )
