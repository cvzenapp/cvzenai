import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Accessibility configuration interface
export interface AccessibilityConfig {
  contrastRatio: 'normal' | 'high' | 'maximum';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  colorBlindFriendly: boolean;
  darkMode: boolean;
}

// User preferences interface
export interface UserPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  fontSize: number;
}

// Accessibility context interface
interface AccessibilityContextType {
  config: AccessibilityConfig;
  userPreferences: UserPreferences;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  validateContrast: (foreground: string, background: string) => boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (element: HTMLElement | null) => void;
  isAccessibilityCompliant: () => boolean;
}

// Create accessibility context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Default accessibility configuration
const defaultConfig: AccessibilityConfig = {
  contrastRatio: 'normal',
  fontSize: 'medium',
  reducedMotion: false,
  screenReaderOptimized: true,
  keyboardNavigation: true,
  focusVisible: true,
  colorBlindFriendly: false,
  darkMode: false,
};

// Accessibility Provider Props
interface AccessibilityProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AccessibilityConfig>;
}

/**
 * AccessibilityProvider - Provides accessibility configuration and utilities
 * 
 * Features:
 * - WCAG 2.1 AA compliance monitoring
 * - User preference detection and adaptation
 * - Contrast ratio validation
 * - Screen reader announcements
 * - Focus management utilities
 * - Keyboard navigation support
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<AccessibilityConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorScheme: 'no-preference',
    fontSize: 16,
  });

  // Screen reader announcement element
  const [announcementElement, setAnnouncementElement] = useState<HTMLElement | null>(null);

  // Detect user preferences on mount
  useEffect(() => {
    const detectUserPreferences = (): UserPreferences => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : window.matchMedia('(prefers-color-scheme: light)').matches 
        ? 'light' 
        : 'no-preference';
      
      // Get font size from computed style or default
      const fontSize = parseInt(getComputedStyle(document.documentElement).fontSize) || 16;

      return {
        prefersReducedMotion,
        prefersHighContrast,
        prefersColorScheme,
        fontSize,
      };
    };

    const preferences = detectUserPreferences();
    setUserPreferences(preferences);

    // Update config based on user preferences, but don't override explicit initial config
    setConfig(prev => ({
      ...prev,
      reducedMotion: initialConfig.reducedMotion !== undefined ? prev.reducedMotion : preferences.prefersReducedMotion,
      contrastRatio: initialConfig.contrastRatio !== undefined ? prev.contrastRatio : (preferences.prefersHighContrast ? 'high' : prev.contrastRatio),
      darkMode: initialConfig.darkMode !== undefined ? prev.darkMode : preferences.prefersColorScheme === 'dark',
    }));

    // Create screen reader announcement element
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    setAnnouncementElement(announcer);

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
    ];

    const handlePreferenceChange = () => {
      const newPreferences = detectUserPreferences();
      setUserPreferences(newPreferences);
      
      setConfig(prev => ({
        ...prev,
        reducedMotion: newPreferences.prefersReducedMotion,
        contrastRatio: newPreferences.prefersHighContrast ? 'high' : prev.contrastRatio,
        darkMode: newPreferences.prefersColorScheme === 'dark',
      }));
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handlePreferenceChange));

    // Cleanup
    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handlePreferenceChange));
      if (announcer && document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    };
  }, []);

  // Apply accessibility configuration to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply CSS custom properties for accessibility
    root.style.setProperty('--a11y-contrast-ratio', config.contrastRatio);
    root.style.setProperty('--a11y-font-size', config.fontSize);
    root.style.setProperty('--a11y-reduced-motion', config.reducedMotion ? 'reduce' : 'no-preference');
    root.style.setProperty('--a11y-focus-visible', config.focusVisible ? 'visible' : 'hidden');
    
    // Apply accessibility classes
    root.classList.toggle('a11y-high-contrast', config.contrastRatio === 'high' || config.contrastRatio === 'maximum');
    root.classList.toggle('a11y-large-text', config.fontSize === 'large' || config.fontSize === 'extra-large');
    root.classList.toggle('a11y-reduced-motion', config.reducedMotion);
    root.classList.toggle('a11y-screen-reader-optimized', config.screenReaderOptimized);
    root.classList.toggle('a11y-keyboard-navigation', config.keyboardNavigation);
    root.classList.toggle('a11y-color-blind-friendly', config.colorBlindFriendly);
    root.classList.toggle('dark', config.darkMode);
  }, [config]);

  // Update configuration
  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Validate contrast ratio between two colors
  const validateContrast = (foreground: string, background: string): boolean => {
    try {
      const ratio = calculateContrastRatio(foreground, background);
      const minRatio = getMinimumContrastRatio(config.contrastRatio);
      return ratio >= minRatio;
    } catch (error) {
      console.warn('Failed to validate contrast ratio:', error);
      return false;
    }
  };

  // Announce message to screen readers
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementElement || !config.screenReaderOptimized) return;

    announcementElement.setAttribute('aria-live', priority);
    announcementElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementElement) {
        announcementElement.textContent = '';
      }
    }, 1000);
  };

  // Focus element with proper management
  const focusElement = (element: HTMLElement | null) => {
    if (!element || !config.keyboardNavigation) return;

    try {
      element.focus();
      
      // Ensure focus is visible if configured
      if (config.focusVisible) {
        element.classList.add('focus-visible');
        setTimeout(() => element.classList.remove('focus-visible'), 100);
      }
    } catch (error) {
      console.warn('Failed to focus element:', error);
    }
  };

  // Check overall accessibility compliance
  const isAccessibilityCompliant = (): boolean => {
    return (
      config.screenReaderOptimized &&
      config.keyboardNavigation &&
      config.focusVisible &&
      (config.contrastRatio === 'normal' || config.contrastRatio === 'high' || config.contrastRatio === 'maximum')
    );
  };

  const contextValue: AccessibilityContextType = {
    config,
    userPreferences,
    updateConfig,
    validateContrast,
    announceToScreenReader,
    focusElement,
    isAccessibilityCompliant,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Utility functions for contrast calculation
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    throw new Error('Invalid color format');
  }
  
  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getMinimumContrastRatio(level: AccessibilityConfig['contrastRatio']): number {
  switch (level) {
    case 'high':
      return 7; // WCAG AAA
    case 'maximum':
      return 10; // Enhanced accessibility
    case 'normal':
    default:
      return 4.5; // WCAG AA
  }
}

export default AccessibilityProvider;