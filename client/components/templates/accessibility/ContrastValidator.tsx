import React, { useEffect, useState, useCallback } from 'react';
import { useAccessibility } from './AccessibilityProvider';

// Color contrast validation result
export interface ContrastValidationResult {
  ratio: number;
  isValid: boolean;
  level: 'AA' | 'AAA' | 'fail';
  recommendation?: string;
}

// Contrast validator props
export interface ContrastValidatorProps {
  foreground: string;
  background: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  onValidationChange?: (result: ContrastValidationResult) => void;
  showWarnings?: boolean;
  className?: string;
}

/**
 * ContrastValidator - Validates and monitors color contrast ratios
 * 
 * Features:
 * - Real-time WCAG 2.1 contrast ratio validation
 * - AA and AAA compliance checking
 * - Font size and weight consideration
 * - Automatic color suggestions for compliance
 * - Visual indicators for accessibility issues
 * - Developer warnings and recommendations
 */
export const ContrastValidator: React.FC<ContrastValidatorProps> = ({
  foreground,
  background,
  fontSize = 16,
  fontWeight = 'normal',
  onValidationChange,
  showWarnings = true,
  className = '',
}) => {
  const { config, validateContrast } = useAccessibility();
  const [validationResult, setValidationResult] = useState<ContrastValidationResult | null>(null);

  // Calculate contrast ratio and validation
  const validateColors = useCallback(() => {
    try {
      const ratio = calculateContrastRatio(foreground, background);
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
      
      // WCAG 2.1 requirements
      const aaRequirement = isLargeText ? 3 : 4.5;
      const aaaRequirement = isLargeText ? 4.5 : 7;
      
      let level: 'AA' | 'AAA' | 'fail';
      let recommendation: string | undefined;
      
      if (ratio >= aaaRequirement) {
        level = 'AAA';
      } else if (ratio >= aaRequirement) {
        level = 'AA';
      } else {
        level = 'fail';
        recommendation = generateRecommendation(ratio, aaRequirement, foreground, background);
      }
      
      const result: ContrastValidationResult = {
        ratio,
        isValid: ratio >= aaRequirement,
        level,
        recommendation,
      };
      
      setValidationResult(result);
      onValidationChange?.(result);
      
      return result;
    } catch (error) {
      console.warn('Contrast validation failed:', error);
      const failResult: ContrastValidationResult = {
        ratio: 0,
        isValid: false,
        level: 'fail',
        recommendation: 'Unable to validate colors. Please check color format.',
      };
      setValidationResult(failResult);
      onValidationChange?.(failResult);
      return failResult;
    }
  }, [foreground, background, fontSize, fontWeight, onValidationChange]);

  // Validate colors when inputs change
  useEffect(() => {
    validateColors();
  }, [validateColors]);

  // Generate accessibility recommendation
  const generateRecommendation = (
    currentRatio: number,
    targetRatio: number,
    fg: string,
    bg: string
  ): string => {
    const improvement = targetRatio - currentRatio;
    
    if (improvement <= 1) {
      return 'Slightly adjust color darkness or lightness to meet accessibility standards.';
    } else if (improvement <= 2) {
      return 'Consider using a darker foreground or lighter background color.';
    } else {
      return 'Significant color changes needed. Consider high-contrast color combinations.';
    }
  };

  // Get status color based on validation result
  const getStatusColor = (): string => {
    if (!validationResult) return 'text-muted-foreground';
    
    switch (validationResult.level) {
      case 'AAA':
        return 'text-green-600';
      case 'AA':
        return 'text-yellow-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  // Get status icon
  const getStatusIcon = (): React.ReactNode => {
    if (!validationResult) return null;
    
    switch (validationResult.level) {
      case 'AAA':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'AA':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'fail':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Don't render if warnings are disabled and validation passes
  if (!showWarnings && validationResult?.isValid) {
    return null;
  }

  return (
    <div className={`contrast-validator ${className}`}>
      {validationResult && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <div className={`flex-shrink-0 ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                Contrast Ratio: {validationResult.ratio.toFixed(2)}:1
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                validationResult.level === 'AAA' 
                  ? 'bg-green-100 text-green-800' 
                  : validationResult.level === 'AA'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                WCAG {validationResult.level}
              </span>
            </div>
            
            {validationResult.recommendation && (
              <p className="text-sm text-muted-foreground">
                {validationResult.recommendation}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Font: {fontSize}px {fontWeight}</span>
              <span>Required: {fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold') ? '3:1' : '4.5:1'} (AA)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * useContrastValidator - Hook for contrast validation utilities
 */
export const useContrastValidator = () => {
  const { validateContrast } = useAccessibility();

  const validateColorPair = useCallback((
    foreground: string,
    background: string,
    fontSize: number = 16,
    fontWeight: 'normal' | 'bold' = 'normal'
  ): ContrastValidationResult => {
    try {
      const ratio = calculateContrastRatio(foreground, background);
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
      
      const aaRequirement = isLargeText ? 3 : 4.5;
      const aaaRequirement = isLargeText ? 4.5 : 7;
      
      let level: 'AA' | 'AAA' | 'fail';
      if (ratio >= aaaRequirement) {
        level = 'AAA';
      } else if (ratio >= aaRequirement) {
        level = 'AA';
      } else {
        level = 'fail';
      }
      
      return {
        ratio,
        isValid: ratio >= aaRequirement,
        level,
      };
    } catch (error) {
      return {
        ratio: 0,
        isValid: false,
        level: 'fail',
        recommendation: 'Invalid color format',
      };
    }
  }, []);

  const suggestAccessibleColors = useCallback((
    baseColor: string,
    targetBackground: string
  ): string[] => {
    // This is a simplified implementation
    // In a real application, you might want more sophisticated color generation
    const suggestions: string[] = [];
    
    try {
      const baseRgb = hexToRgb(baseColor);
      if (!baseRgb) return suggestions;
      
      // Generate darker and lighter variations
      for (let i = 0.2; i <= 1; i += 0.2) {
        const darker = rgbToHex(
          Math.floor(baseRgb.r * i),
          Math.floor(baseRgb.g * i),
          Math.floor(baseRgb.b * i)
        );
        
        const lighter = rgbToHex(
          Math.min(255, Math.floor(baseRgb.r + (255 - baseRgb.r) * i)),
          Math.min(255, Math.floor(baseRgb.g + (255 - baseRgb.g) * i)),
          Math.min(255, Math.floor(baseRgb.b + (255 - baseRgb.b) * i))
        );
        
        if (validateContrast(darker, targetBackground)) {
          suggestions.push(darker);
        }
        if (validateContrast(lighter, targetBackground)) {
          suggestions.push(lighter);
        }
      }
    } catch (error) {
      console.warn('Failed to generate color suggestions:', error);
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }, [validateContrast]);

  return {
    validateColorPair,
    suggestAccessibleColors,
    validateContrast,
  };
};

// Utility functions for color manipulation
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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

export default ContrastValidator;