import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Resume, PersonalInfo } from '@shared/api';

// Enhanced interfaces for form state management
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

export interface FormFieldState {
  value: any;
  isValid: boolean;
  errors: ValidationError[];
  isDirty: boolean;
  lastModified: string;
}

export interface FormMetadata {
  lastSaved: string | null;
  isDirty: boolean;
  validationStatus: 'valid' | 'invalid' | 'warning' | 'pending';
  autoSaveEnabled: boolean;
  version: number;
  lastModified: string;
}

export interface ResumeFormState extends Omit<Resume, 'id' | 'upvotes' | 'rating' | 'isShortlisted' | 'createdAt' | 'updatedAt'> {
  metadata: FormMetadata;
}

export interface FormStateManager {
  state: ResumeFormState;
  setFormState: any;
  updateField: (path: string, value: any) => void;
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;
  updateSummary: (value: string) => void;
  updateObjective: (value: string) => void;
  addArrayItem: (arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, item: any) => void;
  removeArrayItem: (arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, index: number) => void;
  updateArrayItem: (arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, index: number, field: string, value: any) => void;
  reorderArrayItem: (arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, fromIndex: number, toIndex: number) => void;
  validateForm: () => ValidationError[];
  resetForm: () => void;
  loadFromStorage: (resumeId: string) => Promise<void>;
  getFieldState: (path: string) => FormFieldState | null;
  markFieldDirty: (path: string) => void;
  clearValidationErrors: (field?: string) => void;
}

// Default state factory
const createDefaultFormState = (): ResumeFormState => ({
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
  certifications: [],
  metadata: {
    lastSaved: null,
    isDirty: false,
    validationStatus: 'valid',
    autoSaveEnabled: true,
    version: 1,
    lastModified: '', // Use empty string to avoid constant timestamp changes
  },
});

// Utility function to create immutable updates
const updateNestedObject = <T>(obj: T, path: string, value: any): T => {
  const keys = path.split('.');
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }
  
  const [firstKey, ...restKeys] = keys;
  return {
    ...obj,
    [firstKey]: updateNestedObject((obj as any)[firstKey], restKeys.join('.'), value),
  };
};

// Generate unique ID for array items
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

