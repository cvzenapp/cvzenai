import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypographyCustomizer, TypographyLayoutConfig } from '@/components/templates/customization/TypographyCustomizer';

// Mock the UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={props['data-testid']}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  )
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid="label">
      {children}
    </label>
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('test-value')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  )
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, min, max, step, id }: any) => (
    <input
      type="range"
      id={id}
      min={min}
      max={max}
      step={step}
      value={value?.[0] || 0}
      onChange={(e) => onValueChange && onValueChange([parseFloat(e.target.value)])}
      data-testid="slider"
    />
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      data-testid="switch"
    />
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Type: () => <div data-testid="type-icon" />,
  Layout: () => <div data-testid="layout-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}));

describe('TypographyCustomizer', () => {
  const mockConfig: TypographyLayoutConfig = {
    id: 'test-config',
    name: 'Test Configuration',
    typography: {
      fontFamily: 'inter',
      fontSize: 'medium',
      fontSizeScale: 1.0,
      lineHeight: 1.6,
      letterSpacing: 0,
      headingWeight: 'semibold',
      bodyWeight: 'normal'
    },
    layout: {
      density: 'standard',
      maxWidth: 'standard',
      sectionSpacing: 2,
      cardPadding: 1.5,
      borderRadius: 0.5
    }
  };

  const mockProps = {
    currentConfig: mockConfig,
    onConfigChange: vi.fn(),
    onPreview: vi.fn(),
    onSave: vi.fn(),
    className: 'test-class'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders typography customizer with header', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    expect(screen.getByText('Typography & Layout')).toBeInTheDocument();
    expect(screen.getAllByTestId('type-icon')).toHaveLength(2); // Header and Typography Settings
  });

  it('displays accessibility validation status', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    expect(screen.getByText('Accessibility Compliant')).toBeInTheDocument();
    expect(screen.getAllByTestId('check-icon')).toHaveLength(2); // Validation and Apply button
    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('shows predefined configurations', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    expect(screen.getByText('Predefined Configurations')).toBeInTheDocument();
    expect(screen.getByText('Modern Standard')).toBeInTheDocument();
    expect(screen.getByText('Compact Professional')).toBeInTheDocument();
    expect(screen.getByText('Spacious Elegant')).toBeInTheDocument();
    expect(screen.getByText('Accessible High Contrast')).toBeInTheDocument();
  });

  it('displays typography settings section', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    expect(screen.getByText('Typography Settings')).toBeInTheDocument();
    expect(screen.getByText('Font Family')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText(/Font Size Scale:/)).toBeInTheDocument();
    expect(screen.getByText(/Line Height:/)).toBeInTheDocument();
    expect(screen.getByText(/Letter Spacing:/)).toBeInTheDocument();
    expect(screen.getByText('Heading Weight')).toBeInTheDocument();
    expect(screen.getByText('Body Weight')).toBeInTheDocument();
  });

  it('displays layout settings section', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    expect(screen.getByText('Layout Settings')).toBeInTheDocument();
    expect(screen.getByText('Layout Density')).toBeInTheDocument();
    expect(screen.getByText('Content Width')).toBeInTheDocument();
    expect(screen.getByText(/Section Spacing:/)).toBeInTheDocument();
    expect(screen.getByText(/Card Padding:/)).toBeInTheDocument();
    expect(screen.getByText(/Border Radius:/)).toBeInTheDocument();
  });

  it('calls onConfigChange when predefined configuration is selected', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const modernStandardCard = screen.getByText('Modern Standard').closest('[data-testid="card"]');
    expect(modernStandardCard).toBeInTheDocument();
    
    fireEvent.click(modernStandardCard!);
    
    expect(mockProps.onConfigChange).toHaveBeenCalled();
  });

  it('updates font size scale when slider changes', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const sliders = screen.getAllByTestId('slider');
    const fontSizeScaleSlider = sliders[0]; // First slider should be font size scale
    
    fireEvent.change(fontSizeScaleSlider, { target: { value: '1.2' } });
    
    // Should trigger preview
    expect(mockProps.onPreview).toHaveBeenCalled();
  });

  it('updates line height when slider changes', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const sliders = screen.getAllByTestId('slider');
    const lineHeightSlider = sliders[1]; // Second slider should be line height
    
    fireEvent.change(lineHeightSlider, { target: { value: '1.8' } });
    
    // Should trigger preview
    expect(mockProps.onPreview).toHaveBeenCalled();
  });

  it('calls onPreview when preview button is clicked', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const previewButton = screen.getByText('Preview').closest('button');
    expect(previewButton).toBeInTheDocument();
    
    fireEvent.click(previewButton!);
    
    expect(mockProps.onPreview).toHaveBeenCalled();
  });

  it('calls onSave when apply button is clicked', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const applyButton = screen.getByText('Apply Settings').closest('button');
    expect(applyButton).toBeInTheDocument();
    
    fireEvent.click(applyButton!);
    
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('resets configuration when reset button is clicked', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    // First, make a change to trigger customization mode
    const sliders = screen.getAllByTestId('slider');
    fireEvent.change(sliders[0], { target: { value: '1.2' } });
    
    // Then click reset
    const resetButton = screen.getByText('Reset').closest('button');
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton!);
    
    // Should reset to original configuration
    expect(mockProps.onPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        typography: expect.objectContaining({
          fontSizeScale: 1.0 // Should be back to original value
        })
      })
    );
  });

  it('shows accessibility issues when configuration is invalid', () => {
    const invalidConfig: TypographyLayoutConfig = {
      ...mockConfig,
      typography: {
        ...mockConfig.typography,
        fontSizeScale: 0.7, // Too small
        lineHeight: 1.1 // Too tight
      }
    };

    render(<TypographyCustomizer {...mockProps} currentConfig={invalidConfig} />);
    
    expect(screen.getByText('Accessibility Issues')).toBeInTheDocument();
    expect(screen.getByText('Issues Found')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes('Font size') && content.includes('too small');
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes('Line height') && content.includes('too tight');
    })).toBeInTheDocument();
  });

  it('disables apply button when configuration is invalid', () => {
    const invalidConfig: TypographyLayoutConfig = {
      ...mockConfig,
      typography: {
        ...mockConfig.typography,
        fontSizeScale: 0.7 // Too small
      }
    };

    render(<TypographyCustomizer {...mockProps} currentConfig={invalidConfig} />);
    
    const applyButton = screen.getByText('Apply Settings').closest('button');
    expect(applyButton).toBeDisabled();
  });

  it('applies custom class name', () => {
    const { container } = render(<TypographyCustomizer {...mockProps} />);
    
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('displays current values in sliders and labels', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    expect(screen.getByText('Font Size Scale: 1.0x')).toBeInTheDocument();
    expect(screen.getByText('Line Height: 1.6')).toBeInTheDocument();
    expect(screen.getByText('Letter Spacing: 0.000em')).toBeInTheDocument();
    expect(screen.getByText('Section Spacing: 2.0rem')).toBeInTheDocument();
    expect(screen.getByText('Card Padding: 1.5rem')).toBeInTheDocument();
    expect(screen.getByText('Border Radius: 0.50rem')).toBeInTheDocument();
  });

  it('handles font family selection', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const fontFamilySelect = screen.getAllByTestId('select')[0]; // First select should be font family
    const selectButton = fontFamilySelect.querySelector('button');
    
    fireEvent.click(selectButton!);
    
    // Should trigger preview with updated font family
    expect(mockProps.onPreview).toHaveBeenCalled();
  });

  it('handles font size selection', () => {
    render(<TypographyCustomizer {...mockProps} />);
    
    const fontSizeSelect = screen.getAllByTestId('select')[1]; // Second select should be font size
    const selectButton = fontSizeSelect.querySelector('button');
    
    fireEvent.click(selectButton!);
    
    // Should trigger preview
    expect(mockProps.onPreview).toHaveBeenCalled();
  });
});