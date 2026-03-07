import React, { useState, useEffect } from 'react';
import {
    Megaphone, Search, XCircle, ArrowUpRight, MoreVertical, Loader2
} from 'lucide-react';
import adminService from '../../../api/adminService';
import apiClient from '../../../api/client';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';

const BroadcastTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [broadcastTarget, setBroadcastTarget] = useState('ALL');
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [emailSearch, setEmailSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data.results || data || []);
        } catch (err) {
            console.error('Failed to fetch users for broadcast:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        const msg = e.target.message.value;
        const targetType = broadcastTarget;
        if (!msg) return;
        if (targetType === 'EMAILS' && selectedEmails.length === 0) {
            showToast(t('admin.broadcast_mgmt.select_users_hint'), 'info');
            return;
        }

        try {
            setActionLoading(true);
            await apiClient.post('/chat/admin-broadcast/broadcast/', {
                message: msg,
                target_type: targetType,
                emails: targetType === 'EMAILS' ? selectedEmails : []
            });
            showToast(t('admin.broadcast_mgmt.success'), 'success');
            e.target.reset();
            setSelectedEmails([]);
            setEmailSearch('');
        } catch (err) {
            showToast(t('admin.broadcast_mgmt.error'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    return (
        <div data-testid="broadcast-tab" className="max-w-2xl mx-auto py-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="premium-card p-10 bg-slate-50 text-black relative overflow-hidden mb-8 border border-slate-200 shadow-sm">
                <Megaphone className="absolute -right-10 -bottom-10 w-64 h-64 text-slate-200/50 rotate-12" />
                <h3 className="text-2xl font-black mb-2 text-black">{t('admin.broadcast.title')}</h3>
                <p className="text-black font-medium opacity-70">{t('admin.broadcast.subtitle')}</p>
            </div>

            <div className="premium-card p-10">
                <form className="space-y-6" onSubmit={handleBroadcastSubmit}>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.broadcast_mgmt.target_label')}</label>
                        <div className="relative">
                            <select
                                name="target_type"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 font-bold transition-all appearance-none cursor-pointer text-slate-900"
                                value={broadcastTarget}
                                onChange={(e) => setBroadcastTarget(e.target.value)}
                            >
                                <option value="ALL">📢 {t('admin.broadcast_mgmt.target_all')}</option>
                                <option value="CLIENTS">💼 {t('admin.broadcast_mgmt.target_clients')}</option>
                                <option value="FREELANCERS">🚀 {t('admin.broadcast_mgmt.target_freelancers')}</option>
                                <option value="VIP">👑 {t('admin.broadcast_mgmt.target_vip')}</option>
                                <option value="EMAILS">📧 {t('admin.broadcast_mgmt.target_emails')}</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <MoreVertical size={18} />
                            </div>
                        </div>
                    </div>

                    {broadcastTarget === 'EMAILS' && (
                        <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.broadcast_mgmt.select_label')}</label>

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
                                    placeholder={t('admin.broadcast_mgmt.search_placeholder')}
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
                                            <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase">{t('admin.broadcast_mgmt.user_not_found')}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('admin.broadcast_mgmt.message_label')}</label>
                        <textarea name="message" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 min-h-[150px] font-medium transition-all text-slate-900" placeholder={t('admin.broadcast_mgmt.message_placeholder')} required />
                    </div>
                    <button data-testid="send-broadcast-button" type="submit" disabled={actionLoading} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                        {actionLoading ? <Loader2 className="animate-spin" /> : <><Megaphone size={20} /> {t('admin.broadcast_mgmt.btn_start')}</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BroadcastTab;
