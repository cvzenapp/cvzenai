/**
 * Unit tests for useTemplateCustomization hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTemplateCustomization } from './useTemplateCustomization';
import { TemplateConfig } from '../services/templateService';
import { templateCustomizationEngine } from '../services/templateCustomizationEngine';

// Mock the template customization engine
vi.mock('../services/templateCustomizationEngine', () => ({
  templateCustomizationEngine: {
    getDefaultCustomizationOptions: vi.fn(),
    applyAllCustomizations: vi.fn(),
    registerPreviewCallback: vi.fn(),
    unregisterPreviewCallback: vi.fn(),
    updatePreview: vi.fn(),
    saveCustomization: vi.fn(),
    loadCustomization: vi.fn(),
    deleteCustomization: vi.fn(),
    validateCustomization: vi.fn()
  }
}));

describe('useTemplateCustomization', () => {
  let mockTemplate: TemplateConfig;
  let mockColorScheme: any;
  let mockFontCombination: any;
  let mockLayoutOption: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTemplate = {
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

    mockColorScheme = {
      id: 'test-colors',
      name: 'Test Colors',
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        background: '#f0f0f0',
        text: '#000000',
        muted: '#888888'
      }
    };

    mockFontCombination = {
      id: 'test-fonts',
      name: 'Test Fonts',
      typography: {
        headingFont: 'Helvetica',
        bodyFont: 'Times',
        codeFont: 'Monaco'
      }
    };

    mockLayoutOption = {
      id: 'test-layout',
      name: 'Test Layout',
      headerStyle: 'executive-minimal',
      sidebarPosition: 'right',
      cardStyle: 'metrics-focused'
    };

    // Setup default mocks
    (templateCustomizationEngine.getDefaultCustomizationOptions as any).mockReturnValue({
      colorSchemes: [mockColorScheme],
      fontCombinations: [mockFontCombination],
      layoutOptions: [mockLayoutOption]
    });

    (templateCustomizationEngine.applyAllCustomizations as any).mockImplementation(
      (template, customization) => ({ ...template, ...customization })
    );

    (templateCustomizationEngine.validateCustomization as any).mockReturnValue({
      isValid: true,
      errors: []
    });
  });

  describe('initialization', () => {
    it('should initialize with base template and default options', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      expect(result.current.customizedTemplate).toMatchObject(mockTemplate);
      expect(result.current.colorSchemes).toEqual([mockColorScheme]);
      expect(result.current.fontCombinations).toEqual([mockFontCombination]);
      expect(result.current.layoutOptions).toEqual([mockLayoutOption]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should register preview callback when enabled', () => {
      renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          enableRealTimePreview: true
        })
      );

      expect(templateCustomizationEngine.registerPreviewCallback).toHaveBeenCalledWith(
        'test-template',
        expect.any(Function)
      );
    });

    it('should not register preview callback when disabled', () => {
      renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          enableRealTimePreview: false
        })
      );

      expect(templateCustomizationEngine.registerPreviewCallback).not.toHaveBeenCalled();
    });
  });

  describe('customization actions', () => {
    it('should apply color scheme and mark as unsaved', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      act(() => {
        result.current.applyColorScheme(mockColorScheme);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(templateCustomizationEngine.updatePreview).toHaveBeenCalledWith(
        'test-template',
        { colorScheme: mockColorScheme }
      );
    });

    it('should apply font combination and mark as unsaved', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      act(() => {
        result.current.applyFontCombination(mockFontCombination);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(templateCustomizationEngine.updatePreview).toHaveBeenCalledWith(
        'test-template',
        { fontCombination: mockFontCombination }
      );
    });

    it('should apply layout option and mark as unsaved', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      act(() => {
        result.current.applyLayoutOption(mockLayoutOption);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(templateCustomizationEngine.updatePreview).toHaveBeenCalledWith(
        'test-template',
        { layoutOption: mockLayoutOption }
      );
    });

    it('should apply custom colors and mark as unsaved', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      const customColors = { primary: '#custom-color' };

      act(() => {
        result.current.applyCustomColors(customColors);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(templateCustomizationEngine.updatePreview).toHaveBeenCalledWith(
        'test-template',
        { customColors }
      );
    });

    it('should apply custom fonts and mark as unsaved', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      const customFonts = { headingFont: 'Custom Font' };

      act(() => {
        result.current.applyCustomFonts(customFonts);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(templateCustomizationEngine.updatePreview).toHaveBeenCalledWith(
        'test-template',
        { customFonts }
      );
    });
  });

  describe('template management', () => {
    it('should save customization successfully', async () => {
      const userId = 'user-123';
      const customizationId = 'custom-456';

      (templateCustomizationEngine.saveCustomization as any).mockResolvedValue(customizationId);

      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          userId
        })
      );

      // Make a change to have something to save
      act(() => {
        result.current.applyColorScheme(mockColorScheme);
      });

      let savedId: string | null = null;
      await act(async () => {
        savedId = await result.current.saveCustomization();
      });

      expect(savedId).toBe(customizationId);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle save failure', async () => {
      const userId = 'user-123';

      (templateCustomizationEngine.saveCustomization as any).mockImplementation(() => {
        throw new Error('Save failed');
      });

      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          userId
        })
      );

      // Make a change to have something to save
      act(() => {
        result.current.applyColorScheme(mockColorScheme);
      });

      let savedId: string | null = null;
      await act(async () => {
        savedId = await result.current.saveCustomization();
      });

      expect(savedId).toBeNull();
      expect(result.current.isSaving).toBe(false);
    });

    it('should load customization successfully', async () => {
      const customizationId = 'custom-456';
      const mockCustomization = {
        templateId: 'test-template',
        colorScheme: mockColorScheme,
        lastModified: new Date()
      };

      (templateCustomizationEngine.loadCustomization as any).mockResolvedValue(mockCustomization);

      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      let loaded = false;
      await act(async () => {
        loaded = await result.current.loadCustomization(customizationId);
      });

      expect(loaded).toBe(true);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should reset customization', () => {
      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      // Make a change
      act(() => {
        result.current.applyColorScheme(mockColorScheme);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      // Reset
      act(() => {
        result.current.resetCustomization();
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should delete customization', async () => {
      const userId = 'user-123';
      const customizationId = 'custom-456';

      (templateCustomizationEngine.deleteCustomization as any).mockResolvedValue(true);

      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          userId
        })
      );

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteCustomization(customizationId);
      });

      expect(deleted).toBe(true);
      expect(templateCustomizationEngine.deleteCustomization).toHaveBeenCalledWith(
        userId,
        customizationId
      );
    });
  });

  describe('validation', () => {
    it('should handle validation errors', () => {
      const validationErrors = ['Invalid color scheme', 'Missing font'];

      (templateCustomizationEngine.validateCustomization as any).mockReturnValue({
        isValid: false,
        errors: validationErrors
      });

      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate
        })
      );

      act(() => {
        result.current.applyColorScheme(mockColorScheme);
      });

      expect(result.current.validationErrors).toEqual(validationErrors);
    });
  });

  describe('cleanup', () => {
    it('should unregister preview callback on unmount', () => {
      const { unmount } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          enableRealTimePreview: true
        })
      );

      unmount();

      expect(templateCustomizationEngine.unregisterPreviewCallback).toHaveBeenCalledWith(
        'test-template'
      );
    });
  });

  describe('auto-save', () => {
    it('should auto-save when enabled and changes are made', async () => {
      vi.useFakeTimers();

      const userId = 'user-123';
      const customizationId = 'custom-456';

      (templateCustomizationEngine.saveCustomization as any).mockResolvedValue(customizationId);

      const { result } = renderHook(() =>
        useTemplateCustomization({
          templateId: 'test-template',
          baseTemplate: mockTemplate,
          userId,
          autoSave: true,
          autoSaveDelay: 1000
        })
      );

      // Make a change
      act(() => {
        result.current.applyColorScheme(mockColorScheme);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      // Fast-forward time to trigger auto-save
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve(); // Allow async operations to complete
      });

      expect(templateCustomizationEngine.saveCustomization).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});