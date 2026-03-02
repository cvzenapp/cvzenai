# Template Customization System

A comprehensive, accessible, and user-friendly customization system for CVZen resume templates. This system allows users to customize colors, typography, and layout settings with real-time preview and validation.

## Features

- **Color Scheme Customization**: Predefined accessible color schemes with custom color picker
- **Typography & Layout**: Font family, size, spacing, and layout density controls
- **Real-time Preview**: Live preview of changes as you make them
- **Accessibility Validation**: WCAG AA compliance checking with contrast ratio validation
- **Export/Import**: Save and share custom themes as JSON files
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark Mode Support**: Automatic dark mode variants with system preference detection

## Components

### TemplateCustomizationPanel

The main customization interface that combines color and typography customization.

```tsx
import { TemplateCustomizationPanel } from '@/components/templates/customization';

<TemplateCustomizationPanel
  templateId="my-template"
  isOpen={isCustomizationOpen}
  onClose={() => setIsCustomizationOpen(false)}
  onSave={handleCustomizationSave}
  onPreview={handleCustomizationPreview}
  onExport={handleCustomizationExport}
/>
```

### CustomizationTrigger

A flexible trigger button that can be positioned anywhere in your template.

```tsx
import { CustomizationTrigger } from '@/components/templates/customization';

<CustomizationTrigger
  onOpenCustomization={() => setIsCustomizationOpen(true)}
  hasCustomizations={hasCustomizations}
  isCustomizationOpen={isCustomizationOpen}
  variant="floating" // or "inline" or "minimal"
  position="top-right" // for floating variant
/>
```

### ColorSchemeCustomizer

Standalone color scheme customization component.

```tsx
import { ColorSchemeCustomizer } from '@/components/templates/customization';

<ColorSchemeCustomizer
  currentScheme={currentScheme}
  onSchemeChange={handleSchemeChange}
  onPreview={handlePreview}
  onSave={handleSave}
/>
```

### TypographyCustomizer

Standalone typography and layout customization component.

```tsx
import { TypographyCustomizer } from '@/components/templates/customization';

<TypographyCustomizer
  currentConfig={currentConfig}
  onConfigChange={handleConfigChange}
  onPreview={handlePreview}
  onSave={handleSave}
/>
```

## Hooks

### useColorScheme

Manages color scheme state with persistence and validation.

```tsx
import { useColorScheme } from '@/hooks/useColorScheme';

const {
  currentScheme,
  setColorScheme,
  saveScheme,
  previewScheme,
  validateScheme,
  isDarkMode,
  toggleDarkMode
} = useColorScheme({
  templateId: 'my-template',
  autoApply: true,
  persistToStorage: true
});
```

### useTypographyLayout

Manages typography and layout settings with persistence and validation.

```tsx
import { useTypographyLayout } from '@/hooks/useTypographyLayout';

const {
  currentConfig,
  setConfig,
  saveConfig,
  previewConfig,
  validateConfig,
  generateResponsiveCSS
} = useTypographyLayout({
  templateId: 'my-template',
  autoApply: true,
  persistToStorage: true
});
```

## Integration Guide

### 1. Basic Integration

Add customization to any template in 3 simple steps:

```tsx
import React, { useState } from 'react';
import { 
  TemplateCustomizationPanel, 
  CustomizationTrigger,
  useColorScheme,
  useTypographyLayout 
} from '@/components/templates/customization';

export const MyTemplate = () => {
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  
  // Initialize customization hooks
  const { currentScheme, previewScheme, applyScheme } = useColorScheme({
    templateId: 'my-template',
    autoApply: true
  });
  
  const { currentConfig, previewConfig, applyConfig } = useTypographyLayout({
    templateId: 'my-template',
    autoApply: true
  });

  const handleCustomizationSave = (customization) => {
    applyScheme(customization.colorScheme);
    applyConfig(customization.typographyLayout);
  };

  const handleCustomizationPreview = (customization) => {
    previewScheme(customization.colorScheme);
    previewConfig(customization.typographyLayout);
  };

  return (
    <div className="template-container">
      {/* Your template content */}
      
      {/* Add customization trigger */}
      <CustomizationTrigger
        onOpenCustomization={() => setIsCustomizationOpen(true)}
        variant="floating"
      />
      
      {/* Add customization panel */}
      <TemplateCustomizationPanel
        templateId="my-template"
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        onSave={handleCustomizationSave}
        onPreview={handleCustomizationPreview}
        onExport={handleExport}
      />
    </div>
  );
};
```

