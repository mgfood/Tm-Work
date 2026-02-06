from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Job


class JobService:
    # Определение разрешенных переходов состояний
    TRANSITIONS = {
        Job.Status.DRAFT: [Job.Status.PUBLISHED, Job.Status.CANCELLED],
        Job.Status.PUBLISHED: [Job.Status.IN_PROGRESS, Job.Status.CANCELLED],
        Job.Status.IN_PROGRESS: [Job.Status.SUBMITTED, Job.Status.DISPUTE, Job.Status.CANCELLED],
        Job.Status.SUBMITTED: [Job.Status.COMPLETED, Job.Status.DISPUTE, Job.Status.IN_PROGRESS],
        Job.Status.DISPUTE: [Job.Status.COMPLETED, Job.Status.CANCELLED, Job.Status.IN_PROGRESS],
        Job.Status.COMPLETED: [],  # Конечный статус
        Job.Status.CANCELLED: [],   # Конечный статус
    }

    @staticmethod
    def change_status(job: Job, new_status: Job.Status, user):
        """
        Смена статуса с валидацией переходов и прав доступа.
        """
        current_status = job.status

        # 1. Проверка существования перехода
        if new_status not in JobService.TRANSITIONS.get(current_status, []):
            raise ValidationError(
                f"Transition from {current_status} to {new_status} is not allowed."
            )

        # 2. Проверка бизнес-логики и прав
        # Пример: Только клиент может опубликовать или отменить на ранних стадиях
        if new_status == Job.Status.PUBLISHED:
            if user != job.client:
                raise ValidationError("Only the client can publish the job.")
        
        if new_status == Job.Status.IN_PROGRESS:
            if not job.freelancer:
                raise ValidationError("Cannot move to IN_PROGRESS without a freelancer.")

        if new_status == Job.Status.SUBMITTED:
            if user != job.freelancer:
                raise ValidationError("Only the freelancer can submit work.")

        if new_status == Job.Status.COMPLETED:
            if user != job.client:
                raise ValidationError("Only the client can confirm completion.")
            
            # Increment freelancer's completed works count
            if job.freelancer:
                from apps.profiles.models import Profile
                profile, _ = Profile.objects.get_or_create(user=job.freelancer)
                profile.completed_works_count += 1
                profile.save(update_fields=['completed_works_count'])

        # Сохранение основного состояния
        job.status = new_status
        job.save(update_fields=['status', 'updated_at'])
        
        # Логирование изменения статуса (JobStatusLog)
        from .models import JobStatusLog
        JobStatusLog.objects.create(
            job=job,
            from_status=current_status,
            to_status=new_status,
            changed_by=user,
            comment=f"Status changed from {current_status} to {new_status} by {user.email}"
        )
        
        return job

    @staticmethod
    @transaction.atomic
    def submit_work(job: Job, freelancer, content, file_ids=None):
        """
        Фрилансер сдает работу.
        """
        if job.freelancer != freelancer:
            raise ValidationError("Only the assigned freelancer can submit work.")
        
        # Смена статуса через основной метод (с проверкой прав фрилансера внутри)
        JobService.change_status(job, Job.Status.SUBMITTED, freelancer)

        # Создание или обновление записи о сдаче
        from .models import JobSubmission
        submission, created = JobSubmission.objects.get_or_create(
            job=job,
            defaults={'content': content}
        )
        if not created:
            submission.content = content
            submission.save()
        
        if file_ids:
            submission.files.set(file_ids)

        return submission

    @staticmethod
    @transaction.atomic
    def approve_work(job: Job, client):
        """
        Заказчик одобряет работу и инициирует выплату.
        """
        if job.client != client:
            raise ValidationError("Only the client can approve work.")

        # Смена статуса (проверка прав клиента внутри)
        JobService.change_status(job, Job.Status.COMPLETED, client)

        # Выплата средств из Escrow
        from apps.escrow.services import EscrowService
        if hasattr(job, 'escrow'):
            EscrowService.release_funds(job.escrow, client)
        else:
            # Если это заказ без Escrow (например, постоплата вне системы), 
            # просто закрываем, но по ТЗ мы работаем с Escrow.
            pass

        return job
