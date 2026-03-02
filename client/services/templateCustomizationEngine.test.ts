/**
 * Unit tests for Template Customization Engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  TemplateCustomizationEngine, 
  CustomizationData,
  TemplatePreviewUpdate 
} from './templateCustomizationEngine';
import { TemplateConfig, ColorScheme, FontCombination, LayoutOption } from './templateService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('TemplateCustomizationEngine', () => {
  let engine: TemplateCustomizationEngine;
  let mockTemplate: TemplateConfig;
  let mockColorScheme: ColorScheme;
  let mockFontCombination: FontCombination;
  let mockLayoutOption: LayoutOption;

  beforeEach(() => {
    engine = new TemplateCustomizationEngine();
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
  });

  describe('applyColorScheme', () => {
    it('should apply color scheme to template', () => {
      const result = engine.applyColorScheme(mockTemplate, mockColorScheme);

      expect(result.colors).toEqual(mockColorScheme.colors);
      expect(result.id).toBe(mockTemplate.id);
      expect(result.name).toBe(mockTemplate.name);
    });

    it('should preserve other template properties', () => {
      const result = engine.applyColorScheme(mockTemplate, mockColorScheme);

      expect(result.typography).toEqual(mockTemplate.typography);
      expect(result.layout).toEqual(mockTemplate.layout);
      expect(result.sections).toEqual(mockTemplate.sections);
    });
  });

  describe('applyFontCombination', () => {
    it('should apply font combination to template', () => {
      const result = engine.applyFontCombination(mockTemplate, mockFontCombination);

      expect(result.typography).toEqual(mockFontCombination.typography);
      expect(result.id).toBe(mockTemplate.id);
      expect(result.name).toBe(mockTemplate.name);
    });

    it('should preserve other template properties', () => {
      const result = engine.applyFontCombination(mockTemplate, mockFontCombination);

      expect(result.colors).toEqual(mockTemplate.colors);
      expect(result.layout).toEqual(mockTemplate.layout);
      expect(result.sections).toEqual(mockTemplate.sections);
    });
  });

  describe('customizeLayout', () => {
    it('should apply layout customization to template', () => {
      const result = engine.customizeLayout(mockTemplate, mockLayoutOption);

      expect(result.layout.headerStyle).toBe(mockLayoutOption.headerStyle);
      expect(result.layout.sidebarPosition).toBe(mockLayoutOption.sidebarPosition);
      expect(result.layout.cardStyle).toBe(mockLayoutOption.cardStyle);
    });

    it('should preserve section priority', () => {
      const result = engine.customizeLayout(mockTemplate, mockLayoutOption);

      expect(result.layout.sectionPriority).toEqual(mockTemplate.layout.sectionPriority);
    });
  });

  describe('applySectionCustomizations', () => {
    it('should apply section customizations', () => {
      const sectionCustomizations = [
        { sectionId: 'contact', displayName: 'Contact', isVisible: true, order: 0 },
        { sectionId: 'summary', displayName: 'Summary', isVisible: true, order: 1 },
        { sectionId: 'skills', displayName: 'Skills', isVisible: false, order: 2 }
      ];

      const result = engine.applySectionCustomizations(mockTemplate, sectionCustomizations);

      expect(result.layout.sectionPriority).toEqual(['contact', 'summary']);
    });

    it('should filter out invisible sections from required sections', () => {
      const sectionCustomizations = [
        { sectionId: 'contact', displayName: 'Contact', isVisible: false, order: 0 },
        { sectionId: 'summary', displayName: 'Summary', isVisible: true, order: 1 }
      ];

      const result = engine.applySectionCustomizations(mockTemplate, sectionCustomizations);

      expect(result.sections.required).toEqual(['summary']);
    });
  });

  describe('applyAllCustomizations', () => {
    it('should apply all customizations in correct order', () => {
      const customization: CustomizationData = {
        templateId: 'test-template',
        colorScheme: mockColorScheme,
        fontCombination: mockFontCombination,
        layoutOption: mockLayoutOption,
        customColors: { primary: '#custom-color' },
        customFonts: { headingFont: 'Custom Font' },
        lastModified: new Date()
      };

      const result = engine.applyAllCustomizations(mockTemplate, customization);

      // Should apply color scheme first, then custom colors
      expect(result.colors.primary).toBe('#custom-color');
      expect(result.colors.secondary).toBe(mockColorScheme.colors.secondary);

      // Should apply font combination first, then custom fonts
      expect(result.typography.headingFont).toBe('Custom Font');
      expect(result.typography.bodyFont).toBe(mockFontCombination.typography.bodyFont);

      // Should apply layout
      expect(result.layout.sidebarPosition).toBe(mockLayoutOption.sidebarPosition);
    });
  });

  describe('createCustomTemplate', () => {
    it('should create custom template with correct properties', () => {
      const customization: CustomizationData = {
        templateId: 'test-template',
        colorScheme: mockColorScheme,
        lastModified: new Date()
      };

      const customizationId = 'custom-123';
      const result = engine.createCustomTemplate(mockTemplate, customization, customizationId);

      expect(result.id).toBe(customizationId);
      expect(result.name).toBe('Test Template (Custom)');
      expect(result.customizationId).toBe(customizationId);
      expect(result.baseTemplateId).toBe(mockTemplate.id);
      expect(result.customization).toBe(customization);
      expect(result.isCustom).toBe(true);
      expect(result.colors).toEqual(mockColorScheme.colors);
    });
  });

  describe('preview callbacks', () => {
    it('should register and trigger preview callbacks', () => {
      const callback = vi.fn();
      const templateId = 'test-template';

      engine.registerPreviewCallback(templateId, callback);
      
      const customization = { colorScheme: mockColorScheme };
      engine.updatePreview(templateId, customization);

      expect(callback).toHaveBeenCalledWith({
        templateId,
        customization,
        previewData: undefined
      });
    });

    it('should unregister preview callbacks', () => {
      const callback = vi.fn();
      const templateId = 'test-template';

      engine.registerPreviewCallback(templateId, callback);
      engine.unregisterPreviewCallback(templateId);
      
      engine.updatePreview(templateId, {});

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('customization persistence', () => {
    it('should save customization to memory and localStorage', () => {
      const customization: CustomizationData = {
        templateId: 'test-template',
        colorScheme: mockColorScheme,
        lastModified: new Date()
      };

      const userId = 'user-123';
      const templateId = 'test-template';

      localStorageMock.getItem.mockReturnValue('{}');

      const customizationId = engine.saveCustomization(userId, templateId, customization);

      expect(customizationId).toMatch(/^user-123-test-template-\d+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'template-customizations-user-123',
        expect.any(String)
      );
    });

    it('should load customization from memory', () => {
      const customization: CustomizationData = {
        templateId: 'test-template',
        colorScheme: mockColorScheme,
        lastModified: new Date()
      };

      const userId = 'user-123';
      const templateId = 'test-template';

      localStorageMock.getItem.mockReturnValue('{}');

      const customizationId = engine.saveCustomization(userId, templateId, customization);
      const loaded = engine.loadCustomization(customizationId);

      expect(loaded).toEqual(expect.objectContaining({
        templateId,
        colorScheme: mockColorScheme
      }));
    });

    it('should delete customization', () => {
      const customization: CustomizationData = {
        templateId: 'test-template',
        lastModified: new Date()
      };

      const userId = 'user-123';
      const templateId = 'test-template';

      localStorageMock.getItem.mockReturnValue('{}');

      const customizationId = engine.saveCustomization(userId, templateId, customization);
      const deleted = engine.deleteCustomization(userId, customizationId);

      expect(deleted).toBe(true);
      expect(engine.loadCustomization(customizationId)).toBeNull();
    });
  });

  describe('validation', () => {
    it('should validate valid customization', () => {
      const customization: Partial<CustomizationData> = {
        colorScheme: mockColorScheme,
        fontCombination: mockFontCombination,
        layoutOption: mockLayoutOption
      };

      const result = engine.validateCustomization(customization);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing color properties', () => {
      const invalidColorScheme = {
        id: 'invalid',
        name: 'Invalid',
        colors: {
          primary: '#ff0000'
          // Missing other required colors
        }
      };

      const customization: Partial<CustomizationData> = {
        colorScheme: invalidColorScheme as ColorScheme
      };

      const result = engine.validateCustomization(customization);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Missing required colors');
    });

    it('should detect invalid sidebar position', () => {
      const invalidLayoutOption = {
        ...mockLayoutOption,
        sidebarPosition: 'invalid' as any
      };

      const customization: Partial<CustomizationData> = {
        layoutOption: invalidLayoutOption
      };

      const result = engine.validateCustomization(customization);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid sidebar position');
    });
  });

  describe('default options', () => {
    it('should provide default color schemes', () => {
      const options = engine.getDefaultCustomizationOptions(mockTemplate);

      expect(options.colorSchemes).toHaveLength(5);
      expect(options.colorSchemes[0]).toHaveProperty('id');
      expect(options.colorSchemes[0]).toHaveProperty('name');
      expect(options.colorSchemes[0]).toHaveProperty('colors');
    });

    it('should provide default font combinations', () => {
      const options = engine.getDefaultCustomizationOptions(mockTemplate);

      expect(options.fontCombinations).toHaveLength(5);
      expect(options.fontCombinations[0]).toHaveProperty('id');
      expect(options.fontCombinations[0]).toHaveProperty('name');
      expect(options.fontCombinations[0]).toHaveProperty('typography');
    });

    it('should provide default layout options', () => {
      const options = engine.getDefaultCustomizationOptions(mockTemplate);

      expect(options.layoutOptions).toHaveLength(4);
      expect(options.layoutOptions[0]).toHaveProperty('id');
      expect(options.layoutOptions[0]).toHaveProperty('name');
      expect(options.layoutOptions[0]).toHaveProperty('sidebarPosition');
    });
  });
});