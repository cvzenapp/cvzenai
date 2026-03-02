/**
 * Empty State Service
 * Provides utilities for creating empty resume data structures
 * to ensure clean resume creation without pre-populated sample data
 */

import { Resume, PersonalInfo, Experience, Education, Project, Skill } from '@shared/api';

/**
 * Extended Skill interface to match ResumeBuilder implementation
 * TODO: Align with shared API types in future refactor
 */
export interface ResumeBuilderSkill extends Omit<Skill, 'level'> {
  proficiency: number; // 0-100 proficiency level (matches current ResumeBuilder)
  current?: boolean; // For experience entries
}

/**
 * Extended Experience interface to match ResumeBuilder implementation
 */
export interface ResumeBuilderExperience extends Experience {
  current?: boolean; // Indicates if this is current position
}

/**
 * Resume creation mode enumeration
 */
export enum ResumeMode {
  NEW = 'new',
  EDIT = 'edit',
  DUPLICATE = 'duplicate'
}

/**
 * Configuration for resume initialization
 */
export interface ResumeInitializationConfig {
  mode: ResumeMode;
  resumeId?: string;
  clearExistingData?: boolean;
}

/**
 * Creates an empty PersonalInfo object
 */
export const getEmptyPersonalInfo = (): PersonalInfo => ({
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  avatar: ''
});

/**
 * Creates an empty Experience template
 */
export const getEmptyExperience = (): ResumeBuilderExperience => ({
  id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  position: '',
  company: '',
  location: '',
  employmentType: undefined, // No default selection
  startDate: '',
  endDate: '',
  description: '',
  technologies: [],
  current: false
});

/**
 * Creates an empty Skill template
 */
export const getEmptySkill = (): ResumeBuilderSkill => ({
  id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: '',
  category: '', // No default selection
  yearsOfExperience: 0,
  proficiency: 50, // Reasonable default for slider
  isCore: false
});

/**
 * Creates an empty Education template
 */
export const getEmptyEducation = (): Education => ({
  id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  institution: '',
  degree: '', // No default selection
  field: '',
  startDate: '',
  endDate: '',
  gpa: '',
  location: '',
  achievements: []
});

/**
 * Creates an empty Project template
 */
export const getEmptyProject = (): Project => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: '',
  description: '',
  technologies: [],
  startDate: '',
  endDate: '',
  url: '',
  github: '',
  images: []
});

/**
 * Creates a complete empty resume template
 */
export const getEmptyResume = (resumeId?: string): Omit<Resume, 'upvotes' | 'rating' | 'isShortlisted' | 'createdAt' | 'updatedAt'> => ({
  id: resumeId || '1',
  personalInfo: getEmptyPersonalInfo(),
  summary: '',
  objective: '',
  experiences: [],
  skills: [],
  education: [],
  projects: []
});

/**
 * Placeholder text constants for form fields
 */
export const PLACEHOLDER_TEXT = {
  personalInfo: {
    name: 'Enter your full name',
    title: 'e.g., Senior Software Engineer',
    email: 'your.email@example.com',
    phone: '+1 (555) 123-4567',
    location: 'City, State',
    website: 'https://yourportfolio.com',
    linkedin: 'linkedin.com/in/yourprofile',
    github: 'github.com/yourusername'
  },
  experience: {
    position: 'e.g., Senior Software Engineer',
    company: 'Company name',
    location: 'City, State',
    description: 'Describe your responsibilities, achievements, and impact...',
    technologies: 'React, Node.js, PostgreSQL'
  },
  education: {
    institution: 'e.g., University of California, Berkeley',
    field: 'e.g., Computer Science',
    location: 'City, State',
    gpa: '3.8'
  },
  project: {
    name: 'e.g., E-commerce Platform',
    description: 'Describe the project, your role, and key achievements...',
    url: 'https://project-demo.com',
    github: 'github.com/username/project'
  },
  skill: {
    name: 'e.g., JavaScript'
  },
  summary: 'Write a compelling summary of your professional experience, key skills, and achievements...',
  objective: 'Describe your career goals and what you\'re looking for in your next role...'
};

/**
 * Dropdown default options
 */
export const DROPDOWN_DEFAULTS = {
  employmentType: 'Select employment type',
  degree: 'Select degree',
  skillCategory: 'Select category'
};

/**
 * Skill categories for dropdown
 */
export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend Frameworks',
  'Backend Technologies',
  'Databases',
  'Cloud & DevOps',
  'Development Tools',
  'Soft Skills'
];

/**
 * Employment types for dropdown
 */
export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship'
] as const;

/**
 * Degree types for dropdown
 */
export const DEGREE_TYPES = [
  'High School Diploma',
  'Associate of Arts',
  'Associate of Science',
  'Bachelor of Arts',
  'Bachelor of Science',
  'Master of Arts',
  'Master of Science',
  'Master of Business Administration',
  'Doctor of Philosophy',
  'Certificate Program'
];

/**
 * Validates if a resume is in empty state
 */
export const isResumeEmpty = (resume: Partial<Resume>): boolean => {
  const personalInfoEmpty = !resume.personalInfo?.name && 
                           !resume.personalInfo?.email && 
                           !resume.personalInfo?.title;
  
  const sectionsEmpty = (!resume.experiences || resume.experiences.length === 0) &&
                       (!resume.skills || resume.skills.length === 0) &&
                       (!resume.education || resume.education.length === 0) &&
                       (!resume.projects || resume.projects.length === 0) &&
                       !resume.summary &&
                       !resume.objective;

  return personalInfoEmpty && sectionsEmpty;
};

/**
 * Clears resume-related localStorage data
 */
export const clearResumeSession = (resumeId?: string): void => {
  if (resumeId) {
    localStorage.removeItem(`resume-${resumeId}`);
    localStorage.removeItem(`resume-${resumeId}-template`);
  } else {
    // Clear all resume-related localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith('resume-'))
      .forEach(key => localStorage.removeItem(key));
  }
};

/**
 * Determines resume creation mode from URL parameters
 */
export const getResumeMode = (searchParams: URLSearchParams): ResumeMode => {
  const mode = searchParams.get('mode');
  const resumeId = searchParams.get('resumeId');
  
  if (mode === 'new' || (!mode && !resumeId)) {
    return ResumeMode.NEW;
  } else if (mode === 'duplicate') {
    return ResumeMode.DUPLICATE;
  } else {
    return ResumeMode.EDIT;
  }
};