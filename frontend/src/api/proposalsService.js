import apiClient from './client';

const proposalsService = {
    getProposals: async (params = {}) => {
        const response = await apiClient.get('/proposals/', { params });
        return response.data;
    },

    getProposalById: async (id) => {
        const response = await apiClient.get(`/proposals/${id}/`);
        return response.data;
    },

    createProposal: async (proposalData) => {
        const response = await apiClient.post('/proposals/', proposalData);
        return response.data;
    },

    acceptProposal: async (id) => {
        const response = await apiClient.post(`/proposals/${id}/accept/`);
        return response.data;
    }
};

export default proposalsService;
