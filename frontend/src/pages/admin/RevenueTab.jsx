import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import adminService from '../../api/adminService';

const RevenueTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        try {
            setLoading(true);
            const data = await adminService.getRevenueStats();
            setStats(data.data || data);
        } catch (err) {
            showToast('Ошибка загрузки статистики', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Загрузка...</div>;
    }

    const cards = [
        {
            title: 'Общая выручка',
            value: `${stats?.total_revenue || 0} TMT`,
            icon: DollarSign,
            color: 'bg-green-500',
            textColor: 'text-green-600'
        },
        {
            title: 'Доход за сегодня',
            value: `${stats?.today_revenue || 0} TMT`,
            icon: Calendar,
            color: 'bg-blue-500',
            textColor: 'text-blue-600'
        },
        {
            title: 'Доход за месяц',
            value: `${stats?.month_revenue || 0} TMT`,
            icon: TrendingUp,
            color: 'bg-purple-500',
            textColor: 'text-purple-600'
        },
        {
            title: 'Баланс системы',
            value: `${stats?.system_balance || 0} TMT`,
            icon: Wallet,
            color: 'bg-orange-500',
            textColor: 'text-orange-600'
        }
    ];

    return (
        <div data-testid="revenue-tab" className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    <DollarSign className="inline mr-2" size={28} />
                    Доходы платформы
                </h2>
                <p className="text-slate-600">
                    Всего транзакций комиссий: {stats?.total_transactions || 0}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${card.color} bg-opacity-10 flex items-center justify-center`}>
                                    <Icon className={card.textColor} size={24} />
                                </div>
                            </div>
                            <h3 className="text-slate-600 text-sm font-medium mb-2">{card.title}</h3>
                            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Информация</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600">Общая выручка:</span>
                        <span className="font-medium text-slate-800">{stats?.total_revenue} TMT</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600">Выручка за сегодня:</span>
                        <span className="font-medium text-slate-800">{stats?.today_revenue} TMT</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600">Выручка за месяц:</span>
                        <span className="font-medium text-slate-800">{stats?.month_revenue} TMT</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Текущий баланс:</span>
                        <span className="font-semibold text-green-600">{stats?.system_balance} TMT</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueTab;
