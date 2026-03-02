import { ValidationError, ResumeFormState } from '@/hooks/useFormStateManager';
import { PersonalInfo, Experience, Education, Project, Skill } from '@shared/api';

// Validation rule types
export interface ValidationRule {
  field: string;
  validator: (value: any, context: ResumeFormState) => ValidationError | null;
  priority: number; // Lower numbers run first
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fieldErrors: Record<string, ValidationError[]>;
}

// Built-in validation functions
export class ValidationEngine {
  static getDefaultRules(): ValidationRule[] {
    const engine = new ValidationEngine();
    return engine.rules;
  }
  private rules: ValidationRule[] = [];
  private customRules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default validation rules
  private initializeDefaultRules(): void {
    // Required field rules
    this.addRule({
      field: 'personalInfo.name',
      priority: 1,
      validator: (value: string) => {
        if (!value || !value.trim()) {
          return {
            field: 'personalInfo.name',
            message: 'Name is required',
            severity: 'error',
            code: 'REQUIRED_FIELD'
          };
        }
        return null;
      }
    });

    this.addRule({
      field: 'personalInfo.email',
      priority: 1,
      validator: (value: string) => {
        if (!value || !value.trim()) {
          return {
            field: 'personalInfo.email',
            message: 'Email is required',
            severity: 'error',
            code: 'REQUIRED_FIELD'
          };
        }
        return null;
      }
    });

    // Email format validation
    this.addRule({
      field: 'personalInfo.email',
      priority: 2,
      validator: (value: string) => {
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return {
              field: 'personalInfo.email',
              message: 'Please enter a valid email address (e.g., user@example.com)',
              severity: 'error',
              code: 'INVALID_EMAIL_FORMAT'
            };
          }
        }
        return null;
      }
    });

    // Phone validation
    this.addRule({
      field: 'personalInfo.phone',
      priority: 1,
      validator: (value: string) => {
        if (value && value.trim()) {
          // Allow various phone formats: +1-234-567-8900, (234) 567-8900, 234.567.8900, 2345678900
          const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)\.]{7,15}$/;
          if (!phoneRegex.test(value.trim())) {
            return {
              field: 'personalInfo.phone',
              message: 'Please enter a valid phone number',
              severity: 'error',
              code: 'INVALID_PHONE_FORMAT'
            };
          }
        }
        return null;
      }
    });

    // URL validation for website, LinkedIn, GitHub
    const urlFields = ['personalInfo.website', 'personalInfo.linkedin', 'personalInfo.github'];
    urlFields.forEach(field => {
      this.addRule({
        field,
        priority: 2,
        validator: (value: string) => {
          if (value && value.trim()) {
            try {
              new URL(value.trim());
              return null;
            } catch {
              return {
                field,
                message: 'Please enter a valid URL (e.g., https://example.com)',
                severity: 'error',
                code: 'INVALID_URL_FORMAT'
              };
            }
          }
          return null;
        }
      });
    });

    // Date validation rules
    this.addDateValidationRules();
    
    // Experience validation rules
    this.addExperienceValidationRules();
    
    // Education validation rules
    this.addEducationValidationRules();
    
    // Project validation rules
    this.addProjectValidationRules();
    
    // Skills validation rules
    this.addSkillsValidationRules();
  }

  private addDateValidationRules(): void {
    // Generic date format validation
    const validateDateFormat = (value: string, fieldName: string): ValidationError | null => {
      if (value && value.trim()) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            field: fieldName,
            message: 'Please enter a valid date',
            severity: 'error',
            code: 'INVALID_DATE_FORMAT'
          };
        }
        
        // Check if date is not too far in the future
        const now = new Date();
        const maxFutureDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
        if (date > maxFutureDate) {
          return {
            field: fieldName,
            message: 'Date cannot be more than 10 years in the future',
            severity: 'warning',
            code: 'DATE_TOO_FUTURE'
          };
        }
      }
      return null;
    };

    // Experience date validation
    this.addRule({
      field: 'experiences',
      priority: 3,
      validator: (experiences: Experience[], context: ResumeFormState) => {
        for (let i = 0; i < experiences.length; i++) {
          const exp = experiences[i];
          
          // Validate start date
          const startDateError = validateDateFormat(exp.startDate, `experiences.${i}.startDate`);
          if (startDateError) return startDateError;
          
          // Validate end date if provided
          if (exp.endDate) {
            const endDateError = validateDateFormat(exp.endDate, `experiences.${i}.endDate`);
            if (endDateError) return endDateError;
            
            // Check date range logic
            const startDate = new Date(exp.startDate);
            const endDate = new Date(exp.endDate);
            if (startDate > endDate) {
              return {
                field: `experiences.${i}.endDate`,
                message: 'End date must be after start date',
                severity: 'error',
                code: 'INVALID_DATE_RANGE'
              };
            }
          }
        }
        return null;
      }
    });

    // Education date validation
    this.addRule({
      field: 'education',
      priority: 3,
      validator: (education: Education[]) => {
        for (let i = 0; i < education.length; i++) {
          const edu = education[i];
          
          const startDateError = validateDateFormat(edu.startDate, `education.${i}.startDate`);
          if (startDateError) return startDateError;
          
          const endDateError = validateDateFormat(edu.endDate, `education.${i}.endDate`);
          if (endDateError) return endDateError;
          
          // Check date range
          const startDate = new Date(edu.startDate);
          const endDate = new Date(edu.endDate);
          if (startDate > endDate) {
            return {
              field: `education.${i}.endDate`,
              message: 'End date must be after start date',
              severity: 'error',
              code: 'INVALID_DATE_RANGE'
            };
          }
        }
        return null;
      }
    });
  }

  private addExperienceValidationRules(): void {
    this.addRule({
      field: 'experiences',
      priority: 2,
      validator: (experiences: Experience[]) => {
        for (let i = 0; i < experiences.length; i++) {
          const exp = experiences[i];
          
          // Required fields for experiences
          if (!exp.company || !exp.company.trim()) {
            return {
              field: `experiences.${i}.company`,
              message: 'Company name is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          if (!exp.position || !exp.position.trim()) {
            return {
              field: `experiences.${i}.position`,
              message: 'Position title is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          if (!exp.startDate || !exp.startDate.trim()) {
            return {
              field: `experiences.${i}.startDate`,
              message: 'Start date is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          // Validate company URL if provided
          if (exp.companyUrl && exp.companyUrl.trim()) {
            try {
              new URL(exp.companyUrl.trim());
            } catch {
              return {
                field: `experiences.${i}.companyUrl`,
                message: 'Please enter a valid company URL',
                severity: 'error',
                code: 'INVALID_URL_FORMAT'
              };
            }
          }
        }
        return null;
      }
    });
  }

  private addEducationValidationRules(): void {
    this.addRule({
      field: 'education',
      priority: 2,
      validator: (education: Education[]) => {
        for (let i = 0; i < education.length; i++) {
          const edu = education[i];
          
          if (!edu.institution || !edu.institution.trim()) {
            return {
              field: `education.${i}.institution`,
              message: 'Institution name is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          if (!edu.degree || !edu.degree.trim()) {
            return {
              field: `education.${i}.degree`,
              message: 'Degree is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          if (!edu.field || !edu.field.trim()) {
            return {
              field: `education.${i}.field`,
              message: 'Field of study is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          // GPA validation if provided
          if (edu.gpa && edu.gpa.trim()) {
            const gpaNum = parseFloat(edu.gpa);
            if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
              return {
                field: `education.${i}.gpa`,
                message: 'GPA must be a number between 0.0 and 4.0',
                severity: 'error',
                code: 'INVALID_GPA_FORMAT'
              };
            }
          }
          
          // Institution URL validation
          if (edu.institutionUrl && edu.institutionUrl.trim()) {
            try {
              new URL(edu.institutionUrl.trim());
            } catch {
              return {
                field: `education.${i}.institutionUrl`,
                message: 'Please enter a valid institution URL',
                severity: 'error',
                code: 'INVALID_URL_FORMAT'
              };
            }
          }
        }
        return null;
      }
    });
  }

  private addProjectValidationRules(): void {
    this.addRule({
      field: 'projects',
      priority: 2,
      validator: (projects: Project[]) => {
        for (let i = 0; i < projects.length; i++) {
          const project = projects[i];
          
          if (!project.name || !project.name.trim()) {
            return {
              field: `projects.${i}.name`,
              message: 'Project name is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          if (!project.description || !project.description.trim()) {
            return {
              field: `projects.${i}.description`,
              message: 'Project description is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          // URL validations
          if (project.url && project.url.trim()) {
            try {
              new URL(project.url.trim());
            } catch {
              return {
                field: `projects.${i}.url`,
                message: 'Please enter a valid project URL',
                severity: 'error',
                code: 'INVALID_URL_FORMAT'
              };
            }
          }
          
          if (project.github && project.github.trim()) {
            try {
              new URL(project.github.trim());
            } catch {
              return {
                field: `projects.${i}.github`,
                message: 'Please enter a valid GitHub URL',
                severity: 'error',
                code: 'INVALID_URL_FORMAT'
              };
            }
          }
        }
        return null;
      }
    });
  }

  private addSkillsValidationRules(): void {
    this.addRule({
      field: 'skills',
      priority: 2,
      validator: (skills: Skill[]) => {
        for (let i = 0; i < skills.length; i++) {
          const skill = skills[i];
          
          if (!skill.name || !skill.name.trim()) {
            return {
              field: `skills.${i}.name`,
              message: 'Skill name is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
          
          if (skill.level < 1 || skill.level > 100) {
            return {
              field: `skills.${i}.level`,
              message: 'Skill level must be between 1 and 100',
              severity: 'error',
              code: 'INVALID_SKILL_LEVEL'
            };
          }
          
          if (!skill.category || !skill.category.trim()) {
            return {
              field: `skills.${i}.category`,
              message: 'Skill category is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            };
          }
        }
        return null;
      }
    });
  }

  // Add a validation rule
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  // Add custom rule for specific field
  addCustomRule(field: string, rule: ValidationRule): void {
    if (!this.customRules.has(field)) {
      this.customRules.set(field, []);
    }
    this.customRules.get(field)!.push(rule);
  }

  // Get all rules for a specific field
  getFieldRules(field: string): ValidationRule[] {
    const standardRules = this.rules.filter(rule => rule.field === field);
    const customRules = this.customRules.get(field) || [];
    return [...standardRules, ...customRules].sort((a, b) => a.priority - b.priority);
  }

  // Validate a specific field
  validateField(field: string, value: any, context: ResumeFormState): ValidationError[] {
    const errors: ValidationError[] = [];
    const rules = this.getFieldRules(field);
    
    for (const rule of rules) {
      const error = rule.validator(value, context);
      if (error) {
        errors.push(error);
      }
    }
    
    return errors;
  }

  // Validate entire form
  validateForm(state: ResumeFormState): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const fieldErrors: Record<string, ValidationError[]> = {};
    
    // Run all validation rules
    for (const rule of this.rules) {
      const fieldValue = this.getFieldValue(state, rule.field);
      const error = rule.validator(fieldValue, state);
      
      if (error) {
        if (error.severity === 'error') {
          errors.push(error);
        } else if (error.severity === 'warning') {
          warnings.push(error);
        }
        
        if (!fieldErrors[error.field]) {
          fieldErrors[error.field] = [];
        }
        fieldErrors[error.field].push(error);
      }
    }
    
    // Run custom rules
    for (const [field, rules] of this.customRules) {
      const fieldValue = this.getFieldValue(state, field);
      for (const rule of rules) {
        const error = rule.validator(fieldValue, state);
        if (error) {
          if (error.severity === 'error') {
            errors.push(error);
          } else if (error.severity === 'warning') {
            warnings.push(error);
          }
          
          if (!fieldErrors[error.field]) {
            fieldErrors[error.field] = [];
          }
          fieldErrors[error.field].push(error);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldErrors
    };
  }

  // Helper to get field value from nested object
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Clear all custom rules
  clearCustomRules(): void {
    this.customRules.clear();
  }

  // Remove specific rule
  removeRule(field: string, ruleIndex: number): void {
    const rules = this.customRules.get(field);
    if (rules && rules[ruleIndex]) {
      rules.splice(ruleIndex, 1);
    }
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine();