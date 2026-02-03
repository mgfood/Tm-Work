from django.urls import path, include

urlpatterns = [
    path('auth/', include('apps.users.urls')),
    path('users/', include('apps.users.urls_admin')),
    path('profiles/', include('apps.profiles.urls')),
    path('jobs/', include('apps.jobs.urls')),
    path('proposals/', include('apps.proposals.urls')),
    path('escrow/', include('apps.escrow.urls')),
    path('transactions/', include('apps.transactions.urls')),
    path('chat/', include('apps.chat.urls')),
]
