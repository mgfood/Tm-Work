import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthProvider } from '../../context/AuthContext';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock useTranslation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: {
            changeLanguage: vi.fn(),
            language: 'ru',
        },
    }),
}));

// Mock notificationsService to avoid real network calls
vi.mock('../../api/notificationsService', () => ({
    default: {
        getNotifications: vi.fn(() => Promise.resolve({ data: { results: [], count: 0 } })),
        markAsRead: vi.fn(),
        getUnreadCount: vi.fn(() => Promise.resolve({ data: { count: 0 } })),
    }
}));

const renderNavbar = () => {
    return render(
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
    );
};

describe('Navbar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders guest navigation when user is not logged in', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            logout: vi.fn(),
            loading: false,
        });

        renderNavbar();

        expect(screen.getByText('nav.login')).toBeInTheDocument();
        expect(screen.getByText('nav.register')).toBeInTheDocument();
    });

    it('renders user navigation when logged in', () => {
        mockUseAuth.mockReturnValue({
            user: {
                email: 'test@example.com',
                balance: '150.00',
                is_staff: false,
            },
            logout: vi.fn(),
            loading: false,
        });

        renderNavbar();

        expect(screen.getByText('150.00 TMT')).toBeInTheDocument();
        expect(screen.queryByText('nav.login')).not.toBeInTheDocument();
    });

    it('shows admin link only for staff members', () => {
        mockUseAuth.mockReturnValue({
            user: {
                email: 'admin@example.com',
                is_staff: true,
                balance: '0.00'
            },
            logout: vi.fn(),
            loading: false,
        });

        renderNavbar();

        // The admin dashboard link is found by its aria-label
        const adminLink = screen.getByRole('link', { name: /admin dashboard/i });
        expect(adminLink).toBeDefined();
    });
});
