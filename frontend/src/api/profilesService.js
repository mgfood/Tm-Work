import apiClient from './client';

const profilesService = {
    getProfiles: async (params = {}) => {
        const response = await apiClient.get('/profiles/', { params });
        return response.data;
    },

    getProfileByUserId: async (userId) => {
        const response = await apiClient.get(`/profiles/${userId}/`);
        return response.data;
    },

    getMyProfile: async () => {
        const response = await apiClient.get('/profiles/me/');
        return response.data;
    },

    updateMyProfile: async (profileData) => {
        // Note: If sending files (avatar), use FormData
        const response = await apiClient.patch('/profiles/me/', profileData);
        return response.data;
    },

    getSkills: async () => {
        const response = await apiClient.get('/profiles/skills/');
        return response.data;
    },

    getAllSkills: async () => {
        const response = await apiClient.get('/profiles/skills/');
        return response.data;
    },

    deleteAvatar: async () => {
        const response = await apiClient.post('/profiles/delete-avatar/');
        return response.data;
    },

    // --- Portfolio Methods ---
    getPortfolioItems: async (userId) => {
        const response = await apiClient.get('/profiles/portfolio/', { params: { user_id: userId } });
        return response.data;
    },

    addPortfolioItem: async (formData) => {
        const response = await apiClient.post('/profiles/portfolio/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updatePortfolioItem: async (itemId, formData) => {
        const response = await apiClient.patch(`/profiles/portfolio/${itemId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deletePortfolioItem: async (itemId) => {
        const response = await apiClient.delete(`/profiles/portfolio/${itemId}/`);
        return response.data;
    },

    blockUser: async (userId) => {
        const response = await apiClient.post(`/profiles/${userId}/block/`);
        return response.data;
    },

    unblockUser: async (userId) => {
        const response = await apiClient.post(`/profiles/${userId}/unblock/`);
        return response.data;
    }
};

export default profilesService;
