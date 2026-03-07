import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api/v1',
});

// Helper to check if token is expired
const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Add 30 seconds buffer
        return payload.exp < (Date.now() / 1000) + 30;
    } catch (e) {
        return true;
    }
};

// Interceptor to add JWT token and handle pre-emptive refresh
apiClient.interceptors.request.use(
    async (config) => {
        let token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (token && isTokenExpired(token) && refreshToken) {
            try {
                const response = await axios.post('/api/v1/auth/token/refresh/', {
                    refresh: refreshToken,
                });
                token = response.data.access;
                localStorage.setItem('access_token', token);
            } catch (error) {
                // If refresh fails, clear tokens
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle token refresh or logout on 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post('/api/v1/auth/token/refresh/', {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('access_token', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh token expired, logout user
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
