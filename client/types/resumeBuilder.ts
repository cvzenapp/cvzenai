/**
 * TypeScript interfaces for Resume Builder
 * Extends shared API types with builder-specific properties
 */

import { Resume, PersonalInfo, Experience, Education, Project, Skill } from '@shared/api';

/**
 * Extended interfaces to match current ResumeBuilder implementation
 * These should eventually be aligned with the shared API types
 */

export interface ResumeBuilderPersonalInfo extends PersonalInfo {
  // Matches current implementation
}

export interface ResumeBuilderExperience extends Experience {
  current?: boolean; // Indicates if this is current position
}

export interface ResumeBuilderSkill extends Omit<Skill, 'level'> {
  proficiency: number; // 0-100 proficiency level (current implementation uses this instead of 'level')
}

export interface ResumeBuilderEducation extends Education {
  // Matches current implementation
}

export interface ResumeBuilderProject extends Project {
  title?: string; // Current implementation uses 'title' in some places
}

/**
 * Complete Resume Builder data structure
 */
export interface ResumeBuilderData {
  id: string;
  personalInfo: ResumeBuilderPersonalInfo;
  summary: string;
  objective: string;
  experiences: ResumeBuilderExperience[];
  skills: ResumeBuilderSkill[];
  education: ResumeBuilderEducation[];
  projects: ResumeBuilderProject[];
}

/**
 * Resume creation context
 */
export interface ResumeCreationContext {
  isNewResume: boolean;
  resumeId: string | null;
  mode: 'new' | 'edit' | 'duplicate';
  dataLoaded: boolean;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  showEmptyMessage: boolean;
  emptyMessage: string;
  showAddButton: boolean;
  addButtonText: string;
}

/**
 * Form validation state
 */
export interface FormValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  requiredFields: string[];
  completedFields: string[];
}

/**
 * Step completion status
 */
export interface StepCompletionStatus {
  personal: boolean;
  overview: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
}

/**
 * Array section types for generic handling
 */
export type ArraySectionType = 'experiences' | 'skills' | 'education' | 'projects';

/**
 * Array section item types
 */
export type ArraySectionItem = ResumeBuilderExperience | ResumeBuilderSkill | ResumeBuilderEducation | ResumeBuilderProject;

/**
 * Form field change handler type
 */
export type FieldChangeHandler<T = string> = (value: T) => void;

/**
 * Array item update handler type
 */
export type ArrayItemUpdateHandler<T = ArraySectionItem> = (index: number, field: string, value: any) => void;

/**
 * Array item action handlers
 */
export interface ArraySectionHandlers<T = ArraySectionItem> {
  add: () => void;
  remove: (index: number) => void;
  update: ArrayItemUpdateHandler<T>;
}

/**
 * Resume builder step configuration
 */
export interface ResumeBuilderStep {
  id: string;
  title: string;
  description: string;
  icon: any; // React component
  required: boolean;
  completed: boolean;
}

/**
 * Local storage keys for resume data
 */
export const STORAGE_KEYS = {
  RESUME_DATA: (id: string) => `resume-${id}`,
  RESUME_TEMPLATE: (id: string) => `resume-${id}-template`,
  RESUME_DRAFT: (id: string) => `resume-${id}-draft`
} as const;