import { Home, Search, MessageSquare, User, Plus, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const MobileBottomNav = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    if (!user) return null;

    const navItems = [
        { to: '/', icon: Home, label: t('nav.home') },
        { to: '/jobs', icon: Search, label: t('nav.find_job') },
        { to: '/chat', icon: MessageSquare, label: t('nav.messages') },
        { to: '/profile', icon: User, label: t('nav.profile') }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* FAB - Floating Action Button */}
            <Link to="/jobs/create" className="fab">
                <Plus size={24} />
            </Link>

            {/* Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                <div className="flex justify-around items-center py-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive(item.to)
                                    ? 'text-primary-600 bg-primary-50'
                                    : 'text-slate-400'
                                }`}
                        >
                            <item.icon
                                size={24}
                                strokeWidth={isActive(item.to) ? 2.5 : 2}
                            />
                            <span className={`text-xs font-semibold ${isActive(item.to) ? '' : 'font-normal'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
};

export default MobileBottomNav;
