import React from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { SummarySkills } from '../components/SummarySkills';
import { ExperienceProjects } from '../components/ExperienceProjects';

// Three-tier hierarchy layout interface
export interface ThreeTierLayoutProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  children?: React.ReactNode;
  className?: string;
}

// Tier 1: Critical Assessment (Top 1/3)
export interface Tier1Props {
  resume: Resume;
  templateConfig: TemplateConfig;
  onDownload?: () => void;
  onContact?: () => void;
  onShare?: () => void;
}

// Tier 2: Qualification Review (Middle 1/3)
export interface Tier2Props {
  resume: Resume;
  templateConfig: TemplateConfig;
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

// Tier 3: Detailed Evaluation (Bottom 1/3)
export interface Tier3Props {
  resume: Resume;
  templateConfig: TemplateConfig;
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

/**
 * Base template structure implementing three-tier hierarchy layout
 * Following HFI and HIG principles for recruiter-optimized information architecture
 */
export const BaseTemplateStructure: React.FC<ThreeTierLayoutProps> = ({
  resume: _resume,
  templateConfig,
  children,
  className = ''
}) => {
  return (
    <div 
      className={`template-container min-h-screen bg-background text-foreground ${className}`}
      data-template-id={templateConfig.id}
      data-template-category={templateConfig.category}
    >
      {/* Template wrapper with responsive grid */}
      <div 
        id="resume-template-container"
        className="template-grid max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        {children}
      </div>
    </div>
  );
};



/**
 * Tier 2: Qualification Review Component
 * Contains professional summary and core skills/tech stack
 */
export const Tier2QualificationReview: React.FC<Tier2Props> = ({
  resume,
  templateConfig,
  improveSection,
  isImprovingSection,
  showImproveButtons
}) => {
  return (
    <section 
      className="tier-2-qualification-review"
      aria-label="Qualification Review"
    >
      <SummarySkills 
        resume={resume}
        templateConfig={templateConfig}
        improveSection={improveSection}
        isImprovingSection={isImprovingSection}
        showImproveButtons={showImproveButtons}
      />
    </section>
  );
};

/**
 * Tier 3: Detailed Evaluation Component
 * Contains work experience, projects, and education
 */
export const Tier3DetailedEvaluation: React.FC<Tier3Props> = ({
  resume,
  templateConfig,
  improveSection,
  isImprovingSection,
  showImproveButtons
}) => {
  return (
    <section 
      className="tier-3-detailed-evaluation"
      aria-label="Detailed Evaluation"
    >
      <ExperienceProjects 
        resume={resume}
        templateConfig={templateConfig}
        improveSection={improveSection}
        isImprovingSection={isImprovingSection}
        showImproveButtons={showImproveButtons}
      />
    </section>
  );
};





