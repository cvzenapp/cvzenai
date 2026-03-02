import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAccessibility } from './AccessibilityProvider';

// Focus trap configuration
export interface FocusManagerProps {
  children: ReactNode;
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

// Focus management utilities
export interface FocusManagerRef {
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  trapFocus: () => void;
  releaseFocus: () => void;
}

/**
 * FocusManager - Manages focus within a container for accessibility
 * 
 * Features:
 * - Focus trapping for modal dialogs and complex widgets
 * - Logical tab order management
 * - Auto-focus on mount with restoration on unmount
 * - Keyboard navigation utilities
 * - Screen reader compatibility
 * - WCAG 2.1 compliance for focus management
 */
export const FocusManager = React.forwardRef<FocusManagerRef, FocusManagerProps>(({
  children,
  enabled = true,
  autoFocus = false,
  restoreFocus = true,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const { config, focusElement, announceToScreenReader } = useAccessibility();

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'iframe',
      'object',
      'embed',
      'area[href]',
      'summary',
    ].join(', ');

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    // Filter out elements that are not visible or have negative tabindex
    return elements.filter(element => {
      const style = getComputedStyle(element);
      const tabIndex = element.getAttribute('tabindex');
      
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.hasAttribute('hidden') &&
        tabIndex !== '-1' &&
        element.offsetParent !== null
      );
    });
  }, []);

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0 && config.keyboardNavigation) {
      focusElement(focusableElements[0]);
      announceToScreenReader('Focused on first element');
    }
  }, [getFocusableElements, config.keyboardNavigation, focusElement, announceToScreenReader]);

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0 && config.keyboardNavigation) {
      focusElement(focusableElements[focusableElements.length - 1]);
      announceToScreenReader('Focused on last element');
    }
  }, [getFocusableElements, config.keyboardNavigation, focusElement, announceToScreenReader]);

  // Focus the next focusable element
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex !== -1 && config.keyboardNavigation) {
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      focusElement(focusableElements[nextIndex]);
    }
  }, [getFocusableElements, config.keyboardNavigation, focusElement]);

  // Focus the previous focusable element
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex !== -1 && config.keyboardNavigation) {
      const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusElement(focusableElements[previousIndex]);
    }
  }, [getFocusableElements, config.keyboardNavigation, focusElement]);

  // Trap focus within the container
  const trapFocus = useCallback(() => {
    if (!enabled || !config.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // If shift+tab on first element, focus last element
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        focusElement(lastElement);
        return;
      }

      // If tab on last element, focus first element
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        focusElement(firstElement);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, config.keyboardNavigation, getFocusableElements, focusElement]);

  // Release focus trap
  const releaseFocus = useCallback(() => {
    if (restoreFocus && previousActiveElementRef.current) {
      focusElement(previousActiveElementRef.current);
      announceToScreenReader('Focus restored to previous element');
    }
  }, [restoreFocus, focusElement, announceToScreenReader]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    trapFocus,
    releaseFocus,
  }), [focusFirst, focusLast, focusNext, focusPrevious, trapFocus, releaseFocus]);

  // Handle auto-focus and focus restoration
  useEffect(() => {
    if (!enabled) return;

    // Store the currently active element for restoration
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Auto-focus first element if requested
    if (autoFocus) {
      focusFirst();
    }

    // Set up focus trap
    const cleanup = trapFocus();

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
      if (restoreFocus && previousActiveElementRef.current) {
        releaseFocus();
      }
    };
  }, [enabled, autoFocus, restoreFocus, focusFirst, trapFocus, releaseFocus]);

  // Handle keyboard navigation within the container
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enabled || !config.keyboardNavigation) return;

    switch (event.key) {
      case 'Home':
        if (event.ctrlKey) {
          event.preventDefault();
          focusFirst();
        }
        break;
      case 'End':
        if (event.ctrlKey) {
          event.preventDefault();
          focusLast();
        }
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        if (event.ctrlKey) {
          event.preventDefault();
          focusNext();
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        if (event.ctrlKey) {
          event.preventDefault();
          focusPrevious();
        }
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`focus-manager ${className}`}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Focus managed container"
    >
      {children}
    </div>
  );
});

FocusManager.displayName = 'FocusManager';

/**
 * useFocusManager - Hook for focus management utilities
 */
export const useFocusManager = () => {
  const { config, focusElement, announceToScreenReader } = useAccessibility();

  const createFocusManager = useCallback((container: HTMLElement | null) => {
    if (!container) return null;

    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
        .filter(element => {
          const style = getComputedStyle(element);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !element.hasAttribute('hidden') &&
            element.offsetParent !== null
          );
        });
    };

    return {
      focusFirst: () => {
        const elements = getFocusableElements();
        if (elements.length > 0 && config.keyboardNavigation) {
          focusElement(elements[0]);
        }
      },
      focusLast: () => {
        const elements = getFocusableElements();
        if (elements.length > 0 && config.keyboardNavigation) {
          focusElement(elements[elements.length - 1]);
        }
      },
      focusNext: (currentElement: HTMLElement) => {
        const elements = getFocusableElements();
        const currentIndex = elements.indexOf(currentElement);
        if (currentIndex !== -1 && config.keyboardNavigation) {
          const nextIndex = (currentIndex + 1) % elements.length;
          focusElement(elements[nextIndex]);
        }
      },
      focusPrevious: (currentElement: HTMLElement) => {
        const elements = getFocusableElements();
        const currentIndex = elements.indexOf(currentElement);
        if (currentIndex !== -1 && config.keyboardNavigation) {
          const previousIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
          focusElement(elements[previousIndex]);
        }
      },
    };
  }, [config.keyboardNavigation, focusElement]);

  return {
    createFocusManager,
    announceToScreenReader,
    focusElement,
  };
};

export default FocusManager;