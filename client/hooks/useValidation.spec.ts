import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useValidation } from './useValidation';
import { ResumeFormState } from './useFormStateManager';

describe('useValidation', () => {
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
        lastModified: new Date().toISOString()
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with valid state', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    expect(result.current.isValid).toBe(true);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.hasWarnings).toBe(false);
    expect(result.current.validationResult.errors).toHaveLength(0);
  });

  it('should validate field and return errors', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    const errors = result.current.validateField('personalInfo.name', '', mockFormState);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('REQUIRED_FIELD');
  });

  it('should validate entire form', () => {
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: '',
        email: 'invalid-email'
      }
    };

    const { result } = renderHook(() => useValidation(invalidFormState));

    act(() => {
      const validationResult = result.current.validateForm(invalidFormState);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
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
      ({ formState }) => useValidation(formState, { enableRealTimeValidation: true, debounceMs: 300 }),
      { initialProps: { formState: mockFormState } }
    );

    // Initially valid
    expect(result.current.isValid).toBe(true);

    // Update to invalid state
    rerender({ formState: invalidFormState });

    // Should not validate immediately due to debouncing
    expect(result.current.isValid).toBe(true);

    // Fast-forward time to trigger debounced validation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.hasErrors).toBe(true);
  });

  it('should check if specific field is valid', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    // Valid field
    expect(result.current.isFieldValid('personalInfo.name')).toBe(true);

    // Validate form with invalid data
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: ''
      }
    };

    act(() => {
      result.current.validateForm(invalidFormState);
    });

    expect(result.current.isFieldValid('personalInfo.name')).toBe(false);
  });

  it('should get field errors', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    // Initially no errors
    expect(result.current.getFieldErrors('personalInfo.name')).toHaveLength(0);

    // Validate with invalid data
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: ''
      }
    };

    act(() => {
      result.current.validateForm(invalidFormState);
    });

    const fieldErrors = result.current.getFieldErrors('personalInfo.name');
    expect(fieldErrors.length).toBeGreaterThan(0);
    expect(fieldErrors[0].code).toBe('REQUIRED_FIELD');
  });

  it('should clear field errors', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    // First create some errors
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: '',
        email: 'invalid'
      }
    };

    act(() => {
      result.current.validateForm(invalidFormState);
    });

    expect(result.current.hasErrors).toBe(true);
    expect(result.current.getFieldErrors('personalInfo.name').length).toBeGreaterThan(0);

    // Clear specific field errors
    act(() => {
      result.current.clearFieldErrors('personalInfo.name');
    });

    expect(result.current.getFieldErrors('personalInfo.name')).toHaveLength(0);
    // Should still have email errors
    expect(result.current.getFieldErrors('personalInfo.email').length).toBeGreaterThan(0);
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    // Create some errors
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: '',
        email: 'invalid'
      }
    };

    act(() => {
      result.current.validateForm(invalidFormState);
    });

    expect(result.current.hasErrors).toBe(true);

    // Clear all errors
    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.hasErrors).toBe(false);
    expect(result.current.isValid).toBe(true);
    expect(result.current.validationResult.errors).toHaveLength(0);
  });

  it('should validate on mount when option is enabled', () => {
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: ''
      }
    };

    const { result } = renderHook(() => 
      useValidation(invalidFormState, { validateOnMount: true })
    );

    expect(result.current.isValid).toBe(false);
    expect(result.current.hasErrors).toBe(true);
  });

  it('should not validate on mount by default', () => {
    const invalidFormState = {
      ...mockFormState,
      personalInfo: {
        ...mockFormState.personalInfo,
        name: ''
      }
    };

    const { result } = renderHook(() => useValidation(invalidFormState));

    // Should start as valid since validation on mount is disabled by default
    expect(result.current.isValid).toBe(true);
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
      ({ formState }) => useValidation(formState, { enableRealTimeValidation: false }),
      { initialProps: { formState: mockFormState } }
    );

    // Update to invalid state
    rerender({ formState: invalidFormState });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be valid since real-time validation is disabled
    expect(result.current.isValid).toBe(true);
  });

  it('should handle warnings separately from errors', () => {
    const { result } = renderHook(() => useValidation(mockFormState));

    // Create a form state that would generate warnings (future dates)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 15);
    
    const formStateWithWarnings = {
      ...mockFormState,
      experiences: [{
        id: '1',
        company: 'Test Company',
        position: 'Test Position',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: null,
        description: 'Test description'
      }]
    };

    act(() => {
      result.current.validateForm(formStateWithWarnings);
    });

    expect(result.current.hasWarnings).toBe(true);
    expect(result.current.validationResult.warnings.length).toBeGreaterThan(0);
  });
});