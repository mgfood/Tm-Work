import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';

const ApiErrorInterceptor = () => {
    const { showToast } = useToast();

    useEffect(() => {
        const interceptor = apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                const message = error.response?.data?.error || error.response?.data?.detail || 'An unexpected error occurred';

                if (!error.response) {
                    // Network error
                    showToast('Network error. Check your connection.', 'error');
                } else if (error.response.status >= 500) {
                    showToast('Server error. Please try again later.', 'error');
                } else if (error.response.status !== 401) {
                    // Show validation errors or other 4xx (excluding 401 which handles redirects)
                    showToast(message, 'error');
                }

                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.response.eject(interceptor);
        };
    }, [showToast]);

    return null;
};

export default ApiErrorInterceptor;
