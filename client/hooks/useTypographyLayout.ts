import { useState, useEffect, useCallback } from 'react';
import { TypographyLayoutConfig, TypographySettings, LayoutSettings } from '@/components/templates/customization/TypographyCustomizer';

export interface UseTypographyLayoutOptions {
  templateId?: string;
  userId?: string;
  persistToStorage?: boolean;
  autoApply?: boolean;
}

export interface UseTypographyLayoutReturn {
  currentConfig: TypographyLayoutConfig;
  availableConfigs: TypographyLayoutConfig[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConfig: (config: TypographyLayoutConfig) => void;
  saveConfig: (config: TypographyLayoutConfig) => Promise<void>;
  loadConfig: (configId: string) => Promise<void>;
  resetToDefault: () => void;
  previewConfig: (config: TypographyLayoutConfig) => void;
  applyConfig: (config: TypographyLayoutConfig) => void;
  
  // Utilities
  validateConfig: (config: TypographyLayoutConfig) => { isValid: boolean; issues: string[] };
  generateResponsiveCSS: (config: TypographyLayoutConfig) => string;
}

// Default configuration
const DEFAULT_CONFIG: TypographyLayoutConfig = {
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
  },
  isDefault: true
};

// Storage keys
const STORAGE_KEYS = {
  CURRENT_CONFIG: 'cvzen-typography-layout-config',
  CUSTOM_CONFIGS: 'cvzen-custom-typography-configs'
};

// Font family mappings
const FONT_FAMILIES = {
  'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'inter': '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
  'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  'lato': '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
  'source-sans': '"Source Sans Pro", -apple-system, BlinkMacSystemFont, sans-serif',
  'nunito': '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
  'georgia': 'Georgia, "Times New Roman", Times, serif',
  'times': '"Times New Roman", Times, serif',
  'arial': 'Arial, Helvetica, sans-serif',
  'helvetica': 'Helvetica, Arial, sans-serif'
};

// Font size mappings
const FONT_SIZES = {
  small: { base: 14, scale: 1.125 },
  medium: { base: 16, scale: 1.25 },
  large: { base: 18, scale: 1.333 }
};

// Layout density mappings
const DENSITY_MULTIPLIERS = {
  compact: 0.75,
  standard: 1.0,
  spacious: 1.5
};

// Max width mappings
const MAX_WIDTHS = {
  narrow: '42rem',   // ~672px
  standard: '56rem', // ~896px
  wide: '72rem'      // ~1152px
};

/**
 * Hook for managing typography and layout settings with persistence and validation
 */
