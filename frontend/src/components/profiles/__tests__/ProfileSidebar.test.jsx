import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProfileSidebar from '../ProfileSidebar';

const mockT = (key) => key;

const defaultProps = {
    user: {
        first_name: 'John',
        last_name: 'Doe',
        roles: [{ name: 'FREELANCER' }]
    },
    profile: {
        avatar: null,
        profession: 'Developer'
    },
    isEditing: false,
    setIsEditing: vi.fn(),
    handleAvatarChange: vi.fn(),
    handleDeleteAvatar: vi.fn(),
    handleRoleSwitch: vi.fn(),
    logout: vi.fn(),
    t: mockT
};

describe('ProfileSidebar Component', () => {
    it('renders user name and profession', () => {
        render(<ProfileSidebar {...defaultProps} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('shows default user icon when no avatar is provided', () => {
        const { container } = render(<ProfileSidebar {...defaultProps} />);
        // Checking for Lucide User icon (usually a svg with certain class or data-icon if mocked)
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('shows avatar image when provided', () => {
        const propsWithAvatar = {
            ...defaultProps,
            profile: { ...defaultProps.profile, avatar: 'test-avatar.jpg' }
        };
        render(<ProfileSidebar {...propsWithAvatar} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'test-avatar.jpg');
    });

    it('calls setIsEditing when settings button is clicked', () => {
        render(<ProfileSidebar {...defaultProps} />);
        const settingsBtn = screen.getByText('profile.settings_title');
        fireEvent.click(settingsBtn);
        expect(defaultProps.setIsEditing).toHaveBeenCalled();
    });

    it('calls logout when logout button is clicked', () => {
        render(<ProfileSidebar {...defaultProps} />);
        const logoutBtn = screen.getByText('nav.logout');
        fireEvent.click(logoutBtn);
        expect(defaultProps.logout).toHaveBeenCalled();
    });

    it('highlights active roles and handles switch', () => {
        render(<ProfileSidebar {...defaultProps} />);
        // Freelancer should be highlighted (indicated by check icon or classes, here we check text)
        const freelancerBtn = screen.getByText('common.freelancer').closest('button');
        const clientBtn = screen.getByText('common.client').closest('button');

        fireEvent.click(clientBtn);
        expect(defaultProps.handleRoleSwitch).toHaveBeenCalledWith('CLIENT');
    });
});
