import { describe, it, expect, beforeEach } from 'vitest';
import { StepValidationService, stepValidationService } from './stepValidationService';
import { ResumeFormState } from '@/hooks/useFormStateManager';

describe('StepValidationService', () => {
  let service: StepValidationService;
  let mockFormState: ResumeFormState;

  beforeEach(() => {
    service = new StepValidationService();
    mockFormState = {
      personalInfo: {
        name: 'Alex Morgan',
        title: 'Software Engineer',
        email: 'john@example.com',
        phone: '+1-234-567-8900',
        location: 'New York, NY',
        website: 'https://johndoe.com',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        avatar: ''
      },
      summary: 'Experienced software engineer',
      objective: 'Seeking new opportunities',
      experiences: [{
        id: '1',
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
        description: 'Developed web applications'
      }],
      education: [{
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-01'
      }],
      skills: [{
        id: '1',
        name: 'JavaScript',
        level: 90,
        category: 'Programming Languages'
      }],
      projects: [{
        id: '1',
        name: 'Portfolio Website',
        description: 'Personal portfolio built with React',
        technologies: ['React', 'TypeScript'],
        startDate: '2023-01-01'
      }],
      metadata: {
        lastSaved: null,
        isDirty: false,
        validationStatus: 'valid',
        autoSaveEnabled: true,
        version: 1,
        lastModified: new Date().toISOString()
      }
    };
  });

  describe('Step Configuration Management', () => {
    it('should initialize with default steps', () => {
      const allSteps = service.getAllSteps();
      expect(allSteps).toHaveLength(6);
      expect(allSteps.map(s => s.stepId)).toEqual([
        'personal-info',
        'summary',
        'experience',
        'education',
        'skills',
        'projects'
      ]);
    });

    it('should add new step configuration', () => {
      const newStep = {
        stepId: 'custom-step',
        name: 'Custom Step',
        requiredFields: ['customField'],
        optionalFields: []
      };

      service.addStep(newStep);
      const config = service.getStepConfig('custom-step');
      expect(config).toEqual(newStep);
    });

    it('should remove step configuration', () => {
      service.removeStep('projects');
      const config = service.getStepConfig('projects');
      expect(config).toBeUndefined();
      
      const allSteps = service.getAllSteps();
      expect(allSteps.map(s => s.stepId)).not.toContain('projects');
    });

    it('should insert step at specific index', () => {
      const newStep = {
        stepId: 'inserted-step',
        name: 'Inserted Step',
        requiredFields: [],
        optionalFields: []
      };

      service.addStep(newStep, 2);
      const allSteps = service.getAllSteps();
      expect(allSteps[2].stepId).toBe('inserted-step');
    });
  });

  describe('Step Validation', () => {
    it('should validate personal-info step correctly', () => {
      const result = service.validateStep('personal-info', mockFormState);
      
      expect(result.stepId).toBe('personal-info');
      expect(result.isValid).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.completionPercentage).toBeGreaterThan(0);
    });

    it('should detect missing required fields', () => {
      const invalidFormState = {
        ...mockFormState,
        personalInfo: {
          ...mockFormState.personalInfo,
          name: '',
          email: ''
        }
      };

      const result = service.validateStep('personal-info', invalidFormState);
      
      expect(result.isValid).toBe(false);
      expect(result.isComplete).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'personalInfo.name')).toBe(true);
      expect(result.errors.some(e => e.field === 'personalInfo.email')).toBe(true);
    });

    it('should validate optional fields when present', () => {
      const formStateWithInvalidOptional = {
        ...mockFormState,
        personalInfo: {
          ...mockFormState.personalInfo,
          website: 'invalid-url'
        }
      };

      const result = service.validateStep('personal-info', formStateWithInvalidOptional);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'personalInfo.website')).toBe(true);
    });

    it('should run custom validators', () => {
      const emptyExperienceState = {
        ...mockFormState,
        experiences: []
      };

      const result = service.validateStep('experience', emptyExperienceState);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'RECOMMENDED_FIELD')).toBe(true);
    });

    it('should calculate completion percentage correctly', () => {
      const partialFormState = {
        ...mockFormState,
        personalInfo: {
          ...mockFormState.personalInfo,
          phone: '',
          website: '',
          linkedin: '',
          github: ''
        }
      };

      const result = service.validateStep('personal-info', partialFormState);
      
      // Should have name, email, location filled (3 out of 7 fields)
      expect(result.completionPercentage).toBeCloseTo(42.86, 1);
    });

    it('should throw error for unknown step', () => {
      expect(() => {
        service.validateStep('unknown-step', mockFormState);
      }).toThrow('Step configuration not found for: unknown-step');
    });
  });

  describe('Form-Level Validation', () => {
    it('should validate all steps', () => {
      const result = service.validateAllSteps(mockFormState, 'personal-info');
      
      expect(result.currentStep).toBe('personal-info');
      expect(result.overallValid).toBe(true);
      expect(result.canProceedToNext).toBe(true);
      expect(result.canGoToPrevious).toBe(false);
      expect(Object.keys(result.steps)).toHaveLength(6);
    });

    it('should detect overall invalid state', () => {
      const invalidFormState = {
        ...mockFormState,
        personalInfo: {
          ...mockFormState.personalInfo,
          name: '',
          email: 'invalid-email'
        }
      };

      const result = service.validateAllSteps(invalidFormState, 'personal-info');
      
      expect(result.overallValid).toBe(false);
      expect(result.canProceedToNext).toBe(false);
    });

    it('should handle step navigation correctly', () => {
      const result = service.validateAllSteps(mockFormState, 'experience');
      
      expect(result.canProceedToNext).toBe(true);
      expect(result.canGoToPrevious).toBe(true);
    });
  });

  describe('Step Navigation', () => {
    it('should allow proceeding to next step when current is complete', () => {
      const canProceed = service.canProceedToStep('personal-info', 'summary', mockFormState);
      expect(canProceed).toBe(true);
    });

    it('should prevent proceeding when current step is incomplete', () => {
      const invalidFormState = {
        ...mockFormState,
        personalInfo: {
          ...mockFormState.personalInfo,
          name: ''
        }
      };

      const canProceed = service.canProceedToStep('personal-info', 'summary', invalidFormState);
      expect(canProceed).toBe(false);
    });

    it('should always allow going backwards', () => {
      const canProceed = service.canProceedToStep('summary', 'personal-info', mockFormState);
      expect(canProceed).toBe(true);
    });

    it('should get next step correctly', () => {
      expect(service.getNextStep('personal-info')).toBe('summary');
      expect(service.getNextStep('projects')).toBeNull();
    });

    it('should get previous step correctly', () => {
      expect(service.getPreviousStep('summary')).toBe('personal-info');
      expect(service.getPreviousStep('personal-info')).toBeNull();
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(stepValidationService).toBeInstanceOf(StepValidationService);
      expect(stepValidationService).toBe(stepValidationService);
    });
  });
});