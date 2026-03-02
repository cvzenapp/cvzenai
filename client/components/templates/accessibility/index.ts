// Accessibility Framework Exports

// Core Provider and Context
export { 
  AccessibilityProvider, 
  useAccessibility,
  type AccessibilityConfig,
  type UserPreferences 
} from './AccessibilityProvider';

// Focus Management
export { 
  FocusManager, 
  useFocusManager,
  type FocusManagerProps,
  type FocusManagerRef 
} from './FocusManager';

// Contrast Validation
export { 
  ContrastValidator, 
  useContrastValidator,
  type ContrastValidationResult,
  type ContrastValidatorProps 
} from './ContrastValidator';

// Screen Reader Optimization
export { 
  ScreenReaderOptimizer,
  ScreenReaderText,
  LiveRegion,
  SemanticHeading,
  AccessibleButton,
  useScreenReaderAnnouncements,
  type ScreenReaderOptimizerProps,
  type ScreenReaderTextProps,
  type LiveRegionProps,
  type SemanticHeadingProps,
  type AccessibleButtonProps
} from './ScreenReaderOptimizer';

// Accessibility Testing
export { 
  AccessibilityTester, 
  useAccessibilityTester,
  type AccessibilityTestResult,
  type AccessibilityAuditConfig,
  type AccessibilityTesterProps 
} from './AccessibilityTester';

// Accessibility Audit
export { 
  AccessibilityAudit,
  type AccessibilityAuditReport,
  type AccessibilityAuditProps 
} from './AccessibilityAudit';

// CSS Styles (import in your main CSS file)
// import './accessibility.css';