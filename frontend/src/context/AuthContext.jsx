import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentRole, setCurrentRole] = useState(null);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setUser(null);
            setCurrentRole(null);
            setLoading(false);
            return;
        }

        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);

            // Determine current role logic
            const storedRole = localStorage.getItem('current_role');
            const userRoles = userData.roles?.map(r => r.name) || [];

            if (storedRole && userRoles.includes(storedRole)) {
                setCurrentRole(storedRole);
            } else if (userRoles.length > 0) {
                // Default to first role (prefer Client if both, or alphabetical? Let's verify)
                // Let's default to the first one available
                const defaultRole = userRoles.includes('CLIENT') ? 'CLIENT' : userRoles[0];
                setCurrentRole(defaultRole);
                localStorage.setItem('current_role', defaultRole);
            } else {
                setCurrentRole(null);
            }

        } catch (error) {
            console.error('Failed to fetch user:', error);
            // If unauthorized, clear tokens
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('current_role');
                setUser(null);
                setCurrentRole(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const switchRole = (role) => {
        if (user && user.roles.some(r => r.name === role)) {
            setCurrentRole(role);
            localStorage.setItem('current_role', role);
            return true;
        }
        return false;
    };

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Polling for user data (balance, VIP status, etc.)
    useEffect(() => {
        let intervalId = null;

        if (user) {
            intervalId = setInterval(() => {
                fetchUser();
            }, 30000); // Update every 30 seconds
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user, fetchUser]);

    const login = async (credentials) => {
        const result = await authService.login(credentials);
        await fetchUser();
        return result;
    };

    const register = async (userData) => {
        const result = await authService.register(userData);
        await fetchUser();
        return result;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setCurrentRole(null);
        localStorage.removeItem('current_role');
    };

    const value = {
        user,
        currentRole,
        loading,
        login,
        register,
        logout,
        switchRole,
        refreshUser: fetchUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
