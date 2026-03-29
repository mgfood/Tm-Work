import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Search, Filter, MoreVertical, CheckCircle,
    XCircle, Award, Edit, Trash, History, Shield,
    Lock, Unlock, DollarSign, X, CheckCircle2, ChevronRight,
    Loader2, AlertTriangle
} from 'lucide-react';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { formatDate } from '../../../utils/formatters';
import UserEditModal from '../UserEditModal';

const UsersTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({ amount: '', reason: '' });

    // Temp Block / Password Reset Modals
    const [isTempBlockModalOpen, setIsTempBlockModalOpen] = useState(false);
    const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState('');
    const [tempBlockData, setTempBlockData] = useState({ hours: '24', reason: '' });
    const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
    
    // Status filter: 'active' or 'deleted'
    const [statusFilter, setStatusFilter] = useState('active');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers({ status: statusFilter });
            const usersArray = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setUsers(usersArray);
        } catch (err) {
            setError(t('admin.load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [statusFilter]);

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(null);
            }
        };

        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenu]);

    const handleUserAction = async (userId, actionType, reason = '') => {
        try {
            setActionLoading(true);
            if (actionType === 'block') {
                await adminService.blockUser(userId, reason);
                // Optimistic update
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: false } : u));
            } else if (actionType === 'unblock') {
                await adminService.unblockUser(userId, reason);
                // Optimistic update
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: true, blocked_until: null } : u));
            } else if (actionType === 'toggle_verify') {
                await adminService.toggleVerifyUser(userId);
            } else if (actionType === 'toggle_vip') {
                await adminService.toggleVipUser(userId);
            } else if (actionType === 'delete') {
                const isConfirmed = await confirm({
                    title: t('common.confirm_action'),
                    message: t('admin.actions.confirm_delete_user_full'),
                    variant: 'danger'
                });
                if (isConfirmed) {
                    await adminService.deleteUser(userId);
                    setUsers(prev => prev.filter(u => u.id !== userId));
                    setIsUserModalOpen(false);
                }
            } else if (actionType === 'restore') {
                const isConfirmed = await confirm({
                    title: t('common.confirm_action'),
                    message: 'Вы уверены, что хотите восстановить удаленный аккаунт пользователя?',
                    variant: 'info'
                });
                if (isConfirmed) {
                    await adminService.restoreUser(userId);
                    setUsers(prev => prev.filter(u => u.id !== userId));
                    setIsUserModalOpen(false);
                }
            }
            // Fetch updated data in background to ensure sync
            fetchUsers();
            
            setOpenMenu(null);
            if (selectedUser?.id === userId && actionType !== 'delete') {
                handleShowUserDetails(userId);
            }
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_action'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleImpersonate = async (userId, userFirst, userLast) => {
        try {
            const isConfirmed = await confirm({
                title: 'Режим Наблюдения',
                message: `Вы собираетесь войти в аккаунт пользователя. Ваша сессия администратора будет сохранена, и вы сможете вернуться в любой момент. Продолжить?`,
                variant: 'info'
            });
            if (!isConfirmed) return;

            setActionLoading(true);
            const data = await adminService.impersonateUser(userId);
            
            // Store original admin session
            localStorage.setItem('original_admin_token', localStorage.getItem('access_token'));
            localStorage.setItem('original_admin_refresh', localStorage.getItem('refresh_token'));
            localStorage.setItem('impersonated_user_name', `${userFirst} ${userLast}`);

            // Apply new user session
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // Force reload to apply auth context
            window.location.href = '/';
        } catch (err) {
            showToast(err.response?.data?.error || 'Ошибка при входе в аккаунт', 'error');
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
            showToast(t('admin.actions.error_user_details'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdjustBalance = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await adminService.adjustBalance(selectedUser.id, adjustmentData);
            showToast(t('admin.actions.balance_adjusted', { amount: adjustmentData.amount }), 'success');
            setIsAdjustmentModalOpen(false);
            setAdjustmentData({ amount: '', reason: '' });
            await handleShowUserDetails(selectedUser.id);
        } catch (err) {
            showToast(t('admin.actions.error_balance_adjustment'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTempBlock = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            
            // Optimistic update for the table
            const blockedUntil = new Date();
            blockedUntil.setHours(blockedUntil.getHours() + parseInt(tempBlockData.hours));
            
            setUsers(prev => prev.map(u => 
                u.id === selectedUser.id 
                ? { ...u, blocked_until: blockedUntil.toISOString() } 
                : u
            ));

            await adminService.tempBlockUser(selectedUser.id, tempBlockData);
            setIsTempBlockModalOpen(false);
            setTempBlockData({ hours: '24', reason: '' });
            
            // Background sync
            fetchUsers();

            await handleShowUserDetails(selectedUser.id);
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_temp_block'), 'error');
            // Revert on error
            fetchUsers();
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
            showToast(t('admin.actions.password_changed'), 'success');
        } catch (err) {
            showToast(err.response?.data?.error || t('admin.actions.error_reset_password'), 'error');
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
        <div data-testid="users-tab" className="space-y-6">
            
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-xl w-max">
                <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statusFilter === 'active' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Активные
                </button>
                <button
                    onClick={() => setStatusFilter('deleted')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statusFilter === 'deleted' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Ожидают очистки
                </button>
                <button
                    onClick={() => setStatusFilter('anonymized')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statusFilter === 'anonymized' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Анонимизированные
                </button>
            </div>

            <div className="premium-card overflow-visible animate-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
                <div className="overflow-visible w-full pb-32">
                    <table data-testid="users-table" className="w-full text-left border-collapse">                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">{t('admin.user_table.user')}</th>
                                <th className="px-6 py-4">{t('admin.user_table.reg_date')}</th>
                                <th className="px-6 py-4">{t('admin.user_table.status')}</th>
                                <th className="px-6 py-4 text-center">{t('admin.user_table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">{t('admin.user_table.not_found')}</td></tr>
                            ) : users.map(u => (
                                <tr
                                    key={u.id}
                                    data-testid={`user-row-${u.id}`}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    onClick={() => handleShowUserDetails(u.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                                {u.first_name?.[0] || u.email[0]}
                                            </div>
                                            <div>
                                                <div data-testid="user-email" className="font-bold text-slate-900 flex items-center gap-2">
                                                    {u.email}
                                                    {u.is_verified && <CheckCircle size={14} className="text-blue-500" />}
                                                    {u.is_vip && <Award size={14} className="text-amber-500" />}
                                                </div>
                                                <div className="text-xs text-slate-400">{t('admin.user_table.id')}: {u.id} | {u.first_name} {u.last_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{formatDate(u.date_joined)}</td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            if (u.is_anonymized) {
                                                return (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                                        СТЕРТ
                                                    </span>
                                                );
                                            }
                                            if (u.is_deleted) {
                                                return (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                                                        В КОРЗИНЕ
                                                    </span>
                                                );
                                            }
                                            const isBanned = !u.is_active || (u.blocked_until && new Date(u.blocked_until) > new Date());
                                            return (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${!isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {!isBanned ? t('admin.user_table.active') : t('admin.user_table.banned')}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-center relative overflow-visible">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setOpenMenu(openMenu === u.id ? null : u.id); 
                                            }} 
                                            className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {openMenu === u.id && (() => {
                                            if (u.is_anonymized) return null; // No actions for fully scrubbed users
                                            
                                            if (u.is_deleted) {
                                                return (
                                                    <div 
                                                        ref={menuRef}
                                                        className="absolute right-6 top-10 w-48 bg-white border rounded-2xl shadow-2xl z-50 p-2 text-left animate-in fade-in zoom-in-95"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, 'restore'); }}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-green-600 hover:bg-green-50 flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={14} /> Восстановить профиль
                                                        </button>
                                                        <hr className="my-2 border-slate-100" />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleImpersonate(u.id, u.first_name, u.last_name); }}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                        >
                                                            <Users size={14} /> 🕵️‍♂️ Войти под юзером
                                                        </button>
                                                        <hr className="my-2 border-slate-100" />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, 'delete'); }}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash size={14} /> Удалить навсегда
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            const isBanned = !u.is_active || (u.blocked_until && new Date(u.blocked_until) > new Date());
                                            return (
                                                <div 
                                                    ref={menuRef}
                                                    className="absolute right-6 top-10 w-48 bg-white border rounded-2xl shadow-2xl z-50 p-2 text-left animate-in fade-in zoom-in-95"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        data-testid={`user-action-${!isBanned ? 'block' : 'unblock'}-${u.id}`}
                                                        onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, !isBanned ? 'block' : 'unblock'); }}
                                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold ${!isBanned ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                    >
                                                        {!isBanned ? t('admin.user_table.block') : t('admin.user_table.unblock')}
                                                    </button>
                                                    <hr className="my-2 border-slate-100" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(u); setIsUserEditModalOpen(true); setOpenMenu(null); }}
                                                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Edit size={14} /> {t('admin.user_table.edit_profile')}
                                                    </button>
                                                    <hr className="my-2 border-slate-100" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, 'toggle_verify'); }}
                                                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50"
                                                    >
                                                        {u.is_verified ? t('admin.user_table.unverify') : t('admin.user_table.verify')}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, 'toggle_vip'); }}
                                                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50"
                                                    >
                                                        {u.is_vip ? t('admin.user_table.remove_vip') : t('admin.user_table.give_vip')}
                                                    </button>
                                                    <hr className="my-2 border-slate-100" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleImpersonate(u.id, u.first_name, u.last_name); }}
                                                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                    >
                                                        <Users size={14} /> 🕵️‍♂️ Войти под юзером
                                                    </button>
                                                    <hr className="my-2 border-slate-100" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUserAction(u.id, 'delete'); }}
                                                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash size={14} /> {t('admin.user_table.delete')}
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Edit Modal */}
            <UserEditModal
                isOpen={isUserEditModalOpen}
                onClose={() => setIsUserEditModalOpen(false)}
                user={selectedUser}
                onSuccess={() => {
                    setIsUserEditModalOpen(false);
                    fetchUsers();
                }}
            />

            {/* Individual User Details Modal - God Mode */}
            {isUserModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-2xl overflow-y-auto">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="relative h-48 bg-slate-900">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-blue-600/20"></div>
                            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all z-10"><X size={24} /></button>
                        </div>

                        {/* Avatar - Moved outside to prevent overflow clipping */}
                        <div className="absolute top-32 left-12 w-32 h-32 rounded-[40px] bg-white p-2 shadow-2xl z-20">
                            <div className="w-full h-full rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400 overflow-hidden">
                                {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : selectedUser.first_name?.[0] || selectedUser.email[0]}
                            </div>
                        </div>

                        <div className="pt-20 px-12 pb-12">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-4">
                                        {selectedUser.first_name} {selectedUser.last_name}
                                        {selectedUser.is_vip && <span className="px-4 py-1.5 bg-amber-500 text-white text-xs rounded-full uppercase tracking-widest">{t('common.vip')}</span>}
                                    </h2>
                                    <p className="text-xl text-slate-400 font-medium">{selectedUser.email}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsAdjustmentModalOpen(true)} className="px-6 py-4 bg-primary-50 text-primary-600 font-black rounded-2xl hover:bg-primary-100 transition-all flex items-center gap-2 tracking-tight">
                                        <DollarSign size={20} /> {t('admin.user_details.adjust_balance')}
                                    </button>
                                    <button onClick={() => setIsPasswordResetModalOpen(true)} className="px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2">
                                        <Lock size={20} /> {t('admin.user_details.reset_password')}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                {/* Details Column */}
                                <div className="md:col-span-2 space-y-12">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="premium-card p-6 bg-slate-50 border-none">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('admin.user_details.balance')}</div>
                                            <div className="text-3xl font-black text-primary-600">{selectedUser.balance || '0.00'} <span className="text-sm">TMT</span></div>
                                        </div>
                                        <div className="premium-card p-6 bg-slate-50 border-none">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('admin.user_details.frozen')}</div>
                                            <div className="text-3xl font-black text-blue-600">{selectedUser.frozen_balance || '0.00'} <span className="text-sm">TMT</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 py-2 border-b-4 border-primary-500 inline-block">{t('admin.user_details.stats')}</h3>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="text-2xl font-black text-slate-900">{selectedUser.jobs_count || 0}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{t('admin.user_details.total_jobs')}</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-slate-900">{selectedUser.proposals_count || 0}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{t('admin.user_details.total_proposals')}</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-slate-900">{selectedUser.experience_years || 0}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{t('admin.user_details.experience')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Column */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">{t('admin.user_details.admin_actions')}</h3>
                                    
                                    {selectedUser.is_anonymized ? (
                                        <div className="p-5 bg-slate-50 text-slate-500 rounded-2xl font-bold flex items-center gap-3">
                                            <AlertTriangle size={20} /> Профиль безвозвратно стерт по политике анонимизации. Доступны только финансовые записи.
                                        </div>
                                    ) : selectedUser.is_deleted ? (
                                        <>
                                            <button onClick={() => handleUserAction(selectedUser.id, 'restore')} className="w-full p-5 bg-green-50 text-green-600 rounded-2xl flex items-center justify-between font-black hover:bg-green-100 transition-all">
                                                <span className="flex items-center gap-3"><CheckCircle size={20} /> Восстановить профиль</span>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button onClick={() => handleImpersonate(selectedUser.id, selectedUser.first_name, selectedUser.last_name)} className="w-full p-5 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-between font-black hover:bg-blue-100 transition-all">
                                                <span className="flex items-center gap-3"><Users size={20} /> 🕵️‍♂️ Войти под юзером</span>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button onClick={() => handleUserAction(selectedUser.id, 'delete')} className="w-full p-5 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-between font-black hover:bg-red-50 hover:text-red-500 transition-all">
                                                <span className="flex items-center gap-3"><Trash size={20} /> Удалить навсегда (Очистить)</span>
                                                <ChevronRight size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {(() => {
                                                const isBanned = !selectedUser.is_active || (selectedUser.blocked_until && new Date(selectedUser.blocked_until) > new Date());
                                                return (
                                                    <button onClick={() => handleUserAction(selectedUser.id, !isBanned ? 'block' : 'unblock')} className={`w-full p-5 rounded-2xl flex items-center justify-between font-black transition-all ${!isBanned ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                                        <span className="flex items-center gap-3">
                                                            {!isBanned ? <Shield size={20} /> : <Unlock size={20} />}
                                                            {!isBanned ? t('admin.user_details.block_account') : t('admin.user_table.unblock')}
                                                        </span>
                                                        <ChevronRight size={18} />
                                                    </button>
                                                );
                                            })()}
                                            <button onClick={() => setIsTempBlockModalOpen(true)} className="w-full p-5 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-between font-black hover:bg-orange-100 transition-all">
                                                <span className="flex items-center gap-3"><History size={20} /> {t('admin.user_details.temp_block')}</span>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button onClick={() => handleUserAction(selectedUser.id, 'toggle_verify')} className="w-full p-5 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-between font-black hover:bg-blue-100 transition-all">
                                                <span className="flex items-center gap-3"><CheckCircle2 size={20} /> {selectedUser.is_verified ? t('admin.user_details.remove_verify') : t('admin.user_details.verify_account')}</span>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button onClick={() => handleImpersonate(selectedUser.id, selectedUser.first_name, selectedUser.last_name)} className="w-full p-5 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-between font-black hover:bg-blue-100 transition-all mt-4">
                                                <span className="flex items-center gap-3"><Users size={20} /> 🕵️‍♂️ Войти под юзером (God Mode)</span>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button onClick={() => handleUserAction(selectedUser.id, 'delete')} className="w-full p-5 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-between font-black hover:bg-red-50 hover:text-red-500 transition-all mt-4">
                                                <span className="flex items-center gap-3"><Trash size={20} /> Удалить профиль (Скрыть)</span>
                                                <ChevronRight size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Balance Modal */}
            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><DollarSign className="text-primary-600" /> {t('admin.balance_modal.title')}</h3>
                        <form onSubmit={handleAdjustBalance} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">{t('admin.balance_modal.amount')}</label>
                                <input type="number" step="0.01" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary-100" placeholder="0.00" value={adjustmentData.amount} onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })} />
                                <p className="mt-2 text-[10px] text-slate-400 italic">{t('admin.balance_modal.hint')}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">{t('admin.balance_modal.reason')}</label>
                                <textarea required rows="3" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary-100 resize-none" placeholder={t('admin.balance_modal.reason_placeholder')} value={adjustmentData.reason} onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" disabled={actionLoading} className="flex-grow btn-primary py-4 rounded-2xl font-black">{t('common.save')}</button>
                                <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="px-8 bg-slate-100 text-slate-600 font-bold rounded-2xl">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Temp Block Modal */}
            {isTempBlockModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-orange-600"><History /> {t('admin.temp_block.title')}</h3>
                        <form onSubmit={handleTempBlock} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">{t('admin.temp_block.duration')}</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-100" value={tempBlockData.hours} onChange={(e) => setTempBlockData({ ...tempBlockData, hours: e.target.value })}>
                                    <option value="24">24 {t('common.hours')}</option>
                                    <option value="48">48 {t('common.hours')}</option>
                                    <option value="168">7 {t('common.days')}</option>
                                    <option value="720">30 {t('common.days')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">{t('admin.temp_block.reason')}</label>
                                <textarea required rows="3" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-100 resize-none" placeholder={t('admin.temp_block.reason_placeholder')} value={tempBlockData.reason} onChange={(e) => setTempBlockData({ ...tempBlockData, reason: e.target.value })} />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" disabled={actionLoading} className="flex-grow py-4 bg-orange-600 text-white rounded-2xl font-black hover:bg-orange-700">{t('admin.temp_block.btn')}</button>
                                <button type="button" onClick={() => setIsTempBlockModalOpen(false)} className="px-8 bg-slate-100 text-slate-600 font-bold rounded-2xl">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {isPasswordResetModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Lock /> {t('admin.password_reset.title')}</h3>
                        <form onSubmit={handleSetPassword} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">{t('admin.password_reset.new_password')}</label>
                                <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary-100" placeholder="••••••••" value={resetPasswordData} onChange={(e) => setResetPasswordData(e.target.value)} />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" disabled={actionLoading} className="flex-grow btn-primary py-4 rounded-2xl font-black">{t('admin.password_reset.btn')}</button>
                                <button type="button" onClick={() => setIsPasswordResetModalOpen(false)} className="px-8 bg-slate-100 text-slate-600 font-bold rounded-2xl">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersTab;
