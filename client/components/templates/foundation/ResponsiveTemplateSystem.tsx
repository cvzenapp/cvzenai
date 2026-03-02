import React, { useState, useEffect, useCallback } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

// Enhanced breakpoint system with device detection
export const ENHANCED_BREAKPOINTS = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1279 },
  wide: { min: 1280, max: Infinity }
} as const;

export type BreakpointKey = keyof typeof ENHANCED_BREAKPOINTS;

// Device capability detection
export interface DeviceCapabilities {
  isTouchDevice: boolean;
  hasHover: boolean;
  prefersReducedMotion: boolean;
  supportsWebP: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  screenDensity: number;
}

// Responsive template configuration
export interface ResponsiveTemplateConfig {
  breakpoints: {
    mobile: TemplateLayoutConfig;
    tablet: TemplateLayoutConfig;
    desktop: TemplateLayoutConfig;
    wide: TemplateLayoutConfig;
  };
  adaptiveFeatures: {
    lazyLoadImages: boolean;
    progressiveEnhancement: boolean;
    touchOptimization: boolean;
    printOptimization: boolean;
  };
  performanceSettings: {
    enableVirtualization: boolean;
    imageOptimization: boolean;
    fontPreloading: boolean;
  };
}

export interface TemplateLayoutConfig {
  layout: 'single-column' | 'two-column' | 'three-column' | 'sidebar';
  headerStyle: 'compact' | 'standard' | 'expanded';
  navigationStyle: 'tabs' | 'accordion' | 'sidebar' | 'hidden';
  cardDensity: 'compact' | 'standard' | 'spacious';
  showSecondaryInfo: boolean;
  enableAnimations: boolean;
}

// Hook for responsive template behavior
export const useResponsiveTemplate = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('desktop');
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    isTouchDevice: false,
    hasHover: true,
    prefersReducedMotion: false,
    supportsWebP: false,
    connectionSpeed: 'unknown',
    screenDensity: 1
  });

  // Detect current breakpoint
  const updateBreakpoint = useCallback(() => {
    const width = window.innerWidth;
    
    for (const [key, range] of Object.entries(ENHANCED_BREAKPOINTS)) {
      if (width >= range.min && width <= range.max) {
        setCurrentBreakpoint(key as BreakpointKey);
        break;
      }
    }
  }, []);

  // Detect device capabilities
  const detectCapabilities = useCallback(() => {
    const capabilities: DeviceCapabilities = {
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasHover: window.matchMedia('(hover: hover)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      supportsWebP: (() => {
        try {
          const canvas = document.createElement('canvas');
          const dataURL = canvas.toDataURL('image/webp');
          return dataURL && dataURL.indexOf('data:image/webp') === 0;
        } catch (error) {
          // Fallback for test environments or browsers without canvas support
          return false;
        }
      })(),
      connectionSpeed: (() => {
        try {
          const connection = (navigator as any).connection;
          if (!connection) return 'unknown';
          return connection.effectiveType === '4g' ? 'fast' : 'slow';
        } catch (error) {
          return 'unknown';
        }
      })(),
      screenDensity: window.devicePixelRatio || 1
    };

    setDeviceCapabilities(capabilities);
  }, []);

  useEffect(() => {
    updateBreakpoint();
    detectCapabilities();

    window.addEventListener('resize', updateBreakpoint);
    
    // Listen for media query changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverQuery = window.matchMedia('(hover: hover)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setDeviceCapabilities(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };
    
    const handleHoverChange = (e: MediaQueryListEvent) => {
      setDeviceCapabilities(prev => ({ ...prev, hasHover: e.matches }));
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    hoverQuery.addEventListener('change', handleHoverChange);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      hoverQuery.removeEventListener('change', handleHoverChange);
    };
  }, [updateBreakpoint, detectCapabilities]);

  return {
    currentBreakpoint,
    deviceCapabilities,
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop' || currentBreakpoint === 'wide',
    isWide: currentBreakpoint === 'wide'
  };
};

// Responsive template wrapper component
export interface ResponsiveTemplateWrapperProps {
  children: React.ReactNode;
  resume: Resume;
  templateConfig: TemplateConfig;
  responsiveConfig?: ResponsiveTemplateConfig;
  className?: string;
}

