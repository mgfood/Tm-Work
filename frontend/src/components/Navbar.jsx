import { useNavigate, Link } from 'react-router-dom';
import { 
    Menu, X, User as UserIcon, LogOut, LayoutDashboard, 
    Search, Users, ShieldAlert, Mail, MessageSquare, 
    Wallet, Award, Languages, ChevronDown 
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import NotificationBell from './notifications/NotificationBell';

// ... (импорты остаются прежними)

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const { user, logout, loading } = useAuth();
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsLangOpen(false);
    };

    const currentLangLabel = i18n.language?.startsWith('tk') ? 'TKM' : 'RUS';

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-primary-600 tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-lg">T</div>
                    TmWork
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex gap-7 items-center font-medium text-slate-600">
                    <Link to="/" className="hover:text-primary-600 transition-colors">{t('nav.home')}</Link>
                    <Link to="/jobs" className="hover:text-primary-600 transition-colors flex items-center gap-1.5"><Search size={16} /> {t('nav.find_job')}</Link>
                    <Link to="/talents" className="hover:text-primary-600 transition-colors flex items-center gap-1.5"><Users size={16} /> {t('nav.find_talents')}</Link>
                    <Link to="/chat" className="hover:text-primary-600 transition-colors flex items-center gap-1.5"><MessageSquare size={16} /> {t('nav.messages')}</Link>
                    <Link to="/vip" className="text-amber-600 hover:text-amber-700 transition-colors font-black flex items-center gap-1.5 animate-pulse"><Award size={16} /> {t('nav.vip')}</Link>
                    <Link to="/contact" className="hover:text-primary-600 transition-colors flex items-center gap-1.5">{t('nav.contacts')}</Link>

                    {/* Language Switcher */}
                    <div className="relative ml-2">
                        <button 
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-[11px] font-black text-slate-700 border border-slate-200"
                        >
                            <Languages size={14} className="text-primary-600" />
                            {currentLangLabel}
                            <ChevronDown size={12} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLangOpen && (
                            <div className="absolute top-full mt-2 right-0 bg-white border border-slate-100 shadow-xl rounded-xl p-1.5 min-w-[120px] z-[60] animate-in fade-in zoom-in-95">
                                <button onClick={() => changeLanguage('ru')} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${i18n.language?.startsWith('ru') ? 'bg-primary-50 text-primary-600 font-bold' : 'hover:bg-slate-50'}`}>
                                    Русский {i18n.language?.startsWith('ru') && "✓"}
                                </button>
                                <button onClick={() => changeLanguage('tk')} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${i18n.language?.startsWith('tk') ? 'bg-primary-50 text-primary-600 font-bold' : 'hover:bg-slate-50'}`}>
                                    Türkmençe {i18n.language?.startsWith('tk') && "✓"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* User Block */}
                    <div className="flex gap-3 ml-2 border-l pl-6 border-slate-100">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-slate-50 animate-pulse"></div>
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                {user.is_staff && (
                                    <Link to="/admin-dashboard" className="text-slate-400 hover:text-primary-600 transition-colors">
                                        <ShieldAlert size={20} />
                                    </Link>
                                )}
                                <Link to="/dashboard" className="text-slate-400 hover:text-primary-600 transition-colors">
                                    <LayoutDashboard size={20} />
                                </Link>
                                <NotificationBell />
                                <Link to="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-slate-700">
                                    <Wallet size={18} className="text-primary-600" />
                                    <span className="font-bold text-sm">{user.balance || '0.00'} TMT</span>
                                </Link>
                                <Link to="/jobs/create" className="btn-primary text-xs py-2 px-4 whitespace-nowrap">{t('nav.create_order')}</Link>
                                <Link to="/profile" className="w-8 h-8 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold border-2 border-primary-100">
                                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                                </Link>
                                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Link to="/login" className="btn-secondary py-2 px-5 text-sm">{t('nav.login')}</Link>
                                <Link to="/register" className="btn-primary py-2 px-5 text-sm">{t('nav.register')}</Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Mobile Controls */}
                <div className="flex items-center gap-3 md:hidden">
                    <button 
                        onClick={() => changeLanguage(i18n.language?.startsWith('ru') ? 'tk' : 'ru')}
                        className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md uppercase border border-slate-200"
                    >
                        {currentLangLabel}
                    </button>
                    <button className="text-slate-600 p-2" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Content */}
            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-4 shadow-2xl z-50">
                    <Link to="/" onClick={() => setIsOpen(false)} className="py-2 font-medium">{t('nav.home')}</Link>
                    <Link to="/jobs" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><Search size={18} /> {t('nav.find_job')}</Link>
                    <Link to="/talents" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><Users size={18} /> {t('nav.find_talents')}</Link>
                    <Link to="/chat" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><MessageSquare size={18} /> {t('nav.messages')}</Link>
                    <Link to="/contact" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><Mail size={18} /> {t('nav.contacts')}</Link>
                    
                    <hr className="border-slate-100" />
                    {user ? (
                        <div className="flex flex-col gap-4">
                            <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-2 font-medium">
                                <LayoutDashboard size={20} className="text-primary-600" /> {t('nav.dashboard')}
                            </Link>
                            <Link to="/wallet" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-2 font-medium">
                                <Wallet size={20} className="text-primary-600" /> {t('nav.wallet')} ({user.balance} TMT)
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-3 py-2 font-medium text-red-500">
                                <LogOut size={20} /> {t('nav.logout')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Link to="/login" className="btn-secondary text-center py-3" onClick={() => setIsOpen(false)}>{t('nav.login')}</Link>
                            <Link to="/register" className="btn-primary text-center py-3" onClick={() => setIsOpen(false)}>{t('nav.register')}</Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Navbar;