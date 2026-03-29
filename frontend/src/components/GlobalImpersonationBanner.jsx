import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GlobalImpersonationBanner = () => {
    const { t } = useTranslation();
    const { refreshUser } = useAuth();
    
    const originalToken = localStorage.getItem('original_admin_token');
    const originalRefresh = localStorage.getItem('original_admin_refresh');
    const impersonatedName = localStorage.getItem('impersonated_user_name');

    if (!originalToken) return null;

    const handleRevert = async () => {
        // Restore tokens
        localStorage.setItem('access_token', originalToken);
        if (originalRefresh) localStorage.setItem('refresh_token', originalRefresh);
        
        // Clear impersonation data
        localStorage.removeItem('original_admin_token');
        localStorage.removeItem('original_admin_refresh');
        localStorage.removeItem('impersonated_user_name');
        
        // Fetch original admin user context and reload
        await refreshUser();
        window.location.href = '/admin-dashboard';
    };

    return (
        <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-[100]">
            <div className="flex items-center gap-3">
                <ShieldAlert size={20} className="animate-pulse" />
                <div className="text-sm font-bold">
                    Режим наблюдения: Вы вошли как <span className="underline uppercase tracking-wider mx-1">{impersonatedName || 'Пользователь'}</span>
                </div>
            </div>
            
            <button 
                onClick={handleRevert}
                className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2"
            >
                <LogOut size={14} /> Вернуться в Админку
            </button>
        </div>
    );
};

export default GlobalImpersonationBanner;
