import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { ContrastValidationResult, useContrastValidator } from './ContrastValidator';

// Accessibility test result interface
export interface AccessibilityTestResult {
  id: string;
  category: 'contrast' | 'keyboard' | 'screenReader' | 'structure' | 'aria';
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  recommendation?: string;
  wcagReference?: string;
}

// Accessibility audit configuration
export interface AccessibilityAuditConfig {
  testContrast: boolean;
  testKeyboardNavigation: boolean;
  testScreenReaderCompatibility: boolean;
  testAriaCompliance: boolean;
  testSemanticStructure: boolean;
  autoFix: boolean;
  reportLevel: 'error' | 'warning' | 'info';
}

// Accessibility tester props
export interface AccessibilityTesterProps {
  target?: HTMLElement | null;
  config?: Partial<AccessibilityAuditConfig>;
  onTestComplete?: (results: AccessibilityTestResult[]) => void;
  showResults?: boolean;
  autoRun?: boolean;
  className?: string;
}

/**
 * AccessibilityTester - Automated accessibility testing and validation
 * 
 * Features:
 * - WCAG 2.1 AA/AAA compliance testing
 * - Real-time contrast ratio validation
 * - Keyboard navigation testing
 * - ARIA compliance checking
 * - Semantic structure validation
 * - Automated accessibility warnings
 * - Developer-friendly error reporting
 */
