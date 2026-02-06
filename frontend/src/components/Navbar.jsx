import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, Search, Users, ShieldAlert, Mail, MessageSquare, Wallet, Award } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-primary-600 tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-lg">T</div>
                    TmWork
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex gap-8 items-center font-medium text-slate-600">
                    <Link to="/" className="hover:text-primary-600 transition-colors flex items-center gap-1.5">Главная</Link>
                    <Link to="/jobs" className="hover:text-primary-600 transition-colors flex items-center gap-1.5"><Search size={16} /> Найти работу</Link>
                    <Link to="/talents" className="hover:text-primary-600 transition-colors flex items-center gap-1.5"><Users size={16} /> Поиск талантов</Link>
                    <Link to="/chat" className="hover:text-primary-600 transition-colors flex items-center gap-1.5"><MessageSquare size={16} /> Сообщения</Link>
                    <Link to="/vip" className="text-amber-600 hover:text-amber-700 transition-colors font-black flex items-center gap-1.5 animate-pulse"><Award size={16} /> VIP</Link>
                    <Link to="/contact" className="hover:text-primary-600 transition-colors flex items-center gap-1.5">Контакты</Link>

                    <div className="flex gap-3 ml-4 border-l pl-8 border-slate-100">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-slate-50 animate-pulse"></div>
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                {user.is_staff && (
                                    <Link to="/admin-dashboard" className="text-slate-400 hover:text-primary-600 transition-colors" title="Админ-панель">
                                        <ShieldAlert size={20} />
                                    </Link>
                                )}
                                <Link to="/dashboard" className="text-slate-400 hover:text-primary-600 transition-colors" title="Дашборд">
                                    <LayoutDashboard size={20} />
                                </Link>
                                <NotificationBell />
                                <Link to="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-slate-700 hover:text-primary-600 transition-colors" title="Кошелек">
                                    <Wallet size={18} className="text-primary-600" />
                                    <span className="font-bold text-sm">{user.balance || '0.00'} TMT</span>
                                </Link>
                                <Link to="/jobs/create" className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
                                    Создать заказ
                                </Link>
                                {user.is_vip && (
                                    <Link to="/vip" className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200">
                                        <Award size={12} /> VIP
                                    </Link>
                                )}
                                <Link to="/profile" className="flex items-center gap-2 text-slate-700 hover:text-primary-600 transition-colors shrink-0">
                                    <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold border-2 border-primary-100">
                                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                                    </div>
                                    <span className="hidden lg:inline">{user.first_name || 'Профиль'}</span>
                                </Link>
                                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Выйти">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="btn-secondary py-2 px-6 text-sm">Войти</Link>
                                <Link to="/register" className="btn-primary py-2 px-6 text-sm">Регистрация</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Mobile Toggle */}
                <button className="md:hidden text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 shadow-xl">
                    <Link to="/" onClick={() => setIsOpen(false)} className="py-2 font-medium">Главная</Link>
                    <Link to="/jobs" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><Search size={18} /> Найти работу</Link>
                    <Link to="/talents" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><Users size={18} /> Поиск талантов</Link>
                    <Link to="/chat" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><MessageSquare size={18} /> Сообщения</Link>
                    <Link to="/contact" onClick={() => setIsOpen(false)} className="py-2 font-medium flex items-center gap-2"><Mail size={18} /> Контакты</Link>
                    <hr className="border-slate-100" />
                    {user ? (
                        <div className="flex flex-col gap-4">
                            <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-2 font-medium">
                                <LayoutDashboard size={20} className="text-primary-600" />
                                Дашборд (Мои заказы)
                            </Link>
                            <Link to="/wallet" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-2 font-medium">
                                <Wallet size={20} className="text-primary-600" />
                                Кошелек ({user.balance || '0.00'} TMT)
                            </Link>
                            <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-2 font-medium">
                                <UserIcon size={20} className="text-primary-600" />
                                Личный профиль
                            </Link>
                            <Link to="/vip" onClick={() => setIsOpen(false)} className="flex items-center gap-3 py-2 font-medium">
                                <Award size={20} className="text-amber-500" />
                                Стать VIP
                            </Link>
                            <button
                                onClick={() => { handleLogout(); setIsOpen(false); }}
                                className="flex items-center gap-3 py-2 font-medium text-red-500 border-t border-slate-50 pt-4"
                            >
                                <LogOut size={20} />
                                Выйти
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 pt-2">
                            <Link to="/login" className="btn-secondary text-center py-3" onClick={() => setIsOpen(false)}>Войти</Link>
                            <Link to="/register" className="btn-primary text-center py-3" onClick={() => setIsOpen(false)}>Регистрация</Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Navbar;
