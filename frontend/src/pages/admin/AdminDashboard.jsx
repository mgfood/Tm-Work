import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, ShieldAlert, BarChart3,
    Search, Filter, MoreVertical, CheckCircle,
    XCircle, AlertTriangle, TrendingUp, DollarSign
} from 'lucide-react';
import adminService from '../../api/adminService';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                setLoading(true);
                const [statsData, usersData] = await Promise.all([
                    adminService.getStats(),
                    adminService.getUsers()
                ]);
                setStats(statsData);
                setUsers(usersData.results || usersData);
            } catch (err) {
                console.error('Failed to fetch admin data', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.is_staff) {
            fetchAdminData();
        }
    }, [user]);

    // Protect route
    if (!authLoading && (!user || !user.is_staff)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-50">
            {/* Admin Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col gap-2">
                <h2 className="text-white font-bold mb-8 px-4 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary-500" />
                    Панель управления
                </h2>

                {[
                    { id: 'overview', label: 'Обзор', icon: BarChart3 },
                    { id: 'users', label: 'Пользователи', icon: Users },
                    { id: 'jobs', label: 'Заказы', icon: Briefcase },
                    { id: 'disputes', label: 'Споры', icon: AlertTriangle },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </button>
                ))}
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-6 md:p-12 overflow-y-auto">
                <header className="flex flex-col md:row justify-between items-start md:items-center gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">
                            {activeTab === 'overview' && 'Общая статистика'}
                            {activeTab === 'users' && 'Управление пользователями'}
                            {activeTab === 'jobs' && 'Модерация заказов'}
                            {activeTab === 'disputes' && 'Разрешение споров'}
                        </h1>
                        <p className="text-slate-500">Система администрирования TmWork</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold flex items-center gap-2">
                            <TrendingUp size={16} /> Отчет
                        </button>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-12">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Всего пользователей', value: stats?.total_users, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                                { label: 'Активных заказов', value: stats?.active_jobs, color: 'text-green-600', bg: 'bg-green-50', icon: Briefcase },
                                { label: 'В Escrow', value: stats?.total_escrow, color: 'text-primary-600', bg: 'bg-primary-50', icon: DollarSign },
                                { label: 'Споров', value: stats?.disputes, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
                            ].map((item, idx) => (
                                <div key={idx} className="premium-card p-6 flex items-center gap-6">
                                    <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                                        <item.icon size={28} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                                        <div className="text-2xl font-black text-slate-900">{item.value || '...'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Performance Placeholder Chart */}
                        <div className="premium-card p-10 h-80 flex flex-col justify-between">
                            <h3 className="font-bold text-slate-900 mb-6">Динамика оборота</h3>
                            <div className="flex items-end justify-between h-40 gap-2">
                                {[40, 70, 45, 90, 65, 80, 50, 60, 85, 95, 75, 100].map((h, i) => (
                                    <div key={i} className="flex-grow bg-primary-100 rounded-t-lg transition-all hover:bg-primary-600 group relative" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            + {h * 12} TMT
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mt-4">
                                <span>Янв</span><span>Фев</span><span>Мар</span><span>Апр</span><span>Май</span><span>Июн</span>
                                <span>Июл</span><span>Авг</span><span>Сен</span><span>Окт</span><span>Ноя</span><span>Дек</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="premium-card overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="relative w-72">
                                <input type="text" placeholder="Поиск по email или имени..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <button className="p-2 border border-slate-200 rounded-lg"><Filter size={18} /></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Пользователь</th>
                                        <th className="px-6 py-4">Роли</th>
                                        <th className="px-6 py-4">Дата регистрации</th>
                                        <th className="px-6 py-4">Статус</th>
                                        <th className="px-6 py-4">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-slate-400">Загрузка данных...</td></tr>
                                    ) : users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                                        {u.first_name?.[0] || u.email[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                                                        <div className="text-xs text-slate-400">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {u.roles?.map(r => (
                                                        <span key={r.name} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                                                            {r.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(u.date_joined).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {u.is_active ? 'Активен' : 'Заблокирован'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><MoreVertical size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(activeTab === 'jobs' || activeTab === 'disputes') && (
                    <div className="premium-card p-20 text-center">
                        <Briefcase size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Раздел в разработке</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Эта функциональность администратора будет реализована в следующей итерации.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
