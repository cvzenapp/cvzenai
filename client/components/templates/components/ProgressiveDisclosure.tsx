import React, { useState, useRef, useEffect } from 'react';

export interface ProgressiveDisclosureProps {
  /** The content that's always visible */
  summary: React.ReactNode;
  /** The content that can be expanded/collapsed */
  details: React.ReactNode;
  /** Whether the disclosure is initially expanded */
  defaultExpanded?: boolean;
  /** Custom label for the expand/collapse button */
  expandLabel?: string;
  collapseLabel?: string;
  /** Visual style variant */
  variant?: 'default' | 'card' | 'inline';
  /** Additional CSS classes */
  className?: string;
  /** Callback when expansion state changes */
  onToggle?: (expanded: boolean) => void;
  /** Unique identifier for accessibility */
  id?: string;
}

/**
 * Progressive Disclosure Component
 * 
 * Implements collapsible sections for detailed information that doesn't fit
 * the scanning hierarchy. Provides accessible expand/collapse functionality
 * with keyboard navigation and screen reader support.
 * 
 * Features:
 * - Keyboard navigation (Enter/Space to toggle)
 * - Screen reader compatibility with ARIA attributes
 * - Visual indicators for expandable content
 * - Smooth animations for expand/collapse
 * - Multiple visual variants
 */
export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  summary,
  details,
  defaultExpanded = false,
  expandLabel = 'Show more',
  collapseLabel = 'Show less',
  variant = 'default',
  className = '',
  onToggle,
  id
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAnimating, setIsAnimating] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Generate unique ID if not provided
  const disclosureId = id || `disclosure-${Math.random().toString(36).substr(2, 9)}`;
  const detailsId = `${disclosureId}-details`;
  const buttonId = `${disclosureId}-button`;

  const handleToggle = () => {
    setIsAnimating(true);
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'border border-border rounded-lg p-4 bg-background hover:border-primary/30 transition-colors';
      case 'inline':
        return 'inline-block';
      default:
        return 'space-y-3';
    }
  };

  // Get button variant classes
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded';
    
    switch (variant) {
      case 'card':
        return `${baseClasses} text-primary hover:text-primary/80 mt-3`;
      case 'inline':
        return `${baseClasses} text-primary hover:text-primary/80 ml-2`;
      default:
        return `${baseClasses} text-primary hover:text-primary/80`;
    }
  };

  return (
    <div 
      className={`progressive-disclosure ${getVariantClasses()} ${className}`}
      data-variant={variant}
      data-expanded={isExpanded}
    >
      {/* Summary Content - Always Visible */}
      <div className="summary-content">
        {summary}
      </div>

      {/* Expand/Collapse Button */}
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={getButtonClasses()}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={isExpanded ? collapseLabel : expandLabel}
      >
        <span>{isExpanded ? collapseLabel : expandLabel}</span>
        
        {/* Chevron Icon */}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {/* Details Content - Collapsible */}
      {isExpanded && (
        <div
          ref={detailsRef}
          id={detailsId}
          className={`details-content transition-all duration-300 ease-in-out ${
            isAnimating ? 'pointer-events-none' : ''
          }`}
          style={{
            marginTop: variant === 'inline' ? '0.5rem' : '1rem'
          }}
          aria-hidden={!isExpanded}
          role="region"
          aria-labelledby={buttonId}
        >
          <div className={variant === 'card' ? 'pt-3 border-t border-border/30' : ''}>
            {details}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveDisclosure;