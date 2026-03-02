import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStepValidation } from './useStepValidation';
import { ResumeFormState } from './useFormStateManager';

describe('useStepValidation', () => {
  let mockFormState: ResumeFormState;

  beforeEach(() => {
    vi.useFakeTimers();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default step and validation state', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    expect(result.current.formValidationState.currentStep).toBe('personal-info');
    expect(result.current.currentStepResult).toBeTruthy();
    expect(result.current.canProceedToNext).toBe(true);
    expect(result.current.canGoToPrevious).toBe(false);
  });

  it('should initialize with custom initial step', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState, 'summary'));

    expect(result.current.formValidationState.currentStep).toBe('summary');
    expect(result.current.canGoToPrevious).toBe(true);
  });

  it('should validate specific step', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    const stepResult = result.current.validateStep('personal-info');
    expect(stepResult.stepId).toBe('personal-info');
    expect(stepResult.isValid).toBe(true);
    expect(stepResult.isComplete).toBe(true);
  });

  it('should validate all steps', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    act(() => {
      const validationState = result.current.validateAllSteps();
      expect(validationState.overallValid).toBe(true);
      expect(Object.keys(validationState.steps)).toHaveLength(6);
    });
  });

  it('should check if can proceed to specific step', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    expect(result.current.canProceedToStep('summary')).toBe(true);
    expect(result.current.canProceedToStep('personal-info')).toBe(true); // Can go backwards
  });

  it('should get next and previous steps', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    expect(result.current.getNextStep()).toBe('summary');
    expect(result.current.getPreviousStep()).toBeNull();
  });

  it('should get step progress', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    const progress = result.current.getStepProgress('personal-info');
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('should get all steps with status', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    const allSteps = result.current.getAllSteps();
    expect(allSteps).toHaveLength(6);
    expect(allSteps[0]).toHaveProperty('stepId');
    expect(allSteps[0]).toHaveProperty('name');
    expect(allSteps[0]).toHaveProperty('isValid');
    expect(allSteps[0]).toHaveProperty('isComplete');
    expect(allSteps[0]).toHaveProperty('completionPercentage');
  });

  it('should update current step when allowed', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    act(() => {
      result.current.setCurrentStep('summary');
    });

    expect(result.current.formValidationState.currentStep).toBe('summary');
  });

  it('should not update current step when not allowed', () => {
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: '',
        email: ''
      }
    };

    const { result } = renderHook(() => useStepValidation(invalidFormState));

    act(() => {
      result.current.setCurrentStep('summary');
    });

    // Should remain on personal-info because it's incomplete
    expect(result.current.formValidationState.currentStep).toBe('personal-info');
  });

  it('should perform real-time validation with debouncing', () => {
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: ''
      }
    };

    const { result, rerender } = renderHook(
      ({ formState }) => useStepValidation(formState, 'personal-info', { enableRealTimeValidation: true, debounceMs: 300 }),
      { initialProps: { formState: mockFormState } }
    );

    // Initially valid
    expect(result.current.canProceedToNext).toBe(true);

    // Update to invalid state
    rerender({ formState: invalidFormState });

    // Should not validate immediately due to debouncing
    expect(result.current.canProceedToNext).toBe(true);

    // Fast-forward time to trigger debounced validation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.canProceedToNext).toBe(false);
  });

  it('should disable real-time validation when option is false', () => {
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: ''
      }
    };

    const { result, rerender } = renderHook(
      ({ formState }) => useStepValidation(formState, 'personal-info', { enableRealTimeValidation: false }),
      { initialProps: { formState: mockFormState } }
    );

    // Update to invalid state
    rerender({ formState: invalidFormState });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be valid since real-time validation is disabled
    expect(result.current.canProceedToNext).toBe(true);
  });

  it('should handle step navigation state correctly', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState, 'experience'));

    expect(result.current.canProceedToNext).toBe(true);
    expect(result.current.canGoToPrevious).toBe(true);
    expect(result.current.getNextStep()).toBe('education');
    expect(result.current.getPreviousStep()).toBe('summary');
  });

  it('should handle last step correctly', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState, 'projects'));

    expect(result.current.getNextStep()).toBeNull();
    expect(result.current.canGoToPrevious).toBe(true);
  });

  it('should update validation state when current step changes', () => {
    const { result } = renderHook(() => useStepValidation(mockFormState));

    const initialStepResult = result.current.currentStepResult;
    expect(initialStepResult?.stepId).toBe('personal-info');

    act(() => {
      result.current.setCurrentStep('summary');
    });

    const newStepResult = result.current.currentStepResult;
    expect(newStepResult?.stepId).toBe('summary');
  });
});