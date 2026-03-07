import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ApiErrorInterceptor from '../ApiErrorInterceptor';
import apiClient from '../../api/client';
import { ToastProvider } from '../../context/ToastContext';
import * as ToastContext from '../../context/ToastContext';

// Mock the ToastContext
const showToastMock = vi.fn();

vi.mock('../../context/ToastContext', async () => {
    const actual = await vi.importActual('../../context/ToastContext');
    return {
        ...actual,
        useToast: () => ({
            showToast: showToastMock,
        }),
    };
});

describe('ApiErrorInterceptor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Eject interceptor to clean up
        if (apiClient.interceptors.response.handlers.length > 0) {
            apiClient.interceptors.response.eject(apiClient.interceptors.response.handlers[0]);
        }
    });

    it('should show toast on network error (no response)', async () => {
        render(
            <ToastProvider>
                <ApiErrorInterceptor />
            </ToastProvider>
        );

        // Simulate network error
        try {
            const handlers = apiClient.interceptors.response.handlers;
            const interceptor = handlers[handlers.length - 1].rejected;
            await interceptor({
                response: undefined,
            });
        } catch (error) {
            // Expected to reject
        }

        expect(showToastMock).toHaveBeenCalledWith('Network error. Check your connection.', 'error');
    });

    it('should show toast on server error (500)', async () => {
        render(
            <ToastProvider>
                <ApiErrorInterceptor />
            </ToastProvider>
        );

        try {
            const handlers = apiClient.interceptors.response.handlers;
            const interceptor = handlers[handlers.length - 1].rejected;
            await interceptor({
                response: { status: 500 },
            });
        } catch (error) {
            // Expected
        }

        expect(showToastMock).toHaveBeenCalledWith('Server error. Please try again later.', 'error');
    });

    it('should show toast with error message on 400', async () => {
        render(
            <ToastProvider>
                <ApiErrorInterceptor />
            </ToastProvider>
        );

        try {
            const handlers = apiClient.interceptors.response.handlers;
            const interceptor = handlers[handlers.length - 1].rejected;
            await interceptor({
                response: {
                    status: 400,
                    data: { error: 'Bad Request' }
                },
            });
        } catch (error) {
            // Expected
        }

        expect(showToastMock).toHaveBeenCalledWith('Bad Request', 'error');
    });

    it('should NOT show toast on 401 (handled by redirect)', async () => {
        render(
            <ToastProvider>
                <ApiErrorInterceptor />
            </ToastProvider>
        );

        try {
            const interceptor = apiClient.interceptors.response.handlers[0].rejected;
            await interceptor({
                response: { status: 401 },
            });
        } catch (error) {
            // Expected
        }

        expect(showToastMock).not.toHaveBeenCalled();
    });
});
