// Customization Components
export { default as ColorSchemeCustomizer } from './ColorSchemeCustomizer';
export type { ColorScheme, ColorSchemeCustomizerProps } from './ColorSchemeCustomizer';

export { default as TypographyCustomizer } from './TypographyCustomizer';
export type { 
  TypographySettings, 
  LayoutSettings, 
  TypographyLayoutConfig, 
  TypographyCustomizerProps 
} from './TypographyCustomizer';

export { default as TemplateCustomizationPanel } from './TemplateCustomizationPanel';
export type { 
  TemplateCustomizationPanelProps, 
  TemplateCustomization 
} from './TemplateCustomizationPanel';

export { default as CustomizationTrigger } from './CustomizationTrigger';
export type { CustomizationTriggerProps } from './CustomizationTrigger';

// Re-export hooks for convenience
export { useColorScheme } from '@/hooks/useColorScheme';
export { useTypographyLayout } from '@/hooks/useTypographyLayout';