/**
 * Unit tests for Empty State Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEmptyPersonalInfo,
  getEmptyExperience,
  getEmptySkill,
  getEmptyEducation,
  getEmptyProject,
  getEmptyResume,
  isResumeEmpty,
  clearResumeSession,
  getResumeMode,
  ResumeMode,
  PLACEHOLDER_TEXT,
  DROPDOWN_DEFAULTS,
  SKILL_CATEGORIES,
  EMPLOYMENT_TYPES,
  DEGREE_TYPES
} from './emptyStateService';

describe('Empty State Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getEmptyPersonalInfo', () => {
    it('should return empty personal info object', () => {
      const result = getEmptyPersonalInfo();
      
      expect(result).toEqual({
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
    });

    it('should return a new object each time', () => {
      const result1 = getEmptyPersonalInfo();
      const result2 = getEmptyPersonalInfo();
      
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('getEmptyExperience', () => {
    it('should return empty experience object with unique ID', () => {
      const result = getEmptyExperience();
      
      expect(result).toMatchObject({
        position: '',
        company: '',
        location: '',
        employmentType: undefined,
        startDate: '',
        endDate: '',
        description: '',
        technologies: [],
        current: false
      });
      
      expect(result.id).toBeTruthy();
      expect(typeof result.id).toBe('string');
    });

    it('should generate unique IDs for multiple calls', () => {
      const result1 = getEmptyExperience();
      const result2 = getEmptyExperience();
      
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getEmptySkill', () => {
    it('should return empty skill object with default proficiency', () => {
      const result = getEmptySkill();
      
      expect(result).toMatchObject({
        name: '',
        category: '',
        yearsOfExperience: 0,
        proficiency: 50,
        isCore: false
      });
      
      expect(result.id).toBeTruthy();
    });
  });

  describe('getEmptyEducation', () => {
    it('should return empty education object', () => {
      const result = getEmptyEducation();
      
      expect(result).toMatchObject({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        location: '',
        achievements: []
      });
      
      expect(result.id).toBeTruthy();
    });
  });

  describe('getEmptyProject', () => {
    it('should return empty project object', () => {
      const result = getEmptyProject();
      
      expect(result).toMatchObject({
        name: '',
        description: '',
        technologies: [],
        startDate: '',
        endDate: '',
        url: '',
        github: '',
        images: []
      });
      
      expect(result.id).toBeTruthy();
    });
  });

  describe('getEmptyResume', () => {
    it('should return complete empty resume structure', () => {
      const result = getEmptyResume();
      
      expect(result).toMatchObject({
        id: '1',
        personalInfo: getEmptyPersonalInfo(),
        summary: '',
        objective: '',
        experiences: [],
        skills: [],
        education: [],
        projects: []
      });
    });

    it('should use provided resume ID', () => {
      const customId = 'custom-resume-id';
      const result = getEmptyResume(customId);
      
      expect(result.id).toBe(customId);
    });
  });

  describe('isResumeEmpty', () => {
    it('should return true for completely empty resume', () => {
      const emptyResume = getEmptyResume();
      
      expect(isResumeEmpty(emptyResume)).toBe(true);
    });

    it('should return false if personal info has data', () => {
      const resume = {
        ...getEmptyResume(),
        personalInfo: {
          ...getEmptyPersonalInfo(),
          name: 'Alex Morgan'
        }
      };
      
      expect(isResumeEmpty(resume)).toBe(false);
    });

    it('should return false if any section has data', () => {
      const resume = {
        ...getEmptyResume(),
        experiences: [getEmptyExperience()]
      };
      
      expect(isResumeEmpty(resume)).toBe(false);
    });

    it('should return false if summary is filled', () => {
      const resume = {
        ...getEmptyResume(),
        summary: 'Professional summary'
      };
      
      expect(isResumeEmpty(resume)).toBe(false);
    });
  });

  describe('clearResumeSession', () => {
    beforeEach(() => {
      // Set up some test data in localStorage
      localStorage.setItem('resume-1', 'test-data-1');
      localStorage.setItem('resume-1-template', 'template-1');
      localStorage.setItem('resume-2', 'test-data-2');
      localStorage.setItem('other-data', 'should-remain');
    });

    it('should clear specific resume data when resumeId provided', () => {
      clearResumeSession('1');
      
      expect(localStorage.getItem('resume-1')).toBeNull();
      expect(localStorage.getItem('resume-1-template')).toBeNull();
      expect(localStorage.getItem('resume-2')).toBe('test-data-2');
      expect(localStorage.getItem('other-data')).toBe('should-remain');
    });

    it('should clear all resume data when no resumeId provided', () => {
      clearResumeSession();
      
      expect(localStorage.getItem('resume-1')).toBeNull();
      expect(localStorage.getItem('resume-1-template')).toBeNull();
      expect(localStorage.getItem('resume-2')).toBeNull();
      expect(localStorage.getItem('other-data')).toBe('should-remain');
    });
  });

  describe('getResumeMode', () => {
    it('should return NEW mode for new parameter', () => {
      const searchParams = new URLSearchParams('?mode=new');
      
      expect(getResumeMode(searchParams)).toBe(ResumeMode.NEW);
    });

    it('should return EDIT mode for edit parameter', () => {
      const searchParams = new URLSearchParams('?mode=edit&resumeId=123');
      
      expect(getResumeMode(searchParams)).toBe(ResumeMode.EDIT);
    });

    it('should return DUPLICATE mode for duplicate parameter', () => {
      const searchParams = new URLSearchParams('?mode=duplicate&resumeId=123');
      
      expect(getResumeMode(searchParams)).toBe(ResumeMode.DUPLICATE);
    });

    it('should return NEW mode when no parameters provided', () => {
      const searchParams = new URLSearchParams('');
      
      expect(getResumeMode(searchParams)).toBe(ResumeMode.NEW);
    });

    it('should return EDIT mode when resumeId provided without mode', () => {
      const searchParams = new URLSearchParams('?resumeId=123');
      
      expect(getResumeMode(searchParams)).toBe(ResumeMode.EDIT);
    });
  });

  describe('Constants', () => {
    it('should have placeholder text for all form fields', () => {
      expect(PLACEHOLDER_TEXT.personalInfo.name).toBeTruthy();
      expect(PLACEHOLDER_TEXT.personalInfo.email).toBeTruthy();
      expect(PLACEHOLDER_TEXT.experience.position).toBeTruthy();
      expect(PLACEHOLDER_TEXT.education.institution).toBeTruthy();
      expect(PLACEHOLDER_TEXT.project.name).toBeTruthy();
      expect(PLACEHOLDER_TEXT.skill.name).toBeTruthy();
      expect(PLACEHOLDER_TEXT.summary).toBeTruthy();
      expect(PLACEHOLDER_TEXT.objective).toBeTruthy();
    });

    it('should have dropdown defaults', () => {
      expect(DROPDOWN_DEFAULTS.employmentType).toBe('Select employment type');
      expect(DROPDOWN_DEFAULTS.degree).toBe('Select degree');
      expect(DROPDOWN_DEFAULTS.skillCategory).toBe('Select category');
    });

    it('should have skill categories array', () => {
      expect(Array.isArray(SKILL_CATEGORIES)).toBe(true);
      expect(SKILL_CATEGORIES.length).toBeGreaterThan(0);
      expect(SKILL_CATEGORIES).toContain('Programming Languages');
    });

    it('should have employment types array', () => {
      expect(Array.isArray(EMPLOYMENT_TYPES)).toBe(true);
      expect(EMPLOYMENT_TYPES.length).toBeGreaterThan(0);
      expect(EMPLOYMENT_TYPES).toContain('Full-time');
    });

    it('should have degree types array', () => {
      expect(Array.isArray(DEGREE_TYPES)).toBe(true);
      expect(DEGREE_TYPES.length).toBeGreaterThan(0);
      expect(DEGREE_TYPES).toContain('Bachelor of Science');
    });
  });
});