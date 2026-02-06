import apiClient from './client';

const vipService = {
    getPlans: async () => {
        const response = await apiClient.get('/vip/plans/');
        return response.data;
    },

    buyPlan: async (planId) => {
        const response = await apiClient.post(`/vip/plans/${planId}/buy/`);
        return response.data;
    },

    getSettings: async () => {
        const response = await apiClient.get('/vip/settings/');
        return response.data;
    },

    updateSettings: async (data) => {
        const response = await apiClient.put('/vip/settings/1/', data);
        return response.data;
    }
};

export default vipService;
