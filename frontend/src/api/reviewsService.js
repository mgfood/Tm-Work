import axiosInstance from './client';

const reviewsService = {
    getReviews: async (receiverId) => {
        const response = await axiosInstance.get(`/reviews/?receiver_id=${receiverId}`);
        return response.data;
    },

    createReview: async (reviewData) => {
        const response = await axiosInstance.post('/reviews/', reviewData);
        return response.data;
    }
};

export default reviewsService;
