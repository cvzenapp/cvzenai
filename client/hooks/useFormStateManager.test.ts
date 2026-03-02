import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormStateManager } from './useFormStateManager';

describe('useFormStateManager', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFormStateManager());
    
    expect(result.current.state.personalInfo.name).toBe('');
    expect(result.current.state.personalInfo.email).toBe('');
    expect(result.current.state.summary).toBe('');
    expect(result.current.state.objective).toBe('');
    expect(result.current.state.experiences).toEqual([]);
    expect(result.current.state.education).toEqual([]);
    expect(result.current.state.skills).toEqual([]);
    expect(result.current.state.projects).toEqual([]);
    expect(result.current.state.metadata.isDirty).toBe(false);
    expect(result.current.state.metadata.validationStatus).toBe('valid');
  });

  it('should update personal info fields correctly', () => {
    const { result } = renderHook(() => useFormStateManager());
    
    act(() => {
      result.current.updatePersonalInfo('name', 'Jane Doe');
    });
    
    expect(result.current.state.personalInfo.name).toBe('Jane Doe');
    expect(result.current.state.metadata.isDirty).toBe(true);
  });

  it('should update summary correctly', () => {
    const { result } = renderHook(() => useFormStateManager());
    
    act(() => {
      result.current.updateSummary('This is my professional summary');
    });
    
    expect(result.current.state.summary).toBe('This is my professional summary');
    expect(result.current.state.metadata.isDirty).toBe(true);
  });

  it('should add new experience', () => {
    const { result } = renderHook(() => useFormStateManager());
    
    const newExperience = {
      company: 'Tech Corp',
      position: 'Software Engineer',
      startDate: '2023-01-01',
      endDate: null,
      description: 'Working on cool projects',
    };
    
    act(() => {
      result.current.addArrayItem('experiences', newExperience);
    });
    
    expect(result.current.state.experiences).toHaveLength(1);
    expect(result.current.state.experiences[0].company).toBe('Tech Corp');
    expect(result.current.state.experiences[0].id).toBeDefined();
    expect(result.current.state.metadata.isDirty).toBe(true);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useFormStateManager());
    
    const errors = result.current.validateForm();
    
    expect(errors).toHaveLength(2);
    expect(errors.find(e => e.field === 'personalInfo.name')).toBeDefined();
    expect(errors.find(e => e.field === 'personalInfo.email')).toBeDefined();
  });

  it('should reset form to default state', () => {
    const { result } = renderHook(() => useFormStateManager());
    
    // Make some changes
    act(() => {
      result.current.updatePersonalInfo('name', 'Alex Morgan');
      result.current.updateSummary('Test summary');
    });
    
    expect(result.current.state.personalInfo.name).toBe('Alex Morgan');
    expect(result.current.state.metadata.isDirty).toBe(true);
    
    // Reset form
    act(() => {
      result.current.resetForm();
    });
    
    expect(result.current.state.personalInfo.name).toBe('');
    expect(result.current.state.summary).toBe('');
    expect(result.current.state.metadata.isDirty).toBe(false);
  });
});