import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, ShieldAlert, BarChart3,
    List, CreditCard, Award, Megaphone,
    History, Gavel, UserCog, DollarSign, Settings, Banknote
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Tab Components
import OverviewTab from '../../components/admin/tabs/OverviewTab';
import UsersTab from '../../components/admin/tabs/UsersTab';
import JobsTab from '../../components/admin/tabs/JobsTab';
import CategoriesTab from '../../components/admin/tabs/CategoriesTab';
import SkillsTab from '../../components/admin/tabs/SkillsTab';
import TransactionsTab from '../../components/admin/tabs/TransactionsTab';
import DisputesTab from '../../components/admin/tabs/DisputesTab';
import AuditLogsTab from '../../components/admin/tabs/AuditLogsTab';
import BroadcastTab from '../../components/admin/tabs/BroadcastTab';
import VIPSettingsTab from '../../components/admin/tabs/VIPSettingsTab';
import StaffManagementTab from './StaffManagementTab';
import RevenueTab from './RevenueTab';
import BalanceRequestsTab from './BalanceRequestsTab';
import SystemSettingsTab from '../../components/admin/tabs/SystemSettingsTab';
import WithdrawalsTab from '../../components/admin/tabs/WithdrawalsTab';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');

    if (!authLoading && (!user || !user.is_staff)) {
        return <Navigate to="/" replace />;
    }

    const menuItems = [
        { id: 'overview', label: 'Рабочий стол', icon: BarChart3 }, // Доступно всем
        { id: 'users', label: t('admin.users'), icon: Users, permission: 'can_manage_users' },
        { id: 'jobs', label: t('admin.jobs'), icon: Briefcase, permission: 'can_manage_jobs' },
        { id: 'categories', label: t('admin.categories'), icon: List, permission: 'can_manage_content' },
        { id: 'skills', label: t('admin.skills'), icon: Award, permission: 'can_manage_content' },
        { id: 'transactions', label: t('admin.transactions'), icon: CreditCard, permission: 'can_manage_finance' },
        { id: 'withdrawals', label: 'Вывод средств', icon: Banknote, permission: 'can_manage_finance' },
        { id: 'balance_requests', label: 'Запросы на баланс', icon: DollarSign, permission: 'can_manage_finance' },
        { id: 'disputes', label: t('admin.disputes_mgmt'), icon: Gavel, permission: 'can_manage_jobs' },
        { id: 'logs', label: t('admin.audit_logs'), icon: History, permission: 'can_manage_admins' },
        { id: 'broadcast', label: t('admin.broadcast_mgmt.title'), icon: Megaphone, permission: 'can_manage_admins' },
    ];

    const hasPermission = (item) => {
        if (user?.is_superuser) return true;
        if (!user?.admin_role) return false;
        if (!item.permission) return true;
        return user.admin_role[item.permission];
    };

    useEffect(() => {
        if (!authLoading && user) {
            // Защита супер-админских вкладок
            const superAdminTabs = ['staff', 'revenue', 'vip_settings', 'settings'];
            if (superAdminTabs.includes(activeTab) && !user.is_superuser) {
                const firstPermitted = menuItems.find(hasPermission);
                if (firstPermitted) setActiveTab(firstPermitted.id);
                return;
            }

            // Защита обычных вкладок
            const currentMenuItem = menuItems.find(item => item.id === activeTab);
            if (currentMenuItem && !hasPermission(currentMenuItem)) {
                const firstPermitted = menuItems.find(hasPermission);
                if (firstPermitted) setActiveTab(firstPermitted.id);
            }
        }
    }, [user, authLoading, activeTab]);

    return (
        <div data-testid="admin-dashboard" className="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-50">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col gap-2 shrink-0">
                <h2 className="text-white font-bold mb-8 px-4 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary-500" />
                    TmWork Admin
                </h2>

                {menuItems.filter(hasPermission).map((item) => (
                    <button
                        key={item.id}
                        data-testid={`admin-tab-${item.id}`}
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

                {user?.is_superuser && (
                    <>
                        <div className="border-t border-slate-700 my-4"></div>
                        <button
                            onClick={() => setActiveTab('staff')}
                            data-testid="admin-tab-staff"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'staff'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <UserCog size={18} />
                            {t('admin.staff')}
                        </button>
                        <button
                            onClick={() => setActiveTab('revenue')}
                            data-testid="admin-tab-revenue"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'revenue'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <DollarSign size={18} />
                            {t('admin.revenue')}
                        </button>
                        <button
                            onClick={() => setActiveTab('vip_settings')}
                            data-testid="admin-tab-vip_settings"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'vip_settings'
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'hover:bg-slate-800 text-amber-500 hover:text-amber-400'
                                }`}
                        >
                            <Award size={18} />
                            {t('admin.vip_settings')}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            data-testid="admin-tab-settings"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Settings size={18} />
                            Настройки системы
                        </button>
                    </>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow p-6 md:p-12 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900">
                        {activeTab === 'overview' && t('admin.analytics')}
                        {activeTab === 'users' && t('admin.user_mgmt')}
                        {activeTab === 'jobs' && t('admin.job_mgmt')}
                        {activeTab === 'categories' && t('admin.categories_mgmt_title')}
                        {activeTab === 'skills' && t('admin.skills_mgmt')}
                        {activeTab === 'transactions' && t('admin.transactions_history')}
                        {activeTab === 'disputes' && t('admin.disputes_mgmt')}
                        {activeTab === 'logs' && t('admin.audit_logs')}
                        {activeTab === 'broadcast' && t('admin.broadcast_mgmt.title')}
                        {activeTab === 'vip_settings' && t('admin.vip_settings')}
                        {activeTab === 'staff' && t('admin.staff_mgmt')}
                        {activeTab === 'revenue' && t('admin.revenue_mgmt')}
                        {activeTab === 'balance_requests' && 'Запросы на изменение баланса'}
                        {activeTab === 'withdrawals' && 'Модерация выплат'}
                        {activeTab === 'settings' && 'Настройки Системы'}
                    </h1>
                    <p className="text-slate-500">{t('admin.subtitle')}</p>
                </header>

                <div className="tab-content">
                    {/* Safe Render Engine - only render if permitted */}
                    {activeTab === 'overview' && hasPermission(menuItems.find(i => i.id === 'overview')) && <OverviewTab />}
                    {activeTab === 'users' && hasPermission(menuItems.find(i => i.id === 'users')) && <UsersTab />}
                    {activeTab === 'jobs' && hasPermission(menuItems.find(i => i.id === 'jobs')) && <JobsTab />}
                    {activeTab === 'categories' && hasPermission(menuItems.find(i => i.id === 'categories')) && <CategoriesTab />}
                    {activeTab === 'skills' && hasPermission(menuItems.find(i => i.id === 'skills')) && <SkillsTab />}
                    {activeTab === 'transactions' && hasPermission(menuItems.find(i => i.id === 'transactions')) && <TransactionsTab />}
                    {activeTab === 'disputes' && hasPermission(menuItems.find(i => i.id === 'disputes')) && <DisputesTab />}
                    {activeTab === 'logs' && hasPermission(menuItems.find(i => i.id === 'logs')) && <AuditLogsTab />}
                    {activeTab === 'broadcast' && hasPermission(menuItems.find(i => i.id === 'broadcast')) && <BroadcastTab />}
                    
                    {/* SuperAdmin Only Rendering */}
                    {user?.is_superuser && activeTab === 'vip_settings' && <VIPSettingsTab />}
                    {user?.is_superuser && activeTab === 'staff' && <StaffManagementTab />}
                    {user?.is_superuser && activeTab === 'revenue' && <RevenueTab />}
                    {user?.is_superuser && activeTab === 'settings' && <SystemSettingsTab />}
                    { activeTab === 'balance_requests' && hasPermission(menuItems.find(i => i.id === 'balance_requests')) && <BalanceRequestsTab />}
                    { activeTab === 'withdrawals' && hasPermission(menuItems.find(i => i.id === 'withdrawals')) && <WithdrawalsTab />}
                </div>
            </main>
        </div >
    );
};

export default AdminDashboard;
