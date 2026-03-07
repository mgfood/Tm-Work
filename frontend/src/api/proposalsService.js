import apiClient from './client';

const proposalsService = {
    getProposals: async (params = {}) => {
        const response = await apiClient.get('/proposals/', { params });
        return response.data;
    },

    getSentProposals: async () => {
        const response = await apiClient.get('/proposals/', { params: { type: 'sent' } });
        return response.data;
    },

    getReceivedProposals: async () => {
        const response = await apiClient.get('/proposals/', { params: { type: 'received' } });
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
    },

    rejectProposal: async (id) => {
        const response = await apiClient.post(`/proposals/${id}/reject/`);
        return response.data;
    },

    cancelProposal: async (id) => {
        const response = await apiClient.post(`/proposals/${id}/cancel/`);
        return response.data;
    }
};

export default proposalsService;
