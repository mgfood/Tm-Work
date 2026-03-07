import React, { useState, useEffect } from 'react';
import {
    Loader2
} from 'lucide-react';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../utils/formatters';

const TransactionsTab = () => {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await adminService.getTransactions();
            const txArray = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setTransactions(txArray);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    return (
        <div data-testid="transactions-tab" className="premium-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table data-testid="transactions-table" className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">{t('admin.transactions_table.amount')}</th>
                            <th className="px-6 py-4">{t('admin.transactions_table.type')}</th>
                            <th className="px-6 py-4">{t('admin.transactions_table.user')}</th>
                            <th className="px-6 py-4">{t('admin.transactions_table.description')}</th>
                            <th className="px-6 py-4">{t('admin.transactions_table.date')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactions.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">{t('admin.transactions_table.not_found')}</td></tr>
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
                                <td className="px-6 py-4 text-xs text-slate-400">{formatDate(tx.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionsTab;
