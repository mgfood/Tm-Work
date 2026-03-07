import React, { useState } from 'react';
import {
    Users, Briefcase, ShieldAlert, BarChart3,
    List, CreditCard, Award, Megaphone,
    History, Gavel, UserCog, DollarSign
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

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');

    if (!authLoading && (!user || !user.is_staff)) {
        return <Navigate to="/" replace />;
    }

    const menuItems = [
        { id: 'overview', label: t('admin.analytics'), icon: BarChart3 },
        { id: 'users', label: t('admin.users'), icon: Users },
        { id: 'jobs', label: t('admin.jobs'), icon: Briefcase },
        { id: 'categories', label: t('admin.categories'), icon: List },
        { id: 'skills', label: t('admin.skills'), icon: Award },
        { id: 'transactions', label: t('admin.transactions'), icon: CreditCard },
        { id: 'disputes', label: t('admin.disputes_mgmt'), icon: Gavel },
        { id: 'logs', label: t('admin.audit_logs'), icon: History },
        { id: 'broadcast', label: t('admin.broadcast_mgmt.title'), icon: Megaphone },
    ];

    return (
        <div data-testid="admin-dashboard" className="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-50">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-400 p-6 flex flex-col gap-2 shrink-0">
                <h2 className="text-white font-bold mb-8 px-4 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary-500" />
                    TmWork Admin
                </h2>

                {menuItems.map((item) => (
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
                    </h1>
                    <p className="text-slate-500">{t('admin.subtitle')}</p>
                </header>

                <div className="tab-content">
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'jobs' && <JobsTab />}
                    {activeTab === 'categories' && <CategoriesTab />}
                    {activeTab === 'skills' && <SkillsTab />}
                    {activeTab === 'transactions' && <TransactionsTab />}
                    {activeTab === 'disputes' && <DisputesTab />}
                    {activeTab === 'logs' && <AuditLogsTab />}
                    {activeTab === 'broadcast' && <BroadcastTab />}
                    {activeTab === 'vip_settings' && <VIPSettingsTab />}
                    {activeTab === 'staff' && <StaffManagementTab />}
                    {activeTab === 'revenue' && <RevenueTab />}
                </div>
            </main>
        </div >
    );
};

export default AdminDashboard;
