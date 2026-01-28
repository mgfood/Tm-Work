import apiClient from '../client';

/**
 * Сервис для работы с заказами (Jobs).
 * Тонкий слой: только HTTP-запросы без бизнес-логики.
 */
const jobService = {
    // Получение списка заказов
    getAll: async (params = {}) => {
        const response = await apiClient.get('jobs/', { params });
        return response.data;
    },

    // Создание нового заказа (только для роли CLIENT)
    create: async (jobData) => {
        const response = await apiClient.post('jobs/', jobData);
        return response.data;
    },

    // Получение деталей заказа
    getById: async (id) => {
        const response = await apiClient.get(`jobs/${id}/`);
        return response.data;
    },

    // Публикация заказа (смена статуса через API-action)
    publish: async (id) => {
        const response = await apiClient.post(`jobs/${id}/publish/`);
        return response.data;
    },

    // Отмена заказа
    cancel: async (id) => {
        const response = await apiClient.post(`jobs/${id}/cancel/`);
        return response.data;
    }
};

export default jobService;
