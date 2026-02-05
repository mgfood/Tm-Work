import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const DepositModal = ({ isOpen, onClose, onDeposit }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const presets = [50, 100, 500, 1000];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        setError(null);

        const result = await onDeposit(parseFloat(amount));

        setLoading(false);
        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setAmount('');
                onClose();
            }, 2000);
        } else {
            setError(result.error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Пополнение баланса</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 size={64} className="text-green-500" />
                            <p className="text-lg font-medium text-gray-900">Баланс успешно пополнен!</p>
                            <p className="text-sm text-gray-500">(Тестовый режим)</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                {presets.map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setAmount(val.toString())}
                                        className={`py-3 px-4 rounded-xl border-2 transition-all ${amount === val.toString()
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {val} TMT
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Другая сумма"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    min="0.01"
                                    step="0.01"
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">TMT</span>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !amount}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Оплатить'}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                Это тестовая транзакция. Реальные средства не списываются.
                            </p>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default DepositModal;
