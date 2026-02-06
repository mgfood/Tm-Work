import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Users, Briefcase, ShieldAlert, BarChart3,
    Search, Filter, MoreVertical, CheckCircle,
    XCircle, AlertTriangle, TrendingUp, DollarSign,
    List, CreditCard, Award, Check, Megaphone,
    History, Scale, ExternalLink, ArrowUpRight, ArrowDownRight,
    Monitor, Globe, Code, PenTool, Database, Layout, Smartphone,
    Server, Cpu, Layers, HardDrive, Terminal, Shield, Lock,
    Unlock, Settings, Cloud, Wifi, Bluetooth, Zap as ZapIcon,
    Camera, Video, Music, Image as ImageIcon, Briefcase as JobIcon,
    Heart, MessageCircle, Star as StarIcon, User as UserIcon,
    Users as UsersGroup, Settings as SettingsIcon, Bell,
    Calendar, Clock, MapPin, Mail, Phone, ShoppingCart,
    CreditCard as CardIcon, DollarSign as Dollar, Wallet as WalletIcon,
    Award as AwardIcon, Megaphone as MegaphoneIcon, Rocket,
    Zap, Home, HelpCircle, Info, ChevronRight, ChevronDown,
    ChevronLeft, ChevronUp, Plus, Minus, Search as SearchIcon,
    X, Trash, Edit, Save, LogOut as Logout, Sun, Moon,
    Maximize, Minimize, RefreshCw, Download, Upload, Share2,
    Copy, ExternalLink as LinkIcon, Menu, MoreHorizontal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../api/adminService';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Navigate } from 'react-router-dom';
