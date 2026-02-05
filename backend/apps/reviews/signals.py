from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review
from apps.profiles.models import Profile

@receiver(post_save, sender=Review)
def update_profile_rating(sender, instance, created, **kwargs):
    if created:
        receiver_user = instance.receiver
        profile = receiver_user.profile
        
        # Calculate overall rating and count for the receiver
        stats = Review.objects.filter(receiver=receiver_user).aggregate(
            avg_rating=Avg('rating'),
            count=Count('id')
        )
        
        # Determine if the receiver was a freelancer or client in the job
        # If the author is the job's client, the receiver is the freelancer
        if instance.job.client == instance.author:
            profile.freelancer_rating = stats['avg_rating'] or 0.00
            profile.freelancer_reviews_count = stats['count']
        else:
            # If the author is the freelancer (or anyone else), the receiver is the client
            profile.client_rating = stats['avg_rating'] or 0.00
            profile.client_reviews_count = stats['count']
            
        profile.save()
