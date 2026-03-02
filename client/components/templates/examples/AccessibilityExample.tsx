import React, { useState } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { 
  AccessibilityProvider, 
  FocusManager, 
  ContrastValidator,
  ScreenReaderOptimizer,
  AccessibilityTester,
  AccessibilityAudit,
  SemanticHeading,
  AccessibleButton,
  useAccessibility
} from '../accessibility';

// Mock resume data for demonstration
const mockResume: Resume = {
  id: 'example-resume',
  userId: 'example-user',
  personalInfo: {
    name: 'Jane Developer',
    title: 'Senior Frontend Engineer',
    email: 'jane@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/janedeveloper',
    github: 'https://github.com/janedeveloper',
    website: 'https://janedeveloper.com',
  },
  summary: 'Experienced frontend engineer with expertise in React, TypeScript, and accessibility.',
  experiences: [],
  education: [],
  skills: ['React', 'TypeScript', 'Accessibility', 'WCAG', 'ARIA'],
  projects: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTemplateConfig: TemplateConfig = {
  id: 'accessibility-example',
  name: 'Accessibility Example',
  category: 'modern-professional',
  description: 'Example template demonstrating accessibility features',
  previewImage: '',
  isActive: true,
};

/**
 * AccessibilityControlPanel - Demonstrates accessibility configuration
 */
const AccessibilityControlPanel: React.FC = () => {
  const { config, updateConfig, isAccessibilityCompliant } = useAccessibility();

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <SemanticHeading level={3}>Accessibility Settings</SemanticHeading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Contrast Ratio
          </label>
          <select
            value={config.contrastRatio}
            onChange={(e) => updateConfig({ contrastRatio: e.target.value as any })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          >
            <option value="normal">Normal (WCAG AA)</option>
            <option value="high">High (WCAG AAA)</option>
            <option value="maximum">Maximum</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Font Size
          </label>
          <select
            value={config.fontSize}
            onChange={(e) => updateConfig({ fontSize: e.target.value as any })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="reduced-motion"
            checked={config.reducedMotion}
            onChange={(e) => updateConfig({ reducedMotion: e.target.checked })}
            className="rounded focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="reduced-motion" className="text-sm font-medium">
            Reduced Motion
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="color-blind-friendly"
            checked={config.colorBlindFriendly}
            onChange={(e) => updateConfig({ colorBlindFriendly: e.target.checked })}
            className="rounded focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="color-blind-friendly" className="text-sm font-medium">
            Color Blind Friendly
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="dark-mode"
            checked={config.darkMode}
            onChange={(e) => updateConfig({ darkMode: e.target.checked })}
            className="rounded focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="dark-mode" className="text-sm font-medium">
            Dark Mode
          </label>
        </div>
      </div>
      
      <div className={`p-3 rounded ${
        isAccessibilityCompliant() 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isAccessibilityCompliant() ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <span className="font-medium">
            {isAccessibilityCompliant() ? 'Fully Compliant' : 'Partially Compliant'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * ContrastValidationDemo - Demonstrates contrast validation
 */
const ContrastValidationDemo: React.FC = () => {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <SemanticHeading level={3}>Contrast Validation</SemanticHeading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Foreground Color
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="w-12 h-10 border rounded"
            />
            <input
              type="text"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary"
              placeholder="#000000"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Background Color
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-12 h-10 border rounded"
            />
            <input
              type="text"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>
      
      <div 
        className="p-4 rounded text-center font-medium"
        style={{ color: foreground, backgroundColor: background }}
      >
        Sample text with selected colors
      </div>
      
      <ContrastValidator
        foreground={foreground}
        background={background}
        fontSize={16}
        fontWeight="normal"
        showWarnings={true}
      />
    </div>
  );
};

/**
 * FocusManagementDemo - Demonstrates focus management
 */
const FocusManagementDemo: React.FC = () => {
  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <SemanticHeading level={3}>Focus Management</SemanticHeading>
      
      <FocusManager enabled={true} autoFocus={false} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AccessibleButton variant="primary" size="medium">
            First Button
          </AccessibleButton>
          <AccessibleButton variant="secondary" size="medium">
            Second Button
          </AccessibleButton>
          <AccessibleButton variant="tertiary" size="medium">
            Third Button
          </AccessibleButton>
        </div>
        
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Text input"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          />
          <select className="w-full p-2 border rounded focus:ring-2 focus:ring-primary">
            <option>Select option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <textarea
            placeholder="Textarea"
            rows={3}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          Use Tab to navigate between elements. Use Ctrl+Arrow keys for enhanced navigation.
        </p>
      </FocusManager>
    </div>
  );
};

/**
 * AccessibilityExample - Main example component
 */
export const AccessibilityExample: React.FC = () => {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <AccessibilityProvider>
      <ScreenReaderOptimizer
        announceChanges={true}
        skipToContent={true}
        landmarkRoles={true}
        headingStructure={true}
      >
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <header>
            <SemanticHeading level={1}>
              Accessibility Framework Example
            </SemanticHeading>
            <p className="text-lg text-muted-foreground mt-2">
              Demonstration of WCAG 2.1 compliance features for resume templates
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AccessibilityControlPanel />
            <ContrastValidationDemo />
          </div>

          <FocusManagementDemo />

          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <SemanticHeading level={3}>
                Accessibility Testing
              </SemanticHeading>
              <AccessibleButton
                variant="secondary"
                onClick={() => setShowAudit(!showAudit)}
                aria-expanded={showAudit}
                aria-controls="accessibility-audit"
              >
                {showAudit ? 'Hide' : 'Show'} Audit
              </AccessibleButton>
            </div>

            {showAudit && (
              <div id="accessibility-audit">
                <AccessibilityAudit
                  showDetailedReport={true}
                  autoRun={false}
                />
              </div>
            )}

            <AccessibilityTester
              showResults={true}
              autoRun={false}
            />
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <SemanticHeading level={3}>
              Implementation Notes
            </SemanticHeading>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• All components follow WCAG 2.1 AA guidelines</li>
              <li>• Keyboard navigation is fully supported</li>
              <li>• Screen reader compatibility is built-in</li>
              <li>• Contrast ratios are automatically validated</li>
              <li>• Focus management maintains logical tab order</li>
              <li>• User preferences are detected and respected</li>
              <li>• Real-time accessibility testing is available</li>
            </ul>
          </div>
        </div>
      </ScreenReaderOptimizer>
    </AccessibilityProvider>
  );
};

export default AccessibilityExample;