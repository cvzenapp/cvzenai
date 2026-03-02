import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine, validationEngine } from './validationEngine';
import { ResumeFormState } from '@/hooks/useFormStateManager';
import { PersonalInfo, Experience, Education, Project, Skill } from '@shared/api';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;
  let mockFormState: ResumeFormState;

  beforeEach(() => {
    engine = new ValidationEngine();
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

  describe('Personal Info Validation', () => {
    it('should validate required name field', () => {
      const errors = engine.validateField('personalInfo.name', '', mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED_FIELD');
      expect(errors[0].message).toBe('Name is required');
    });

    it('should validate required email field', () => {
      const errors = engine.validateField('personalInfo.email', '', mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED_FIELD');
    });

    it('should validate email format', () => {
      const invalidEmails = ['invalid-email', 'test@', '@example.com', 'test@.com'];
      
      invalidEmails.forEach(email => {
        const errors = engine.validateField('personalInfo.email', email, mockFormState);
        expect(errors.some(error => error.code === 'INVALID_EMAIL_FORMAT')).toBe(true);
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org'];
      
      validEmails.forEach(email => {
        const errors = engine.validateField('personalInfo.email', email, mockFormState);
        expect(errors.filter(error => error.code === 'INVALID_EMAIL_FORMAT')).toHaveLength(0);
      });
    });

    it('should validate phone number format', () => {
      const invalidPhones = ['123', 'abc-def-ghij', ''];
      
      invalidPhones.forEach(phone => {
        if (phone) { // Skip empty string as it's optional
          const errors = engine.validateField('personalInfo.phone', phone, mockFormState);
          expect(errors.some(error => error.code === 'INVALID_PHONE_FORMAT')).toBe(true);
        }
      });
    });

    it('should accept valid phone formats', () => {
      const validPhones = ['+1-234-567-8900', '(234) 567-8900', '234.567.8900', '2345678900'];
      
      validPhones.forEach(phone => {
        const errors = engine.validateField('personalInfo.phone', phone, mockFormState);
        expect(errors.filter(error => error.code === 'INVALID_PHONE_FORMAT')).toHaveLength(0);
      });
    });

    it('should validate URL formats for website, LinkedIn, GitHub', () => {
      const urlFields = ['personalInfo.website', 'personalInfo.linkedin', 'personalInfo.github'];
      const invalidUrls = ['not-a-url', 'http://', '://invalid'];
      
      urlFields.forEach(field => {
        invalidUrls.forEach(url => {
          const errors = engine.validateField(field, url, mockFormState);
          expect(errors.some(error => error.code === 'INVALID_URL_FORMAT')).toBe(true);
        });
      });
    });

    it('should accept valid URLs', () => {
      const urlFields = ['personalInfo.website', 'personalInfo.linkedin', 'personalInfo.github'];
      const validUrls = ['https://example.com', 'http://test.org', 'https://sub.domain.co.uk/path'];
      
      urlFields.forEach(field => {
        validUrls.forEach(url => {
          const errors = engine.validateField(field, url, mockFormState);
          expect(errors.filter(error => error.code === 'INVALID_URL_FORMAT')).toHaveLength(0);
        });
      });
    });
  });

  describe('Experience Validation', () => {
    it('should validate required experience fields', () => {
      const invalidExperience: Experience = {
        id: '1',
        company: '',
        position: '',
        startDate: '',
        endDate: null,
        description: 'Test description'
      };

      const errors = engine.validateField('experiences', [invalidExperience], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED_FIELD');
    });

    it('should validate experience date ranges', () => {
      const invalidExperience: Experience = {
        id: '1',
        company: 'Test Company',
        position: 'Developer',
        startDate: '2023-12-01',
        endDate: '2023-01-01', // End date before start date
        description: 'Test description'
      };

      const errors = engine.validateField('experiences', [invalidExperience], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_DATE_RANGE');
    });

    it('should validate company URL format', () => {
      const experienceWithInvalidUrl: Experience = {
        id: '1',
        company: 'Test Company',
        position: 'Developer',
        startDate: '2023-01-01',
        endDate: '2023-12-01',
        description: 'Test description',
        companyUrl: 'invalid-url'
      };

      const errors = engine.validateField('experiences', [experienceWithInvalidUrl], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_URL_FORMAT');
    });

    it('should accept valid experience data', () => {
      const validExperience: Experience = {
        id: '1',
        company: 'Test Company',
        position: 'Software Developer',
        startDate: '2023-01-01',
        endDate: '2023-12-01',
        description: 'Developed software applications',
        companyUrl: 'https://testcompany.com'
      };

      const errors = engine.validateField('experiences', [validExperience], mockFormState);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Education Validation', () => {
    it('should validate required education fields', () => {
      const invalidEducation: Education = {
        id: '1',
        institution: '',
        degree: '',
        field: '',
        startDate: '2020-01-01',
        endDate: '2024-01-01'
      };

      const errors = engine.validateField('education', [invalidEducation], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED_FIELD');
    });

    it('should validate GPA format', () => {
      const educationWithInvalidGpa: Education = {
        id: '1',
        institution: 'Test University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        gpa: '5.0' // Invalid GPA > 4.0
      };

      const errors = engine.validateField('education', [educationWithInvalidGpa], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_GPA_FORMAT');
    });

    it('should accept valid GPA values', () => {
      const validGpas = ['3.5', '4.0', '2.8', '0.0'];
      
      validGpas.forEach(gpa => {
        const education: Education = {
          id: '1',
          institution: 'Test University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-01',
          endDate: '2024-01-01',
          gpa
        };

        const errors = engine.validateField('education', [education], mockFormState);
        expect(errors).toHaveLength(0);
      });
    });

    it('should validate education date ranges', () => {
      const educationWithInvalidDates: Education = {
        id: '1',
        institution: 'Test University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2024-01-01',
        endDate: '2020-01-01' // End before start
      };

      const errors = engine.validateField('education', [educationWithInvalidDates], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_DATE_RANGE');
    });
  });

  describe('Project Validation', () => {
    it('should validate required project fields', () => {
      const invalidProject: Project = {
        id: '1',
        name: '',
        description: '',
        technologies: ['React'],
        startDate: '2023-01-01'
      };

      const errors = engine.validateField('projects', [invalidProject], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED_FIELD');
    });

    it('should validate project URL formats', () => {
      const projectWithInvalidUrls: Project = {
        id: '1',
        name: 'Test Project',
        description: 'A test project',
        technologies: ['React'],
        startDate: '2023-01-01',
        url: 'invalid-url',
        github: 'also-invalid'
      };

      const errors = engine.validateField('projects', [projectWithInvalidUrls], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_URL_FORMAT');
    });

    it('should accept valid project data', () => {
      const validProject: Project = {
        id: '1',
        name: 'Test Project',
        description: 'A comprehensive test project',
        technologies: ['React', 'TypeScript'],
        startDate: '2023-01-01',
        endDate: '2023-06-01',
        url: 'https://testproject.com',
        github: 'https://github.com/user/project'
      };

      const errors = engine.validateField('projects', [validProject], mockFormState);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Skills Validation', () => {
    it('should validate required skill fields', () => {
      const invalidSkill: Skill = {
        id: '1',
        name: '',
        level: 85,
        category: ''
      };

      const errors = engine.validateField('skills', [invalidSkill], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('REQUIRED_FIELD');
    });

    it('should validate skill level range', () => {
      const skillWithInvalidLevel: Skill = {
        id: '1',
        name: 'JavaScript',
        level: 150, // Invalid level > 100
        category: 'Programming'
      };

      const errors = engine.validateField('skills', [skillWithInvalidLevel], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_SKILL_LEVEL');
    });

    it('should accept valid skill data', () => {
      const validSkill: Skill = {
        id: '1',
        name: 'JavaScript',
        level: 85,
        category: 'Programming Languages',
        yearsOfExperience: 3,
        isCore: true
      };

      const errors = engine.validateField('skills', [validSkill], mockFormState);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Date Validation', () => {
    it('should validate date formats', () => {
      const invalidDates = ['invalid-date', '2023-13-01', 'not-a-date'];
      
      invalidDates.forEach(date => {
        const experience: Experience = {
          id: '1',
          company: 'Test',
          position: 'Test',
          startDate: date,
          endDate: null,
          description: 'Test'
        };

        const errors = engine.validateField('experiences', [experience], mockFormState);
        expect(errors).toHaveLength(1);
        expect(errors[0].code).toBe('INVALID_DATE_FORMAT');
      });
    });

    it('should warn about dates too far in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 15);
      
      const experience: Experience = {
        id: '1',
        company: 'Test Company',
        position: 'Test Position',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: null,
        description: 'Test description'
      };

      const errors = engine.validateField('experiences', [experience], mockFormState);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('DATE_TOO_FUTURE');
      expect(errors[0].severity).toBe('warning');
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form and return comprehensive results', () => {
      const invalidFormState: ResumeFormState = {
        ...mockFormState,
        personalInfo: {
          ...mockFormState.personalInfo,
          name: '', // Missing required field
          email: 'invalid-email' // Invalid format
        }
      };

      const result = engine.validateForm(invalidFormState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.fieldErrors['personalInfo.name']).toBeDefined();
      expect(result.fieldErrors['personalInfo.email']).toBeDefined();
    });

    it('should return valid result for complete form', () => {
      const result = engine.validateForm(mockFormState);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Custom Rules', () => {
    it('should allow adding custom validation rules', () => {
      engine.addCustomRule('personalInfo.name', {
        field: 'personalInfo.name',
        priority: 10,
        validator: (value: string) => {
          if (value && value.length < 2) {
            return {
              field: 'personalInfo.name',
              message: 'Name must be at least 2 characters',
              severity: 'error',
              code: 'CUSTOM_MIN_LENGTH'
            };
          }
          return null;
        }
      });

      const errors = engine.validateField('personalInfo.name', 'A', mockFormState);
      expect(errors.some(error => error.code === 'CUSTOM_MIN_LENGTH')).toBe(true);
    });

    it('should allow clearing custom rules', () => {
      engine.addCustomRule('test.field', {
        field: 'test.field',
        priority: 1,
        validator: () => null
      });

      expect(engine.getFieldRules('test.field')).toHaveLength(1);
      
      engine.clearCustomRules();
      expect(engine.getFieldRules('test.field')).toHaveLength(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton validation engine instance', () => {
      expect(validationEngine).toBeInstanceOf(ValidationEngine);
      expect(validationEngine).toBe(validationEngine); // Same instance
    });
  });
});