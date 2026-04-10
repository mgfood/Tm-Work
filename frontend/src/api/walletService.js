import axiosInstance from './client';

const walletService = {
    getWalletSummary: async () => {
        const response = await axiosInstance.get('/transactions/summary/');
        return response.data;
    },

    depositTest: async (amount) => {
        const response = await axiosInstance.post('/transactions/deposit-test/', { amount });
        return response.data;
    },

    getTransactionHistory: async () => {
        const response = await axiosInstance.get('/transactions/');
        return response.data;
    },

    withdraw: async (amount, bankDetails) => {
        const response = await axiosInstance.post('/transactions/withdrawals/', {
            amount: parseFloat(amount),
            bank_details: bankDetails
        });
        return response.data;
    },

    getWithdrawals: async () => {
        const response = await axiosInstance.get('/transactions/withdrawals/');
        return response.data;
    }
};

export default walletService;
