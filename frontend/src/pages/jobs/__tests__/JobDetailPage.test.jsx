import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import JobDetailPage from '../JobDetailPage';
import jobsService from '../../../api/jobsService';
import proposalsService from '../../../api/proposalsService';
import apiClient from '../../../api/client';
import { AuthProvider } from '../../../context/AuthContext';
import { ToastProvider } from '../../../context/ToastContext';

// Mock all dependencies
vi.mock('../../../api/jobsService');
vi.mock('../../../api/proposalsService');
vi.mock('../../../api/client');
vi.mock('../../../api/chatService');
vi.mock('../../../api/reviewsService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '123' }),
    };
});

const tMock = (key) => key;
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: tMock,
        i18n: { language: 'ru' }
    }),
}));

// Mock useAuth using vi.fn() to allow per-test changes
const mockUseAuth = vi.fn();
vi.mock('../../../context/AuthContext', async () => {
    const actual = await vi.importActual('../../../context/AuthContext');
    return {
        ...actual,
        useAuth: () => mockUseAuth()
    };
});

const mockJob = {
    id: 123,
    title: 'Test Job',
    description: 'Job Description',
    budget: 500,
    status: 'PUBLISHED',
    client: 1, // User ID 1 is the owner
    created_at: '2023-01-01',
    deadline: '2023-12-31'
};

const mockProposals = [
    { id: 1, freelancer: 2, price: 450, message: 'I can do it', created_at: '2023-01-02', is_accepted: false }
];

const renderJobDetailPage = () => {
    return render(
        <BrowserRouter>
            <ToastProvider>
                <JobDetailPage />
            </ToastProvider>
        </BrowserRouter>
    );
};

describe('JobDetailPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jobsService.getJobById.mockResolvedValue(mockJob);
        proposalsService.getProposals.mockResolvedValue({ results: mockProposals });
        apiClient.get.mockResolvedValue({ data: { results: [] } }); // For reviews
        mockUseAuth.mockReturnValue({ user: null, loading: false });
    });

    it('renders job details for a guest', async () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false });
        renderJobDetailPage();

        expect(await screen.findByText('Test Job')).toBeInTheDocument();
        expect(screen.getByText('Job Description')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('shows proposal form for a freelancer (not owner)', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 2, role: 'FREELANCER' }, loading: false });
        renderJobDetailPage();

        expect(await screen.findByText('buttons.sendProposal')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('job.coverLetterPlaceholder')).toBeInTheDocument();
    });

    it('shows proposals list for the client (owner)', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 1, role: 'CLIENT' }, loading: false });
        renderJobDetailPage();

        expect(await screen.findByText(/job.proposals/i)).toBeInTheDocument();
        expect(screen.getByText(/I can do it/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.acceptProposal/i })).toBeInTheDocument();
    });

    it('handles proposal submission correctly', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 2, role: 'FREELANCER' }, loading: false });
        proposalsService.createProposal.mockResolvedValue({});
        renderJobDetailPage();

        const messageInput = await screen.findByPlaceholderText('job.coverLetterPlaceholder');
        const priceInput = screen.getByDisplayValue('500'); // Default budget
        const deadlineInput = screen.getByPlaceholderText('7');

        fireEvent.change(messageInput, { target: { value: 'My bid' } });
        fireEvent.change(priceInput, { target: { value: '400' } });
        fireEvent.change(deadlineInput, { target: { value: '5' } });

        const submitBtn = screen.getByText('buttons.sendProposal');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(proposalsService.createProposal).toHaveBeenCalledWith(expect.objectContaining({
                message: 'My bid',
                price: '400',
                deadline_days: '5'
            }));
            expect(screen.getByText('job.proposalSent')).toBeInTheDocument();
        });
    });

    it('handles proposal acceptance by client', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 1, role: 'CLIENT' }, loading: false });
        proposalsService.acceptProposal.mockResolvedValue({});
        window.confirm = vi.fn(() => true);

        renderJobDetailPage();

        const acceptBtn = await screen.findByRole('button', { name: /buttons.acceptProposal/i });
        fireEvent.click(acceptBtn);

        await waitFor(() => {
            expect(proposalsService.acceptProposal).toHaveBeenCalledWith(1);
            expect(jobsService.getJobById).toHaveBeenCalledTimes(2); // Initial + Refresh after accept
        });
    });

    it('shows error state when job is not found', async () => {
        jobsService.getJobById.mockRejectedValue(new Error('404'));
        renderJobDetailPage();

        expect(await screen.findByText('errors.jobNotFoundAccess')).toBeInTheDocument();
    });
});
