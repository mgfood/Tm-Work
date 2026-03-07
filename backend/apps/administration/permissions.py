from rest_framework import permissions


class IsSupport(permissions.BasePermission):
    """Permission for Support role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.groups.filter(name='Support').exists()
        )


class IsModerator(permissions.BasePermission):
    """Permission for Moderator role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.groups.filter(name='Moderator').exists()
        )


class IsFinancialAdmin(permissions.BasePermission):
    """Permission for FinancialAdmin role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.groups.filter(name='FinancialAdmin').exists()
        )


class IsAdminStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow:
    - Read-only access for authenticated users
    - Write access only for staff/admin
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff
