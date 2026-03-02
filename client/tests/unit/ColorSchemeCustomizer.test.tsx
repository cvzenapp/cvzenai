import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ColorSchemeCustomizer, ColorScheme } from '@/components/templates/customization/ColorSchemeCustomizer';

// Mock color scheme for testing
const mockColorScheme: ColorScheme = {
  id: 'test-scheme',
  name: 'Test Scheme',
  colors: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981',
    text: '#1F2937',
    background: '#FFFFFF',
    muted: '#F8FAFC',
    border: '#E2E8F0'
  },
  isDark: false,
  isAccessible: true,
  contrastRatio: 4.8
};

describe('ColorSchemeCustomizer', () => {
  const mockOnSchemeChange = vi.fn();
  const mockOnPreview = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders color scheme customizer with current scheme', () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Color Scheme')).toBeInTheDocument();
    expect(screen.getByText('WCAG AA Compliant')).toBeInTheDocument();
    expect(screen.getByText('4.8:1 contrast')).toBeInTheDocument();
  });

  it('displays predefined color schemes', () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Predefined Schemes')).toBeInTheDocument();
    expect(screen.getByText('Professional Blue')).toBeInTheDocument();
    expect(screen.getByText('Corporate Gray')).toBeInTheDocument();
    expect(screen.getByText('Creative Purple')).toBeInTheDocument();
  });

  it('allows selecting predefined color schemes', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    const corporateGrayScheme = screen.getByText('Corporate Gray').closest('.cursor-pointer');
    expect(corporateGrayScheme).toBeInTheDocument();

    fireEvent.click(corporateGrayScheme!);

    await waitFor(() => {
      expect(mockOnSchemeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Corporate Gray',
          colors: expect.objectContaining({
            primary: '#6B7280'
          })
        })
      );
    });
  });

  it('toggles dark mode correctly', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    const darkModeToggle = screen.getByRole('switch');
    expect(darkModeToggle).not.toBeChecked();

    fireEvent.click(darkModeToggle);

    await waitFor(() => {
      expect(darkModeToggle).toBeChecked();
    });
  });

  it('allows custom color input', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    const primaryColorInput = screen.getByDisplayValue('#3B82F6');
    expect(primaryColorInput).toBeInTheDocument();

    fireEvent.change(primaryColorInput, { target: { value: '#FF0000' } });

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: expect.objectContaining({
            primary: '#FF0000'
          })
        })
      );
    });
  });

  it('validates accessibility and shows warnings for poor contrast', async () => {
    const poorContrastScheme: ColorScheme = {
      ...mockColorScheme,
      colors: {
        ...mockColorScheme.colors,
        text: '#CCCCCC', // Poor contrast with white background
        background: '#FFFFFF'
      },
      isAccessible: false,
      contrastRatio: 1.5
    };

    render(
      <ColorSchemeCustomizer
        currentScheme={poorContrastScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Accessibility Issues')).toBeInTheDocument();
    expect(screen.getByText('1.5:1 contrast')).toBeInTheDocument();
    expect(screen.getByText(/Text contrast ratio is below WCAG AA standard/)).toBeInTheDocument();
  });

  it('disables save button for inaccessible schemes', () => {
    const inaccessibleScheme: ColorScheme = {
      ...mockColorScheme,
      isAccessible: false,
      contrastRatio: 2.0
    };

    render(
      <ColorSchemeCustomizer
        currentScheme={inaccessibleScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    const applyButton = screen.getByRole('button', { name: /apply scheme/i });
    expect(applyButton).toBeDisabled();
  });

  it('calls onSave when apply button is clicked', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    const applyButton = screen.getByRole('button', { name: /apply scheme/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          colors: expect.any(Object),
          isAccessible: true
        })
      );
    });
  });

  it('calls onPreview when preview button is clicked', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: mockColorScheme.colors,
          isDark: false
        })
      );
    });
  });

  it('resets to original scheme when reset button is clicked', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    // First, change a color
    const primaryColorInput = screen.getByDisplayValue('#3B82F6');
    fireEvent.change(primaryColorInput, { target: { value: '#FF0000' } });

    // Then reset
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('#3B82F6')).toBeInTheDocument();
    });
  });

  it('shows high contrast scheme option', () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('High Contrast')).toBeInTheDocument();
    expect(screen.getByText('21:1 contrast')).toBeInTheDocument();
  });

  it('generates dark variants of light schemes when dark mode is enabled', async () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    // Enable dark mode
    const darkModeToggle = screen.getByRole('switch');
    fireEvent.click(darkModeToggle);

    // Select a light scheme
    const professionalBlueScheme = screen.getByText('Professional Blue').closest('.cursor-pointer');
    fireEvent.click(professionalBlueScheme!);

    await waitFor(() => {
      expect(mockOnSchemeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Professional Blue (Dark)',
          isDark: true,
          colors: expect.objectContaining({
            background: '#0F172A',
            text: '#F8FAFC'
          })
        })
      );
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    // Check that color inputs have proper labels
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary')).toBeInTheDocument();
    expect(screen.getByLabelText('Accent')).toBeInTheDocument();

    // Check that dark mode toggle has proper label
    expect(screen.getByLabelText('Dark Mode')).toBeInTheDocument();

    // Check that buttons have proper accessible names
    expect(screen.getByRole('button', { name: /apply scheme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('displays color values in both color picker and text input', () => {
    render(
      <ColorSchemeCustomizer
        currentScheme={mockColorScheme}
        onSchemeChange={mockOnSchemeChange}
        onPreview={mockOnPreview}
        onSave={mockOnSave}
      />
    );

    // Check that both color picker and text input show the same value
    const colorPickers = screen.getAllByDisplayValue('#3B82F6');
    expect(colorPickers).toHaveLength(2); // One color picker, one text input

    // Check that text input allows manual hex entry
    const textInput = colorPickers.find(input => input.getAttribute('type') === 'text');
    expect(textInput).toHaveClass('font-mono');
  });
});