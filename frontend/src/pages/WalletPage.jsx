import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Добавили импорт
import { useWallet } from '../hooks/useWallet';
import DepositModal from '../components/wallet/DepositModal';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Loader2, RefreshCw } from 'lucide-react';

const WalletPage = () => {
    const { t } = useTranslation(); // Инициализация перевода
    const { balance, history, loading, error, refresh, deposit } = useWallet();
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    if (loading && !history.length) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Balance Card */}
                <div className="w-full md:w-1/3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet size={120} />
                        </div>

                        <div className="relative z-10">
                            <p className="text-blue-100 font-medium mb-1">{t('billing.available_balance')}</p>
                            <h1 data-testid="wallet-balance" className="text-5xl font-black mb-6">
                                {balance.toFixed(2)} <span className="text-2xl font-normal">{t('billing.currency')}</span>
                            </h1>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsDepositOpen(true)}
                                    data-testid="deposit-button"
                                    className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                                >
                                    {t('billing.deposit')}
                                </button>
                                <button className="w-full py-3 bg-blue-500/30 text-white font-medium rounded-xl hover:bg-blue-500/40 transition-colors">
                                    {t('billing.withdraw')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex gap-3 text-sm text-yellow-700">
                        <Wallet className="flex-shrink-0" size={20} />
                        <p>{t('billing.usage_hint')}</p>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="w-full md:w-2/3">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-gray-900">
                                <History className="text-gray-400" size={20} />
                                <span>{t('billing.history_title')}</span>
                            </div>
                            <button
                                onClick={refresh}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div data-testid="transaction-history" className="divide-y divide-gray-50">
                            {history.length > 0 ? (
                                history.map((tx) => (
                                    <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_REFUND'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-red-50 text-red-600'
                                                }`}>
                                                {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {tx.type === 'DEPOSIT' ? t('billing.tx_deposit') :
                                                        tx.type === 'WITHDRAWAL' ? t('billing.tx_withdrawal') :
                                                            tx.type === 'ESCROW_LOCK' ? t('billing.tx_escrow_lock') :
                                                                tx.type === 'ESCROW_RELEASE' ? t('billing.tx_escrow_release') : tx.type}
                                                </p>
                                                <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right font-black text-lg">
                                            <span className={tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_REFUND' ? 'text-green-600' : 'text-red-600'}>
                                                {tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_REFUND' ? '+' : '-'} {parseFloat(tx.amount).toFixed(2)}
                                            </span>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{t('billing.currency')}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-gray-400">
                                    <History size={48} className="mx-auto mb-4 opacity-10" />
                                    <p>{t('billing.history_empty')}</p>
                                </div>
                            )}
                        </div>

                        {history.length > 0 && (
                            <div className="p-6 bg-gray-50 text-center">
                                <button className="text-sm font-bold text-blue-600 hover:text-blue-700">
                                    {t('billing.show_all')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DepositModal
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                onDeposit={deposit}
            />
        </div>
    );
};

export default WalletPage;