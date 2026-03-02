import React, { ReactNode, useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

// Screen reader optimization props
export interface ScreenReaderOptimizerProps {
  children: ReactNode;
  announceChanges?: boolean;
  skipToContent?: boolean;
  landmarkRoles?: boolean;
  headingStructure?: boolean;
  className?: string;
}

// Landmark configuration
export interface LandmarkConfig {
  role: string;
  label?: string;
  description?: string;
}

/**
 * ScreenReaderOptimizer - Optimizes content for screen reader accessibility
 * 
 * Features:
 * - Semantic HTML structure with proper landmarks
 * - Skip navigation links for keyboard users
 * - Proper heading hierarchy (H1 -> H2 -> H3)
 * - ARIA labels and descriptions
 * - Live region announcements for dynamic content
 * - Screen reader-only content for context
 */
export const ScreenReaderOptimizer: React.FC<ScreenReaderOptimizerProps> = ({
  children,
  announceChanges = true,
  skipToContent = true,
  landmarkRoles = true,
  headingStructure = true,
  className = '',
}) => {
  const { config, announceToScreenReader } = useAccessibility();
  const contentRef = useRef<HTMLDivElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  // Announce content changes to screen readers
  useEffect(() => {
    if (announceChanges && config.screenReaderOptimized) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Announce when new content is added
            const addedText = Array.from(mutation.addedNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE)
              .map(node => node.textContent)
              .filter(text => text && text.trim().length > 0)
              .join(' ');
            
            if (addedText.trim()) {
              announceToScreenReader(`Content updated: ${addedText.slice(0, 100)}`, 'polite');
            }
          }
        });
      });

      if (contentRef.current) {
        observer.observe(contentRef.current, {
          childList: true,
          subtree: true,
        });
      }

      return () => observer.disconnect();
    }
  }, [announceChanges, config.screenReaderOptimized, announceToScreenReader]);

  // Handle skip link activation
  const handleSkipToContent = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (contentRef.current) {
        contentRef.current.focus();
        contentRef.current.scrollIntoView({ behavior: 'smooth' });
        announceToScreenReader('Skipped to main content');
      }
    }
  };

  return (
    <div className={`screen-reader-optimizer ${className}`}>
      {/* Skip Navigation Links */}
      {skipToContent && config.screenReaderOptimized && (
        <div className="skip-navigation sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
          <a
            ref={skipLinkRef}
            href="#main-content"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-primary-foreground"
            onKeyDown={handleSkipToContent}
            onClick={(e) => {
              e.preventDefault();
              if (contentRef.current) {
                contentRef.current.focus();
                contentRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Skip to main content
          </a>
        </div>
      )}

      {/* Main Content with Semantic Structure */}
      <div
        ref={contentRef}
        id="main-content"
        className="main-content"
        role={landmarkRoles ? "main" : undefined}
        aria-label={landmarkRoles ? "Main resume content" : undefined}
        tabIndex={-1}
      >
        {/* Screen Reader Context */}
        {config.screenReaderOptimized && (
          <div className="sr-only">
            <h1>Resume Content Navigation</h1>
            <p>
              This resume is optimized for screen readers. Use heading navigation to jump between sections.
              Press H to navigate by headings, or use the skip links to jump to specific content areas.
            </p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

/**
 * ScreenReaderText - Component for screen reader-only text
 */
export interface ScreenReaderTextProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export const ScreenReaderText: React.FC<ScreenReaderTextProps> = ({
  children,
  as: Component = 'span',
  className = '',
}) => {
  return (
    <Component className={`sr-only ${className}`}>
      {children}
    </Component>
  );
};

/**
 * LiveRegion - Component for announcing dynamic content changes
 */
export interface LiveRegionProps {
  children: ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className = '',
}) => {
  return (
    <div
      className={`live-region ${className}`}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {children}
    </div>
  );
};

/**
 * SemanticHeading - Component for proper heading hierarchy
 */
export interface SemanticHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  id?: string;
  className?: string;
}

export const SemanticHeading: React.FC<SemanticHeadingProps> = ({
  level,
  children,
  id,
  className = '',
}) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag
      id={id}
      className={`semantic-heading heading-${level} ${className}`}
      tabIndex={-1}
    >
      {children}
    </HeadingTag>
  );
};

/**
 * AccessibleButton - Button with enhanced accessibility features
 */
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  loadingText?: string;
  describedBy?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingText = 'Loading...',
  describedBy,
  className = '',
  disabled,
  ...props
}) => {
  const { announceToScreenReader } = useAccessibility();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    
    props.onClick?.(event);
    
    // Announce button activation to screen readers
    if (props['aria-label']) {
      announceToScreenReader(`${props['aria-label']} activated`);
    }
  };

  const baseClasses = 'accessible-button focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
    tertiary: 'border border-border hover:bg-muted focus:ring-primary',
  };
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={describedBy}
      onClick={handleClick}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">{loadingText}</span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * useScreenReaderAnnouncements - Hook for screen reader announcements
 */
export const useScreenReaderAnnouncements = () => {
  const { announceToScreenReader, config } = useAccessibility();

  const announceNavigation = (destination: string) => {
    if (config.screenReaderOptimized) {
      announceToScreenReader(`Navigated to ${destination}`);
    }
  };

  const announceAction = (action: string, result?: string) => {
    if (config.screenReaderOptimized) {
      const message = result ? `${action}: ${result}` : action;
      announceToScreenReader(message);
    }
  };

  const announceError = (error: string) => {
    if (config.screenReaderOptimized) {
      announceToScreenReader(`Error: ${error}`, 'assertive');
    }
  };

  const announceSuccess = (message: string) => {
    if (config.screenReaderOptimized) {
      announceToScreenReader(`Success: ${message}`, 'polite');
    }
  };

  return {
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
    announceToScreenReader,
  };
};

export default ScreenReaderOptimizer;