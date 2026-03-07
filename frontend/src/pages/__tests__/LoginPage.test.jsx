import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

// Use vi.hoisted to define variables accessible inside vi.mock
const { mockLogin } = vi.hoisted(() => ({
    mockLogin: vi.fn()
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        user: null,
        loading: false
    })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
    }),
}));

const renderLoginPage = () => {
    return render(
        <BrowserRouter>
            <LoginPage />
        </BrowserRouter>
    );
};

describe('LoginPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form correctly', () => {
        renderLoginPage();
        expect(screen.getByText('login.title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('login.email_placeholder')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('handles input changes', () => {
        renderLoginPage();
        const emailInput = screen.getByPlaceholderText('login.email_placeholder');
        const passwordInput = screen.getByPlaceholderText('••••••••');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('calls login and navigates on success', async () => {
        mockLogin.mockResolvedValue({});
        renderLoginPage();

        fireEvent.change(screen.getByPlaceholderText('login.email_placeholder'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByText('login.submit_button'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows error message on failed login', async () => {
        mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
        renderLoginPage();

        fireEvent.change(screen.getByPlaceholderText('login.email_placeholder'), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });

        fireEvent.click(screen.getByText('login.submit_button'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalled();
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
