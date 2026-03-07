import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Search, Filter, Briefcase, Clock, DollarSign, MapPin, List, HelpCircle } from 'lucide-react';
import JobListPage from '../JobListPage';
import jobsService from '../../../api/jobsService';

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        Search: () => <div data-testid="search-icon" />,
        Filter: () => <div data-testid="filter-icon" />,
        Briefcase: () => <div data-testid="briefcase-icon" />,
        Clock: () => <div data-testid="clock-icon" />,
        DollarSign: () => <div data-testid="dollar-icon" />,
        MapPin: () => <div data-testid="map-pin-icon" />,
        List: () => <div data-testid="list-icon" />,
        HelpCircle: () => <div data-testid="help-icon" />,
    };
});

// Mock the services
vi.mock('../../../api/jobsService', () => ({
    default: {
        getJobs: vi.fn(),
        getCategories: vi.fn(),
    }
}));

const tMock = (key) => key;
const i18nMock = { language: 'ru' };

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: tMock,
        i18n: i18nMock
    }),
}));

const mockJobs = [
    { id: 1, title: 'React Developer', description: 'Experience with Vitest', budget: 1000, created_at: '2023-01-01', category: { name: 'IT', icon: 'Code' } },
    { id: 2, title: 'Python Expert', description: 'Django skills required', budget: 1500, created_at: '2023-01-02', category: { name: 'IT', icon: 'Code' } }
];

const mockCategories = [
    { id: 10, name: 'IT', icon: 'Code' },
    { id: 11, name: 'Design', icon: 'Palette' }
];

const renderJobListPage = () => {
    return render(
        <BrowserRouter>
            <JobListPage />
        </BrowserRouter>
    );
};

describe('JobListPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        jobsService.getCategories.mockResolvedValue({ results: mockCategories });
        jobsService.getJobs.mockResolvedValue({ results: mockJobs });
    });

    it('renders jobs and categories from API', async () => {
        renderJobListPage();

        // Check if categories are rendered in the sidebar
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /IT/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Design/i })).toBeInTheDocument();
        });

        // Check if jobs are rendered (using regex to find them among multiple mentions)
        expect(screen.getAllByText(/React Developer/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Python Expert/i)[0]).toBeInTheDocument();
    });

    it('filters jobs on search input', async () => {
        renderJobListPage();
        // Wait for initial render
        const initialJob = await screen.findByText(/React Developer/i);
        expect(initialJob).toBeInTheDocument();

        const searchInput = screen.getByPlaceholderText('jobs.searchPlaceholder');
        fireEvent.change(searchInput, { target: { value: 'React' } });

        // Job list is filtered client-side
        await waitFor(() => {
            expect(screen.getByText(/React Developer/i)).toBeInTheDocument();
            expect(screen.queryByText(/Python Expert/i)).not.toBeInTheDocument();
        });
    });

    it('fetches filtered jobs when category is clicked', async () => {
        renderJobListPage();
        const itCategoryBtn = await screen.findByRole('button', { name: /IT/i });
        fireEvent.click(itCategoryBtn);

        // Should call getJobs with category ID
        await waitFor(() => {
            expect(jobsService.getJobs).toHaveBeenCalledWith(expect.objectContaining({
                category: 10
            }));
        });
    });

    it('shows error message on API failure', async () => {
        jobsService.getJobs.mockRejectedValue(new Error('Fetch failed'));
        renderJobListPage();

        await waitFor(() => {
            expect(screen.getByText('jobs.loadError')).toBeInTheDocument();
        });
    });

    it('shows empty state when no jobs match search', async () => {
        renderJobListPage();
        await screen.findByText(/React Developer/i);

        const searchInput = screen.getByPlaceholderText('jobs.searchPlaceholder');
        fireEvent.change(searchInput, { target: { value: 'NonExistentJob' } });

        await waitFor(() => {
            expect(screen.getByText('jobs.notFound')).toBeInTheDocument();
        });
    });
});
