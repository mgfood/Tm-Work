import apiClient from './client';

const adminService = {
    // Stats
    getStats: async () => {
        // This could be a new endpoint, or we can mock it from existing data for now
        // For a real app, we'd have /api/v1/admin/stats/
        const response = await apiClient.get('/admin/stats/').catch(() => ({
            data: {
                total_users: 156,
                active_jobs: 42,
                total_escrow: '12,450 TMT',
                disputes: 3
            }
        }));
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
