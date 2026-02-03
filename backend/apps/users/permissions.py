from rest_framework import permissions

class IsClient(permissions.BasePermission):
    """
    Лишь пользователи с ролью CLIENT могут выполнять действие.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('CLIENT')

class IsFreelancer(permissions.BasePermission):
    """
    Лишь пользователи с ролью FREELANCER могут выполнять действие.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('FREELANCER')

class IsJobOwner(permissions.BasePermission):
    """
    Разрешение только для владельца (заказчика) работы.
    """
    def has_object_permission(self, request, view, obj):
        return obj.client == request.user

class IsFreelancerAssigned(permissions.BasePermission):
    """
    Разрешение только для фрилансера, назначенного на работу.
    """
    def has_object_permission(self, request, view, obj):
        return obj.freelancer == request.user


class IsProfileOwner(permissions.BasePermission):
    """
    Разрешение только для владельца профиля.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'profile'):
            return obj.profile.user == request.user
        return False
