import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, roles }) => {
    const { user, currentRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-600" size={48} />
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(currentRole)) {
        // User is logged in but doesn't have the required role
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
