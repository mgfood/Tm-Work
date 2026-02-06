import apiClient from './client';

const adminService = {
    // Stats
    getStats: async () => {
        const response = await apiClient.get('/administration/stats/');
        return response.data;
    },

    getLogs: async () => {
        const response = await apiClient.get('/administration/logs/');
        return response.data;
    },

    // User Management
    getUsers: async (params = {}) => {
        const response = await apiClient.get('/users/', { params }).catch(() => ({
            data: { results: [] }
        }));
        return response.data;
    },

    getUserDetails: async (userId) => {
        const response = await apiClient.get(`/users/${userId}/details/`);
        return response.data;
    },

    adjustBalance: async (userId, data) => {
        const response = await apiClient.post(`/users/${userId}/adjust-balance/`, data);
        return response.data;
    },

    blockUser: async (userId, reason = '') => {
        const response = await apiClient.post(`/users/${userId}/block/`, { reason });
        return response.data;
    },

    unblockUser: async (userId, reason = '') => {
        const response = await apiClient.post(`/users/${userId}/unblock/`, { reason });
        return response.data;
    },

    toggleVerifyUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/toggle-verify/`);
        return response.data;
    },

    toggleVipUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/toggle-vip/`);
        return response.data;
    },

    tempBlockUser: async (userId, data) => {
        const response = await apiClient.post(`/users/${userId}/temp-block/`, data);
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await apiClient.delete(`/users/${userId}/`);
        return response.data;
    },

    resetPassword: async (userId, password) => {
        const response = await apiClient.post(`/users/${userId}/set-password/`, { password });
        return response.data;
    },

    // Categories
    getCategories: async () => {
        const response = await apiClient.get('/jobs/categories/');
        return response.data;
    },
    createCategory: async (data) => {
        const response = await apiClient.post('/jobs/categories/', data);
        return response.data;
    },
    deleteCategory: async (id) => {
        await apiClient.delete(`/jobs/categories/${id}/`);
    },

    // Skills
    getSkills: async () => {
        const response = await apiClient.get('/profiles/skills/');
        return response.data;
    },
    createSkill: async (data) => {
        const response = await apiClient.post('/profiles/skills/', data);
        return response.data;
    },
    deleteSkill: async (id) => {
        await apiClient.delete(`/profiles/skills/${id}/`);
    },

    // Transactions
    getTransactions: async () => {
        const response = await apiClient.get('/transactions/');
        return response.data;
    },

    // Jobs moderation
    getAllJobs: async (params = {}) => {
        const response = await apiClient.get('/jobs/', { params });
        return response.data;
    },

    // Finance/Escrow audit
    getAllEscrows: async () => {
        const response = await apiClient.get('/escrow/');
        return response.data;
    },

    forceReleaseEscrow: async (id, reason = '') => {
        const response = await apiClient.post(`/escrow/${id}/release/`, { reason });
        return response.data;
    },

    forceRefundEscrow: async (id, reason = '') => {
        const response = await apiClient.post(`/escrow/${id}/refund/`, { reason });
        return response.data;
    }
};

export default adminService;
