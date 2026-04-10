import React, { useState, useEffect } from 'react';
import { 
    DollarSign, Clock, CheckCircle2, XCircle, 
    MessageSquare, User, ArrowUpRight, ArrowDownLeft,
    Plus, Filter, MoreVertical, Send
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import adminService from '../../api/adminService';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
    const styles = {
        'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
        'APPROVED': 'bg-green-50 text-green-600 border-green-100',
        'REJECTED': 'bg-red-50 text-red-600 border-red-100'
    };
    
    const labels = {
        'PENDING': 'Ожидает',
        'APPROVED': 'Одобрено',
        'REJECTED': 'Отклонено'
    };

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || styles['PENDING']}`}>
            {labels[status] || status}
        </span>
    );
};

const BalanceRequestsTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    
    // Create Request State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({ target_email: '', amount: '', reason: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review State
    const [reviewModal, setReviewModal] = useState({ isOpen: false, requestId: null, action: '', comment: '' });

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await adminService.getBalanceRequests({ status: filterStatus });
            setRequests(data);
        } catch (err) {
            showToast('Ошибка загрузки запросов', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            // 1. Find user by email
            const users = await adminService.getUsers({ email: newRequest.target_email });
            const targetUser = users.results?.find(u => u.email.toLowerCase() === newRequest.target_email.toLowerCase());
            
            if (!targetUser) {
                showToast('Пользователь не найден', 'error');
                return;
            }

            // 2. Submit request
            await adminService.createBalanceRequest({
                target_user: targetUser.id,
                amount: parseFloat(newRequest.amount),
                reason: newRequest.reason
            });

            showToast('Запрос успешно отправлен на рассмотрение', 'success');
            setIsCreateOpen(false);
            setNewRequest({ target_email: '', amount: '', reason: '' });
            fetchRequests();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Ошибка создания запроса', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReview = async () => {
        try {
            await adminService.reviewBalanceRequest(
                reviewModal.requestId, 
                reviewModal.action, 
                reviewModal.comment
            );
            showToast(`Запрос ${reviewModal.action === 'APPROVE' ? 'одобрен' : 'отклонен'}`, 'success');
            setReviewModal({ isOpen: false, requestId: null, action: '', comment: '' });
            fetchRequests();
        } catch (err) {
            showToast('Ошибка обработки запроса', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Запросы на баланс</h2>
                    <p className="text-slate-500">Управление корректировками кошельков пользователей</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                        >
                            <option value="">Все статусы</option>
                            <option value="PENDING">Ожидают</option>
                            <option value="APPROVED">Одобрены</option>
                            <option value="REJECTED">Отклонены</option>
                        </select>
                    </div>
                    
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary-100"
                    >
                        <Plus size={20} />
                        Новый запрос
                    </button>
                </div>
            </div>

            {/* Main List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Загрузка данных...</div>
                ) : requests.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                        <DollarSign size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-500">Запросы не найдены</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {req.amount > 0 ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-lg">
                                            {req.amount > 0 ? '+' : ''}{req.amount} TMM
                                        </span>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <span className="flex items-center gap-1"><User size={14} /> Кому: {req.target_user_email}</span>
                                        <span className="flex items-center gap-1"><Send size={14} /> От: {req.requester_email}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(req.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="flex-grow md:max-w-xs">
                                    <div className="text-sm text-slate-600 italic flex items-start gap-2">
                                        <MessageSquare size={16} className="shrink-0 mt-0.5 text-slate-400" />
                                        "{req.reason}"
                                    </div>
                                    {req.admin_comment && (
                                        <div className="text-xs text-primary-600 mt-1 font-medium italic">
                                            Ответ: {req.admin_comment}
                                        </div>
                                    )}
                                </div>

                                {req.status === 'PENDING' && currentUser?.is_superuser && (
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => setReviewModal({ isOpen: true, requestId: req.id, action: 'APPROVE', comment: '' })}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Одобрить
                                        </button>
                                        <button 
                                            onClick={() => setReviewModal({ isOpen: true, requestId: req.id, action: 'REJECT', comment: '' })}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-sm font-bold transition-all"
                                        >
                                            Отклонить
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Request Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">Создать запрос на баланс</h3>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email пользователя</label>
                                <input 
                                    required
                                    type="email"
                                    value={newRequest.target_email}
                                    onChange={e => setNewRequest({...newRequest, target_email: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Сумма (TMM)</label>
                                <input 
                                    required
                                    type="number"
                                    step="0.01"
                                    value={newRequest.amount}
                                    onChange={e => setNewRequest({...newRequest, amount: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Напр. 500 или -200"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Положительное - начисление, отрицательное - списание</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Причина</label>
                                <textarea 
                                    required
                                    rows="3"
                                    value={newRequest.reason}
                                    onChange={e => setNewRequest({...newRequest, reason: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder="Опишите причину корректировки..."
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {reviewModal.action === 'APPROVE' ? 'Одобрить запрос' : 'Отклонить запрос'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Вы уверены, что хотите {reviewModal.action === 'APPROVE' ? 'подтвердить это начисление' : 'отклонить эту заявку'}?
                            </p>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Комментарий (опционально)</label>
                                <textarea 
                                    rows="2"
                                    value={reviewModal.comment}
                                    onChange={e => setReviewModal({...reviewModal, comment: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder="Причина решения..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setReviewModal({ isOpen: false, requestId: null, action: '', comment: '' })}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={handleReview}
                                    className={`flex-1 px-4 py-2 text-white rounded-xl font-bold transition-all ${reviewModal.action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    Подтвердить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceRequestsTab;
