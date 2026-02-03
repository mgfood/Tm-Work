import apiClient from './client';

const authService = {
    register: async (userData) => {
        const response = await apiClient.post('/auth/register/', userData);
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
        }
        return response.data;
    },

    login: async (credentials) => {
        const response = await apiClient.post('/auth/login/', credentials);
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
        }
        return response.data;
    },

    logout: async () => {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
            try {
                await apiClient.post('/auth/logout/', { refresh });
            } catch (e) {
                console.error('Logout error', e);
            }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    acceptProposal: async (id) => {
        const response = await apiClient.post(`/proposals/${id}/accept/`);
        return response.data;
    },

    rejectProposal: async (id) => {
        const response = await apiClient.post(`/proposals/${id}/reject/`);
        return response.data;
    },

    cancelProposal: async (id) => {
        const response = await apiClient.post(`/proposals/${id}/cancel/`);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await apiClient.get('/auth/me/');
        return response.data;
    },

    toggleRole: async (role) => {
        const response = await apiClient.post('/users/toggle-role/', { role });
        return response.data;
    },
};

export default authService;
