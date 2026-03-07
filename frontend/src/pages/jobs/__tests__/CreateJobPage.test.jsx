import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import CreateJobPage from '../CreateJobPage';
import jobsService from '../../../api/jobsService';
import { ToastProvider } from '../../../context/ToastContext';

// Mock services
vi.mock('../../../api/jobsService', () => ({
    default: {
        getCategories: vi.fn(),
        createJob: vi.fn(),
        publishJob: vi.fn(),
    }
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
const tMock = (key) => key;
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: tMock,
    }),
}));

const mockCategories = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'Design' }
];

const renderCreateJobPage = () => {
    return render(
        <BrowserRouter>
            <ToastProvider>
                <CreateJobPage />
            </ToastProvider>
        </BrowserRouter>
    );
};

describe('CreateJobPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jobsService.getCategories.mockResolvedValue({ results: mockCategories });
    });

    it('renders the form and loads categories', async () => {
        renderCreateJobPage();
        expect(screen.getByText('create_job.title')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('IT')).toBeInTheDocument();
            expect(screen.getByText('Design')).toBeInTheDocument();
        });
    });

    it('shows validation error for zero budget', async () => {
        renderCreateJobPage();

        const titleInput = screen.getByPlaceholderText('create_job.fields.title_placeholder');
        fireEvent.change(titleInput, { target: { name: 'title', value: 'New Test Job' } });

        const publishBtn = screen.getByText('create_job.buttons.publish');
        fireEvent.click(publishBtn);

        await waitFor(() => {
            expect(screen.getByText('create_job.errors.budget_positive')).toBeInTheDocument();
        });
    });

    it('calls createJob and navigates on successful draft save', async () => {
        jobsService.createJob.mockResolvedValue({ id: 123 });
        renderCreateJobPage();

        fireEvent.change(screen.getByPlaceholderText('create_job.fields.title_placeholder'), { target: { name: 'title', value: 'New Job' } });
        fireEvent.change(screen.getByPlaceholderText('500'), { target: { name: 'budget', value: '100' } });

        const saveDraftBtn = screen.getByText('create_job.buttons.save_draft');
        fireEvent.click(saveDraftBtn);

        await waitFor(() => {
            expect(jobsService.createJob).toHaveBeenCalledWith(expect.objectContaining({
                title: 'New Job',
                budget: 100
            }));
            expect(mockNavigate).toHaveBeenCalledWith('/jobs/123');
        });
    });

    it('calls createJob and publishJob on publish click', async () => {
        jobsService.createJob.mockResolvedValue({ id: 123 });
        jobsService.publishJob.mockResolvedValue({});
        renderCreateJobPage();

        fireEvent.change(screen.getByPlaceholderText('create_job.fields.title_placeholder'), { target: { name: 'title', value: 'New Job' } });
        fireEvent.change(screen.getByPlaceholderText('500'), { target: { name: 'budget', value: '100' } });

        const publishBtn = screen.getByText('create_job.buttons.publish');
        fireEvent.click(publishBtn);

        await waitFor(() => {
            expect(jobsService.createJob).toHaveBeenCalled();
            expect(jobsService.publishJob).toHaveBeenCalledWith(123);
            expect(mockNavigate).toHaveBeenCalledWith('/jobs/123');
        });
    });

    it('displays server error messages from API', async () => {
        const serverError = { response: { data: { title: ['Too short'], budget: ['Must be higher'] } } };
        jobsService.createJob.mockRejectedValue(serverError);

        renderCreateJobPage();
        fireEvent.change(screen.getByPlaceholderText('500'), { target: { name: 'budget', value: '100' } });

        const saveBtn = screen.getByText('create_job.buttons.save_draft');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByText(/create_job.errors.prefix/i)).toBeInTheDocument();
            expect(screen.getByText(/title: Too short/i)).toBeInTheDocument();
        });
    });
});
