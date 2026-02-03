import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, ShieldAlert, BarChart3,
    Search, Filter, MoreVertical, CheckCircle,
    XCircle, AlertTriangle, TrendingUp, DollarSign,
    List, CreditCard, Award, Check
} from 'lucide-react';
import adminService from '../../api/adminService';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [skills, setSkills] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Parallel fetch all admin data
            const [statsData, usersData, jobsData, escrowData, catData, skillData, transData] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers(),
                adminService.getAllJobs(),
                adminService.getAllEscrows().catch(() => ({ results: [] })),
                adminService.getCategories().catch(() => ({ results: [] })),
                adminService.getSkills().catch(() => ({ results: [] })),
                adminService.getTransactions().catch(() => ({ results: [] })),
            ]);

            setStats(statsData);
            setUsers(usersData.results || usersData || []);
            setJobs(jobsData.results || jobsData || []);
            setEscrows(escrowData.results || escrowData || []);
            setCategories(catData.results || catData || []);
            setSkills(skillData.results || skillData || []);
            setTransactions(transData.results || transData || []);
        } catch (err) {
            console.error('Admin data fetch error:', err);
            setError('Ошибка! Не удалось загрузить данные администратора.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.is_staff) {
            fetchAdminData();
        }
    }, [user]);

    const handleUserAction = async (userId, actionType) => {
        try {
            setActionLoading(true);
            if (actionType === 'block') {
                await adminService.blockUser(userId);
            } else if (actionType === 'unblock') {
                await adminService.unblockUser(userId);
            } else if (actionType === 'toggle_verify') {
                await adminService.toggleVerifyUser(userId);
            } else if (actionType === 'toggle_vip') {
                await adminService.toggleVipUser(userId);
            }
            await fetchAdminData();
            setOpenMenu(null);
        } catch (err) {
            setError(`Ошибка: ${err.response?.data?.error || 'Не удалось выполнить действие'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const icon = formData.get('icon');
        const slug = name.toLowerCase().replace(/\s+/g, '-');

        try {
            setActionLoading(true);
            await adminService.createCategory({ name, slug, icon });
            await fetchAdminData();
            e.target.reset();
        } catch (err) {
            setError('Ошибка создания категории');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Удалить категорию?')) return;
        try {
            setActionLoading(true);
            await adminService.deleteCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
            setError('Ошибка удаления');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateSkill = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const slug = name.toLowerCase().replace(/\s+/g, '-');

        try {
            setActionLoading(true);
            await adminService.createSkill({ name, slug });
            await fetchAdminData();
            e.target.reset();
        } catch (err) {
            setError('Ошибка создания навыка');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm('Удалить навык?')) return;
        try {
            setActionLoading(true);
            await adminService.deleteSkill(id);
            setSkills(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            setError('Ошибка удаления');
        } finally {
            setActionLoading(false);
        }
    };

    if (!authLoading && (!user || !user.is_staff)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-50" onClick={() => setOpenMenu(null)}>
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col gap-2 shrink-0">
                <h2 className="text-white font-bold mb-8 px-4 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary-500" />
                    TmWork Admin
                </h2>

                {[
                    { id: 'overview', label: 'Аналитика', icon: BarChart3 },
                    { id: 'users', label: 'Пользователи', icon: Users },
                    { id: 'jobs', label: 'Заказы', icon: Briefcase },
                    { id: 'categories', label: 'Категории', icon: List },
                    { id: 'skills', label: 'Навыки', icon: Award },
                    { id: 'transactions', label: 'Транзакции', icon: CreditCard },
                    { id: 'disputes', label: 'Споры', icon: AlertTriangle },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={(e) => { e.stopPropagation(); setActiveTab(item.id); }}
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

            {/* Main */}
            <main className="flex-grow p-6 md:p-12 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900">
                        {activeTab === 'overview' && 'Общая статистика'}
                        {activeTab === 'users' && 'Управление пользователями'}
                        {activeTab === 'jobs' && 'Все заказы платформы'}
                        {activeTab === 'disputes' && 'Арбитраж и споры'}
                    </h1>
                    <p className="text-slate-500">Система мониторинга и контроля TmWork</p>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-3">
                        <AlertTriangle size={20} /> {error}
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'Пользователи', value: stats?.total_users, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                                { label: 'Активные заказы', value: stats?.active_jobs, color: 'text-green-600', bg: 'bg-green-50', icon: Briefcase },
                                { label: 'В Escrow (TMT)', value: stats?.total_escrow, color: 'text-primary-600', bg: 'bg-primary-50', icon: DollarSign },
                                { label: 'Оборот (TMT)', value: stats?.total_volume, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: TrendingUp },
                                { label: 'Средний чек', value: stats?.avg_budget, color: 'text-amber-600', bg: 'bg-amber-50', icon: BarChart3 },
                                { label: 'Конфликты', value: stats?.disputes, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
                            ].map((item, idx) => (
                                <div key={idx} className="premium-card p-6 flex items-center gap-6">
                                    <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                                        <item.icon size={28} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                                        <div className="text-2xl font-black text-slate-900">{item.value || '0'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="premium-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Пользователь</th>
                                        <th className="px-6 py-4">Дата регистрации</th>
                                        <th className="px-6 py-4">Статус</th>
                                        <th className="px-6 py-4 text-center">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.length === 0 ? (
                                        <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">Пользователей не найдено</td></tr>
                                    ) : users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                    {u.email}
                                                    {u.is_verified && <CheckCircle size={14} className="text-blue-500" />}
                                                    {u.is_vip && <Award size={14} className="text-amber-500" />}
                                                </div>
                                                <div className="text-xs text-slate-400">ID: {u.id} | {u.first_name} {u.last_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">{new Date(u.date_joined).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {u.is_active ? 'Активен' : 'Забанен'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center relative overflow-visible">
                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }} className="p-2 hover:bg-slate-100 rounded-lg">
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openMenu === u.id && (
                                                    <div className="absolute right-6 top-10 w-48 bg-white border rounded-xl shadow-xl z-50 p-2 text-left animate-in fade-in zoom-in-95">
                                                        <button
                                                            onClick={() => handleUserAction(u.id, u.is_active ? 'block' : 'unblock')}
                                                            className={`w-full text-left px-3 py-2 rounded text-sm font-bold ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        >
                                                            {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                                                        </button>
                                                        <hr className="my-1 border-slate-100" />
                                                        <button
                                                            onClick={() => handleUserAction(u.id, 'toggle_verify')}
                                                            className="w-full text-left px-3 py-2 rounded text-sm font-bold text-blue-600 hover:bg-blue-50"
                                                        >
                                                            {u.is_verified ? 'Снять верификацию' : 'Верифицировать'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleUserAction(u.id, 'toggle_vip')}
                                                            className="w-full text-left px-3 py-2 rounded text-sm font-bold text-amber-600 hover:bg-amber-50"
                                                        >
                                                            {u.is_vip ? 'Убрать VIP' : 'Выдать VIP'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="premium-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Заголовок</th>
                                        <th className="px-6 py-4">Бюджет</th>
                                        <th className="px-6 py-4">Статус</th>
                                        <th className="px-6 py-4">Дата</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {jobs.length === 0 ? (
                                        <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">Заказов пока нет</td></tr>
                                    ) : jobs.map(j => (
                                        <tr key={j.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 truncate max-w-xs">{j.title}</div>
                                                <div className="text-xs text-slate-400">ID: {j.id} | Клиент ID: {j.client}</div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-primary-600">{j.budget} <span className="text-[10px]">TMT</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${j.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {j.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(j.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'disputes' && (
                    <div className="premium-card p-12 text-center text-slate-500 font-medium italic animate-in fade-in duration-500">
                        {jobs.filter(j => j.status === 'DISPUTE').length === 0
                            ? 'В данный момент активных споров в системе не зафиксировано.'
                            : 'Список споров и инструментов арбитража будет доступен в следующем обновлении.'}
                    </div>
                )}
                {activeTab === 'categories' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
                        <div className="md:col-span-2 premium-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Название</th>
                                            <th className="px-6 py-4">Слаг</th>
                                            <th className="px-6 py-4">Иконка</th>
                                            <th className="px-6 py-4 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {categories.map(cat => (
                                            <tr key={cat.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-bold text-slate-900">{cat.name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{cat.slug}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{cat.icon}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="premium-card p-6 h-fit sticky top-6">
                            <h3 className="font-bold text-lg mb-4">Добавить категорию</h3>
                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Название</label>
                                    <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Например: Дизайн" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Иконка (Lucide)</label>
                                    <input name="icon" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Например: Monitor" />
                                </div>
                                <button disabled={actionLoading} className="w-full btn-primary py-3">Добавить</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
                        <div className="md:col-span-2 premium-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Навык</th>
                                            <th className="px-6 py-4">Слаг</th>
                                            <th className="px-6 py-4 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {skills.map(skill => (
                                            <tr key={skill.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-bold text-slate-900">{skill.name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{skill.slug}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteSkill(skill.id)}
                                                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="premium-card p-6 h-fit sticky top-6">
                            <h3 className="font-bold text-lg mb-4">Добавить навык</h3>
                            <form onSubmit={handleCreateSkill} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Название</label>
                                    <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Например: Python" />
                                </div>
                                <button disabled={actionLoading} className="w-full btn-primary py-3">Добавить</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="premium-card overflow-hidden animate-in fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Пользователь</th>
                                        <th className="px-6 py-4">Тип</th>
                                        <th className="px-6 py-4">Сумма</th>
                                        <th className="px-6 py-4">Дата</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">Транзакций не найдено</td></tr>
                                    ) : transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-xs font-mono text-slate-400">{tx.id.slice(0, 8)}...</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">User #{tx.user}</td>
                                            <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider">{tx.type}</td>
                                            <td className={`px-6 py-4 font-black ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount} TMT
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AdminDashboard;
