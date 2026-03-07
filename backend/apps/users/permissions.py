from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to superuser or users with super_admin role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'admin_role') and request.user.admin_role and request.user.admin_role.codename == 'super_admin':
            return True
        
        return False


class HasAdminPermission(permissions.BasePermission):
    """
    Check if user has specific admin permission.
    Usage: permission_classes = [HasAdminPermission]
    Set permission_required in view (e.g., 'can_manage_users')
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        permission_required = getattr(view, 'permission_required', None)
        if not permission_required:
            return False
        
        admin_role = getattr(request.user, 'admin_role', None)
        if not admin_role:
            return False
        
        return getattr(admin_role, permission_required, False)


class IsProfileOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of a profile to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsClient(permissions.BasePermission):
    """
    Permission to only allow users with CLIENT role to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('CLIENT')


class IsFreelancer(permissions.BasePermission):
    """
    Permission to only allow users with FREELANCER role to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('FREELANCER')


class IsJobOwner(permissions.BasePermission):
    """
    Check if the user is the owner of the job.
    Used in jobs and proposals views.
    """
    def has_object_permission(self, request, view, obj):
        # Case for Job object
        if hasattr(obj, 'client'):
            return obj.client == request.user
            
        # Case for Proposal object (client who owns the job)
        if hasattr(obj, 'job'):
            return obj.job.client == request.user
            
        return False
