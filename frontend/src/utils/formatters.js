import i18n from '../i18n';

/**
 * Форматирует дату согласно текущему языку приложения
 * @param {string|Date} date - Дата для форматирования
 * @param {Object} options - Опции Intl.DateTimeFormat
 * @returns {string} - Отформатированная дата
 */
export const formatDate = (date, options = { day: 'numeric', month: 'long', year: 'numeric' }) => {
    if (!date) return '';
    const d = new Date(date);
    const locale = i18n.language?.startsWith('tk') ? 'tk-TM' : 'ru-RU';
    return d.toLocaleDateString(locale, options);
};

/**
 * Форматирует время согласно текущему языку приложения
 * @param {string|Date} date - Дата/время
 * @returns {string} - Отформатированное время (HH:mm)
 */
export const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const locale = i18n.language?.startsWith('tk') ? 'tk-TM' : 'ru-RU';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

/**
 * Форматирует валюту (TMT)
 * @param {number|string} amount - Сумма
 * @returns {string} - Отформатированная строка (напр. "1,000.00 TMT")
 */
export const formatCurrency = (amount) => {
    const val = parseFloat(amount) || 0;
    const formatted = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
    
    return `${formatted} TMT`;
};
