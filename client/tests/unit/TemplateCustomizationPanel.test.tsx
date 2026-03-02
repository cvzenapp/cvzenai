import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateCustomizationPanel, TemplateCustomization } from '@/components/templates/customization/TemplateCustomizationPanel';

// Mock the hooks
vi.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => ({
    currentScheme: {
      id: 'professional-blue',
      name: 'Professional Blue',
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
    },
    setColorScheme: vi.fn(),
    saveScheme: vi.fn(),
    previewScheme: vi.fn(),
    validateScheme: () => ({ isValid: true, issues: [] }),
    generateDarkVariant: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    isLoading: false,
    error: null
  })
}));

vi.mock('@/hooks/useTypographyLayout', () => ({
  useTypographyLayout: () => ({
    currentConfig: {
      id: 'modern-standard',
      name: 'Modern Standard',
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
    },
    setConfig: vi.fn(),
    saveConfig: vi.fn(),
    previewConfig: vi.fn(),
    validateConfig: () => ({ isValid: true, issues: [] }),
    generateResponsiveCSS: vi.fn(),
    isLoading: false,
    error: null
  })
}));

describe('TemplateCustomizationPanel', () => {
  const mockProps = {
    templateId: 'test-template',
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onPreview: vi.fn(),
    onExport: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    expect(screen.getByText('Customize Template')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TemplateCustomizationPanel {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Customize Template')).not.toBeInTheDocument();
  });

  it('shows validation status when valid', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    expect(screen.getByText(/Ready to save/)).toBeInTheDocument();
    expect(screen.getByText(/✓ Colors/)).toBeInTheDocument();
    expect(screen.getByText(/✓ Typography/)).toBeInTheDocument();
  });

  it('handles tab switching', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const typographyTab = screen.getByText('Typography');
    fireEvent.click(typographyTab);
    
    // Should show typography customizer content
    expect(screen.getByText('Typography & Layout')).toBeInTheDocument();
  });

  it('handles live preview toggle', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const previewToggle = screen.getByLabelText('Live Preview');
    fireEvent.click(previewToggle);
    
    expect(mockProps.onPreview).toHaveBeenCalled();
  });

  it('handles close button', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles save action', async () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const saveButton = screen.getByText('Save Theme');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });

  it('handles export action', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(mockProps.onExport).toHaveBeenCalled();
  });

  it('handles preview action', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);
    
    expect(mockProps.onPreview).toHaveBeenCalled();
  });

  it('allows setting custom theme name', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const nameInput = screen.getByPlaceholderText('My Custom Theme');
    fireEvent.change(nameInput, { target: { value: 'My Awesome Theme' } });
    
    expect(nameInput).toHaveValue('My Awesome Theme');
  });

  it('shows unsaved changes indicator', () => {
    render(<TemplateCustomizationPanel {...mockProps} />);
    
    // The component should show "Unsaved" badge when there are changes
    // This would be triggered by changes in the color scheme or typography
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('disables save button when invalid', () => {
    // Mock invalid validation
    vi.mocked(require('@/hooks/useColorScheme').useColorScheme).mockReturnValue({
      ...require('@/hooks/useColorScheme').useColorScheme(),
      validateScheme: () => ({ isValid: false, issues: ['Invalid color'] })
    });

    render(<TemplateCustomizationPanel {...mockProps} />);
    
    const saveButton = screen.getByText('Save Theme');
    expect(saveButton).toBeDisabled();
  });
});

describe('TemplateCustomization Integration', () => {
  it('creates proper customization object', () => {
    const mockOnSave = vi.fn();
    
    render(
      <TemplateCustomizationPanel 
        {...{
          templateId: 'test-template',
          isOpen: true,
          onClose: vi.fn(),
          onSave: mockOnSave,
          onPreview: vi.fn(),
          onExport: vi.fn()
        }} 
      />
    );
    
    const nameInput = screen.getByPlaceholderText('My Custom Theme');
    fireEvent.change(nameInput, { target: { value: 'Test Theme' } });
    
    const saveButton = screen.getByText('Save Theme');
    fireEvent.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Theme',
        templateId: 'test-template',
        colorScheme: expect.any(Object),
        typographyLayout: expect.any(Object),
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    );
  });
});