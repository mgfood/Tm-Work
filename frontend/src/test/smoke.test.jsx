import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple component for testing
const SmokeComponent = () => <div>Smoke Test Passing</div>;

describe('Smoke Test', () => {
    it('should render the smoke component', () => {
        render(<SmokeComponent />);
        expect(screen.getByText('Smoke Test Passing')).toBeInTheDocument();
    });

    it('basic math works', () => {
        expect(1 + 1).toBe(2);
    });
});