export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  target,
  config: userConfig = {},
  onTestComplete,
  showResults = true,
  autoRun = true,
  className = '',
}) => {
  const { config: a11yConfig, isAccessibilityCompliant } = useAccessibility();
  const { validateColorPair } = useContrastValidator();
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const testIdCounter = useRef(0);

  // Default audit configuration
  const auditConfig: AccessibilityAuditConfig = {
    testContrast: true,
    testKeyboardNavigation: true,
    testScreenReaderCompatibility: true,
    testAriaCompliance: true,
    testSemanticStructure: true,
    autoFix: false,
    reportLevel: 'warning',
    ...userConfig,
  };

  // Generate unique test ID
  const generateTestId = (): string => {
    return `a11y-test-${++testIdCounter.current}`;
  };

  // Test contrast ratios for all text elements
  const testContrastRatios = useCallback((container: HTMLElement): AccessibilityTestResult[] => {
    const results: AccessibilityTestResult[] = [];
    
    if (!auditConfig.testContrast) return results;

    const textElements = container.querySelectorAll('*');
    
    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const computedStyle = getComputedStyle(htmlElement);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Skip elements without visible text
      if (!htmlElement.textContent?.trim() || computedStyle.display === 'none') {
        return;
      }

      try {
        const foreground = rgbToHex(color);
        const background = rgbToHex(backgroundColor) || '#ffffff';
        
        if (foreground && background) {
          const fontSize = parseInt(computedStyle.fontSize);
          const fontWeight = computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700 ? 'bold' : 'normal';
          
          const validation = validateColorPair(foreground, background, fontSize, fontWeight);
          
          if (!validation.isValid) {
            results.push({
              id: generateTestId(),
              category: 'contrast',
              severity: validation.level === 'fail' ? 'error' : 'warning',
              message: `Insufficient color contrast: ${validation.ratio.toFixed(2)}:1`,
              element: htmlElement,
              recommendation: `Increase contrast to meet WCAG ${validation.level === 'fail' ? 'AA' : 'AAA'} standards`,
              wcagReference: 'WCAG 2.1 SC 1.4.3 (Contrast Minimum)',
            });
          }
        }
      } catch (error) {
        // Skip elements with invalid colors
      }
    });

    return results;
  }, [auditConfig.testContrast, validateColorPair]);

  // Test keyboard navigation
  const testKeyboardNavigation = useCallback((container: HTMLElement): AccessibilityTestResult[] => {
    const results: AccessibilityTestResult[] = [];
    
    if (!auditConfig.testKeyboardNavigation) return results;

    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const tabIndex = htmlElement.getAttribute('tabindex');
      
      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        results.push({
          id: generateTestId(),
          category: 'keyboard',
          severity: 'warning',
          message: 'Positive tabindex detected',
          element: htmlElement,
          recommendation: 'Use tabindex="0" or remove tabindex to maintain natural tab order',
          wcagReference: 'WCAG 2.1 SC 2.4.3 (Focus Order)',
        });
      }

      // Check for missing focus indicators
      const computedStyle = getComputedStyle(htmlElement, ':focus');
      if (!computedStyle.outline || computedStyle.outline === 'none') {
        results.push({
          id: generateTestId(),
          category: 'keyboard',
          severity: 'error',
          message: 'Missing focus indicator',
          element: htmlElement,
          recommendation: 'Add visible focus indicator for keyboard navigation',
          wcagReference: 'WCAG 2.1 SC 2.4.7 (Focus Visible)',
        });
      }
    });

    return results;
  }, [auditConfig.testKeyboardNavigation]);

  // Test ARIA compliance
  const testAriaCompliance = useCallback((container: HTMLElement): AccessibilityTestResult[] => {
    const results: AccessibilityTestResult[] = [];
    
    if (!auditConfig.testAriaCompliance) return results;

    const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');

    elementsWithAria.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Check for empty aria-label
      const ariaLabel = htmlElement.getAttribute('aria-label');
      if (ariaLabel !== null && !ariaLabel.trim()) {
        results.push({
          id: generateTestId(),
          category: 'aria',
          severity: 'error',
          message: 'Empty aria-label attribute',
          element: htmlElement,
          recommendation: 'Provide meaningful aria-label or remove the attribute',
          wcagReference: 'WCAG 2.1 SC 4.1.2 (Name, Role, Value)',
        });
      }

      // Check for invalid ARIA references
      const ariaLabelledby = htmlElement.getAttribute('aria-labelledby');
      if (ariaLabelledby) {
        const referencedElement = document.getElementById(ariaLabelledby);
        if (!referencedElement) {
          results.push({
            id: generateTestId(),
            category: 'aria',
            severity: 'error',
            message: `Invalid aria-labelledby reference: ${ariaLabelledby}`,
            element: htmlElement,
            recommendation: 'Ensure referenced element exists or remove invalid reference',
            wcagReference: 'WCAG 2.1 SC 4.1.2 (Name, Role, Value)',
          });
        }
      }

      const ariaDescribedby = htmlElement.getAttribute('aria-describedby');
      if (ariaDescribedby) {
        const referencedElement = document.getElementById(ariaDescribedby);
        if (!referencedElement) {
          results.push({
            id: generateTestId(),
            category: 'aria',
            severity: 'error',
            message: `Invalid aria-describedby reference: ${ariaDescribedby}`,
            element: htmlElement,
            recommendation: 'Ensure referenced element exists or remove invalid reference',
            wcagReference: 'WCAG 2.1 SC 4.1.2 (Name, Role, Value)',
          });
        }
      }
    });

    return results;
  }, [auditConfig.testAriaCompliance]);

  // Test semantic structure
  const testSemanticStructure = useCallback((container: HTMLElement): AccessibilityTestResult[] => {
    const results: AccessibilityTestResult[] = [];
    
    if (!auditConfig.testSemanticStructure) return results;

    // Check heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > previousLevel + 1) {
        results.push({
          id: generateTestId(),
          category: 'structure',
          severity: 'warning',
          message: `Heading level skipped: ${heading.tagName}`,
          element: heading as HTMLElement,
          recommendation: 'Maintain proper heading hierarchy (h1 -> h2 -> h3, etc.)',
          wcagReference: 'WCAG 2.1 SC 1.3.1 (Info and Relationships)',
        });
      }
      
      previousLevel = level;
    });

    // Check for missing main landmark
    const mainLandmark = container.querySelector('main, [role="main"]');
    if (!mainLandmark) {
      results.push({
        id: generateTestId(),
        category: 'structure',
        severity: 'warning',
        message: 'Missing main landmark',
        element: container,
        recommendation: 'Add <main> element or role="main" to identify main content',
        wcagReference: 'WCAG 2.1 SC 1.3.6 (Identify Purpose)',
      });
    }

    // Check for images without alt text
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('alt')) {
        results.push({
          id: generateTestId(),
          category: 'structure',
          severity: 'error',
          message: 'Image missing alt attribute',
          element: img,
          recommendation: 'Add alt attribute with descriptive text or alt="" for decorative images',
          wcagReference: 'WCAG 2.1 SC 1.1.1 (Non-text Content)',
        });
      }
    });

    return results;
  }, [auditConfig.testSemanticStructure]);

  // Test screen reader compatibility
  const testScreenReaderCompatibility = useCallback((container: HTMLElement): AccessibilityTestResult[] => {
    const results: AccessibilityTestResult[] = [];
    
    if (!auditConfig.testScreenReaderCompatibility) return results;

    // Check for buttons without accessible names
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledby = button.getAttribute('aria-labelledby');
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
        results.push({
          id: generateTestId(),
          category: 'screenReader',
          severity: 'error',
          message: 'Button without accessible name',
          element: button,
          recommendation: 'Add text content, aria-label, or aria-labelledby to button',
          wcagReference: 'WCAG 2.1 SC 4.1.2 (Name, Role, Value)',
        });
      }
    });

    // Check for links without accessible names
    const links = container.querySelectorAll('a[href]');
    links.forEach((link) => {
      const hasText = link.textContent?.trim();
      const hasAriaLabel = link.getAttribute('aria-label');
      
      if (!hasText && !hasAriaLabel) {
        results.push({
          id: generateTestId(),
          category: 'screenReader',
          severity: 'error',
          message: 'Link without accessible name',
          element: link as HTMLElement,
          recommendation: 'Add descriptive text or aria-label to link',
          wcagReference: 'WCAG 2.1 SC 2.4.4 (Link Purpose)',
        });
      }
    });

    return results;
  }, [auditConfig.testScreenReaderCompatibility]);

  // Run all accessibility tests
  const runAccessibilityTests = useCallback(async (): Promise<AccessibilityTestResult[]> => {
    const container = target || document.body;
    const allResults: AccessibilityTestResult[] = [];

    setIsRunning(true);

    try {
      // Run all test categories
      const contrastResults = testContrastRatios(container);
      const keyboardResults = testKeyboardNavigation(container);
      const ariaResults = testAriaCompliance(container);
      const structureResults = testSemanticStructure(container);
      const screenReaderResults = testScreenReaderCompatibility(container);

      allResults.push(
        ...contrastResults,
        ...keyboardResults,
        ...ariaResults,
        ...structureResults,
        ...screenReaderResults
      );

      // Filter results based on report level
      const filteredResults = allResults.filter(result => {
        const severityLevels = { error: 3, warning: 2, info: 1 };
        const configLevel = severityLevels[auditConfig.reportLevel];
        const resultLevel = severityLevels[result.severity];
        return resultLevel >= configLevel;
      });

      setTestResults(filteredResults);
      onTestComplete?.(filteredResults);

      return filteredResults;
    } finally {
      setIsRunning(false);
    }
  }, [
    target,
    auditConfig.reportLevel,
    testContrastRatios,
    testKeyboardNavigation,
    testAriaCompliance,
    testSemanticStructure,
    testScreenReaderCompatibility,
    onTestComplete,
  ]);

  // Auto-run tests when component mounts or target changes
  useEffect(() => {
    if (autoRun) {
      runAccessibilityTests();
    }
  }, [autoRun, runAccessibilityTests]);

  // Get severity color
  const getSeverityColor = (severity: AccessibilityTestResult['severity']): string => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: AccessibilityTestResult['severity']): React.ReactNode => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!showResults && testResults.length === 0) {
    return null;
  }

  return (
    <div className={`accessibility-tester ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Accessibility Test Results</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={runAccessibilityTests}
            disabled={isRunning}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isRunning ? 'Testing...' : 'Run Tests'}
          </button>
          <span className={`text-sm px-2 py-1 rounded ${
            testResults.length === 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {testResults.length === 0 ? 'No Issues' : `${testResults.length} Issues`}
          </span>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3">
          {testResults.map((result) => (
            <div
              key={result.id}
              className={`p-3 rounded-lg border ${getSeverityColor(result.severity)}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(result.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.message}</span>
                    <span className="text-xs px-2 py-1 bg-white/50 rounded">
                      {result.category}
                    </span>
                  </div>
                  
                  {result.recommendation && (
                    <p className="text-sm mb-2">{result.recommendation}</p>
                  )}
                  
                  {result.wcagReference && (
                    <p className="text-xs opacity-75">{result.wcagReference}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isRunning && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Running accessibility tests...</span>
        </div>
      )}
    </div>
  );
};

// Utility function to convert RGB to hex
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * useAccessibilityTester - Hook for accessibility testing utilities
 */
export const useAccessibilityTester = () => {
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runQuickTest = useCallback(async (element: HTMLElement): Promise<AccessibilityTestResult[]> => {
    setIsRunning(true);
    
    // Simplified quick test implementation
    const results: AccessibilityTestResult[] = [];
    
    // Check for missing alt text on images
    const images = element.querySelectorAll('img:not([alt])');
    images.forEach((img, index) => {
      results.push({
        id: `quick-test-${index}`,
        category: 'structure',
        severity: 'error',
        message: 'Image missing alt attribute',
        element: img as HTMLElement,
        recommendation: 'Add alt attribute with descriptive text',
        wcagReference: 'WCAG 2.1 SC 1.1.1',
      });
    });
    
    setTestResults(results);
    setIsRunning(false);
    
    return results;
  }, []);

  return {
    testResults,
    isRunning,
    runQuickTest,
  };
};

export default AccessibilityTester;