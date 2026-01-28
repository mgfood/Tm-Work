from django.core.exceptions import ValidationError
from django.db import transaction
from apps.jobs.models import Job
from apps.jobs.services import JobService
from .models import Proposal


class ProposalService:
    @staticmethod
    @transaction.atomic
    def accept_proposal(proposal: Proposal, user):
        """
        Принятие отклика заказчиком.
        """
        job = proposal.job

        # 1. Проверка прав: только заказчик может принять отклик
        if user != job.client:
            raise ValidationError("Only the job owner can accept proposals.")

        # 2. Проверка статуса заказа: только опубликованный заказ может принять отклик
        if job.status != Job.Status.PUBLISHED:
            raise ValidationError("Proposals can only be accepted for published jobs.")

        # 3. Принятие отклика
        proposal.is_accepted = True
        proposal.save(update_fields=['is_accepted', 'updated_at'])

        # 4. Назначение исполнителя и смена статуса заказа
        job.freelancer = proposal.freelancer
        job.save(update_fields=['freelancer'])
        
        # Используем JobService для корректного перехода статуса
        JobService.change_status(job, Job.Status.IN_PROGRESS, user)

        # 5. Отклонение всех остальных откликов (опционально/может быть полезно для уведомлений)
        job.proposals.exclude(id=proposal.id).update(is_accepted=False)

        return proposal

    @staticmethod
    def create_proposal(job: Job, freelancer, price, message, deadline_days):
        """
        Создание отклика фрилансером.
        """
        # Проверка: заказчик не может откликнуться на свой заказ
        if freelancer == job.client:
            raise ValidationError("You cannot propose to your own job.")
            
        # Проверка: только на опубликованные заказы
        if job.status != Job.Status.PUBLISHED:
            raise ValidationError("You can only propose to published jobs.")

        proposal = Proposal.objects.create(
            job=job,
            freelancer=freelancer,
            price=price,
            message=message,
            deadline_days=deadline_days
        )
        return proposal
