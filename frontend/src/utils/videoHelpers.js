/**
 * Получить длительность видео по URL
 * @param {string} videoUrl - URL видео
 * @returns {Promise<number>} Длительность в секундах
 */
export const getVideoDuration = (videoUrl) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const duration = video.duration;
            resolve(duration);
        };

        video.onerror = () => {
            reject(new Error('Failed to load video metadata'));
        };

        video.src = videoUrl;
    });
};

/**
 * Проверить, является ли видео коротким (≤2 минуты)
 * @param {string} videoUrl - URL видео
 * @returns {Promise<boolean>} true если видео ≤120 секунд
 */
export const isShortVideo = async (videoUrl) => {
    try {
        const duration = await getVideoDuration(videoUrl);
        return duration <= 120; // 2 минуты = 120 секунд
    } catch (error) {
        console.error('Error checking video duration:', error);
        return false; // В случае ошибки показываем как файл
    }
};

/**
 * Форматировать длительность в читаемый формат
 * @param {number} seconds - Длительность в секундах
 * @returns {string} Форматированная строка (например, "2:45")
 */
export const formatVideoDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
