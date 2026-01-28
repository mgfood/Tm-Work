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
    }
};

export default profilesService;
