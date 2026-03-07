import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrivacyPolicyPage from '../PrivacyPolicyPage';
import TermsPage from '../TermsPage';

describe('Legal Pages', () => {
    it('renders Privacy Policy page correctly', () => {
        render(
            <MemoryRouter>
                <PrivacyPolicyPage />
            </MemoryRouter>
        );
        expect(screen.getByText(/Политика конфиденциальности/i)).toBeInTheDocument();
        expect(screen.getByText(/Сбор информации/i)).toBeInTheDocument();
    });

    it('renders Terms of Use page correctly', () => {
        render(
            <MemoryRouter>
                <TermsPage />
            </MemoryRouter>
        );
        expect(screen.getByText(/Условия использования/i)).toBeInTheDocument();
        expect(screen.getByText(/Правила работы/i)).toBeInTheDocument();
    });
});
