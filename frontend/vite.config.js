import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Приоритизируем ссылку из .env, иначе используем локальный адрес
    const apiTarget = env.VITE_API_URL || 'http://127.0.0.1:8000';

    return {
        plugins: [react()],
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    onError: (err) => {
                        console.error('Proxy Error:', err);
                    }
                },
                '/media': {
                    target: apiTarget,
                    changeOrigin: true,
                    onError: (err) => {
                        console.error('Proxy Media Error:', err);
                    }
                },
            },
            allowedHosts: true,
        },
    }
})
