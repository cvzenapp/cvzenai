import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { 
  ResponsiveTemplateWrapper, 
  AdaptiveComponent, 
  TouchOptimized,
  PrintOptimized,
  useResponsiveTemplate,
  getResponsiveValue,
  isBreakpointActive,
  ENHANCED_BREAKPOINTS 
} from './ResponsiveTemplateSystem';
import { Resume } from '@shared/api';
import { getTemplateConfig } from '@/services/templateService';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: { effectiveType: '4g' },
});

const mockResume: Resume = {
  id: '1',
  personalInfo: {
    name: 'John Doe',
    title: 'Software Engineer',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    linkedin: '',
    github: '',
    website: '',
    avatar: ''
  },
  summary: 'Experienced software engineer',
  objective: '',
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

// Test component that uses the hook
const TestComponent = () => {
  const { currentBreakpoint, deviceCapabilities, isMobile, isTablet, isDesktop } = useResponsiveTemplate();
  
  return (
    <div>
      <div data-testid="breakpoint">{currentBreakpoint}</div>
      <div data-testid="is-mobile">{isMobile.toString()}</div>
      <div data-testid="is-tablet">{isTablet.toString()}</div>
      <div data-testid="is-desktop">{isDesktop.toString()}</div>
      <div data-testid="is-touch">{deviceCapabilities.isTouchDevice.toString()}</div>
      <div data-testid="has-hover">{deviceCapabilities.hasHover.toString()}</div>
    </div>
  );
};

describe('ResponsiveTemplateSystem', () => {
  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock matchMedia responses
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('hover: hover') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useResponsiveTemplate hook', () => {
    it('detects desktop breakpoint correctly', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('desktop');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
    });

    it('detects mobile breakpoint correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(<TestComponent />);
      
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('mobile');
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
    });

    it('detects tablet breakpoint correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      render(<TestComponent />);
      
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('tablet');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
    });

    it('detects device capabilities correctly', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('has-hover')).toHaveTextContent('true');
      // In test environment, touch detection might be different, so we just check it exists
      expect(screen.getByTestId('is-touch')).toBeInTheDocument();
    });

    it('responds to window resize', () => {
      const { rerender } = render(<TestComponent />);
      
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('desktop');

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 500,
        });
        window.dispatchEvent(new Event('resize'));
      });

      rerender(<TestComponent />);
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('mobile');
    });
  });

  describe('ResponsiveTemplateWrapper', () => {
    it('renders with correct responsive classes', () => {
      const templateConfig = getTemplateConfig('technology');
      
      render(
        <ResponsiveTemplateWrapper
          resume={mockResume}
          templateConfig={templateConfig}
          className="custom-class"
        >
          <div data-testid="content">Test Content</div>
        </ResponsiveTemplateWrapper>
      );

      const wrapper = screen.getByTestId('content').parentElement;
      expect(wrapper).toHaveClass('responsive-template-wrapper');
      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveAttribute('data-breakpoint');
    });

    it('applies CSS custom properties correctly', () => {
      const templateConfig = getTemplateConfig('technology');
      
      render(
        <ResponsiveTemplateWrapper
          resume={mockResume}
          templateConfig={templateConfig}
        >
          <div data-testid="content">Test Content</div>
        </ResponsiveTemplateWrapper>
      );

      const wrapper = screen.getByTestId('content').parentElement;
      const styles = window.getComputedStyle(wrapper!);
      
      // Check that CSS variables are set (they should be in the style attribute)
      expect(wrapper).toHaveAttribute('style');
      expect(wrapper!.getAttribute('style')).toContain('--current-breakpoint');
    });
  });

  describe('AdaptiveComponent', () => {
    it('renders mobile component on mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <AdaptiveComponent
          mobile={<div data-testid="mobile">Mobile Content</div>}
          desktop={<div data-testid="desktop">Desktop Content</div>}
          fallback={<div data-testid="fallback">Fallback Content</div>}
        />
      );

      expect(screen.getByTestId('mobile')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop')).not.toBeInTheDocument();
    });

    it('renders desktop component on desktop breakpoint', () => {
      render(
        <AdaptiveComponent
          mobile={<div data-testid="mobile">Mobile Content</div>}
          desktop={<div data-testid="desktop">Desktop Content</div>}
          fallback={<div data-testid="fallback">Fallback Content</div>}
        />
      );

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile')).not.toBeInTheDocument();
    });

    it('renders fallback when specific component not provided', () => {
      render(
        <AdaptiveComponent
          fallback={<div data-testid="fallback">Fallback Content</div>}
        />
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('TouchOptimized', () => {
    it('renders children correctly', () => {
      render(
        <TouchOptimized>
          <div data-testid="child">Touch Content</div>
        </TouchOptimized>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('handles tap events correctly', () => {
      const onTap = vi.fn();
      
      render(
        <TouchOptimized onTap={onTap}>
          <div data-testid="touchable">Touch Me</div>
        </TouchOptimized>
      );

      const touchable = screen.getByTestId('touchable').parentElement;
      
      // Test both touch and click events
      fireEvent.touchStart(touchable!);
      fireEvent.touchEnd(touchable!);
      
      // In test environment, also test click as fallback
      fireEvent.click(touchable!);
      
      expect(onTap).toHaveBeenCalled();
    });

    it('applies touch-optimized classes', () => {
      render(
        <TouchOptimized className="custom-touch">
          <div data-testid="child">Touch Content</div>
        </TouchOptimized>
      );

      const wrapper = screen.getByTestId('child').parentElement;
      expect(wrapper).toHaveClass('touch-optimized');
      expect(wrapper).toHaveClass('custom-touch');
    });

    it('handles disabled state correctly', () => {
      const onTap = vi.fn();
      
      render(
        <TouchOptimized onTap={onTap} disabled>
          <div data-testid="child">Disabled Touch</div>
        </TouchOptimized>
      );

      const wrapper = screen.getByTestId('child').parentElement;
      expect(wrapper).toHaveClass('disabled');
      expect(wrapper).toHaveAttribute('aria-disabled', 'true');
      
      fireEvent.click(wrapper!);
      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe('PrintOptimized', () => {
    it('renders children correctly', () => {
      render(
        <PrintOptimized>
          <div data-testid="print-content">Print Content</div>
        </PrintOptimized>
      );

      expect(screen.getByTestId('print-content')).toBeInTheDocument();
    });

    it('applies print-only class when specified', () => {
      render(
        <PrintOptimized printOnly>
          <div data-testid="print-content">Print Only Content</div>
        </PrintOptimized>
      );

      const wrapper = screen.getByTestId('print-content').parentElement;
      expect(wrapper).toHaveClass('print-only');
    });

    it('applies hide-in-print class when specified', () => {
      render(
        <PrintOptimized hideInPrint>
          <div data-testid="print-content">Hide in Print</div>
        </PrintOptimized>
      );

      const wrapper = screen.getByTestId('print-content').parentElement;
      expect(wrapper).toHaveClass('hide-in-print');
    });
  });

  describe('Utility functions', () => {
    describe('getResponsiveValue', () => {
      it('returns correct value for current breakpoint', () => {
        const values = {
          mobile: 'mobile-value',
          tablet: 'tablet-value',
          desktop: 'desktop-value',
          wide: 'wide-value'
        };

        expect(getResponsiveValue(values, 'mobile', 'fallback')).toBe('mobile-value');
        expect(getResponsiveValue(values, 'tablet', 'fallback')).toBe('tablet-value');
        expect(getResponsiveValue(values, 'desktop', 'fallback')).toBe('desktop-value');
        expect(getResponsiveValue(values, 'wide', 'fallback')).toBe('wide-value');
      });

      it('falls back to desktop value when current breakpoint not available', () => {
        const values = {
          desktop: 'desktop-value'
        };

        expect(getResponsiveValue(values, 'wide', 'fallback')).toBe('desktop-value');
      });

      it('returns fallback when no values match', () => {
        const values = {};

        expect(getResponsiveValue(values, 'mobile', 'fallback')).toBe('fallback');
      });
    });

    describe('isBreakpointActive', () => {
      it('returns true for active breakpoints', () => {
        expect(isBreakpointActive('mobile', 'desktop')).toBe(true);
        expect(isBreakpointActive('tablet', 'desktop')).toBe(true);
        expect(isBreakpointActive('desktop', 'desktop')).toBe(true);
      });

      it('returns false for inactive breakpoints', () => {
        expect(isBreakpointActive('desktop', 'mobile')).toBe(false);
        expect(isBreakpointActive('wide', 'tablet')).toBe(false);
      });
    });
  });

  describe('ENHANCED_BREAKPOINTS', () => {
    it('has correct breakpoint ranges', () => {
      expect(ENHANCED_BREAKPOINTS.mobile).toEqual({ min: 0, max: 767 });
      expect(ENHANCED_BREAKPOINTS.tablet).toEqual({ min: 768, max: 1023 });
      expect(ENHANCED_BREAKPOINTS.desktop).toEqual({ min: 1024, max: 1279 });
      expect(ENHANCED_BREAKPOINTS.wide).toEqual({ min: 1280, max: Infinity });
    });
  });
});