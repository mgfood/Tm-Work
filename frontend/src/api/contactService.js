import axiosInstance from './client';

const contactService = {
    sendMessage: async (contactData) => {
        // Данный эндпоинт открыт (AllowAny)
        const response = await axiosInstance.post('/administration/contact/', contactData);
        return response.data;
    }
};

export default contactService;
