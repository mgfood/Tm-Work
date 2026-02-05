import axiosInstance from './client';

const notificationsService = {
    getNotifications: async (params = {}) => {
        const response = await axiosInstance.get('/notifications/', { params });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await axiosInstance.get('/notifications/unread-count/');
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await axiosInstance.patch(`/notifications/${id}/read/`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await axiosInstance.post('/notifications/mark-all-read/');
        return response.data;
    }
};

export default notificationsService;
