import { useCallback, useEffect, useState, useRef } from 'react';
import { ValidationError, ResumeFormState } from '@/hooks/useFormStateManager';
import { validationEngine, ValidationResult } from '@/services/validationEngine';

export interface UseValidationOptions {
  enableRealTimeValidation?: boolean;
  debounceMs?: number;
  validateOnMount?: boolean;
}

export interface UseValidationReturn {
  validationResult: ValidationResult;
  validateField: (field: string, value: any, context: ResumeFormState) => ValidationError[];
  validateForm: (state: ResumeFormState) => ValidationResult;
  clearFieldErrors: (field: string) => void;
  clearAllErrors: () => void;
  isFieldValid: (field: string) => boolean;
  getFieldErrors: (field: string) => ValidationError[];
  hasErrors: boolean;
  hasWarnings: boolean;
  isValid: boolean;
}

export const useValidation = (
  formState: ResumeFormState,
  options: UseValidationOptions = {}
): UseValidationReturn => {
  const {
    enableRealTimeValidation = true,
    debounceMs = 300,
    validateOnMount = false
  } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    fieldErrors: {}
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Validate specific field
  const validateField = useCallback((field: string, value: any, context: ResumeFormState): ValidationError[] => {
    return validationEngine.validateField(field, value, context);
  }, []);

  // Validate entire form
  const validateForm = useCallback((state: ResumeFormState): ValidationResult => {
    const result = validationEngine.validateForm(state);
    setValidationResult(result);
    return result;
  }, []);

  // Clear errors for specific field
  const clearFieldErrors = useCallback((field: string) => {
    setValidationResult(prev => {
      const newFieldErrors = { ...prev.fieldErrors };
      delete newFieldErrors[field];
      
      // Remove field errors from main error arrays
      const newErrors = prev.errors.filter(error => error.field !== field);
      const newWarnings = prev.warnings.filter(error => error.field !== field);
      
      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        fieldErrors: newFieldErrors,
        isValid: newErrors.length === 0
      };
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {}
    });
  }, []);

  // Check if specific field is valid
  const isFieldValid = useCallback((field: string): boolean => {
    const fieldErrors = validationResult.fieldErrors[field];
    return !fieldErrors || fieldErrors.filter(error => error.severity === 'error').length === 0;
  }, [validationResult.fieldErrors]);

  // Get errors for specific field
  const getFieldErrors = useCallback((field: string): ValidationError[] => {
    return validationResult.fieldErrors[field] || [];
  }, [validationResult.fieldErrors]);

  // Real-time validation effect
  useEffect(() => {
    if (enableRealTimeValidation) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        // Debug: Log form state before validation
        console.log("🔍 DEBUG: Validation running with form state:", {
          name: formState.personalInfo?.name,
          email: formState.personalInfo?.email,
          nameLength: formState.personalInfo?.name?.length,
          emailLength: formState.personalInfo?.email?.length,
          fullPersonalInfo: formState.personalInfo
        });
        
        const result = validationEngine.validateForm(formState);
        
        // Debug: Log validation result
        console.log("🔍 DEBUG: Validation result:", {
          isValid: result.isValid,
          errors: result.errors,
          fieldErrors: result.fieldErrors,
          nameErrors: result.fieldErrors['personalInfo.name'],
          emailErrors: result.fieldErrors['personalInfo.email']
        });
        
        setValidationResult(result);
      }, debounceMs);
    }

    // Cleanup timer on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formState, enableRealTimeValidation, debounceMs]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateForm(formState);
    }
  }, [validateOnMount, validateForm, formState]);

  return {
    validationResult,
    validateField,
    validateForm,
    clearFieldErrors,
    clearAllErrors,
    isFieldValid,
    getFieldErrors,
    hasErrors: validationResult.errors.length > 0,
    hasWarnings: validationResult.warnings.length > 0,
    isValid: validationResult.isValid
  };
};