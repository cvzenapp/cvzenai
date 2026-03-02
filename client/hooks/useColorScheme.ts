import { useState, useEffect, useCallback } from 'react';
import { ColorScheme } from '@/components/templates/customization/ColorSchemeCustomizer';

export interface UseColorSchemeOptions {
  templateId?: string;
  userId?: string;
  persistToStorage?: boolean;
  autoApply?: boolean;
}

export interface UseColorSchemeReturn {
  currentScheme: ColorScheme;
  availableSchemes: ColorScheme[];
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setColorScheme: (scheme: ColorScheme) => void;
  toggleDarkMode: () => void;
  saveScheme: (scheme: ColorScheme) => Promise<void>;
  loadScheme: (schemeId: string) => Promise<void>;
  resetToDefault: () => void;
  previewScheme: (scheme: ColorScheme) => void;
  applyScheme: (scheme: ColorScheme) => void;
  
  // Utilities
  validateScheme: (scheme: ColorScheme) => { isValid: boolean; issues: string[] };
  generateDarkVariant: (lightScheme: ColorScheme) => ColorScheme;
}

// Default color scheme
const DEFAULT_SCHEME: ColorScheme = {
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
};

// Storage keys
const STORAGE_KEYS = {
  CURRENT_SCHEME: 'cvzen-color-scheme',
  CUSTOM_SCHEMES: 'cvzen-custom-schemes',
  DARK_MODE_PREFERENCE: 'cvzen-dark-mode'
};

/**
 * Hook for managing color schemes with persistence and validation
 */
export function useColorScheme(options: UseColorSchemeOptions = {}): UseColorSchemeReturn {
  const {
    templateId,
    userId,
    persistToStorage = true,
    autoApply = true
  } = options;

  const [currentScheme, setCurrentScheme] = useState<ColorScheme>(DEFAULT_SCHEME);
  const [availableSchemes, setAvailableSchemes] = useState<ColorScheme[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial color scheme and preferences
  useEffect(() => {
    loadInitialScheme();
  }, [templateId, userId]);

  // Apply color scheme to DOM when it changes
  useEffect(() => {
    if (autoApply) {
      applySchemeToDOM(currentScheme);
    }
  }, [currentScheme, autoApply]);

  // Load initial scheme from storage or API
  const loadInitialScheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for user preference for dark mode
      const darkModePreference = localStorage.getItem(STORAGE_KEYS.DARK_MODE_PREFERENCE);
      if (darkModePreference !== null) {
        setIsDarkMode(JSON.parse(darkModePreference));
      } else {
        // Check system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
      }

      // Load saved scheme
      let savedScheme: ColorScheme | null = null;

      if (persistToStorage) {
        const storageKey = templateId ? `${STORAGE_KEYS.CURRENT_SCHEME}-${templateId}` : STORAGE_KEYS.CURRENT_SCHEME;
        const savedSchemeData = localStorage.getItem(storageKey);
        
        if (savedSchemeData) {
          try {
            savedScheme = JSON.parse(savedSchemeData);
          } catch (e) {
            console.warn('Failed to parse saved color scheme:', e);
          }
        }
      }

      // Load custom schemes
      const customSchemesData = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCHEMES);
      let customSchemes: ColorScheme[] = [];
      
      if (customSchemesData) {
        try {
          customSchemes = JSON.parse(customSchemesData);
        } catch (e) {
          console.warn('Failed to parse custom schemes:', e);
        }
      }

      // Set available schemes (predefined + custom)
      setAvailableSchemes([...getPredefinedSchemes(), ...customSchemes]);

      // Set current scheme
      if (savedScheme) {
        setCurrentScheme(savedScheme);
      } else {
        const defaultScheme = isDarkMode ? generateDarkVariant(DEFAULT_SCHEME) : DEFAULT_SCHEME;
        setCurrentScheme(defaultScheme);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load color scheme');
      console.error('Error loading color scheme:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Set color scheme
  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setCurrentScheme(scheme);
    
    if (persistToStorage) {
      const storageKey = templateId ? `${STORAGE_KEYS.CURRENT_SCHEME}-${templateId}` : STORAGE_KEYS.CURRENT_SCHEME;
      localStorage.setItem(storageKey, JSON.stringify(scheme));
    }
  }, [templateId, persistToStorage]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save preference
    localStorage.setItem(STORAGE_KEYS.DARK_MODE_PREFERENCE, JSON.stringify(newDarkMode));
    
    // Update current scheme
    const updatedScheme = newDarkMode && !currentScheme.isDark 
      ? generateDarkVariant(currentScheme)
      : !newDarkMode && currentScheme.isDark
        ? generateLightVariant(currentScheme)
        : currentScheme;
    
    setCurrentScheme(updatedScheme);
  }, [isDarkMode, currentScheme]);

  // Save custom scheme
  const saveScheme = useCallback(async (scheme: ColorScheme) => {
    try {
      setError(null);
      
      // Validate scheme
      const validation = validateScheme(scheme);
      if (!validation.isValid) {
        throw new Error(`Invalid color scheme: ${validation.issues.join(', ')}`);
      }

      // Add to custom schemes
      const customSchemesData = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCHEMES);
      let customSchemes: ColorScheme[] = [];
      
      if (customSchemesData) {
        customSchemes = JSON.parse(customSchemesData);
      }

      // Remove existing scheme with same ID
      customSchemes = customSchemes.filter(s => s.id !== scheme.id);
      
      // Add new scheme
      customSchemes.push(scheme);
      
      // Save to storage
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SCHEMES, JSON.stringify(customSchemes));
      
      // Update available schemes
      setAvailableSchemes([...getPredefinedSchemes(), ...customSchemes]);
      
      // Set as current scheme
      setCurrentScheme(scheme);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save color scheme');
      throw err;
    }
  }, []);

  // Load specific scheme
  const loadScheme = useCallback(async (schemeId: string) => {
    try {
      setError(null);
      
      const scheme = availableSchemes.find(s => s.id === schemeId);
      if (!scheme) {
        throw new Error(`Color scheme not found: ${schemeId}`);
      }
      
      setCurrentScheme(scheme);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load color scheme');
      throw err;
    }
  }, [availableSchemes]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    const defaultScheme = isDarkMode ? generateDarkVariant(DEFAULT_SCHEME) : DEFAULT_SCHEME;
    setCurrentScheme(defaultScheme);
    
    // Clear storage
    if (persistToStorage) {
      const storageKey = templateId ? `${STORAGE_KEYS.CURRENT_SCHEME}-${templateId}` : STORAGE_KEYS.CURRENT_SCHEME;
      localStorage.removeItem(storageKey);
    }
  }, [isDarkMode, templateId, persistToStorage]);

  // Preview scheme (temporary application)
  const previewScheme = useCallback((scheme: ColorScheme) => {
    applySchemeToDOM(scheme);
  }, []);

  // Apply scheme permanently
  const applyScheme = useCallback((scheme: ColorScheme) => {
    setColorScheme(scheme);
  }, [setColorScheme]);

  // Validate color scheme
  const validateScheme = useCallback((scheme: ColorScheme): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check required properties
    if (!scheme.id) issues.push('Scheme ID is required');
    if (!scheme.name) issues.push('Scheme name is required');
    if (!scheme.colors) issues.push('Colors object is required');
    
    // Check color format
    const colorKeys = ['primary', 'secondary', 'accent', 'text', 'background', 'muted', 'border'];
    for (const key of colorKeys) {
      const color = scheme.colors[key as keyof ColorScheme['colors']];
      if (!color || !isValidHexColor(color)) {
        issues.push(`Invalid ${key} color: ${color}`);
      }
    }
    
    // Check accessibility
    if (scheme.contrastRatio < 3.0) {
      issues.push('Contrast ratio is below minimum accessibility standards');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, []);

  // Generate dark variant
  const generateDarkVariant = useCallback((lightScheme: ColorScheme): ColorScheme => {
    return {
      ...lightScheme,
      id: `${lightScheme.id}-dark`,
      name: `${lightScheme.name} (Dark)`,
      colors: {
        ...lightScheme.colors,
        text: '#F8FAFC',
        background: '#0F172A',
        muted: '#1E293B',
        border: '#334155',
        primary: lightenColor(lightScheme.colors.primary, 20),
        secondary: lightenColor(lightScheme.colors.secondary, 15),
        accent: lightenColor(lightScheme.colors.accent, 10)
      },
      isDark: true
    };
  }, []);

  return {
    currentScheme,
    availableSchemes,
    isDarkMode,
    isLoading,
    error,
    
    setColorScheme,
    toggleDarkMode,
    saveScheme,
    loadScheme,
    resetToDefault,
    previewScheme,
    applyScheme,
    
    validateScheme,
    generateDarkVariant
  };
}

