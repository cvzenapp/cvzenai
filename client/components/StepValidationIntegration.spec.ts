import { describe, it, expect, beforeEach } from 'vitest';
import { stepValidationService, STEP_VALIDATION_CONFIGS } from '../services/stepValidationService';
import { ResumeFormState } from '../hooks/useFormStateManager';

describe('Step Validation Integration Tests', () => {
  let mockFormState: ResumeFormState;

  beforeEach(() => {
    mockFormState = {
      personalInfo: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        github: '',
        avatar: '',
      },
      summary: '',
      objective: '',
      experiences: [],
      education: [],
      skills: [],
      projects: [],
      metadata: {
        lastSaved: null,
        isDirty: false,
        validationStatus: 'valid',
        autoSaveEnabled: true,
        version: 1,
        lastModified: new Date().toISOString(),
      },
    };
  });

  describe('Form-level validation and step navigation', () => {
    it('should prevent navigation when current step has validation errors', () => {
      // Start with personal step - missing required fields
      const currentStepId = 'personal';
      const targetStepId = 'overview';

      const navigationResult = stepValidationService.canNavigateToStep(
        targetStepId,
        currentStepId,
        mockFormState
      );

      expect(navigationResult.canNavigate).toBe(false);
      expect(navigationResult.reason).toContain('required steps');
      expect(navigationResult.blockingErrors).toBeDefined();
      expect(navigationResult.blockingErrors!.length).toBeGreaterThan(0);
    });

    it('should allow navigation when current step validation passes', () => {
      // Complete personal info step
      mockFormState.personalInfo.name = 'John Doe';
      mockFormState.personalInfo.email = 'john@example.com';
      mockFormState.personalInfo.title = 'Software Engineer';

      const currentStepId = 'personal';
      const targetStepId = 'overview';

      const navigationResult = stepValidationService.canNavigateToStep(
        targetStepId,
        currentStepId,
        mockFormState
      );

      expect(navigationResult.canNavigate).toBe(true);
      expect(navigationResult.reason).toBeUndefined();
      expect(navigationResult.blockingErrors).toBeUndefined();
    });

    it('should validate form completion before allowing final save', () => {
      // Incomplete form
      const completionStatus = stepValidationService.getFormCompletionStatus(mockFormState);

      expect(completionStatus.isFormValid).toBe(false);
      expect(completionStatus.criticalErrors.length).toBeGreaterThan(0);
      expect(completionStatus.overallCompletion).toBeLessThan(100);

      // Complete required fields
      mockFormState.personalInfo.name = 'John Doe';
      mockFormState.personalInfo.email = 'john@example.com';
      mockFormState.personalInfo.title = 'Software Engineer';
      mockFormState.summary = 'Experienced software engineer with expertise in web development.';

      const updatedStatus = stepValidationService.getFormCompletionStatus(mockFormState);
      expect(updatedStatus.isFormValid).toBe(true);
      expect(updatedStatus.criticalErrors.length).toBe(0);
    });

    it('should validate all steps and return comprehensive status', () => {
      const allStepsValidation = stepValidationService.validateAllSteps(mockFormState);

      // Should have validation results for all configured steps
      const stepIds = Object.keys(STEP_VALIDATION_CONFIGS);
      expect(Object.keys(allStepsValidation)).toEqual(stepIds);

      // Personal step should have errors (missing required fields)
      expect(allStepsValidation.personal.isValid).toBe(false);
      expect(allStepsValidation.personal.errors.length).toBeGreaterThan(0);

      // Overview step should have errors (missing summary)
      expect(allStepsValidation.overview.isValid).toBe(false);
      expect(allStepsValidation.overview.errors.length).toBeGreaterThan(0);

      // Optional steps should be valid (no required fields)
      expect(allStepsValidation.experience.isValid).toBe(true);
      expect(allStepsValidation.education.isValid).toBe(true);
      expect(allStepsValidation.skills.isValid).toBe(true);
      expect(allStepsValidation.projects.isValid).toBe(true);
    });

    it('should handle step-by-step validation workflow', () => {
      const stepOrder = ['personal', 'overview', 'experience', 'education', 'skills', 'projects'];
      
      // Start with first step - should have errors
      let currentStep = stepOrder[0];
      let stepValidation = stepValidationService.validateStep(currentStep, mockFormState);
      expect(stepValidation.isValid).toBe(false);

      // Complete first step
      mockFormState.personalInfo.name = 'John Doe';
      mockFormState.personalInfo.email = 'john@example.com';
      mockFormState.personalInfo.title = 'Software Engineer';

      stepValidation = stepValidationService.validateStep(currentStep, mockFormState);
      expect(stepValidation.isValid).toBe(true);
      expect(stepValidation.completionPercentage).toBe(100);

      // Should now be able to navigate to next step
      const nextStep = stepOrder[1];
      const canNavigate = stepValidationService.canNavigateToStep(nextStep, currentStep, mockFormState);
      expect(canNavigate.canNavigate).toBe(true);

      // Validate next step - should have errors (missing summary)
      currentStep = nextStep;
      stepValidation = stepValidationService.validateStep(currentStep, mockFormState);
      expect(stepValidation.isValid).toBe(false);

      // Complete second step
      mockFormState.summary = 'Experienced software engineer with 5+ years of experience in web development.';
      stepValidation = stepValidationService.validateStep(currentStep, mockFormState);
      expect(stepValidation.isValid).toBe(true);
    });

    it('should handle backward navigation without validation restrictions', () => {
      // Should always allow backward navigation regardless of validation state
      const navigationResult = stepValidationService.canNavigateToStep(
        'personal',
        'overview',
        mockFormState
      );

      expect(navigationResult.canNavigate).toBe(true);
    });

    it('should prevent skipping steps with validation errors', () => {
      // Try to navigate from personal (invalid) to education (skipping overview)
      const navigationResult = stepValidationService.canNavigateToStep(
        'education',
        'personal',
        mockFormState
      );

      expect(navigationResult.canNavigate).toBe(false);
      expect(navigationResult.reason).toContain('required steps');
    });

    it('should validate email format correctly', () => {
      mockFormState.personalInfo.name = 'John Doe';
      mockFormState.personalInfo.title = 'Software Engineer';
      mockFormState.personalInfo.email = 'invalid-email';

      const stepValidation = stepValidationService.validateStep('personal', mockFormState);
      
      expect(stepValidation.isValid).toBe(false);
      const emailError = stepValidation.errors.find(error => 
        error.field === 'personalInfo.email' && error.code === 'INVALID_EMAIL_FORMAT'
      );
      expect(emailError).toBeDefined();
      expect(emailError!.message).toContain('valid email address');
    });

    it('should validate date ranges in experiences', () => {
      mockFormState.experiences = [{
        id: '1',
        position: 'Developer',
        company: 'Tech Corp',
        location: 'San Francisco',
        employmentType: 'Full-time',
        startDate: '2023-01-01',
        endDate: '2022-01-01', // End date before start date
        description: 'Software development role',
        technologies: ['JavaScript', 'React'],
        current: false,
      }];

      const stepValidation = stepValidationService.validateStep('experience', mockFormState);
      
      expect(stepValidation.isValid).toBe(false);
      const dateError = stepValidation.errors.find(error => 
        error.code === 'INVALID_DATE_RANGE'
      );
      expect(dateError).toBeDefined();
    });

    it('should provide completion percentage for each step', () => {
      // Empty form - should have low completion
      let stepValidation = stepValidationService.validateStep('personal', mockFormState);
      expect(stepValidation.completionPercentage).toBe(0);
      expect(stepValidation.requiredFieldsCompleted).toBe(0);
      expect(stepValidation.totalRequiredFields).toBe(3); // name, email, title

      // Partially complete
      mockFormState.personalInfo.name = 'John Doe';
      stepValidation = stepValidationService.validateStep('personal', mockFormState);
      expect(stepValidation.completionPercentage).toBe(33); // 1 of 3 fields
      expect(stepValidation.requiredFieldsCompleted).toBe(1);

      // Fully complete
      mockFormState.personalInfo.email = 'john@example.com';
      mockFormState.personalInfo.title = 'Software Engineer';
      stepValidation = stepValidationService.validateStep('personal', mockFormState);
      expect(stepValidation.completionPercentage).toBe(100);
      expect(stepValidation.requiredFieldsCompleted).toBe(3);
    });

    it('should handle warnings vs errors correctly', () => {
      // Set up a scenario that generates warnings
      mockFormState.personalInfo.name = 'John Doe';
      mockFormState.personalInfo.email = 'john@example.com';
      mockFormState.personalInfo.title = 'Software Engineer';
      mockFormState.summary = 'Short'; // Too short, should generate warning

      const stepValidation = stepValidationService.validateStep('overview', mockFormState);
      
      // Should be valid (no errors) but have warnings
      expect(stepValidation.isValid).toBe(true);
      expect(stepValidation.errors.length).toBe(0);
      expect(stepValidation.warnings.length).toBeGreaterThan(0);
      
      const warningMessage = stepValidation.warnings[0];
      expect(warningMessage.severity).toBe('warning');
      expect(warningMessage.message).toContain('50 characters');
    });
  });

  describe('Real-world validation scenarios', () => {
    it('should handle complete resume creation workflow', () => {
      // Step 1: Personal Information
      mockFormState.personalInfo = {
        name: 'Jane Smith',
        title: 'Senior Frontend Developer',
        email: 'jane.smith@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        website: 'https://janesmith.dev',
        linkedin: 'https://linkedin.com/in/janesmith',
        github: 'https://github.com/janesmith',
        avatar: '',
      };

      let validation = stepValidationService.validateStep('personal', mockFormState);
      expect(validation.isValid).toBe(true);
      expect(validation.completionPercentage).toBe(100);

      // Step 2: Professional Overview
      mockFormState.summary = 'Experienced frontend developer with 8+ years of experience building scalable web applications using React, TypeScript, and modern development practices.';
      mockFormState.objective = 'Seeking a senior frontend role where I can lead technical initiatives and mentor junior developers.';

      validation = stepValidationService.validateStep('overview', mockFormState);
      expect(validation.isValid).toBe(true);

      // Step 3: Experience
      mockFormState.experiences = [{
        id: '1',
        position: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        startDate: '2020-01-01',
        endDate: '',
        description: 'Led frontend development for multiple high-traffic web applications, mentored junior developers, and implemented modern React patterns.',
        technologies: ['React', 'TypeScript', 'Redux', 'Jest'],
        current: true,
      }];

      validation = stepValidationService.validateStep('experience', mockFormState);
      expect(validation.isValid).toBe(true);

      // Final validation - should be ready for save
      const completionStatus = stepValidationService.getFormCompletionStatus(mockFormState);
      expect(completionStatus.isFormValid).toBe(true);
      expect(completionStatus.overallCompletion).toBeGreaterThan(80);
    });

    it('should handle validation errors that block progression', () => {
      // Set up a form with critical errors
      mockFormState.personalInfo.name = 'John Doe';
      mockFormState.personalInfo.email = 'invalid-email-format';
      mockFormState.personalInfo.title = 'Developer';

      // Should not be able to proceed due to email validation error
      const canNavigate = stepValidationService.canNavigateToStep('overview', 'personal', mockFormState);
      expect(canNavigate.canNavigate).toBe(false);
      expect(canNavigate.blockingErrors).toBeDefined();
      
      const emailError = canNavigate.blockingErrors!.find(error => 
        error.field === 'personalInfo.email'
      );
      expect(emailError).toBeDefined();
    });
  });
});