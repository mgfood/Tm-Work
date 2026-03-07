import { useState, useEffect, useCallback } from 'react';
import walletService from '../api/walletService';

export const useWallet = () => {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWalletData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await walletService.getWalletSummary();
            setBalance(data.balance);
            setHistory(data.recent_transactions);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch wallet data');
        } finally {
            setLoading(false);
        }
    }, []);

    const deposit = async (amount) => {
        try {
            await walletService.depositTest(amount);
            await fetchWalletData();
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.detail || err.response?.data?.amount?.[0] || 'Deposit failed'
            };
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    return {
        balance: parseFloat(balance),
        history,
        loading,
        error,
        refresh: fetchWalletData,
        deposit
    };
};
