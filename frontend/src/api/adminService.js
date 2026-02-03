import apiClient from './client';

const adminService = {
    // Stats
    getStats: async () => {
        const response = await apiClient.get('/users/stats/');
        return response.data;
    },

    // User Management
    getUsers: async (params = {}) => {
        // Standard Django 'users' list (might need permission check on backend)
        const response = await apiClient.get('/users/', { params }).catch(() => ({
            data: { results: [] }
        }));
        return response.data;
    },

    blockUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/block/`);
        return response.data;
    },

    unblockUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/unblock/`);
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
    }
};

export default adminService;
