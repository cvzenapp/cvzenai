import { useCallback, useMemo } from 'react';
import { ResumeFormState } from './useFormStateManager';
import { 
  stepValidationService, 
  StepValidationResult, 
  StepDefinition 
} from '@/services/stepValidationService';

export interface UseStepValidationReturn {
  validateStep: (stepId: string) => StepValidationResult;
  validateAllSteps: () => Record<string, StepValidationResult>;
  canNavigateToStep: (stepId: string) => boolean;
  getNextIncompleteStep: () => string | null;
  getOverallValidation: () => {
    isValid: boolean;
    completionPercentage: number;
    totalErrors: number;
    totalWarnings: number;
    stepResults: Record<string, StepValidationResult>;
  };
  getStep: (stepId: string) => StepDefinition | undefined;
  getAllSteps: () => StepDefinition[];
  isStepValid: (stepId: string) => boolean;
  getStepCompletion: (stepId: string) => number;
  getStepErrors: (stepId: string) => number;
}

export const useStepValidation = (formState: ResumeFormState): UseStepValidationReturn => {
  // Validate a specific step
  const validateStep = useCallback((stepId: string): StepValidationResult => {
    return stepValidationService.validateStep(stepId, formState);
  }, [formState]);

  // Validate all steps
  const validateAllSteps = useCallback(() => {
    return stepValidationService.validateAllSteps(formState);
  }, [formState]);

  // Check if navigation to step is allowed
  const canNavigateToStep = useCallback((stepId: string): boolean => {
    return stepValidationService.canNavigateToStep(stepId, formState);
  }, [formState]);

  // Get next incomplete step
  const getNextIncompleteStep = useCallback((): string | null => {
    return stepValidationService.getNextIncompleteStep(formState);
  }, [formState]);

  // Get overall validation status
  const getOverallValidation = useCallback(() => {
    return stepValidationService.getOverallValidation(formState);
  }, [formState]);

  // Get step definition
  const getStep = useCallback((stepId: string): StepDefinition | undefined => {
    return stepValidationService.getStep(stepId);
  }, []);

  // Get all steps
  const getAllSteps = useCallback((): StepDefinition[] => {
    return stepValidationService.getAllSteps();
  }, []);

  // Check if a step is valid
  const isStepValid = useCallback((stepId: string): boolean => {
    const result = validateStep(stepId);
    return result.isValid;
  }, [validateStep]);

  // Get step completion percentage
  const getStepCompletion = useCallback((stepId: string): number => {
    const result = validateStep(stepId);
    return result.completionPercentage;
  }, [validateStep]);

  // Get number of errors in a step
  const getStepErrors = useCallback((stepId: string): number => {
    const result = validateStep(stepId);
    return result.errors.length;
  }, [validateStep]);

  // Memoized overall validation for performance
  const overallValidation = useMemo(() => {
    return getOverallValidation();
  }, [getOverallValidation]);

  return {
    validateStep,
    validateAllSteps,
    canNavigateToStep,
    getNextIncompleteStep,
    getOverallValidation,
    getStep,
    getAllSteps,
    isStepValid,
    getStepCompletion,
    getStepErrors
  };
};