import UserEditModal from '../../components/admin/UserEditModal';
import CategoryEditModal from '../../components/admin/CategoryEditModal';
import SkillEditModal from '../../components/admin/SkillEditModal';
import JobEditModal from '../../components/admin/JobEditModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '');

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [skills, setSkills] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [escrows, setEscrows] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({ amount: '', reason: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [vipPlans, setVipPlans] = useState([]);
    const [globalSettings, setGlobalSettings] = useState(null);
    const [broadcastTarget, setBroadcastTarget] = useState('ALL');
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [emailSearch, setEmailSearch] = useState('');

    // New God Mode Modals
    const [isTempBlockModalOpen, setIsTempBlockModalOpen] = useState(false);
    const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState('');
    const [tempBlockData, setTempBlockData] = useState({ hours: '24', reason: '' });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [selectedLucideIcon, setSelectedLucideIcon] = useState('Monitor');
    const [customIconFile, setCustomIconFile] = useState(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planFormData, setPlanFormData] = useState({
        name: '',
        months: 1,
        price_per_month: '',
        discount_percentage: 0,
        badge_icon: 'Award',
        badge_color: '#f59e0b'
    });

    // Edit Modals
    const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
    const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
    const [isSkillEditModalOpen, setIsSkillEditModalOpen] = useState(false);
    const [isJobEditModalOpen, setIsJobEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSkill, setEditingSkill] = useState(null);
    const [editingJob, setEditingJob] = useState(null);

    const LUCIDE_ICONS = [
        'Monitor', 'Globe', 'Code', 'PenTool', 'Database', 'Layout', 'Smartphone',
        'Server', 'Cpu', 'Layers', 'HardDrive', 'Terminal', 'Shield', 'Lock',
        'Unlock', 'Settings', 'Cloud', 'Wifi', 'Bluetooth', 'Camera', 'Video',
        'Music', 'Heart', 'MessageCircle', 'Bell', 'Calendar', 'Clock', 'MapPin',
        'Mail', 'Phone', 'ShoppingCart', 'Rocket', 'Zap', 'Home', 'Download',
        'Upload', 'Share2', 'Copy', 'Menu', 'Briefcase', 'Award'
    ];

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                statsData, usersData, jobsData, escrowData,
                catData, skillData, transData, logsData,
                vipPlansData, settingsData
            ] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers(),
                adminService.getAllJobs(),
                adminService.getAllEscrows().catch(() => ({ results: [] })),
                adminService.getCategories().catch(() => ({ results: [] })),
                adminService.getSkills().catch(() => ({ results: [] })),
                adminService.getTransactions().catch(() => ({ results: [] })),
                adminService.getLogs().catch(() => []),
                apiClient.get('/vip/plans/?all=true').catch(() => ({ results: [] })),
                apiClient.get('/vip/settings/').catch(() => ({ results: {} })),
            ]);

            setStats(statsData);
            setUsers(usersData.results || usersData || []);
            setJobs(jobsData.results || jobsData || []);
            setEscrows(escrowData.results || escrowData || []);
            setCategories(catData.results || catData || []);
            setSkills(skillData.results || skillData || []);
            setTransactions(transData.results || transData || []);
            setLogs(logsData || []);
            setVipPlans(vipPlansData.data?.results || vipPlansData.data || []);
            setGlobalSettings(settingsData.data);
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

    const handleUserAction = async (userId, actionType, reason = '') => {
        try {
            setActionLoading(true);
            if (actionType === 'block') {
                await adminService.blockUser(userId, reason);
            } else if (actionType === 'unblock') {
                await adminService.unblockUser(userId, reason);
            } else if (actionType === 'toggle_verify') {
                await adminService.toggleVerifyUser(userId);
            } else if (actionType === 'toggle_vip') {
                await adminService.toggleVipUser(userId);
            } else if (actionType === 'delete') {
                if (window.confirm('ВНИМАНИЕ: Это полностью удалит пользователя и ВСЕ его данные! Продолжить?')) {
                    await adminService.deleteUser(userId);
                    setIsUserModalOpen(false);
                }
            }
            await fetchAdminData();
            setOpenMenu(null);
            if (selectedUser?.id === userId && actionType !== 'delete') {
                handleShowUserDetails(userId); // Refresh details
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Не удалось выполнить действие', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTempBlock = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await adminService.tempBlockUser(selectedUser.id, tempBlockData);
            setIsTempBlockModalOpen(false);
            setTempBlockData({ hours: '24', reason: '' });
            await fetchAdminData();
            await handleShowUserDetails(selectedUser.id);
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка временной блокировки', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await adminService.resetPassword(selectedUser.id, resetPasswordData);
            setIsPasswordResetModalOpen(false);
            setResetPasswordData('');
            showToast('Пароль успешно изменен', 'success');
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка сброса пароля', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleShowUserDetails = async (userId) => {
        try {
            setActionLoading(true);
            const userDetails = await adminService.getUserDetails(userId);
            setSelectedUser(userDetails);
            setIsUserModalOpen(true);
        } catch (err) {
            setError('Не удалось загрузить данные пользователя');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdjustBalance = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await adminService.adjustBalance(selectedUser.id, adjustmentData);
            showToast(`Баланс изменен на ${adjustmentData.amount} TMT`, 'success');
            setIsAdjustmentModalOpen(false);
            setAdjustmentData({ amount: '', reason: '' });
            await fetchAdminData();
            await handleShowUserDetails(selectedUser.id);
        } catch (err) {
            showToast('Ошибка настройки баланса', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceRelease = async (id) => {
        if (!window.confirm('ПРИНУДИТЕЛЬНО выплатить исполнителю?')) return;
        const reason = window.prompt('Укажите причину:');
        if (!reason) return;
        try {
            setActionLoading(true);
            await adminService.forceReleaseEscrow(id, reason);
            showToast('Эскроу принудительно выплачен', 'success');
            await fetchAdminData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка принудительной выплаты', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceRefund = async (id) => {
        if (!window.confirm('ПРИНУДИТЕЛЬНО вернуть средства заказчику?')) return;
        const reason = window.prompt('Укажите причину:');
        if (!reason) return;
        try {
            setActionLoading(true);
            await adminService.forceRefundEscrow(id, reason);
            showToast('Средства возвращены заказчику', 'success');
            await fetchAdminData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка принудительного возврата', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', e.target.name.value);

        if (customIconFile) {
            formData.append('custom_icon', customIconFile);
            formData.append('icon', 'Image'); // Default lucide icon name when custom is used
        } else {
            formData.append('icon', selectedLucideIcon || 'Monitor');
        }

        try {
            setActionLoading(true);
            await apiClient.post('/jobs/categories/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Категория успешно создана', 'success');
            e.target.reset();
            setCustomIconFile(null);
            setSelectedLucideIcon('Monitor');
            await fetchAdminData();
        } catch (err) {
            console.error('Category creation error:', err.response?.data);
            showToast('Ошибка при создании категории: ' + JSON.stringify(err.response?.data || err.message), 'error');
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
            showToast('Категория удалена', 'success');
        } catch (err) {
            console.error(err);
            showToast('Ошибка удаления категории', 'error');
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
            showToast('Навык успешно создан', 'success');
            await fetchAdminData();
            e.target.reset();
        } catch (err) {
            showToast('Ошибка создания навыка', 'error');
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

    const handleSavePlan = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            if (editingPlan) {
                await apiClient.put(`/vip/plans/${editingPlan.id}/`, planFormData);
                showToast('Тариф обновлен', 'success');
            } else {
                await apiClient.post('/vip/plans/', planFormData);
                showToast('Тариф создан', 'success');
            }
            setIsPlanModalOpen(false);
            setEditingPlan(null);
            setPlanFormData({ name: '', months: 1, price_per_month: '', discount_percentage: 0, badge_icon: 'Award', badge_color: '#f59e0b' });
            await fetchAdminData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка при сохранении тарифа', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTogglePlanActive = async (planId) => {
        try {
            setActionLoading(true);
            const response = await apiClient.post(`/vip/plans/${planId}/toggle-active/`);
            showToast(response.data.is_active ? 'Тариф активирован' : 'Тариф скрыт', 'success');
            await fetchAdminData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка при изменении статуса тарифа', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!window.confirm('Вы уверены, что хотите УДАЛИТЬ этот тариф? Это действие необратимо.')) return;
        try {
            setActionLoading(true);
            await apiClient.delete(`/vip/plans/${planId}/`);
            showToast('Тариф удален', 'success');
            await fetchAdminData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка при удалении тарифа', 'error');
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
                    { id: 'disputes', label: 'Споры', icon: Scale },
                    { id: 'logs', label: 'Аудит (Logs)', icon: History },
                    { id: 'broadcast', label: 'Рассылка', icon: Megaphone },
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

                {user?.is_superuser && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveTab('vip_settings'); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'vip_settings'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'hover:bg-slate-800 text-amber-500 hover:text-amber-400'
                            }`}
                    >
                        <Award size={18} />
                        VIP Настройки
                    </button>
                )}
            </aside>

            {/* Main */}
            <main className="flex-grow p-6 md:p-12 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900">
                        {activeTab === 'overview' && 'Общая статистика'}
                        {activeTab === 'users' && 'Управление пользователями'}
                        {activeTab === 'jobs' && 'Все заказы платформы'}
                        {activeTab === 'categories' && 'Управление категориями'}
                        {activeTab === 'skills' && 'База навыков'}
                        {activeTab === 'transactions' && 'История транзакций'}
                        {activeTab === 'disputes' && 'Арбитраж и споры'}
                        {activeTab === 'logs' && 'Журнал действий (Audit)'}
                        {activeTab === 'broadcast' && 'Системная рассылка'}
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
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Пользователи', value: stats?.summary?.total_users, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                                { label: 'Активные заказы', value: stats?.summary?.active_jobs, color: 'text-green-600', bg: 'bg-green-50', icon: Briefcase },
                                { label: 'В Escrow (TMT)', value: stats?.summary?.total_escrow, color: 'text-primary-600', bg: 'bg-primary-50', icon: DollarSign },
                                { label: 'Completion Rate', value: `${stats?.completion_rate}%`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: TrendingUp },
                            ].map((item, idx) => (
                                <div key={idx} className="premium-card p-6 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                                            <item.icon size={24} />
                                        </div>
                                        <div className="text-2xl font-black text-slate-900">{item.value || '0'}</div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="premium-card p-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-8">Регистрации (30 дней)</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats?.trends?.registrations || []}>
                                            <defs>
                                                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                            />
                                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReg)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="premium-card p-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-8">Объем транзакций (30 дней)</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats?.trends?.volume || []}>
                                            <defs>
                                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
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
                                        <tr
                                            key={u.id}
                                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                            onClick={() => handleShowUserDetails(u.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                                        {u.first_name?.[0] || u.email[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            {u.email}
                                                            {u.is_verified && <CheckCircle size={14} className="text-blue-500" />}
                                                            {u.is_vip && <Award size={14} className="text-amber-500" />}
                                                        </div>
                                                        <div className="text-xs text-slate-400">ID: {u.id} | {u.first_name} {u.last_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {u.is_active ? 'Активен' : 'Забанен'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }} className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openMenu === u.id && (
                                                    <div className="absolute right-6 top-10 w-48 bg-white border rounded-2xl shadow-2xl z-50 p-2 text-left animate-in fade-in zoom-in-95">
                                                        <button
                                                            onClick={() => handleUserAction(u.id, u.is_active ? 'block' : 'unblock')}
                                                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        >
                                                            {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                                                        </button>
                                                        <hr className="my-2 border-slate-100" />
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setIsUserEditModalOpen(true); setOpenMenu(null); }}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Edit size={14} /> Редактировать профиль
                                                        </button>
                                                        <hr className="my-2 border-slate-100" />
                                                        <button
                                                            onClick={() => handleUserAction(u.id, 'toggle_verify')}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50"
                                                        >
                                                            {u.is_verified ? 'Снять верификацию' : 'Верифицировать'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleUserAction(u.id, 'toggle_vip')}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50"
                                                        >
                                                            {u.is_vip ? 'Убрать VIP' : 'Выдать VIP'}
                                                        </button>
                                                        <hr className="my-2 border-slate-100" />
                                                        <button
                                                            onClick={() => handleUserAction(u.id, 'delete')}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash size={14} /> Удалить пользователя
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
                                        <th className="px-6 py-4 text-right">Действия</th>
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
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => { setEditingJob(j); setIsJobEditModalOpen(true); }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg group/edit"
                                                >
                                                    <Edit size={16} className="text-slate-400 group-hover/edit:text-primary-600 transition-colors" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="premium-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Сумма</th>
                                        <th className="px-6 py-4">Тип</th>
                                        <th className="px-6 py-4">Пользователь</th>
                                        <th className="px-6 py-4">Описание</th>
                                        <th className="px-6 py-4">Дата</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">Транзакций не найдено</td></tr>
                                    ) : transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className={`px-6 py-4 font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount} TMT
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{tx.user_email}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{tx.description}</td>
                                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                                                <td className="px-6 py-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary-600 border border-slate-100 overflow-hidden">
                                                        {cat.custom_icon ? (
                                                            <img
                                                                src={cat.custom_icon.startsWith('http') ? cat.custom_icon : `${API_BASE}${cat.custom_icon}`}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    const fallback = e.target.closest('div').querySelector('.icon-fallback');
                                                                    if (fallback) fallback.style.display = 'block';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className="icon-fallback" style={{ display: cat.custom_icon ? 'none' : 'block' }}>
                                                            {(() => {
                                                                const IconComp = LucideIcons[cat.icon] || LucideIcons.HelpCircle || LucideIcons.Monitor;
                                                                return <IconComp size={20} />;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => { setEditingCategory(cat); setIsCategoryEditModalOpen(true); }}
                                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                                        >
                                                            Редактировать
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat.id)}
                                                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="premium-card p-6 h-fit sticky top-6">
                            <h3 className="font-bold text-lg mb-4">Добавить категорию</h3>
                            <form onSubmit={handleCreateCategory} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Название</label>
                                    <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-100 font-bold" placeholder="Например: Дизайн" />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-700">Иконка</label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setIsIconPickerOpen(true); setCustomIconFile(null); }}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${!customIconFile ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-primary-600">
                                                {(() => {
                                                    const IconComp = LucideIcons[selectedLucideIcon] || LucideIcons.Monitor;
                                                    return <IconComp size={24} />;
                                                })()}
                                            </div>
                                            <span className="text-[10px] font-black uppercase">Lucide: {selectedLucideIcon}</span>
                                        </button>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="custom-icon-upload"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) {
                                                        setCustomIconFile(e.target.files[0]);
                                                        setSelectedLucideIcon('');
                                                    }
                                                }}
                                                accept="image/*"
                                            />
                                            <label
                                                htmlFor="custom-icon-upload"
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer h-full ${customIconFile ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                {customIconFile ? (
                                                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-white border border-slate-100">
                                                        <img src={URL.createObjectURL(customIconFile)} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : <Upload size={24} className="text-slate-400" />}
                                                <span className="text-[10px] font-black uppercase text-center">Свой значок</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button disabled={actionLoading} className="w-full btn-primary py-4 rounded-2xl shadow-lg shadow-primary-200">
                                    {actionLoading ? 'Добавление...' : 'Создать категорию'}
                                </button>
                            </form>
                        </div>

                        {/* Visual Icon Picker Modal */}
                        {isIconPickerOpen && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
                                <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
                                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                                        <h2 className="text-2xl font-black italic">Выберите иконку</h2>
                                        <button onClick={() => setIsIconPickerOpen(false)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><XCircle size={24} /></button>
                                    </div>
                                    <div className="p-8 overflow-y-auto max-h-[60vh] grid grid-cols-5 gap-4 custom-scrollbar">
                                        {LUCIDE_ICONS.map(iconName => {
                                            const IconComp = LucideIcons[iconName] || LucideIcons.Monitor;
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => {
                                                        setSelectedLucideIcon(iconName);
                                                        setIsIconPickerOpen(false);
                                                    }}
                                                    className="aspect-square rounded-2xl border-2 border-slate-50 hover:border-primary-600 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 p-2 group"
                                                >
                                                    <IconComp size={28} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                                                    <span className="text-[8px] font-bold uppercase truncate w-full text-center text-slate-400 group-hover:text-primary-600">{iconName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
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
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => { setEditingSkill(skill); setIsSkillEditModalOpen(true); }}
                                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                                        >
                                                            Редактировать
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSkill(skill.id)}
                                                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
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

                {activeTab === 'disputes' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {jobs.filter(j => j.status === 'DISPUTE').length === 0 ? (
                            <div className="premium-card p-20 text-center text-slate-400">
                                <Scale size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold">Активных споров в системе нет.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {jobs.filter(j => j.status === 'DISPUTE').map(job => {
                                    const escrow = escrows.find(e => e.job === job.id);
                                    return (
                                        <div key={job.id} className="premium-card p-8 border-l-4 border-l-red-500">
                                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase">Dispute</span>
                                                        <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                                                    </div>
                                                    <p className="text-slate-500 mb-6 text-sm">ID заказа: {job.id} | Бюджет: {job.budget} TMT</p>

                                                    <div className="grid grid-cols-2 gap-8 py-6 border-t border-slate-100">
                                                        <div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Заказчик</div>
                                                            <div className="font-bold text-slate-700">{job.client_email}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Исполнитель</div>
                                                            <div className="font-bold text-slate-700">{job.freelancer_email}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex flex-col gap-3 min-w-[240px]">
                                                    <button
                                                        onClick={() => escrow && handleForceRelease(escrow.id)}
                                                        className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Выплатить исполнителю
                                                    </button>
                                                    <button
                                                        onClick={() => escrow && handleForceRefund(escrow.id)}
                                                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Вернуть заказчику
                                                    </button>
                                                    <button className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                                                        Разделить 50/50
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="premium-card overflow-hidden animate-in fade-in duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Админ</th>
                                        <th className="px-6 py-4">Действие</th>
                                        <th className="px-6 py-4">Объект</th>
                                        <th className="px-6 py-4">Комментарий</th>
                                        <th className="px-6 py-4">Дата</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.length === 0 ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">Событий не зафиксировано</td></tr>
                                    ) : logs.map(log => (
                                        <tr key={log.id} className="text-sm">
                                            <td className="px-6 py-4 font-bold text-slate-700">{log.admin_email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.action_type.includes('RELEASE') ? 'bg-green-100 text-green-700' :
                                                    log.action_type.includes('REFUND') || log.action_type.includes('BLOCK') ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.target_info}</td>
                                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{log.comment}</td>
                                            <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'vip_settings' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Commission Settings */}
                        <div className="premium-card p-10">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <DollarSign className="text-green-500" /> Настройки комиссий
                            </h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                try {
                                    setActionLoading(true);
                                    await apiClient.put('/vip/settings/1/', {
                                        regular_commission: formData.get('regular'),
                                        vip_commission: formData.get('vip')
                                    });
                                    showToast('Настройки сохранены', 'success');
                                    await fetchAdminData();
                                } catch (err) { showToast('Ошибка при сохранении настроек', 'error'); } finally { setActionLoading(false); }
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Обычная комиссия (%)</label>
                                    <input name="regular" type="number" step="0.01" defaultValue={globalSettings?.regular_commission} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">VIP комиссия (%)</label>
                                    <input name="vip" type="number" step="0.01" defaultValue={globalSettings?.vip_commission} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold" />
                                </div>
                                <div className="md:col-span-2">
                                    <button disabled={actionLoading} className="btn-primary px-12 py-4">Сохранить комиссии</button>
                                </div>
                            </form>
                        </div>

                        {/* VIP Plans Management */}
                        <div className="premium-card p-10">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <Award className="text-amber-500" /> Тарифные планы
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {vipPlans.map(plan => (
                                    <div key={plan.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: plan.badge_color }}>
                                                <Award size={24} />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900">{plan.name}</div>
                                                <div className="text-xs text-slate-500 font-medium">{plan.months} мес. | {plan.price_per_month} TMT/мес | Скидка {plan.discount_percentage}%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                            {!plan.is_active && <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-lg mr-2">Hidden</span>}
                                            <button
                                                onClick={() => {
                                                    setEditingPlan(plan);
                                                    setPlanFormData({
                                                        name: plan.name,
                                                        months: plan.months,
                                                        price_per_month: plan.price_per_month,
                                                        discount_percentage: plan.discount_percentage,
                                                        badge_icon: plan.badge_icon,
                                                        badge_color: plan.badge_color
                                                    });
                                                    setIsPlanModalOpen(true);
                                                }}
                                                className="text-slate-400 hover:text-primary-600 font-bold text-xs uppercase"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleTogglePlanActive(plan.id)}
                                                className={`font-bold text-xs uppercase ${plan.is_active ? 'text-slate-400 hover:text-orange-500' : 'text-green-500 hover:text-green-600'}`}
                                            >
                                                {plan.is_active ? 'Hide' : 'Show'}
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id)}
                                                className="text-slate-400 hover:text-red-700 font-bold text-xs uppercase"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setEditingPlan(null);
                                        setPlanFormData({ name: '', months: 1, price_per_month: '', discount_percentage: 0, badge_icon: 'Award', badge_color: '#f59e0b' });
                                        setIsPlanModalOpen(true);
                                    }}
                                    className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-primary-300 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} /> Создать новый тариф
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="max-w-2xl mx-auto py-12 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="premium-card p-10 bg-slate-50 text-black relative overflow-hidden mb-8 border border-slate-200 shadow-sm">
                            <Megaphone className="absolute -right-10 -bottom-10 w-64 h-64 text-slate-200/50 rotate-12" />
                            <h3 className="text-2xl font-black mb-2 text-black">Системное оповещение</h3>
                            <p className="text-black font-medium opacity-70">Ваше сообщение увидят все пользователи платформы как уведомление.</p>
                        </div>

                        <div className="premium-card p-10">
                            <form className="space-y-6" onSubmit={async (e) => {
                                e.preventDefault();
                                const msg = e.target.message.value;
                                const targetType = broadcastTarget;
                                if (!msg) return;
                                if (targetType === 'EMAILS' && selectedEmails.length === 0) {
                                    showToast('Выберите хотя бы одного пользователя', 'info');
                                    return;
                                }

                                try {
                                    setActionLoading(true);
                                    await apiClient.post('/chat/admin-broadcast/broadcast/', {
                                        message: msg,
                                        target_type: targetType,
                                        emails: targetType === 'EMAILS' ? selectedEmails : []
                                    });
                                    showToast('Рассылка запущена!', 'success');
                                    e.target.reset();
                                    setSelectedEmails([]);
                                    setEmailSearch('');
                                    await fetchAdminData();
                                } catch (err) { showToast('Ошибка при запуске рассылки', 'error'); } finally { setActionLoading(false); }
                            }}>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Целевая аудитория</label>
                                    <div className="relative">
                                        <select
                                            name="target_type"
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold transition-all appearance-none cursor-pointer text-slate-900"
                                            value={broadcastTarget}
                                            onChange={(e) => setBroadcastTarget(e.target.value)}
                                        >
                                            <option value="ALL">📢 Все пользователи</option>
                                            <option value="CLIENTS">💼 Только заказчики</option>
                                            <option value="FREELANCERS">🚀 Только фрилансеры</option>
                                            <option value="VIP">👑 Только VIP пользователи</option>
                                            <option value="EMAILS">📧 По списку Email</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <MoreVertical size={18} />
                                        </div>
                                    </div>
                                </div>

                                {broadcastTarget === 'EMAILS' && (
                                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Выберите пользователей</label>

                                        {/* Tags mapping */}
                                        {selectedEmails.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {selectedEmails.map(email => (
                                                    <div key={email} className="px-3 py-1.5 bg-primary-600 text-white rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                                                        {email}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedEmails(prev => prev.filter(e => e !== email))}
                                                            className="hover:text-red-200 transition-colors"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Search size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-medium transition-all text-slate-900"
                                                placeholder="Начните вводить email..."
                                                value={emailSearch}
                                                onChange={(e) => setEmailSearch(e.target.value)}
                                            />

                                            {emailSearch.length >= 2 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto z-50 p-2 custom-scrollbar">
                                                    {users
                                                        .filter(u =>
                                                            u.email.toLowerCase().includes(emailSearch.toLowerCase()) &&
                                                            !selectedEmails.includes(u.email)
                                                        )
                                                        .slice(0, 10)
                                                        .map(u => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedEmails(prev => [...prev, u.email]);
                                                                    setEmailSearch('');
                                                                }}
                                                                className="w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between group"
                                                            >
                                                                <span className="font-bold text-slate-700">{u.email}</span>
                                                                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                                                            </button>
                                                        ))
                                                    }
                                                    {users.filter(u => u.email.toLowerCase().includes(emailSearch.toLowerCase())).length === 0 && (
                                                        <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase">Пользователь не найден</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Текст сообщения</label>
                                    <textarea name="message" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 min-h-[150px] font-medium transition-all text-slate-900" placeholder="Текст сообщения..." required />
                                </div>
                                <button disabled={actionLoading} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                                    <Megaphone size={20} /> Запустить рассылку
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </main>

            {/* Custom Modals */}
            {isUserModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-3xl font-black">
                                    {selectedUser.first_name?.[0] || selectedUser.email[0]}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedUser.email}</h2>
                                    <p className="text-primary-400 font-bold flex items-center gap-2">
                                        ID: {selectedUser.id} • {new Date(selectedUser.date_joined).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <DollarSign size={14} className="text-green-500" /> Текущий баланс
                                    </div>
                                    <div className="text-3xl font-black text-slate-900">{selectedUser.balance} TMT</div>
                                    <button
                                        onClick={() => setIsAdjustmentModalOpen(true)}
                                        className="mt-4 text-primary-600 font-black text-xs uppercase hover:underline flex items-center gap-1"
                                    >
                                        <Scale size={14} /> изменить вручную
                                    </button>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={14} className="text-blue-500" /> Заказы
                                    </div>
                                    <div className="text-3xl font-black text-slate-900">{selectedUser.stats?.jobs_count || 0}</div>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Award size={14} className="text-amber-500" /> Рейтинг
                                    </div>
                                    <div className="text-3xl font-black text-slate-900">{selectedUser.stats?.reviews_avg || '0.00'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <CreditCard size={20} className="text-slate-400" />
                                        Недавние транзакции
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedUser.recent_transactions?.map(tx => (
                                            <div key={tx.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {tx.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">{tx.type}</div>
                                                        <div className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-black tracking-tight ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                </div>
                                            </div>
                                        )) || <p className="text-slate-400 italic text-sm">Транзакций не найдено</p>}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <ShieldAlert size={20} className="text-slate-400" />
                                        Управление статусами
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedUser.blocked_until && new Date(selectedUser.blocked_until) > new Date() && (
                                            <div className="p-6 bg-red-600 text-white rounded-2xl mb-4">
                                                <div className="text-[10px] font-black uppercase mb-1">Временная блокировка</div>
                                                <div className="text-sm font-bold">До: {new Date(selectedUser.blocked_until).toLocaleString()}</div>
                                                <div className="text-xs opacity-80">Причина: {selectedUser.block_reason}</div>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleUserAction(selectedUser.id, 'toggle_verify')}
                                            className={`p-6 rounded-2xl border-2 font-black transition-all flex items-center justify-between ${selectedUser.is_verified ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}
                                        >
                                            Верификация {selectedUser.is_verified ? 'Активна' : 'Отсутствует'}
                                            {selectedUser.is_verified ? <CheckCircle className="text-blue-600" /> : <XCircle />}
                                        </button>
                                        <button
                                            onClick={() => handleUserAction(selectedUser.id, 'toggle_vip')}
                                            className={`p-6 rounded-2xl border-2 font-black transition-all flex items-center justify-between ${selectedUser.is_vip ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}
                                        >
                                            VIP Статус {selectedUser.is_vip ? 'Активен' : 'Отсутствует'}
                                            {selectedUser.is_vip && <Award className="text-amber-500" />}
                                        </button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setIsTempBlockModalOpen(true)}
                                                className="p-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-black hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-all text-sm"
                                            >
                                                Временный блок
                                            </button>
                                            <button
                                                onClick={() => setIsPasswordResetModalOpen(true)}
                                                className="p-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-black hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 transition-all text-sm"
                                            >
                                                Сбросить пароль
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const res = window.confirm('Вы уверены? Это полностью ограничит доступ пользователя.');
                                                if (res) handleUserAction(selectedUser.id, selectedUser.is_active ? 'block' : 'unblock', 'Manual action');
                                            }}
                                            className={`p-6 rounded-2xl font-black border-2 transition-all flex items-center justify-between ${selectedUser.is_active ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-600 bg-green-50 text-green-700'}`}
                                        >
                                            {selectedUser.is_active ? 'Перманентный блок' : 'Разблокировать'}
                                            <ShieldAlert />
                                        </button>
                                        <button
                                            onClick={() => handleUserAction(selectedUser.id, 'delete')}
                                            className="p-6 rounded-2xl border-2 border-red-50 bg-white text-red-400 font-black hover:bg-red-600 hover:text-white transition-all text-center"
                                        >
                                            Удалить аккаунт навсегда
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Коррекция баланса</h3>
                        <p className="text-slate-500 text-sm mb-8">Для пользователя: {selectedUser?.email}</p>

                        <form onSubmit={handleAdjustBalance} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Сумма (TMT)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={adjustmentData.amount}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                                    placeholder="Например: 50.00 или -20.00"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold transition-all text-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Причина</label>
                                <textarea
                                    value={adjustmentData.reason}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                    placeholder="Почему меняется баланс?"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 min-h-[100px] font-medium resize-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustmentModalOpen(false)}
                                    className="flex-grow py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-grow py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                >
                                    Применить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isPlanModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">
                            {editingPlan ? 'Редактировать тариф' : 'Создать новый тариф'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-8">Настройте параметры подписки</p>

                        <form onSubmit={handleSavePlan} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Название</label>
                                    <input
                                        type="text"
                                        value={planFormData.name}
                                        onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold"
                                        placeholder="Напр: PRO-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Месяцев</label>
                                    <input
                                        type="number"
                                        value={planFormData.months}
                                        onChange={(e) => setPlanFormData({ ...planFormData, months: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Цена/мес (TMT)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={planFormData.price_per_month}
                                        onChange={(e) => setPlanFormData({ ...planFormData, price_per_month: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Скидка (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={planFormData.discount_percentage}
                                        onChange={(e) => setPlanFormData({ ...planFormData, discount_percentage: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Цвет плашки</label>
                                    <input
                                        type="color"
                                        value={planFormData.badge_color}
                                        onChange={(e) => setPlanFormData({ ...planFormData, badge_color: e.target.value })}
                                        className="w-full h-14 p-1 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 cursor-pointer"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Иконка</label>
                                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50 custom-scrollbar">
                                        {['Award', 'Zap', 'ShieldCheck', 'Star', 'Crown'].map(iconName => {
                                            const Icon = LucideIcons[iconName] || LucideIcons.Award;
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => setPlanFormData({ ...planFormData, badge_icon: iconName })}
                                                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${planFormData.badge_icon === iconName ? 'bg-primary-600 text-white' : 'bg-white text-slate-400'}`}
                                                >
                                                    <Icon size={20} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => { setIsPlanModalOpen(false); setEditingPlan(null); }}
                                    className="flex-grow py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-grow py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all"
                                >
                                    {editingPlan ? 'Сохранить' : 'Создать'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTempBlockModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Временная блокировка</h3>
                        <p className="text-slate-500 text-sm mb-8">Пользователь: {selectedUser?.email}</p>

                        <form onSubmit={handleTempBlock} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Длительность (в часах)</label>
                                <select
                                    value={tempBlockData.hours}
                                    onChange={(e) => setTempBlockData({ ...tempBlockData, hours: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold transition-all"
                                >
                                    <option value="1">1 час</option>
                                    <option value="12">12 часов</option>
                                    <option value="24">24 часа</option>
                                    <option value="72">3 дня (72ч)</option>
                                    <option value="168">7 дней (168ч)</option>
                                    <option value="720">30 дней (720ч)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Причина</label>
                                <textarea
                                    value={tempBlockData.reason}
                                    onChange={(e) => setTempBlockData({ ...tempBlockData, reason: e.target.value })}
                                    placeholder="Почему блокируете?"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 min-h-[100px] font-medium resize-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsTempBlockModalOpen(false)} className="flex-grow py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                                    Отмена
                                </button>
                                <button type="submit" disabled={actionLoading} className="flex-grow py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all">
                                    Блокировать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPasswordResetModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Принудительный сброс пароля</h3>
                        <p className="text-slate-500 text-sm mb-8">Пользователь: {selectedUser?.email}</p>

                        <form onSubmit={handleSetPassword} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Новый пароль</label>
                                <input
                                    type="text"
                                    value={resetPasswordData}
                                    onChange={(e) => setResetPasswordData(e.target.value)}
                                    placeholder="Введите новый пароль"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsPasswordResetModalOpen(false)} className="flex-grow py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                                    Отмена
                                </button>
                                <button type="submit" disabled={actionLoading} className="flex-grow py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all">
                                    Сменить пароль
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isUserEditModalOpen && (
                <UserEditModal
                    user={selectedUser}
                    onClose={() => setIsUserEditModalOpen(false)}
                    onSuccess={() => {
                        showToast('Данные пользователя обновлены', 'success');
                        fetchAdminData();
                    }}
                />
            )}

            {isCategoryEditModalOpen && (
                <CategoryEditModal
                    category={editingCategory}
                    onClose={() => setIsCategoryEditModalOpen(false)}
                    onSuccess={() => {
                        showToast('Категория обновлена', 'success');
                        fetchAdminData();
                    }}
                />
            )}

            {isSkillEditModalOpen && (
                <SkillEditModal
                    skill={editingSkill}
                    onClose={() => setIsSkillEditModalOpen(false)}
                    onSuccess={() => {
                        showToast('Навык обновлен', 'success');
                        fetchAdminData();
                    }}
                />
            )}

            {isJobEditModalOpen && (
                <JobEditModal
                    job={editingJob}
                    onClose={() => setIsJobEditModalOpen(false)}
                    onSuccess={() => {
                        showToast('Заказ обновлен', 'success');
                        fetchAdminData();
                    }}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
