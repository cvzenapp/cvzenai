/**
 * Template Components
 * Exports all template components for building resume templates
 * following the three-tier hierarchy design principles
 */

// Header component (Tier 1: Critical Assessment)
export {
  Header,
  type HeaderProps,
  type TemplateAction,
} from './Header';

// Summary & Skills component (Tier 2: Qualification Review)
export {
  SummarySkills,
  type SummarySkillsProps,
} from './SummarySkills';

// Experience & Projects component (Tier 3: Detailed Evaluation)
export {
  ExperienceProjects,
  type ExperienceProjectsProps,
} from './ExperienceProjects';

// Tab Navigation component for accessible section navigation
export {
  TabNavigation,
  type TabNavigationProps,
  type TabConfig,
} from './TabNavigation';

// Progressive Disclosure component for collapsible content
export {
  ProgressiveDisclosure,
  type ProgressiveDisclosureProps,
} from './ProgressiveDisclosure';

// Education Carousel component
export {
  EducationCarousel,
} from './EducationCarousel';

// Experience Carousel component
export {
  ExperienceCarousel,
} from './ExperienceCarousel';

// Skills visualization components
export {
  SkillsBarChart,
} from './SkillsBarChart';

export {
  SkillsGraphChart,
} from './SkillsGraphChart';

// Certifications Section component
export {
  CertificationsSection,
} from './CertificationsSection';
