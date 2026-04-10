import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, DollarSign, CreditCard, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import walletService from '../../api/walletService';

const WithdrawModal = ({ isOpen, onClose, currentBalance, onSuccess }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [bankDetails, setBankDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 50) {
            setError('Минимальная сумма вывода — 50 TMT');
            return;
        }

        if (numAmount > currentBalance) {
            setError('Недостаточно средств на балансе');
            return;
        }

        if (!bankDetails.trim()) {
            setError('Пожалуйста, введите реквизиты карты (Altyn Asyr)');
            return;
        }

        setLoading(true);
        try {
            await walletService.withdraw(numAmount, bankDetails);
            setSuccess(true);
            if (onSuccess) onSuccess();
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setAmount('');
                setBankDetails('');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail?.[0] || err.response?.data?.detail || 'Ошибка при создании запроса на вывод');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Вывод средств</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Запрос на выплату</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {success ? (
                        <div className="py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
                                <CheckCircle2 size={40} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-2">Запрос отправлен!</h4>
                            <p className="text-slate-500 font-medium px-4">
                                Ваша заявка принята в обработку. Обычно это занимает от 1 до 24 часов.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Balance Info */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-500">Доступный баланс:</span>
                                <span className="text-lg font-black text-slate-900">{currentBalance.toFixed(2)} TMT</span>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Сумма к выводу (TMT)
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-black text-2xl text-slate-900"
                                        min="50"
                                        step="0.01"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg group-focus-within:text-primary-500 transition-colors">TMT</div>
                                </div>
                            </div>

                            {/* Bank Details Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Реквизиты карты Altyn Asyr
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-5 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                                        <CreditCard size={24} />
                                    </div>
                                    <textarea 
                                        placeholder="9311 0000 0000 0000"
                                        value={bankDetails}
                                        onChange={(e) => setBankDetails(e.target.value)}
                                        rows="2"
                                        className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-slate-900 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in shake-1 duration-500">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <p className="text-sm font-bold">{error}</p>
                                </div>
                            )}

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <div className="flex gap-3 text-blue-800">
                                    <div className="shrink-0 mt-0.5"><AlertCircle size={16} /></div>
                                    <div className="text-[11px] font-bold leading-relaxed uppercase tracking-wider">
                                        Внимание: Вывод лимитирован до 10,000 TMT в неделю. Обработка занимает до 24 часов.
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group relative overflow-hidden bg-primary-600 text-white py-5 rounded-2xl font-black text-lg transition-all hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Обработка...
                                        </>
                                    ) : (
                                        <>
                                            Подтвердить вывод
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawModal;