### 2. Using CSS Custom Properties

The system automatically applies CSS custom properties that you can use in your styles:

```css
.my-component {
  color: var(--text-slate-700, #000000);
  background-color: var(--template-background-color, #ffffff);
  border-color: var(--template-border-color, #e2e8f0);
}

.my-heading {
  color: var(--template-primary-color, #3b82f6);
  font-family: var(--font-family-primary, system-ui);
  font-size: var(--font-size-xl, 1.25rem);
  line-height: var(--line-height-base, 1.6);
}
```

### 3. Available CSS Variables

#### Color Variables
- `--template-primary-color`
- `--template-secondary-color`
- `--template-accent-color`
- `--text-slate-700`
- `--template-background-color`
- `--template-muted-color`
- `--template-border-color`

#### Typography Variables
- `--font-family-primary`
- `--font-size-base`
- `--font-size-xs` through `--font-size-3xl`
- `--line-height-base`
- `--letter-spacing-base`
- `--font-weight-heading`
- `--font-weight-body`

#### Layout Variables
- `--layout-max-width`
- `--layout-section-spacing`
- `--layout-card-padding`
- `--layout-border-radius`
- `--layout-density-multiplier`

## Predefined Schemes

### Color Schemes
- **Professional Blue**: Classic blue with high contrast
- **Corporate Gray**: Neutral gray tones for conservative designs
- **Creative Purple**: Vibrant purple for creative professionals
- **Modern Green**: Fresh green for tech and environmental sectors
- **Elegant Dark**: Dark theme with blue accents
- **High Contrast**: Maximum accessibility compliance

### Typography Configurations
- **Modern Standard**: Inter font with balanced spacing
- **Compact Professional**: System font with tight spacing
- **Spacious Elegant**: Georgia serif with generous spacing
- **Accessible High Contrast**: Large fonts with maximum readability

## Accessibility Features

- **WCAG AA Compliance**: All predefined schemes meet accessibility standards
- **Contrast Ratio Validation**: Real-time contrast checking with visual feedback
- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **Focus Management**: Clear focus indicators and logical tab order

## Validation System

The system includes comprehensive validation:

### Color Validation
- Hex color format validation
- Contrast ratio checking (minimum 3:1 for large text, 4.5:1 for normal text)
- Color blindness considerations
- Dark mode compatibility

### Typography Validation
- Font size accessibility (minimum 14px base)
- Line height readability (minimum 1.4)
- Letter spacing limits
- Touch target sizing for mobile

## Export/Import

### Export Format
```json
{
  "id": "custom-theme-123",
  "name": "My Custom Theme",
  "templateId": "technology-template",
  "colorScheme": {
    "id": "custom-colors",
    "name": "Custom Colors",
    "colors": { ... },
    "isDark": false,
    "isAccessible": true,
    "contrastRatio": 4.8
  },
  "typographyLayout": {
    "id": "custom-typography",
    "name": "Custom Typography",
    "typography": { ... },
    "layout": { ... }
  },
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Import Usage
```tsx
const importTheme = (themeFile: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const theme = JSON.parse(e.target?.result as string);
      applyScheme(theme.colorScheme);
      applyConfig(theme.typographyLayout);
    } catch (error) {
      console.error('Invalid theme file:', error);
    }
  };
  reader.readAsText(themeFile);
};
```

## Performance Considerations

- **CSS Custom Properties**: Efficient runtime theme switching
- **Debounced Updates**: Smooth preview without performance impact
- **Lazy Loading**: Components load only when needed
- **Memory Management**: Proper cleanup of event listeners and timers

## Browser Support

- **Modern Browsers**: Full support for Chrome 88+, Firefox 85+, Safari 14+
- **CSS Custom Properties**: Required for theme switching
- **Local Storage**: Used for persistence (graceful degradation)
- **Color Input**: Fallback for browsers without native color picker

## Testing

Run the test suite:

```bash
npm test -- TemplateCustomizationPanel
npm test -- ColorSchemeCustomizer
npm test -- TypographyCustomizer
```

## Contributing

When adding new features:

1. Maintain accessibility standards
2. Add comprehensive tests
3. Update TypeScript types
4. Document new CSS variables
5. Test across different templates

## Examples

See the `examples/` directory for complete implementation examples:

- `CustomizationExample.tsx`: Basic integration example
- `AdvancedCustomizationExample.tsx`: Advanced usage with custom validation
- `AccessibilityExample.tsx`: Accessibility-focused implementation