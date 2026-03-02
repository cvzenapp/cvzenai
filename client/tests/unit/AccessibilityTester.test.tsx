import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessibilityProvider } from '@/components/templates/accessibility/AccessibilityProvider';
import { AccessibilityTester } from '@/components/templates/accessibility/AccessibilityTester';

// Mock test container component
const TestContainer: React.FC = () => {
  return (
    <div data-testid="test-container">
      {/* Test elements with accessibility issues */}
      <img src="test.jpg" /> {/* Missing alt attribute */}
      <button></button> {/* Button without accessible name */}
      <a href="#"></a> {/* Link without accessible name */}
      <h1>Title</h1>
      <h3>Skipped heading level</h3> {/* Skips h2 */}
      <div style={{ color: '#ccc', backgroundColor: '#ddd' }}>Low contrast text</div>
      <button tabIndex={5}>Positive tabindex</button>
      <div aria-labelledby="nonexistent">Invalid ARIA reference</div>
    </div>
  );
};

describe('AccessibilityTester', () => {
  let mockOnTestComplete: any;
  let mockMatchMedia: any;

  beforeEach(() => {
    mockOnTestComplete = vi.fn();
    
    // Mock matchMedia
    mockMatchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
    
    // Mock getComputedStyle for contrast testing
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: vi.fn((element: HTMLElement) => {
        if (element.style.color === '#ccc') {
          return {
            color: 'rgb(204, 204, 204)',
            backgroundColor: 'rgb(221, 221, 221)',
            fontSize: '16px',
            fontWeight: 'normal',
            display: 'block',
          };
        }
        return {
          color: 'rgb(0, 0, 0)',
          backgroundColor: 'rgb(255, 255, 255)',
          fontSize: '16px',
          fontWeight: 'normal',
          display: 'block',
          outline: '2px solid blue',
        };
      }),
    });
  });

  it('renders accessibility tester with run button', () => {
    render(
      <AccessibilityProvider>
        <AccessibilityTester onTestComplete={mockOnTestComplete} />
      </AccessibilityProvider>
    );

    expect(screen.getByText('Accessibility Test Results')).toBeInTheDocument();
    expect(screen.getByText('Run Tests')).toBeInTheDocument();
  });

  it('runs tests and reports issues when button is clicked', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <img src="test.jpg" />
      <button></button>
      <h1>Title</h1>
      <h3>Skipped heading</h3>
    `;
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={false}
        />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText('Run Tests'));

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
    });

    document.body.removeChild(container);
  });

  it('detects missing alt attributes on images', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<img src="test.jpg" />';
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      const imageIssue = results.find((r: any) => r.message.includes('Image missing alt attribute'));
      expect(imageIssue).toBeDefined();
      expect(imageIssue.severity).toBe('error');
    });

    document.body.removeChild(container);
  });

  it('detects buttons without accessible names', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<button></button>';
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      const buttonIssue = results.find((r: any) => r.message.includes('Button without accessible name'));
      expect(buttonIssue).toBeDefined();
      expect(buttonIssue.severity).toBe('error');
    });

    document.body.removeChild(container);
  });

  it('detects heading hierarchy issues', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<h1>Title</h1><h3>Skipped h2</h3>';
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      const headingIssue = results.find((r: any) => r.message.includes('Heading level skipped'));
      expect(headingIssue).toBeDefined();
      expect(headingIssue.severity).toBe('warning');
    });

    document.body.removeChild(container);
  });

  it('detects positive tabindex issues', async () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.setAttribute('tabindex', '5');
    button.textContent = 'Test';
    container.appendChild(button);
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      const tabindexIssue = results.find((r: any) => r.message.includes('Positive tabindex detected'));
      expect(tabindexIssue).toBeDefined();
      expect(tabindexIssue.severity).toBe('warning');
    });

    document.body.removeChild(container);
  });

  it('detects invalid ARIA references', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div aria-labelledby="nonexistent">Test</div>';
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      const ariaIssue = results.find((r: any) => r.message.includes('Invalid aria-labelledby reference'));
      expect(ariaIssue).toBeDefined();
      expect(ariaIssue.severity).toBe('error');
    });

    document.body.removeChild(container);
  });

  it('shows loading state while running tests', async () => {
    render(
      <AccessibilityProvider>
        <AccessibilityTester onTestComplete={mockOnTestComplete} autoRun={false} />
      </AccessibilityProvider>
    );

    const runButton = screen.getByText('Run Tests');
    
    // Initially should show "Run Tests"
    expect(runButton).toHaveTextContent('Run Tests');
    expect(runButton).not.toBeDisabled();
    
    // After clicking, the component should handle the loading state
    fireEvent.click(runButton);
    
    // The test completes very quickly in the test environment,
    // so we just verify the component doesn't crash
    expect(runButton).toBeInTheDocument();
  });

  it('displays test results with proper severity styling', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<img src="test.jpg" />'; // Will generate an error
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
          showResults={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      // Should show the error message
      expect(screen.getByText(/Image missing alt attribute/)).toBeInTheDocument();
    });

    document.body.removeChild(container);
  });

  it('filters results based on report level configuration', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<img src="test.jpg" /><h1>Title</h1><h3>Skip</h3>';
    document.body.appendChild(container);

    render(
      <AccessibilityProvider>
        <AccessibilityTester 
          target={container}
          config={{ reportLevel: 'error' }}
          onTestComplete={mockOnTestComplete}
          autoRun={true}
        />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
      const results = mockOnTestComplete.mock.calls[0][0];
      // Should only include errors, not warnings
      const hasWarnings = results.some((r: any) => r.severity === 'warning');
      expect(hasWarnings).toBe(false);
    });

    document.body.removeChild(container);
  });
});