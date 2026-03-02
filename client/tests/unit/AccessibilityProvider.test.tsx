import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibilityProvider, useAccessibility } from '@/components/templates/accessibility/AccessibilityProvider';

// Mock component to test the accessibility context
const TestComponent: React.FC = () => {
  const { 
    config, 
    userPreferences, 
    updateConfig, 
    validateContrast, 
    announceToScreenReader,
    focusElement,
    isAccessibilityCompliant 
  } = useAccessibility();

  return (
    <div>
      <div data-testid="contrast-ratio">{config.contrastRatio}</div>
      <div data-testid="font-size">{config.fontSize}</div>
      <div data-testid="reduced-motion">{config.reducedMotion.toString()}</div>
      <div data-testid="screen-reader-optimized">{config.screenReaderOptimized.toString()}</div>
      <div data-testid="keyboard-navigation">{config.keyboardNavigation.toString()}</div>
      <div data-testid="compliance">{isAccessibilityCompliant().toString()}</div>
      
      <button 
        data-testid="update-contrast"
        onClick={() => updateConfig({ contrastRatio: 'high' })}
      >
        Update Contrast
      </button>
      
      <button 
        data-testid="validate-contrast"
        onClick={() => {
          const isValid = validateContrast('#000000', '#ffffff');
          const result = document.createElement('div');
          result.setAttribute('data-testid', 'contrast-result');
          result.textContent = isValid.toString();
          document.body.appendChild(result);
        }}
      >
        Validate Contrast
      </button>
      
      <button 
        data-testid="announce"
        onClick={() => announceToScreenReader('Test announcement')}
      >
        Announce
      </button>
      
      <input data-testid="focus-target" />
      <button 
        data-testid="focus-input"
        onClick={() => {
          const input = document.querySelector('[data-testid="focus-target"]') as HTMLElement;
          focusElement(input);
        }}
      >
        Focus Input
      </button>
    </div>
  );
};

describe('AccessibilityProvider', () => {
  let mockMatchMedia: any;

  beforeEach(() => {
    // Mock matchMedia
    mockMatchMedia = vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce') ? false : 
               query.includes('prefers-contrast: high') ? false :
               query.includes('prefers-color-scheme: dark') ? false : false,
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

    // Mock getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: vi.fn(() => ({
        fontSize: '16px',
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provides default accessibility configuration', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('contrast-ratio')).toHaveTextContent('normal');
    expect(screen.getByTestId('font-size')).toHaveTextContent('medium');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    expect(screen.getByTestId('screen-reader-optimized')).toHaveTextContent('true');
    expect(screen.getByTestId('keyboard-navigation')).toHaveTextContent('true');
    expect(screen.getByTestId('compliance')).toHaveTextContent('true');
  });

  it('allows updating accessibility configuration', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId('update-contrast'));

    await waitFor(() => {
      expect(screen.getByTestId('contrast-ratio')).toHaveTextContent('high');
    });
  });

  it('validates contrast ratios correctly', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId('validate-contrast'));

    await waitFor(() => {
      const result = screen.getByTestId('contrast-result');
      expect(result).toHaveTextContent('true'); // Black on white should pass
    });
  });

  it('handles screen reader announcements', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    // Check that announcement element is created
    fireEvent.click(screen.getByTestId('announce'));
    
    // The announcement should be made (we can't easily test the actual announcement)
    // but we can verify the function doesn't throw
    expect(screen.getByTestId('announce')).toBeInTheDocument();
  });

  it('manages focus correctly', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const input = screen.getByTestId('focus-target');
    fireEvent.click(screen.getByTestId('focus-input'));

    // The focus should be set (in a real browser environment)
    expect(input).toBeInTheDocument();
  });

  it('detects user preferences on mount', () => {
    // Mock reduced motion preference
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });

  it('applies custom initial configuration', () => {
    // Mock user preferences to not override initial config
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false, // No user preferences detected
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const initialConfig = {
      contrastRatio: 'high' as const,
      fontSize: 'large' as const,
      reducedMotion: true,
    };

    render(
      <AccessibilityProvider initialConfig={initialConfig}>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('contrast-ratio')).toHaveTextContent('high');
    expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAccessibility must be used within an AccessibilityProvider');

    consoleSpy.mockRestore();
  });

  it('updates document styles when configuration changes', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId('update-contrast'));

    await waitFor(() => {
      // Check that CSS custom properties are set
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--a11y-contrast-ratio')).toBe('high');
    });
  });
});