export function useTypographyLayout(options: UseTypographyLayoutOptions = {}): UseTypographyLayoutReturn {
  const {
    templateId,
    userId,
    persistToStorage = true,
    autoApply = true
  } = options;

  const [currentConfig, setCurrentConfig] = useState<TypographyLayoutConfig>(DEFAULT_CONFIG);
  const [availableConfigs, setAvailableConfigs] = useState<TypographyLayoutConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial configuration
  useEffect(() => {
    loadInitialConfig();
  }, [templateId, userId]);

  // Apply configuration to DOM when it changes
  useEffect(() => {
    if (autoApply) {
      applyConfigToDOM(currentConfig);
    }
  }, [currentConfig, autoApply]);

  // Load initial configuration from storage
  const loadInitialConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load saved configuration
      let savedConfig: TypographyLayoutConfig | null = null;

      if (persistToStorage) {
        const storageKey = templateId ? `${STORAGE_KEYS.CURRENT_CONFIG}-${templateId}` : STORAGE_KEYS.CURRENT_CONFIG;
        const savedConfigData = localStorage.getItem(storageKey);
        
        if (savedConfigData) {
          try {
            savedConfig = JSON.parse(savedConfigData);
          } catch (e) {
            console.warn('Failed to parse saved typography config:', e);
          }
        }
      }

      // Load custom configurations
      const customConfigsData = localStorage.getItem(STORAGE_KEYS.CUSTOM_CONFIGS);
      let customConfigs: TypographyLayoutConfig[] = [];
      
      if (customConfigsData) {
        try {
          customConfigs = JSON.parse(customConfigsData);
        } catch (e) {
          console.warn('Failed to parse custom typography configs:', e);
        }
      }

      // Set available configurations (predefined + custom)
      setAvailableConfigs([...getPredefinedConfigs(), ...customConfigs]);

      // Set current configuration
      if (savedConfig) {
        setCurrentConfig(savedConfig);
      } else {
        setCurrentConfig(DEFAULT_CONFIG);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load typography configuration');
      console.error('Error loading typography configuration:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Set configuration
  const setConfig = useCallback((config: TypographyLayoutConfig) => {
    setCurrentConfig(config);
    
    if (persistToStorage) {
      const storageKey = templateId ? `${STORAGE_KEYS.CURRENT_CONFIG}-${templateId}` : STORAGE_KEYS.CURRENT_CONFIG;
      localStorage.setItem(storageKey, JSON.stringify(config));
    }
  }, [templateId, persistToStorage]);

  // Save custom configuration
  const saveConfig = useCallback(async (config: TypographyLayoutConfig) => {
    try {
      setError(null);
      
      // Validate configuration
      const validation = validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.issues.join(', ')}`);
      }

      // Add to custom configurations
      const customConfigsData = localStorage.getItem(STORAGE_KEYS.CUSTOM_CONFIGS);
      let customConfigs: TypographyLayoutConfig[] = [];
      
      if (customConfigsData) {
        customConfigs = JSON.parse(customConfigsData);
      }

      // Remove existing configuration with same ID
      customConfigs = customConfigs.filter(c => c.id !== config.id);
      
      // Add new configuration
      customConfigs.push(config);
      
      // Save to storage
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CONFIGS, JSON.stringify(customConfigs));
      
      // Update available configurations
      setAvailableConfigs([...getPredefinedConfigs(), ...customConfigs]);
      
      // Set as current configuration
      setCurrentConfig(config);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save typography configuration');
      throw err;
    }
  }, []);

  // Load specific configuration
  const loadConfig = useCallback(async (configId: string) => {
    try {
      setError(null);
      
      const config = availableConfigs.find(c => c.id === configId);
      if (!config) {
        throw new Error(`Configuration not found: ${configId}`);
      }
      
      setCurrentConfig(config);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load typography configuration');
      throw err;
    }
  }, [availableConfigs]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setCurrentConfig(DEFAULT_CONFIG);
    
    // Clear storage
    if (persistToStorage) {
      const storageKey = templateId ? `${STORAGE_KEYS.CURRENT_CONFIG}-${templateId}` : STORAGE_KEYS.CURRENT_CONFIG;
      localStorage.removeItem(storageKey);
    }
  }, [templateId, persistToStorage]);

  // Preview configuration (temporary application)
  const previewConfig = useCallback((config: TypographyLayoutConfig) => {
    applyConfigToDOM(config);
  }, []);

  // Apply configuration permanently
  const applyConfig = useCallback((config: TypographyLayoutConfig) => {
    setConfig(config);
  }, [setConfig]);

  // Validate configuration
  const validateConfig = useCallback((config: TypographyLayoutConfig): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check required properties
    if (!config.id) issues.push('Configuration ID is required');
    if (!config.name) issues.push('Configuration name is required');
    if (!config.typography) issues.push('Typography settings are required');
    if (!config.layout) issues.push('Layout settings are required');
    
    // Typography validation
    if (config.typography.fontSizeScale < 0.8) {
      issues.push('Font size scale is too small for accessibility');
    }
    if (config.typography.fontSizeScale > 1.5) {
      issues.push('Font size scale is too large and may break layout');
    }
    if (config.typography.lineHeight < 1.2) {
      issues.push('Line height is too tight for comfortable reading');
    }
    if (config.typography.lineHeight > 2.5) {
      issues.push('Line height is too loose and may impact readability');
    }
    if (Math.abs(config.typography.letterSpacing) > 0.1) {
      issues.push('Letter spacing is too extreme and may impact readability');
    }
    
    // Layout validation
    if (config.layout.sectionSpacing < 0.5) {
      issues.push('Section spacing is too tight');
    }
    if (config.layout.sectionSpacing > 5) {
      issues.push('Section spacing is too large');
    }
    if (config.layout.cardPadding < 0.5) {
      issues.push('Card padding is too small for touch targets');
    }
    if (config.layout.cardPadding > 4) {
      issues.push('Card padding is too large');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, []);

  // Generate responsive CSS
  const generateResponsiveCSS = useCallback((config: TypographyLayoutConfig): string => {
    const { typography, layout } = config;
    const fontFamily = FONT_FAMILIES[typography.fontFamily as keyof typeof FONT_FAMILIES] || FONT_FAMILIES.system;
    const fontSize = FONT_SIZES[typography.fontSize];
    const densityMultiplier = DENSITY_MULTIPLIERS[layout.density];
    const maxWidth = MAX_WIDTHS[layout.maxWidth];

    return `
      :root {
        /* Typography Variables */
        --font-family-primary: ${fontFamily};
        --font-size-base: ${fontSize.base * typography.fontSizeScale}px;
        --font-size-scale: ${fontSize.scale};
        --line-height-base: ${typography.lineHeight};
        --letter-spacing-base: ${typography.letterSpacing}em;
        --font-weight-heading: ${getFontWeight(typography.headingWeight)};
        --font-weight-body: ${getFontWeight(typography.bodyWeight)};
        
        /* Layout Variables */
        --layout-max-width: ${maxWidth};
        --layout-section-spacing: ${layout.sectionSpacing * densityMultiplier}rem;
        --layout-card-padding: ${layout.cardPadding * densityMultiplier}rem;
        --layout-border-radius: ${layout.borderRadius}rem;
        --layout-density-multiplier: ${densityMultiplier};
        
        /* Computed Font Sizes */
        --font-size-xs: calc(var(--font-size-base) / var(--font-size-scale) / var(--font-size-scale));
        --font-size-sm: calc(var(--font-size-base) / var(--font-size-scale));
        --font-size-base: var(--font-size-base);
        --font-size-lg: calc(var(--font-size-base) * var(--font-size-scale));
        --font-size-xl: calc(var(--font-size-base) * var(--font-size-scale) * var(--font-size-scale));
        --font-size-2xl: calc(var(--font-size-base) * var(--font-size-scale) * var(--font-size-scale) * var(--font-size-scale));
        --font-size-3xl: calc(var(--font-size-base) * var(--font-size-scale) * var(--font-size-scale) * var(--font-size-scale) * var(--font-size-scale));
      }
      
      /* Apply Typography */
      .template-container {
        font-family: var(--font-family-primary);
        font-size: var(--font-size-base);
        line-height: var(--line-height-base);
        letter-spacing: var(--letter-spacing-base);
        max-width: var(--layout-max-width);
      }
      
      .template-container h1 {
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-heading);
        line-height: calc(var(--line-height-base) * 0.9);
      }
      
      .template-container h2 {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-heading);
        line-height: calc(var(--line-height-base) * 0.95);
      }
      
      .template-container h3 {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-heading);
      }
      
      .template-container h4 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-heading);
      }
      
      .template-container p,
      .template-container li,
      .template-container span {
        font-weight: var(--font-weight-body);
      }
      
      /* Apply Layout */
      .template-section {
        margin-bottom: var(--layout-section-spacing);
      }
      
      .template-card {
        padding: var(--layout-card-padding);
        border-radius: var(--layout-border-radius);
      }
      
      /* Responsive Adjustments */
      @media (max-width: 768px) {
        :root {
          --font-size-base: calc(${fontSize.base * typography.fontSizeScale}px * 0.9);
          --layout-section-spacing: calc(${layout.sectionSpacing * densityMultiplier}rem * 0.8);
          --layout-card-padding: calc(${layout.cardPadding * densityMultiplier}rem * 0.8);
        }
      }
      
      @media (max-width: 480px) {
        :root {
          --font-size-base: calc(${fontSize.base * typography.fontSizeScale}px * 0.85);
          --layout-section-spacing: calc(${layout.sectionSpacing * densityMultiplier}rem * 0.7);
          --layout-card-padding: calc(${layout.cardPadding * densityMultiplier}rem * 0.7);
        }
      }
    `;
  }, []);

  return {
    currentConfig,
    availableConfigs,
    isLoading,
    error,
    
    setConfig,
    saveConfig,
    loadConfig,
    resetToDefault,
    previewConfig,
    applyConfig,
    
    validateConfig,
    generateResponsiveCSS
  };
}

// Utility functions
function getPredefinedConfigs(): TypographyLayoutConfig[] {
  return [
    {
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
      },
      isDefault: true
    },
    {
      id: 'compact-professional',
      name: 'Compact Professional',
      typography: {
        fontFamily: 'system',
        fontSize: 'small',
        fontSizeScale: 0.9,
        lineHeight: 1.5,
        letterSpacing: 0,
        headingWeight: 'bold',
        bodyWeight: 'normal'
      },
      layout: {
        density: 'compact',
        maxWidth: 'narrow',
        sectionSpacing: 1,
        cardPadding: 1,
        borderRadius: 0.25
      }
    },
    {
      id: 'spacious-elegant',
      name: 'Spacious Elegant',
      typography: {
        fontFamily: 'georgia',
        fontSize: 'large',
        fontSizeScale: 1.1,
        lineHeight: 1.7,
        letterSpacing: 0.025,
        headingWeight: 'medium',
        bodyWeight: 'normal'
      },
      layout: {
        density: 'spacious',
        maxWidth: 'wide',
        sectionSpacing: 3,
        cardPadding: 2,
        borderRadius: 0.75
      }
    }
  ];
}

function getFontWeight(weight: string): number {
  const weights = {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  };
  return weights[weight as keyof typeof weights] || 400;
}

function applyConfigToDOM(config: TypographyLayoutConfig): void {
  const root = document.documentElement;
  const { typography, layout } = config;
  
  // Apply typography variables
  const fontFamily = FONT_FAMILIES[typography.fontFamily as keyof typeof FONT_FAMILIES] || FONT_FAMILIES.system;
  const fontSize = FONT_SIZES[typography.fontSize];
  const densityMultiplier = DENSITY_MULTIPLIERS[layout.density];
  const maxWidth = MAX_WIDTHS[layout.maxWidth];
  
  root.style.setProperty('--font-family-primary', fontFamily);
  root.style.setProperty('--font-size-base', `${fontSize.base * typography.fontSizeScale}px`);
  root.style.setProperty('--font-size-scale', fontSize.scale.toString());
  root.style.setProperty('--line-height-base', typography.lineHeight.toString());
  root.style.setProperty('--letter-spacing-base', `${typography.letterSpacing}em`);
  root.style.setProperty('--font-weight-heading', getFontWeight(typography.headingWeight).toString());
  root.style.setProperty('--font-weight-body', getFontWeight(typography.bodyWeight).toString());
  
  // Apply layout variables
  root.style.setProperty('--layout-max-width', maxWidth);
  root.style.setProperty('--layout-section-spacing', `${layout.sectionSpacing * densityMultiplier}rem`);
  root.style.setProperty('--layout-card-padding', `${layout.cardPadding * densityMultiplier}rem`);
  root.style.setProperty('--layout-border-radius', `${layout.borderRadius}rem`);
  root.style.setProperty('--layout-density-multiplier', densityMultiplier.toString());
  
  // Apply computed font sizes
  root.style.setProperty('--font-size-xs', `calc(var(--font-size-base) / var(--font-size-scale) / var(--font-size-scale))`);
  root.style.setProperty('--font-size-sm', `calc(var(--font-size-base) / var(--font-size-scale))`);
  root.style.setProperty('--font-size-lg', `calc(var(--font-size-base) * var(--font-size-scale))`);
  root.style.setProperty('--font-size-xl', `calc(var(--font-size-base) * var(--font-size-scale) * var(--font-size-scale))`);
  root.style.setProperty('--font-size-2xl', `calc(var(--font-size-base) * var(--font-size-scale) * var(--font-size-scale) * var(--font-size-scale))`);
  root.style.setProperty('--font-size-3xl', `calc(var(--font-size-base) * var(--font-size-scale) * var(--font-size-scale) * var(--font-size-scale) * var(--font-size-scale))`);
}