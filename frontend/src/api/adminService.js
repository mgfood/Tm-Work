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

    // System Settings
    getSystemSettings: async () => {
        const response = await apiClient.get('/administration/settings/');
        return response.data;
    },

    updateSystemSettings: async (data) => {
        const response = await apiClient.put('/administration/settings/', data);
        return response.data;
    },

    // User Management
    getUsers: async (params = {}) => {
        const response = await apiClient.get('/users/', { params });
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

    restoreUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/restore/`);
        return response.data;
    },

    resetPassword: async (userId, password) => {
        const response = await apiClient.post(`/users/${userId}/set-password/`, { password });
        return response.data;
    },

    impersonateUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/impersonate/`);
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
    },

    // User editing
    updateUser: async (userId, data) => {
        const response = await apiClient.patch(`/users/${userId}/`, data);
        return response.data;
    },

    assignRole: async (userId, role) => {
        const response = await apiClient.post(`/users/${userId}/assign-role/`, { role });
        return response.data;
    },

    removeRole: async (userId, role) => {
        const response = await apiClient.post(`/users/${userId}/remove-role/`, { role });
        return response.data;
    },

    assignGroup: async (userId, group) => {
        const response = await apiClient.post(`/users/${userId}/assign-group/`, { group });
        return response.data;
    },

    removeGroup: async (userId, group) => {
        const response = await apiClient.post(`/users/${userId}/remove-group/`, { group });
        return response.data;
    },

    // Staff & Roles Management
    getStaff: async () => {
        const response = await apiClient.get('/administration/staff/');
        return response.data;
    },

    getAdminRoles: async () => {
        const response = await apiClient.get('/administration/roles/');
        return response.data;
    },

    assignAdminRole: async (userId, roleId) => {
        const response = await apiClient.post('/administration/assign-role/', {
            user_id: userId,
            admin_role_id: roleId
        });
        return response.data;
    },

    // Category editing
    updateCategory: async (id, data) => {
        const response = await apiClient.patch(`/jobs/categories/${id}/`, data);
        return response.data;
    },

    // Skill editing
    updateSkill: async (id, data) => {
        const response = await apiClient.patch(`/profiles/skills/${id}/`, data);
        return response.data;
    },

    // Job management
    updateJob: async (id, data) => {
        const response = await apiClient.patch(`/jobs/${id}/`, data);
        return response.data;
    },

    deleteJob: async (id) => {
        const response = await apiClient.delete(`/jobs/${id}/`);
        return response.data;
    },

    forceJobStatus: async (id, status, reason = '') => {
        const response = await apiClient.post(`/jobs/${id}/force-status/`, { status, reason });
        return response.data;
    },

    // Legacy/Extra endpoints that might be needed
    getRevenueStats: async () => {
        const response = await apiClient.get('/administration/revenue/');
        return response.data;
    }
};

export default adminService;
