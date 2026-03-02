import { ResumeFormState, ValidationError } from '@/hooks/useFormStateManager';
import { validationEngine } from './validationEngine';

export interface StepValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completionPercentage: number;
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
}

export interface StepDefinition {
  id: string;
  name: string;
  requiredFields: string[];
  optionalFields: string[];
  validationRules?: string[];
}

// Define the steps and their required fields
export const RESUME_STEPS: StepDefinition[] = [
  {
    id: 'personal-info',
    name: 'Personal Information',
    requiredFields: [
      'personalInfo.name',
      'personalInfo.email',
      'personalInfo.phone',
      'personalInfo.location'
    ],
    optionalFields: [
      'personalInfo.title',
      'personalInfo.website',
      'personalInfo.linkedin',
      'personalInfo.github',
      'personalInfo.avatar'
    ]
  },
  {
    id: 'summary',
    name: 'Professional Summary',
    requiredFields: ['summary'],
    optionalFields: ['objective']
  },
  {
    id: 'experience',
    name: 'Work Experience',
    requiredFields: [],
    optionalFields: ['experiences'],
    validationRules: ['experiences']
  },
  {
    id: 'education',
    name: 'Education',
    requiredFields: [],
    optionalFields: ['education'],
    validationRules: ['education']
  },
  {
    id: 'skills',
    name: 'Skills',
    requiredFields: [],
    optionalFields: ['skills'],
    validationRules: ['skills']
  },
  {
    id: 'projects',
    name: 'Projects',
    requiredFields: [],
    optionalFields: ['projects'],
    validationRules: ['projects']
  }
];

export class StepValidationService {
  private steps: StepDefinition[];

  constructor(steps: StepDefinition[] = RESUME_STEPS) {
    this.steps = steps;
  }

  // Get step definition by ID
  getStep(stepId: string): StepDefinition | undefined {
    return this.steps.find(step => step.id === stepId);
  }

  // Get all steps
  getAllSteps(): StepDefinition[] {
    return this.steps;
  }

  // Validate a specific step
  validateStep(stepId: string, formState: ResumeFormState): StepValidationResult {
    const step = this.getStep(stepId);
    if (!step) {
      throw new Error(`Step with ID "${stepId}" not found`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let requiredFieldsCompleted = 0;

    // Check required fields
    for (const fieldPath of step.requiredFields) {
      const fieldValue = this.getFieldValue(formState, fieldPath);
      
      if (!this.isFieldCompleted(fieldValue)) {
        errors.push({
          field: fieldPath,
          message: `${this.getFieldDisplayName(fieldPath)} is required`,
          severity: 'error',
          code: 'REQUIRED_FIELD'
        });
      } else {
        requiredFieldsCompleted++;
      }
    }

    // Run validation rules for the step
    if (step.validationRules) {
      for (const rulePath of step.validationRules) {
        const fieldValue = this.getFieldValue(formState, rulePath);
        const fieldErrors = validationEngine.validateField(rulePath, fieldValue, formState);
        
        fieldErrors.forEach(error => {
          if (error.severity === 'error') {
            errors.push(error);
          } else if (error.severity === 'warning') {
            warnings.push(error);
          }
        });
      }
    }

    // Calculate completion percentage
    const totalRequiredFields = step.requiredFields.length;
    const completionPercentage = totalRequiredFields > 0 
      ? (requiredFieldsCompleted / totalRequiredFields) * 100 
      : 100;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionPercentage,
      requiredFieldsCompleted,
      totalRequiredFields
    };
  }

  // Validate all steps
  validateAllSteps(formState: ResumeFormState): Record<string, StepValidationResult> {
    const results: Record<string, StepValidationResult> = {};
    
    for (const step of this.steps) {
      results[step.id] = this.validateStep(step.id, formState);
    }
    
    return results;
  }

  // Check if a step can be navigated to (previous steps are valid)
  canNavigateToStep(targetStepId: string, formState: ResumeFormState): boolean {
    const targetStepIndex = this.steps.findIndex(step => step.id === targetStepId);
    if (targetStepIndex === -1) return false;

    // Always allow navigation to the first step
    if (targetStepIndex === 0) return true;

    // Check if all previous steps are valid
    for (let i = 0; i < targetStepIndex; i++) {
      const stepResult = this.validateStep(this.steps[i].id, formState);
      if (!stepResult.isValid) {
        return false;
      }
    }

    return true;
  }

  // Get next step that needs attention (has errors or is incomplete)
  getNextIncompleteStep(formState: ResumeFormState): string | null {
    for (const step of this.steps) {
      const result = this.validateStep(step.id, formState);
      if (!result.isValid || result.completionPercentage < 100) {
        return step.id;
      }
    }
    return null;
  }

  // Get overall form completion status
  getOverallValidation(formState: ResumeFormState): {
    isValid: boolean;
    completionPercentage: number;
    totalErrors: number;
    totalWarnings: number;
    stepResults: Record<string, StepValidationResult>;
  } {
    const stepResults = this.validateAllSteps(formState);
    
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalCompletion = 0;
    
    Object.values(stepResults).forEach(result => {
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      totalCompletion += result.completionPercentage;
    });

    const overallCompletion = totalCompletion / this.steps.length;
    
    return {
      isValid: totalErrors === 0,
      completionPercentage: overallCompletion,
      totalErrors,
      totalWarnings,
      stepResults
    };
  }

  // Helper method to get field value from nested object
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Helper method to check if a field is completed
  private isFieldCompleted(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  // Helper method to get display name for a field
  private getFieldDisplayName(fieldPath: string): string {
    const fieldNames: Record<string, string> = {
      'personalInfo.name': 'Name',
      'personalInfo.email': 'Email',
      'personalInfo.phone': 'Phone',
      'personalInfo.location': 'Location',
      'personalInfo.title': 'Job Title',
      'personalInfo.website': 'Website',
      'personalInfo.linkedin': 'LinkedIn',
      'personalInfo.github': 'GitHub',
      'summary': 'Professional Summary',
      'objective': 'Career Objective',
      'experiences': 'Work Experience',
      'education': 'Education',
      'skills': 'Skills',
      'projects': 'Projects'
    };

    return fieldNames[fieldPath] || fieldPath;
  }
}

// Export singleton instance
export const stepValidationService = new StepValidationService();