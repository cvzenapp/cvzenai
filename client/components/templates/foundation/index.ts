/**
 * Foundation Components for Resume Templates
 * Exports all foundation components and utilities for building resume templates
 * following the three-tier hierarchy design principles
 */

// Base template structure components
export {
  BaseTemplateStructure,
  Tier2QualificationReview,
  Tier3DetailedEvaluation,
  type ThreeTierLayoutProps,
  type Tier2Props,
  type Tier3Props,
} from './BaseTemplateStructure';

// Responsive grid system
export {
  ResponsiveGrid,
  TierGrid,
  ContentGrid,
  SectionGrid,
  TemplateContainer,
  generateGridClasses,
  useResponsiveGrid,
  BREAKPOINTS,
  type GridConfig,
  type ResponsiveGridProps,
  type TierGridProps,
  type ContentGridProps,
  type SectionGridProps,
  type TemplateContainerProps,
} from './ResponsiveGrid';

// Template components
export * from '../components';

// Responsive template system
export {
  ResponsiveTemplateSystem,
  ResponsiveTemplateWrapper,
  AdaptiveComponent,
  TouchOptimized,
  PrintOptimized,
  useResponsiveTemplate,
  getResponsiveValue,
  isBreakpointActive,
  ENHANCED_BREAKPOINTS,
  type ResponsiveTemplateConfig,
  type TemplateLayoutConfig,
  type DeviceCapabilities,
  type BreakpointKey,
} from './ResponsiveTemplateSystem';

// CSS imports for foundation styles
import './foundation.css';
import './responsive-template.css';
import './hfi-optimized.css';