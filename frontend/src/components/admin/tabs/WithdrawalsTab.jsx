import React, { useState, useEffect } from 'react';
import { 
    Banknote, Clock, CheckCircle2, XCircle, 
    MessageSquare, User, ExternalLink, Filter,
    Search, AlertCircle, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import adminService from '../../../api/adminService';
import { useAuth } from '../../../context/AuthContext';

const StatusBadge = ({ status }) => {
    const styles = {
        'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
        'COMPLETED': 'bg-green-50 text-green-600 border-green-100',
        'REJECTED': 'bg-red-50 text-red-600 border-red-100'
    };
    
    const labels = {
        'PENDING': 'На рассмотрении',
        'COMPLETED': 'Выполнено',
        'REJECTED': 'Отклонено'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles['PENDING']}`}>
            {labels[status] || status}
        </span>
    );
};

const WithdrawalsTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Review Modal State
    const [reviewModal, setReviewModal] = useState({ 
        isOpen: false, 
        request: null, 
        action: '', 
        comment: '',
        isSubmitting: false
    });

    useEffect(() => {
        fetchWithdrawals();
    }, [filterStatus]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const data = await adminService.getWithdrawals({ status: filterStatus });
            setWithdrawals(data);
        } catch (err) {
            showToast('Ошибка загрузки заявок на вывод', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async () => {
        if (!reviewModal.request) return;
        
        try {
            setReviewModal(prev => ({ ...prev, isSubmitting: true }));
            await adminService.reviewWithdrawal(
                reviewModal.request.id, 
                reviewModal.action, 
                reviewModal.comment
            );
            
            showToast(
                reviewModal.action === 'APPROVE' 
                    ? 'Заявка одобрена, средства списаны' 
                    : 'Заявка отклонена', 
                'success'
            );
            
            setReviewModal({ isOpen: false, request: null, action: '', comment: '', isSubmitting: false });
            fetchWithdrawals();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Ошибка при обработке заявки', 'error');
            setReviewModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => 
        w.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Top Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                            <Banknote size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Модерация выводов</h2>
                    </div>
                    <p className="text-slate-500 font-medium">Обработка финансовых запросов талантов</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Поиск по Email или имени..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-500 transition-all min-w-[300px]"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-11 pr-8 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-500 transition-all cursor-pointer appearance-none"
                        >
                            <option value="">Все статусы</option>
                            <option value="PENDING">На рассмотрении</option>
                            <option value="COMPLETED">Выполнено</option>
                            <option value="REJECTED">Отклонено</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100">
                    <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
                    <p className="text-slate-400 font-bold">Загрузка финансовых данных...</p>
                </div>
            ) : filteredWithdrawals.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Banknote size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Заявок нет</h3>
                    <p className="text-slate-500 max-w-xs mx-auto font-medium">По заданным фильтрам не найдено ни одного запроса на вывод средств.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredWithdrawals.map(req => (
                        <div 
                            key={req.id} 
                            className="group bg-white rounded-[28px] border border-slate-100 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary-100 transition-all duration-300"
                        >
                            {/* User & Request Info */}
                            <div className="flex items-start gap-5 flex-1">
                                <div className={`shrink-0 w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                                    req.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 
                                    req.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 
                                    'bg-amber-50 text-amber-600 shadow-inner'
                                }`}>
                                    <Banknote size={32} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-slate-900 tabular-nums">
                                            {req.amount} TMT
                                        </span>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm">
                                            <User size={14} className="text-slate-400" />
                                            {req.full_name || 'Без имени'} 
                                            <span className="text-slate-300 font-normal ml-1">({req.user_email})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                            <Clock size={14} />
                                            {new Date(req.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                            <ExternalLink size={12} /> Реквизиты для оплаты
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 break-all leading-relaxed whitespace-pre-wrap">
                                            {req.bank_details}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions / Admin Comment */}
                            <div className="xl:w-[350px] shrink-0 flex flex-col gap-4">
                                {req.admin_comment && (
                                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-3 border ${
                                        req.status === 'COMPLETED' ? 'bg-green-50/50 text-green-700 border-green-100' : 'bg-red-50/50 text-red-700 border-red-100'
                                    }`}>
                                        <MessageSquare size={16} className="shrink-0 mt-0.5 opacity-60" />
                                        <div className="italic leading-relaxed">Админ: "{req.admin_comment}"</div>
                                    </div>
                                )}

                                {req.status === 'PENDING' && (
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setReviewModal({ isOpen: true, request: req, action: 'APPROVE', comment: '', isSubmitting: false })}
                                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                                        >
                                            <CheckCircle2 size={18} />
                                            Проведено
                                        </button>
                                        <button 
                                            onClick={() => setReviewModal({ isOpen: true, request: req, action: 'REJECT', comment: '', isSubmitting: false })}
                                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-2xl font-black text-sm active:scale-95 transition-all"
                                        >
                                            <XCircle size={18} />
                                            Отклонить
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {reviewModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 border-b border-slate-50 flex items-center justify-between ${
                            reviewModal.action === 'APPROVE' ? 'bg-green-50/30' : 'bg-red-50/30'
                        }`}>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">
                                    {reviewModal.action === 'APPROVE' ? 'Одобрить выплату' : 'Отклонение выплаты'}
                                </h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">Запрос #{reviewModal.request?.id}</p>
                            </div>
                            <div className={`p-4 rounded-3xl ${
                                reviewModal.action === 'APPROVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {reviewModal.action === 'APPROVE' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">К выплате</span>
                                    <span className="text-xl font-black text-primary-600 tabular-nums">{reviewModal.request?.amount} TMT</span>
                                </div>
                                <div className="text-sm text-slate-600 font-bold flex flex-col gap-1">
                                    <span className="text-slate-900">{reviewModal.request?.full_name}</span>
                                    <span className="text-slate-400 font-medium">{reviewModal.request?.user_email}</span>
                                </div>
                            </div>

                            {reviewModal.action === 'APPROVE' && (
                                <div className="flex items-start gap-3 p-4 bg-primary-50 text-primary-700 rounded-2xl text-xs font-bold border border-primary-100">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>Нажимая «Подтвердить», вы подтверждаете, что средства были физически отправлены пользователю по указанным реквизитам. Баланс в системе будет списан автоматически.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Комментарий для пользователя</label>
                                <textarea 
                                    rows="3"
                                    value={reviewModal.comment}
                                    onChange={e => setReviewModal({...reviewModal, comment: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all resize-none font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder={reviewModal.action === 'APPROVE' ? 'Напр: Выплата проведена успешно через Халкбанк' : 'Укажите причину отказа...'}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setReviewModal({ isOpen: false, request: null, action: '', comment: '', isSubmitting: false })}
                                    className="flex-1 px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={handleReview}
                                    disabled={reviewModal.isSubmitting}
                                    className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                                        reviewModal.action === 'APPROVE' 
                                            ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
                                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                                    }`}
                                >
                                    {reviewModal.isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Подтвердить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalsTab;
