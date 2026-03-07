import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, DollarSign, TrendingUp, AlertTriangle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';

const OverviewTab = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const statsData = await adminService.getStats();
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
            setError(t('admin.load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertTriangle size={20} /> {error}
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('admin.stats.total_users'), value: stats?.summary?.total_users, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                    { label: t('admin.stats.active_jobs'), value: stats?.summary?.active_jobs, color: 'text-green-600', bg: 'bg-green-50', icon: Briefcase },
                    { label: t('admin.stats.in_escrow'), value: stats?.summary?.total_escrow, color: 'text-primary-600', bg: 'bg-primary-50', icon: DollarSign },
                    { label: t('admin.stats.completion_rate'), value: `${stats?.completion_rate}%`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: TrendingUp },
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
                    <h3 className="text-lg font-bold text-slate-900 mb-8">{t('admin.stats.registrations_title')}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
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
                    <h3 className="text-lg font-bold text-slate-900 mb-8">{t('admin.stats.volume_title')}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
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
    );
};

export default OverviewTab;
