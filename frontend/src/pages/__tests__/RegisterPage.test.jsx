import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

// Hoisted mocks
const { mockRegister } = vi.hoisted(() => ({
    mockRegister: vi.fn()
}));

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister,
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

const renderRegisterPage = () => {
    return render(
        <BrowserRouter>
            <RegisterPage />
        </BrowserRouter>
    );
};

describe('RegisterPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders register form correctly', () => {
        renderRegisterPage();
        expect(screen.getByText('auth.create_account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('auth.placeholder_first_name')).toBeInTheDocument();
        expect(screen.getByText('auth.role_client')).toBeInTheDocument();
        expect(screen.getByText('auth.role_freelancer')).toBeInTheDocument();
    });

    it('shows error if passwords do not match', async () => {
        renderRegisterPage();

        fireEvent.change(screen.getByPlaceholderText('auth.placeholder_first_name'), { target: { name: 'first_name', value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { name: 'email', value: 'john@example.com' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { name: 'password', value: 'pass1' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { name: 'password_confirm', value: 'pass2' } });

        fireEvent.click(screen.getByText('auth.create_account_btn'));

        await waitFor(() => {
            expect(screen.getByText('auth.passwords_dont_match')).toBeInTheDocument();
        });
    });

    it('shows error if no role is selected', async () => {
        renderRegisterPage();

        // Fill other required fields
        fireEvent.change(screen.getByPlaceholderText('auth.placeholder_first_name'), { target: { name: 'first_name', value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { name: 'email', value: 'john@example.com' } });

        // Unselect CLIENT (it's selected by default)
        fireEvent.click(screen.getByText('auth.role_client'));

        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { name: 'password', value: 'pass123' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { name: 'password_confirm', value: 'pass123' } });

        fireEvent.click(screen.getByText('auth.create_account_btn'));

        await waitFor(() => {
            expect(screen.getByText('auth.select_role_error')).toBeInTheDocument();
        });
    });

    it('calls register and navigates on success', async () => {
        mockRegister.mockResolvedValue({});
        renderRegisterPage();

        fireEvent.change(screen.getByPlaceholderText('auth.placeholder_first_name'), { target: { name: 'first_name', value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { name: 'email', value: 'john@example.com' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { name: 'password', value: 'pass123' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { name: 'password_confirm', value: 'pass123' } });

        const submitBtn = screen.getByText('auth.create_account_btn');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
                email: 'john@example.com',
                first_name: 'John',
                password: 'pass123'
            }));
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('handles server errors and formats them', async () => {
        const serverError = { response: { data: { email: ['Already exists'] } } };
        mockRegister.mockRejectedValue(serverError);

        renderRegisterPage();
        fireEvent.change(screen.getByPlaceholderText('auth.placeholder_first_name'), { target: { name: 'first_name', value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { name: 'email', value: 'john@example.com' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { name: 'password', value: 'pass123' } });
        fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { name: 'password_confirm', value: 'pass123' } });

        fireEvent.click(screen.getByText('auth.create_account_btn'));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
            expect(screen.getByText(/email: Already exists/i)).toBeInTheDocument();
        });
    });
});
