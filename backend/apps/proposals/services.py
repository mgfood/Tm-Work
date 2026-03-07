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
        proposal.status = Proposal.Status.ACCEPTED
        proposal.save(update_fields=['status', 'updated_at'])

        # 4. Назначение исполнителя и заморозка средств в Escrow
        job.freelancer = proposal.freelancer
        job.save(update_fields=['freelancer'])
        
        # Заморозка средств (Escrow)
        from apps.escrow.services import EscrowService
        EscrowService.lock_funds(
            job=job,
            payer=job.client,
            payee=proposal.freelancer,
            amount=proposal.price
        )

        # Используем JobService для корректного перехода статуса
        JobService.change_status(job, Job.Status.IN_PROGRESS, user)

        # 5. Отклонение всех остальных откликов
        job.proposals.exclude(id=proposal.id).update(status=Proposal.Status.REJECTED)

        return proposal

    @staticmethod
    def reject_proposal(proposal: Proposal, user):
        """
        Отклонение отклика заказчиком.
        """
        if user != proposal.job.client:
            raise ValidationError("Only the job owner can reject proposals.")
        
        if proposal.status != Proposal.Status.PENDING:
            raise ValidationError("Only pending proposals can be rejected.")
            
        proposal.status = Proposal.Status.REJECTED
        proposal.save(update_fields=['status', 'updated_at'])
        return proposal

    @staticmethod
    def cancel_proposal(proposal: Proposal, user):
        """
        Отмена отклика самим фрилансером.
        """
        if user != proposal.freelancer:
            raise ValidationError("Only the freelancer who submitted the proposal can cancel it.")
            
        if proposal.status == Proposal.Status.ACCEPTED:
            raise ValidationError("Cannot cancel a proposal that has already been accepted.")
            
        proposal.status = Proposal.Status.CANCELLED
        proposal.save(update_fields=['status', 'updated_at'])
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