// Utility functions
function getPredefinedSchemes(): ColorScheme[] {
  return [
    {
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
    {
      id: 'corporate-gray',
      name: 'Corporate Gray',
      colors: {
        primary: '#6B7280',
        secondary: '#9CA3AF',
        accent: '#F59E0B',
        text: '#1F2937',
        background: '#FFFFFF',
        muted: '#F9FAFB',
        border: '#D1D5DB'
      },
      isDark: false,
      isAccessible: true,
      contrastRatio: 4.6
    },
    {
      id: 'creative-purple',
      name: 'Creative Purple',
      colors: {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#EC4899',
        text: '#1F2937',
        background: '#FFFFFF',
        muted: '#FAF5FF',
        border: '#E9D5FF'
      },
      isDark: false,
      isAccessible: true,
      contrastRatio: 4.5
    }
  ];
}

function generateLightVariant(darkScheme: ColorScheme): ColorScheme {
  return {
    ...darkScheme,
    id: darkScheme.id.replace('-dark', ''),
    name: darkScheme.name.replace(' (Dark)', ''),
    colors: {
      ...darkScheme.colors,
      text: '#1F2937',
      background: '#FFFFFF',
      muted: '#F8FAFC',
      border: '#E2E8F0',
      primary: darkenColor(darkScheme.colors.primary, 20),
      secondary: darkenColor(darkScheme.colors.secondary, 15),
      accent: darkenColor(darkScheme.colors.accent, 10)
    },
    isDark: false
  };
}

function applySchemeToDOM(scheme: ColorScheme): void {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--color-primary', scheme.colors.primary);
  root.style.setProperty('--color-secondary', scheme.colors.secondary);
  root.style.setProperty('--color-accent', scheme.colors.accent);
  root.style.setProperty('--color-text', scheme.colors.text);
  root.style.setProperty('--color-background', scheme.colors.background);
  root.style.setProperty('--color-muted', scheme.colors.muted);
  root.style.setProperty('--color-border', scheme.colors.border);
  
  // Apply template-specific variables
  root.style.setProperty('--template-primary-color', scheme.colors.primary);
  root.style.setProperty('--template-secondary-color', scheme.colors.secondary);
  root.style.setProperty('--template-accent-color', scheme.colors.accent);
  root.style.setProperty('--text-slate-700', scheme.colors.text);
  root.style.setProperty('--template-background-color', scheme.colors.background);
  root.style.setProperty('--template-muted-color', scheme.colors.muted);
  root.style.setProperty('--template-border-color', scheme.colors.border);
}

function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B))
    .toString(16).slice(1);
}