export const useFormStateManager = (initialResumeId?: string): FormStateManager => {
  const [state, setState] = useState<ResumeFormState>(createDefaultFormState);

  const [fieldStates, setFieldStates] = useState<Record<string, FormFieldState>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Array<{ path: string; value: any }>>([]);

  // Update metadata when state changes
  const updateMetadata = useCallback((updates: Partial<FormMetadata>) => {
    setState((prevState: ResumeFormState) => ({
      ...prevState,
      metadata: {
        ...prevState.metadata,
        ...updates,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  // Mark field as dirty and update field state
  const markFieldDirty = useCallback((path: string) => {
    const now = new Date().toISOString();
    setFieldStates((prev: Record<string, FormFieldState>) => ({
      ...prev,
      [path]: {
        value: prev[path]?.value || null,
        isValid: prev[path]?.isValid ?? true,
        errors: prev[path]?.errors || [],
        isDirty: true,
        lastModified: now,
      },
    }));
    // Don't update metadata on every field change to prevent constant auto-save triggers
  }, []);

  // Generic field update function with debouncing
  const updateField = useCallback((path: string, value: any) => {
    // Debug: Log field updates
    console.log("🔧 DEBUG: updateField called:", {
      path,
      value,
      valueType: typeof value,
      valueLength: value?.length,
      timestamp: new Date().toISOString()
    });
    
    // Immediate UI update for responsiveness
    setState((prevState: ResumeFormState) => {
      const newState = updateNestedObject(prevState, path, value);
      
      // Debug: Log state after update
      console.log("🔧 DEBUG: State after updateNestedObject:", {
        path,
        oldValue: prevState.personalInfo?.[path.split('.')[1]],
        newValue: newState.personalInfo?.[path.split('.')[1]],
        fullPersonalInfo: newState.personalInfo
      });
      
      return newState;
    });
    
    // Immediately mark field as dirty for validation
    markFieldDirty(path);
    
    // Add to pending updates for debounced processing
    pendingUpdatesRef.current.push({ path, value });
    
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set new timeout for debounced metadata updates
    updateTimeoutRef.current = setTimeout(() => {
      // Process all pending updates
      const updates = [...pendingUpdatesRef.current];
      pendingUpdatesRef.current = [];
      
      // Update metadata to mark form as dirty
      updateMetadata({ isDirty: true });
    }, 300); // 300ms debounce delay
  }, [markFieldDirty, updateMetadata]);

  // Specific update functions for better type safety
  const updatePersonalInfo = useCallback((field: keyof PersonalInfo, value: string) => {
    updateField(`personalInfo.${field}`, value);
  }, [updateField]);

  const updateSummary = useCallback((value: string) => {
    updateField('summary', value);
  }, [updateField]);

  const updateObjective = useCallback((value: string) => {
    updateField('objective', value);
  }, [updateField]);

  // Array manipulation functions with proper immutability
  const addArrayItem = useCallback((arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, item: any) => {
    setState((prevState: ResumeFormState) => {
      const newItem = { ...item, id: item.id || generateId() };
      const currentArray = (prevState[arrayName] as any[]) || [];
      return {
        ...prevState,
        [arrayName]: [...currentArray, newItem],
      };
    });
    markFieldDirty(arrayName);
  }, [markFieldDirty]);

  const removeArrayItem = useCallback((arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, index: number) => {
    setState((prevState: ResumeFormState) => {
      const currentArray = (prevState[arrayName] as any[]) || [];
      return {
        ...prevState,
        [arrayName]: currentArray.filter((_, i) => i !== index),
      };
    });
    markFieldDirty(arrayName);
  }, [markFieldDirty]);

  const updateArrayItem = useCallback((arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, index: number, field: string, value: any) => {
    setState((prevState: ResumeFormState) => {
      const currentArray = (prevState[arrayName] as any[]) || [];
      const updatedArray = currentArray.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      return {
        ...prevState,
        [arrayName]: updatedArray,
      };
    });
    markFieldDirty(`${arrayName}.${index}.${field}`);
  }, [markFieldDirty]);

  const reorderArrayItem = useCallback((arrayName: keyof Pick<ResumeFormState, 'experiences' | 'education' | 'skills' | 'projects' | 'certifications'>, fromIndex: number, toIndex: number) => {
    setState((prevState: ResumeFormState) => {
      const currentArray = [...((prevState[arrayName] as any[]) || [])];
      const [movedItem] = currentArray.splice(fromIndex, 1);
      currentArray.splice(toIndex, 0, movedItem);
      return {
        ...prevState,
        [arrayName]: currentArray,
      };
    });
    markFieldDirty(arrayName);
  }, [markFieldDirty]);

  // Basic validation function (will be enhanced in validation engine task)
  const validateForm = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Basic required field validation
    if (!state.personalInfo.name.trim()) {
      errors.push({
        field: 'personalInfo.name',
        message: 'Name is required',
        severity: 'error',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!state.personalInfo.email.trim()) {
      errors.push({
        field: 'personalInfo.email',
        message: 'Email is required',
        severity: 'error',
        code: 'REQUIRED_FIELD',
      });
    }
    
    // Email format validation
    if (state.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.personalInfo.email)) {
      errors.push({
        field: 'personalInfo.email',
        message: 'Please enter a valid email address',
        severity: 'error',
        code: 'INVALID_FORMAT',
      });
    }
    
    return errors;
  }, [state]);

  // Reset form to default state
  const resetForm = useCallback(() => {
    setState(createDefaultFormState());
    setFieldStates({});
  }, []);

  // Load data from localStorage or API
  const loadFromStorage = useCallback(async (resumeId: string) => {
    try {
      const savedData = localStorage.getItem(`resume-${resumeId}`);
      if (savedData && savedData !== 'null') {
        const resumeData = JSON.parse(savedData);
        
        // Convert old format to new format if needed
        const formState: ResumeFormState = {
          personalInfo: resumeData.personalInfo || createDefaultFormState().personalInfo,
          summary: resumeData.summary || '',
          objective: resumeData.objective || '',
          experiences: resumeData.experiences || [],
          education: resumeData.education || [],
          skills: resumeData.skills || [],
          projects: resumeData.projects || [],
          certifications: resumeData.certifications || [],
          metadata: {
            lastSaved: resumeData.metadata?.lastSaved || null,
            isDirty: false,
            validationStatus: 'valid',
            autoSaveEnabled: true,
            version: resumeData.metadata?.version || 1,
            lastModified: resumeData.metadata?.lastModified || new Date().toISOString(),
          },
        };
        
        setState(formState);
        console.log('Resume data loaded successfully from localStorage');
      }
    } catch (error) {
      console.error('Error loading resume data:', error);
    }
  }, []);

  // Get field state
  const getFieldState = useCallback((path: string): FormFieldState | null => {
    return fieldStates[path] || null;
  }, [fieldStates]);

  // Clear validation errors
  const clearValidationErrors = useCallback((field?: string) => {
    if (field) {
      setFieldStates((prev: Record<string, FormFieldState>) => ({
        ...prev,
        [field]: {
          ...prev[field],
          value: prev[field]?.value || null,
          isDirty: prev[field]?.isDirty || false,
          lastModified: prev[field]?.lastModified || new Date().toISOString(),
          errors: [],
          isValid: true,
        },
      }));
    } else {
      setFieldStates((prev: Record<string, FormFieldState>) => {
        const cleared: Record<string, FormFieldState> = {};
        Object.keys(prev).forEach(key => {
          cleared[key] = {
            ...prev[key],
            errors: [],
            isValid: true,
          };
        });
        return cleared;
      });
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    if (initialResumeId) {
      loadFromStorage(initialResumeId);
    }
  }, [initialResumeId, loadFromStorage]);

  return useMemo(() => ({
    state,
    setState,
    setFormState: setState, // setFormState is an alias for setState
    updateField,
    updatePersonalInfo,
    updateSummary,
    updateObjective,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    reorderArrayItem,
    validateForm,
    resetForm,
    loadFromStorage,
    getFieldState,
    markFieldDirty,
    clearValidationErrors,
  }), [
    state,
    updateField,
    updatePersonalInfo,
    updateSummary,
    updateObjective,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    reorderArrayItem,
    validateForm,
    resetForm,
    loadFromStorage,
    getFieldState,
    markFieldDirty,
    clearValidationErrors,
  ]);
};