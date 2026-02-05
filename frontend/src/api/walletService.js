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
    }
};

export default walletService;