export const ResponsiveTemplateWrapper: React.FC<ResponsiveTemplateWrapperProps> = ({
  children,
  resume,
  templateConfig,
  responsiveConfig,
  className = ''
}) => {
  const { currentBreakpoint, deviceCapabilities } = useResponsiveTemplate();

  // Default responsive configuration
  const defaultConfig: ResponsiveTemplateConfig = {
    breakpoints: {
      mobile: {
        layout: 'single-column',
        headerStyle: 'compact',
        navigationStyle: 'accordion',
        cardDensity: 'compact',
        showSecondaryInfo: false,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      },
      tablet: {
        layout: 'two-column',
        headerStyle: 'standard',
        navigationStyle: 'tabs',
        cardDensity: 'standard',
        showSecondaryInfo: true,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      },
      desktop: {
        layout: 'three-column',
        headerStyle: 'standard',
        navigationStyle: 'tabs',
        cardDensity: 'standard',
        showSecondaryInfo: true,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      },
      wide: {
        layout: 'three-column',
        headerStyle: 'expanded',
        navigationStyle: 'sidebar',
        cardDensity: 'spacious',
        showSecondaryInfo: true,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      }
    },
    adaptiveFeatures: {
      lazyLoadImages: deviceCapabilities.connectionSpeed === 'slow',
      progressiveEnhancement: true,
      touchOptimization: deviceCapabilities.isTouchDevice,
      printOptimization: true
    },
    performanceSettings: {
      enableVirtualization: currentBreakpoint === 'mobile',
      imageOptimization: true,
      fontPreloading: deviceCapabilities.connectionSpeed === 'fast'
    }
  };

  const config = responsiveConfig || defaultConfig;
  const currentLayout = config.breakpoints[currentBreakpoint];

  // Generate responsive classes
  const responsiveClasses = [
    `breakpoint-${currentBreakpoint}`,
    `layout-${currentLayout.layout}`,
    `header-${currentLayout.headerStyle}`,
    `nav-${currentLayout.navigationStyle}`,
    `density-${currentLayout.cardDensity}`,
    deviceCapabilities.isTouchDevice ? 'touch-device' : 'no-touch',
    deviceCapabilities.hasHover ? 'has-hover' : 'no-hover',
    deviceCapabilities.prefersReducedMotion ? 'reduced-motion' : 'full-motion',
    currentLayout.enableAnimations ? 'animations-enabled' : 'animations-disabled',
    className
  ].join(' ');

  // CSS custom properties for responsive behavior
  const cssVariables = {
    '--current-breakpoint': currentBreakpoint,
    '--touch-target-size': deviceCapabilities.isTouchDevice ? '44px' : '32px',
    '--hover-transition': deviceCapabilities.hasHover ? '0.2s ease' : 'none',
    '--animation-duration': deviceCapabilities.prefersReducedMotion ? '0.01ms' : '0.3s',
    '--screen-density': deviceCapabilities.screenDensity.toString(),
    '--connection-speed': deviceCapabilities.connectionSpeed
  } as React.CSSProperties;

  return (
    <div 
      className={`responsive-template-wrapper ${responsiveClasses}`}
      style={cssVariables}
      data-breakpoint={currentBreakpoint}
      data-touch={deviceCapabilities.isTouchDevice}
      data-hover={deviceCapabilities.hasHover}
    >
      {children}
    </div>
  );
};

// Adaptive component renderer
export interface AdaptiveComponentProps {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  wide?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdaptiveComponent: React.FC<AdaptiveComponentProps> = ({
  mobile,
  tablet,
  desktop,
  wide,
  fallback
}) => {
  const { currentBreakpoint } = useResponsiveTemplate();

  const components = {
    mobile: mobile || fallback,
    tablet: tablet || desktop || fallback,
    desktop: desktop || fallback,
    wide: wide || desktop || fallback
  };

  return <>{components[currentBreakpoint] || fallback}</>;
};

// Touch-friendly interaction wrapper
export interface TouchOptimizedProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
}

export const TouchOptimized: React.FC<TouchOptimizedProps> = ({
  children,
  onTap,
  onLongPress,
  className = '',
  disabled = false
}) => {
  const { deviceCapabilities } = useResponsiveTemplate();
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
    onTap?.();
  }, [disabled, onTap]);

  const handleClick = useCallback(() => {
    if (disabled || deviceCapabilities.isTouchDevice) return;
    onTap?.();
  }, [disabled, deviceCapabilities.isTouchDevice, onTap]);

  const touchClasses = [
    'touch-optimized',
    deviceCapabilities.isTouchDevice ? 'touch-device' : 'mouse-device',
    isPressed ? 'pressed' : '',
    disabled ? 'disabled' : '',
    className
  ].join(' ');

  const touchStyles = {
    minHeight: deviceCapabilities.isTouchDevice ? '44px' : 'auto',
    minWidth: deviceCapabilities.isTouchDevice ? '44px' : 'auto',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent'
  } as React.CSSProperties;

  return (
    <div
      className={touchClasses}
      style={touchStyles}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};

// Print-optimized component wrapper
export interface PrintOptimizedProps {
  children: React.ReactNode;
  showInPrint?: boolean;
  hideInPrint?: boolean;
  printOnly?: boolean;
  className?: string;
}

export const PrintOptimized: React.FC<PrintOptimizedProps> = ({
  children,
  showInPrint = true,
  hideInPrint = false,
  printOnly = false,
  className = ''
}) => {
  const printClasses = [
    printOnly ? 'print-only' : '',
    hideInPrint ? 'hide-in-print' : '',
    !showInPrint ? 'hide-in-print' : '',
    className
  ].join(' ');

  return (
    <div className={printClasses}>
      {children}
    </div>
  );
};

// Utility functions for responsive behavior
export const getResponsiveValue = <T,>(
  values: Partial<Record<BreakpointKey, T>>,
  currentBreakpoint: BreakpointKey,
  fallback: T
): T => {
  return values[currentBreakpoint] || 
         values.desktop || 
         values.tablet || 
         values.mobile || 
         fallback;
};

export const isBreakpointActive = (
  breakpoint: BreakpointKey,
  currentBreakpoint: BreakpointKey
): boolean => {
  const order: BreakpointKey[] = ['mobile', 'tablet', 'desktop', 'wide'];
  const currentIndex = order.indexOf(currentBreakpoint);
  const targetIndex = order.indexOf(breakpoint);
  
  return currentIndex >= targetIndex;
};

// Export responsive template system
export const ResponsiveTemplateSystem = {
  ResponsiveTemplateWrapper,
  AdaptiveComponent,
  TouchOptimized,
  PrintOptimized,
  useResponsiveTemplate,
  getResponsiveValue,
  isBreakpointActive,
  ENHANCED_BREAKPOINTS
};

export default ResponsiveTemplateSystem;