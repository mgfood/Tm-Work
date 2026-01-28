import apiClient from './client';

const jobsService = {
    getJobs: async (params = {}) => {
        const response = await apiClient.get('/jobs/', { params });
        return response.data;
    },

    getJobById: async (id) => {
        const response = await apiClient.get(`/jobs/${id}/`);
        return response.data;
    },

    createJob: async (jobData) => {
        const response = await apiClient.post('/jobs/', jobData);
        return response.data;
    },

    updateJob: async (id, jobData) => {
        const response = await apiClient.patch(`/jobs/${id}/`, jobData);
        return response.data;
    },

    deleteJob: async (id) => {
        await apiClient.delete(`/jobs/${id}/`);
    },

    publishJob: async (id) => {
        const response = await apiClient.post(`/jobs/${id}/publish/`);
        return response.data;
    },

    cancelJob: async (id) => {
        const response = await apiClient.post(`/jobs/${id}/cancel/`);
        return response.data;
    }
};

export default jobsService;
