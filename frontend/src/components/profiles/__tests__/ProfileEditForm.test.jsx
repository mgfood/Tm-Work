import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProfileEditForm from '../ProfileEditForm';

const mockT = (key) => key;

const defaultProps = {
    formData: {
        profession: 'Developer',
        location: 'Ashgabat',
        phone_number: '+993123456',
        hourly_rate: 50,
        experience_years: 5,
        bio: 'Hello world',
        skills_ids: [1],
        social_links: {
            telegram: '',
            instagram: '',
            github: '',
            linkedin: ''
        }
    },
    setFormData: vi.fn(),
    allSkills: [
        { id: 1, name: 'React' },
        { id: 2, name: 'Python' }
    ],
    handleProfileUpdate: vi.fn((e) => e.preventDefault()),
    setIsEditing: vi.fn(),
    isSaving: false,
    t: mockT
};

describe('ProfileEditForm Component', () => {
    it('renders all fields with initial data', () => {
        render(<ProfileEditForm {...defaultProps} />);
        expect(screen.getByDisplayValue('Developer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Ashgabat')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument();
    });

    it('calls handleProfileUpdate on form submission', () => {
        render(<ProfileEditForm {...defaultProps} />);
        const saveBtn = screen.getByText('common.save_changes');
        fireEvent.click(saveBtn); // Since it's type="submit"
        expect(defaultProps.handleProfileUpdate).toHaveBeenCalled();
    });

    it('updates skill selection via setFormData', () => {
        const { rerender } = render(<ProfileEditForm {...defaultProps} />);
        const pythonSkillBtn = screen.getByText('Python');

        fireEvent.click(pythonSkillBtn);

        // Check if setFormData was called. 
        // Logic in component: setFormData({ ...formData, skills_ids: [...formData.skills_ids, skill.id] });
        expect(defaultProps.setFormData).toHaveBeenCalled();
        const callArgs = defaultProps.setFormData.mock.calls[0][0];
        expect(callArgs.skills_ids).toContain(2);
    });

    it('disables save button and shows loader when isSaving is true', () => {
        const savingProps = { ...defaultProps, isSaving: true };
        render(<ProfileEditForm {...savingProps} />);

        const saveBtn = screen.getByRole('button', { name: /common.save_changes/i });
        expect(saveBtn).toBeDisabled();
        // The text is gone when loader is shown
        expect(screen.queryByText('common.save_changes')).not.toBeInTheDocument();
    });

    it('calls setIsEditing(false) when cancel button is clicked', () => {
        render(<ProfileEditForm {...defaultProps} />);
        const cancelBtn = screen.getByText('common.cancel');
        fireEvent.click(cancelBtn);
        expect(defaultProps.setIsEditing).toHaveBeenCalledWith(false);
    });
});
