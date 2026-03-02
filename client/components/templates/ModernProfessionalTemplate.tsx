import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { 
  BaseTemplateStructure, 
  Tier2QualificationReview, 
  Tier3DetailedEvaluation 
} from './foundation/BaseTemplateStructure';
import { Header } from './components/Header';
import { TemplateContainer } from './foundation/ResponsiveGrid';
import { 
  ResponsiveTemplateWrapper, 
  AdaptiveComponent, 
  TouchOptimized,
  useResponsiveTemplate 
} from './foundation/ResponsiveTemplateSystem';

interface TemplateProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  upvotes: number;
  hasUpvoted: boolean;
  isShortlisted: boolean;
  onUpvote: () => void;
  onShortlist: () => void;
  // Section improvement support
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

/**
 * Modern Professional Template
 * Demonstrates the new three-tier hierarchy structure with responsive template system
 * Following HFI and HIG principles for recruiter-optimized information architecture
 */
export default function ModernProfessionalTemplate({
  resume,
  templateConfig,
  activeTab: _activeTab,
  setActiveTab: _setActiveTab,
  upvotes: _upvotes,
  hasUpvoted: _hasUpvoted,
  isShortlisted: _isShortlisted,
  onUpvote: _onUpvote,
  onShortlist: _onShortlist,
  improveSection,
  isImprovingSection,
  showImproveButtons = false,
}: TemplateProps) {
  const { isMobile, isTablet: _isTablet, deviceCapabilities } = useResponsiveTemplate();

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log('Download resume');
  };

  const handleContact = () => {
    // TODO: Implement contact functionality
    console.log('Contact candidate');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share resume');
  };

  // Responsive configuration for the template
  const responsiveConfig = {
    breakpoints: {
      mobile: {
        layout: 'single-column' as const,
        headerStyle: 'compact' as const,
        navigationStyle: 'accordion' as const,
        cardDensity: 'compact' as const,
        showSecondaryInfo: false,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      },
      tablet: {
        layout: 'two-column' as const,
        headerStyle: 'standard' as const,
        navigationStyle: 'tabs' as const,
        cardDensity: 'standard' as const,
        showSecondaryInfo: true,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      },
      desktop: {
        layout: 'three-column' as const,
        headerStyle: 'standard' as const,
        navigationStyle: 'tabs' as const,
        cardDensity: 'standard' as const,
        showSecondaryInfo: true,
        enableAnimations: !deviceCapabilities.prefersReducedMotion
      },
      wide: {
        layout: 'three-column' as const,
        headerStyle: 'expanded' as const,
        navigationStyle: 'tabs' as const,
        cardDensity: 'spacious' as const,
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
      enableVirtualization: isMobile,
      imageOptimization: true,
      fontPreloading: deviceCapabilities.connectionSpeed === 'fast'
    }
  };

  return (
    <ResponsiveTemplateWrapper
      resume={resume}
      templateConfig={templateConfig}
      responsiveConfig={responsiveConfig}
      className="modern-professional-template"
    >
      <BaseTemplateStructure
        resume={resume}
        templateConfig={templateConfig}
        className="modern-professional-template"
      >
        <TemplateContainer maxWidth="7xl">
          {/* Adaptive Tier 1: Critical Assessment - Identity and Primary Actions */}
          <AdaptiveComponent
            mobile={
              <TouchOptimized>
                <Header
                  resume={resume}
                  templateConfig={templateConfig}
                  onDownload={handleDownload}
                  onContact={handleContact}
                  onShare={handleShare}
                />
              </TouchOptimized>
            }
            fallback={
              <Header
                resume={resume}
                templateConfig={templateConfig}
                onDownload={handleDownload}
                onContact={handleContact}
                onShare={handleShare}
              />
            }
          />

          {/* Adaptive Tier 2: Qualification Review - Summary and Skills */}
          <AdaptiveComponent
            mobile={
              <div className="mobile-optimized-tier2">
                <Tier2QualificationReview
                  resume={resume}
                  templateConfig={templateConfig}
                  improveSection={improveSection}
                  isImprovingSection={isImprovingSection}
                  showImproveButtons={showImproveButtons}
                />
              </div>
            }
            fallback={
              <Tier2QualificationReview
                resume={resume}
                templateConfig={templateConfig}
                improveSection={improveSection}
                isImprovingSection={isImprovingSection}
                showImproveButtons={showImproveButtons}
              />
            }
          />

          {/* Adaptive Tier 3: Detailed Evaluation - Experience, Projects, Education */}
          <AdaptiveComponent
            mobile={
              <div className="mobile-optimized-tier3">
                <Tier3DetailedEvaluation
                  resume={resume}
                  templateConfig={templateConfig}
                  improveSection={improveSection}
                  isImprovingSection={isImprovingSection}
                  showImproveButtons={showImproveButtons}
                />
              </div>
            }
            tablet={
              <div className="tablet-optimized-tier3">
                <Tier3DetailedEvaluation
                  resume={resume}
                  templateConfig={templateConfig}
                  improveSection={improveSection}
                  isImprovingSection={isImprovingSection}
                  showImproveButtons={showImproveButtons}
                />
              </div>
            }
            fallback={
              <Tier3DetailedEvaluation
                resume={resume}
                templateConfig={templateConfig}
                improveSection={improveSection}
                isImprovingSection={isImprovingSection}
                showImproveButtons={showImproveButtons}
              />
            }
          />
        </TemplateContainer>
      </BaseTemplateStructure>
    </ResponsiveTemplateWrapper>
  );
}