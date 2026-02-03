import client from './client';

const chatService = {
    // Получить список бесед (можно фильтровать по типу)
    getThreads: async (type = null) => {
        const url = type ? `/chat/threads/by_type/?type=${type}` : '/chat/threads/';
        const response = await client.get(url);
        return response.data;
    },

    // Получить историю сообщений для беседы
    getMessages: async (threadId) => {
        const response = await client.get(`/chat/messages/?thread=${threadId}`);
        return response.data;
    },

    // Отправить сообщение
    sendMessage: async (threadId, content) => {
        const response = await client.post('/chat/messages/', {
            thread: threadId,
            content: content
        });
        return response.data;
    },

    // Отметить сообщения в беседе как прочитанные
    markAsRead: async (threadId) => {
        const response = await client.post('/chat/messages/mark_as_read/', {
            thread: threadId
        });
        return response.data;
    },

    // Найти или создать беседу (для кнопок "Написать")
    getOrCreateThread: async (receiverId, type = 'PERSONAL', jobId = null) => {
        const response = await client.post('/chat/messages/get_or_create_thread/', {
            receiver_id: receiverId,
            type: type,
            job_id: jobId
        });
        return response.data;
    }
};

export default chatService;
