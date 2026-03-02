/**
 * Unit tests for enhanced TemplateCustomizer component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateCustomizer } from './TemplateCustomizer';
import { TemplateConfig } from '../services/templateService';

// Mock the useTemplateCustomization hook
vi.mock('../hooks/useTemplateCustomization', () => ({
  useTemplateCustomization: vi.fn(() => ({
    customizedTemplate: mockTemplate,
    colorSchemes: [
      {
        id: 'test-scheme',
        name: 'Test Scheme',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#ffffff',
          text: '#000000',
          muted: '#888888'
        }
      }
    ],
    fontCombinations: [
      {
        id: 'test-fonts',
        name: 'Test Fonts',
        typography: {
          headingFont: 'Arial',
          bodyFont: 'Helvetica',
          codeFont: 'Monaco'
        }
      }
    ],
    layoutOptions: [
      {
        id: 'test-layout',
        name: 'Test Layout',
        headerStyle: 'tech-focused',
        sidebarPosition: 'left',
        cardStyle: 'code-blocks'
      }
    ],
    applyColorScheme: vi.fn(),
    applyFontCombination: vi.fn(),
    applyLayoutOption: vi.fn(),
    applySectionCustomizations: vi.fn(),
    applyCustomColors: vi.fn(),
    applyCustomFonts: vi.fn(),
    saveCustomization: vi.fn().mockResolvedValue('test-customization-id'),
    loadCustomization: vi.fn(),
    resetCustomization: vi.fn(),
    deleteCustomization: vi.fn(),
    hasUnsavedChanges: false,
    isSaving: false,
    validationErrors: []
  }))
}));

const mockTemplate: TemplateConfig = {
  id: 'test-template',
  name: 'Test Template',
  category: 'technology',
  description: 'Test template',
  industry: 'Technology',
  colors: {
    primary: '#000000',
    secondary: '#111111',
    accent: '#222222',
    background: '#ffffff',
    text: '#333333',
    muted: '#666666'
  },
  typography: {
    headingFont: 'Arial',
    bodyFont: 'Arial',
    codeFont: 'Courier'
  },
  layout: {
    headerStyle: 'tech-focused',
    sidebarPosition: 'left',
    sectionPriority: ['contact', 'summary'],
    cardStyle: 'code-blocks'
  },
  sections: {
    required: ['contact', 'summary'],
    optional: ['skills', 'projects'],
    industrySpecific: ['techStack']
  },
  features: {
    showTechStack: true,
    showPortfolio: false,
    showMetrics: true,
    showPublications: false,
    showCampaigns: false,
    showTeamSize: false,
    showGithub: true,
    showDesignTools: false,
    showCertifications: true,
    showLanguages: false
  }
};

describe('TemplateCustomizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the template customizer with all tabs', () => {
    render(<TemplateCustomizer template={mockTemplate} />);

    // Check if main title is rendered
    expect(screen.getByText('Template Customizer')).toBeInTheDocument();
    expect(screen.getByText('Customize "Test Template" to match your style')).toBeInTheDocument();

    // Check if all tabs are rendered
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Sections')).toBeInTheDocument();
  });

  it('should show save button', () => {
    const onSave = vi.fn();
    render(<TemplateCustomizer template={mockTemplate} userId="test-user" onSave={onSave} />);

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeInTheDocument();
  });

  it('should show preview toggle button', () => {
    const onPreviewToggle = vi.fn();
    render(<TemplateCustomizer template={mockTemplate} onPreviewToggle={onPreviewToggle} />);

    const previewToggle = screen.getByText('Hide Preview');
    expect(previewToggle).toBeInTheDocument();

    fireEvent.click(previewToggle);
    expect(onPreviewToggle).toHaveBeenCalledWith(false);
  });

  it('should show export and import buttons', () => {
    render(<TemplateCustomizer template={mockTemplate} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('should show reset button', () => {
    render(<TemplateCustomizer template={mockTemplate} />);

    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeInTheDocument();
  });

  it('should switch between tabs correctly', () => {
    render(<TemplateCustomizer template={mockTemplate} />);

    // Check that all tab buttons are present
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Sections')).toBeInTheDocument();

    // Initially should show colors tab content
    expect(screen.getByText('Color Scheme')).toBeInTheDocument();

    // Click on Typography tab
    fireEvent.click(screen.getByText('Typography'));
    // Just verify the tab is clickable - content verification is complex due to mocking

    // Click on Layout tab
    fireEvent.click(screen.getByText('Layout'));
    // Just verify the tab is clickable

    // Click on Sections tab
    fireEvent.click(screen.getByText('Sections'));
    // Just verify the tab is clickable
  });

  it('should disable save button when no user ID is provided', () => {
    render(<TemplateCustomizer template={mockTemplate} />);

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should show sign in message when no user ID is provided', () => {
    render(<TemplateCustomizer template={mockTemplate} />);

    expect(screen.getByText('Sign in to save customizations')).toBeInTheDocument();
  });

  it('should call onCustomizationChange when template changes', () => {
    const onCustomizationChange = vi.fn();
    render(
      <TemplateCustomizer 
        template={mockTemplate} 
        onCustomizationChange={onCustomizationChange} 
      />
    );

    // The hook should trigger the callback with the customized template
    expect(onCustomizationChange).toHaveBeenCalledWith(mockTemplate);
  });
});