import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormStateManager } from './useFormStateManager';
import { Experience, Education, Skill, Project } from '@shared/api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useFormStateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
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

    it('should load data from localStorage on initialization', async () => {
      const mockData = {
        personalInfo: {
          name: 'Alex Morgan',
          email: 'john@example.com',
          title: 'Developer',
          phone: '123-456-7890',
          location: 'New York',
          website: '',
          linkedin: '',
          github: '',
          avatar: '',
        },
        summary: 'Test summary',
        objective: 'Test objective',
        experiences: [],
        education: [],
        skills: [],
        projects: [],
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const { result } = renderHook(() => useFormStateManager('1'));
      
      // Wait for useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.state.personalInfo.name).toBe('Alex Morgan');
      expect(result.current.state.personalInfo.email).toBe('john@example.com');
      expect(result.current.state.summary).toBe('Test summary');
    });
  });

  describe('Personal Info Updates', () => {
    it('should update personal info fields correctly', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updatePersonalInfo('name', 'Jane Doe');
      });
      
      expect(result.current.state.personalInfo.name).toBe('Jane Doe');
      expect(result.current.state.metadata.isDirty).toBe(true);
    });

    it('should update multiple personal info fields independently', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updatePersonalInfo('name', 'Jane Doe');
        result.current.updatePersonalInfo('email', 'jane@example.com');
        result.current.updatePersonalInfo('title', 'Senior Developer');
      });
      
      expect(result.current.state.personalInfo.name).toBe('Jane Doe');
      expect(result.current.state.personalInfo.email).toBe('jane@example.com');
      expect(result.current.state.personalInfo.title).toBe('Senior Developer');
      expect(result.current.state.metadata.isDirty).toBe(true);
    });
  });

  describe('Summary and Objective Updates', () => {
    it('should update summary correctly', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updateSummary('This is my professional summary');
      });
      
      expect(result.current.state.summary).toBe('This is my professional summary');
      expect(result.current.state.metadata.isDirty).toBe(true);
    });

    it('should update objective correctly', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updateObjective('This is my career objective');
      });
      
      expect(result.current.state.objective).toBe('This is my career objective');
      expect(result.current.state.metadata.isDirty).toBe(true);
    });
  });

  describe('Array Operations', () => {
    describe('Experience Management', () => {
      it('should add new experience', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const newExperience: Omit<Experience, 'id'> = {
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

      it('should remove experience by index', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const experience1: Omit<Experience, 'id'> = {
          company: 'Tech Corp',
          position: 'Software Engineer',
          startDate: '2023-01-01',
          endDate: null,
          description: 'Working on cool projects',
        };
        
        const experience2: Omit<Experience, 'id'> = {
          company: 'Another Corp',
          position: 'Senior Engineer',
          startDate: '2022-01-01',
          endDate: '2022-12-31',
          description: 'Previous role',
        };
        
        act(() => {
          result.current.addArrayItem('experiences', experience1);
          result.current.addArrayItem('experiences', experience2);
        });
        
        expect(result.current.state.experiences).toHaveLength(2);
        
        act(() => {
          result.current.removeArrayItem('experiences', 0);
        });
        
        expect(result.current.state.experiences).toHaveLength(1);
        expect(result.current.state.experiences[0].company).toBe('Another Corp');
      });

      it('should update experience field', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const newExperience: Omit<Experience, 'id'> = {
          company: 'Tech Corp',
          position: 'Software Engineer',
          startDate: '2023-01-01',
          endDate: null,
          description: 'Working on cool projects',
        };
        
        act(() => {
          result.current.addArrayItem('experiences', newExperience);
        });
        
        act(() => {
          result.current.updateArrayItem('experiences', 0, 'company', 'Updated Tech Corp');
        });
        
        expect(result.current.state.experiences[0].company).toBe('Updated Tech Corp');
        expect(result.current.state.metadata.isDirty).toBe(true);
      });

      it('should reorder experiences', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const experience1: Omit<Experience, 'id'> = {
          company: 'First Corp',
          position: 'Engineer',
          startDate: '2023-01-01',
          endDate: null,
          description: 'First job',
        };
        
        const experience2: Omit<Experience, 'id'> = {
          company: 'Second Corp',
          position: 'Senior Engineer',
          startDate: '2022-01-01',
          endDate: '2022-12-31',
          description: 'Second job',
        };
        
        act(() => {
          result.current.addArrayItem('experiences', experience1);
          result.current.addArrayItem('experiences', experience2);
        });
        
        expect(result.current.state.experiences[0].company).toBe('First Corp');
        expect(result.current.state.experiences[1].company).toBe('Second Corp');
        
        act(() => {
          result.current.reorderArrayItem('experiences', 0, 1);
        });
        
        expect(result.current.state.experiences[0].company).toBe('Second Corp');
        expect(result.current.state.experiences[1].company).toBe('First Corp');
      });
    });

    describe('Skills Management', () => {
      it('should add new skill', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const newSkill: Omit<Skill, 'id'> = {
          name: 'JavaScript',
          level: 85,
          category: 'Programming Languages',
        };
        
        act(() => {
          result.current.addArrayItem('skills', newSkill);
        });
        
        expect(result.current.state.skills).toHaveLength(1);
        expect(result.current.state.skills[0].name).toBe('JavaScript');
        expect(result.current.state.skills[0].level).toBe(85);
        expect(result.current.state.skills[0].id).toBeDefined();
      });
    });

    describe('Education Management', () => {
      it('should add new education', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const newEducation: Omit<Education, 'id'> = {
          institution: 'University of Tech',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2018-09-01',
          endDate: '2022-05-31',
        };
        
        act(() => {
          result.current.addArrayItem('education', newEducation);
        });
        
        expect(result.current.state.education).toHaveLength(1);
        expect(result.current.state.education[0].institution).toBe('University of Tech');
        expect(result.current.state.education[0].id).toBeDefined();
      });
    });

    describe('Projects Management', () => {
      it('should add new project', () => {
        const { result } = renderHook(() => useFormStateManager());
        
        const newProject: Omit<Project, 'id'> = {
          name: 'Awesome App',
          description: 'A really cool application',
          technologies: ['React', 'TypeScript', 'Node.js'],
          startDate: '2023-01-01',
        };
        
        act(() => {
          result.current.addArrayItem('projects', newProject);
        });
        
        expect(result.current.state.projects).toHaveLength(1);
        expect(result.current.state.projects[0].name).toBe('Awesome App');
        expect(result.current.state.projects[0].technologies).toEqual(['React', 'TypeScript', 'Node.js']);
        expect(result.current.state.projects[0].id).toBeDefined();
      });
    });
  });

  describe('Generic Field Updates', () => {
    it('should update nested fields using updateField', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updateField('personalInfo.name', 'John Smith');
        result.current.updateField('summary', 'Updated summary');
      });
      
      expect(result.current.state.personalInfo.name).toBe('John Smith');
      expect(result.current.state.summary).toBe('Updated summary');
      expect(result.current.state.metadata.isDirty).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      const errors = result.current.validateForm();
      
      expect(errors).toHaveLength(2);
      expect(errors.find(e => e.field === 'personalInfo.name')).toBeDefined();
      expect(errors.find(e => e.field === 'personalInfo.email')).toBeDefined();
    });

    it('should validate email format', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updatePersonalInfo('name', 'Alex Morgan');
        result.current.updatePersonalInfo('email', 'invalid-email');
      });
      
      const errors = result.current.validateForm();
      
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('personalInfo.email');
      expect(errors[0].code).toBe('INVALID_FORMAT');
    });

    it('should pass validation with valid data', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.updatePersonalInfo('name', 'Alex Morgan');
        result.current.updatePersonalInfo('email', 'john@example.com');
      });
      
      const errors = result.current.validateForm();
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('Form Reset', () => {
    it('should reset form to default state', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      // Make some changes
      act(() => {
        result.current.updatePersonalInfo('name', 'Alex Morgan');
        result.current.updateSummary('Test summary');
        result.current.addArrayItem('experiences', {
          company: 'Test Corp',
          position: 'Engineer',
          startDate: '2023-01-01',
          endDate: null,
          description: 'Test job',
        });
      });
      
      expect(result.current.state.personalInfo.name).toBe('Alex Morgan');
      expect(result.current.state.experiences).toHaveLength(1);
      expect(result.current.state.metadata.isDirty).toBe(true);
      
      // Reset form
      act(() => {
        result.current.resetForm();
      });
      
      expect(result.current.state.personalInfo.name).toBe('');
      expect(result.current.state.summary).toBe('');
      expect(result.current.state.experiences).toHaveLength(0);
      expect(result.current.state.metadata.isDirty).toBe(false);
    });
  });

  describe('Field State Management', () => {
    it('should mark fields as dirty when updated', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      act(() => {
        result.current.markFieldDirty('personalInfo.name');
      });
      
      const fieldState = result.current.getFieldState('personalInfo.name');
      expect(fieldState?.isDirty).toBe(true);
      expect(fieldState?.lastModified).toBeDefined();
    });

    it('should clear validation errors', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      // First mark field as dirty and add some mock field state
      act(() => {
        result.current.markFieldDirty('personalInfo.email');
      });
      
      act(() => {
        result.current.clearValidationErrors('personalInfo.email');
      });
      
      const fieldState = result.current.getFieldState('personalInfo.email');
      expect(fieldState?.errors).toEqual([]);
      expect(fieldState?.isValid).toBe(true);
    });
  });

  describe('Metadata Tracking', () => {
    it('should track lastModified timestamp', async () => {
      const { result } = renderHook(() => useFormStateManager());
      
      const initialTimestamp = result.current.state.metadata.lastModified;
      
      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      
      act(() => {
        result.current.updatePersonalInfo('name', 'Alex Morgan');
      });
      
      expect(result.current.state.metadata.lastModified).not.toBe(initialTimestamp);
      expect(new Date(result.current.state.metadata.lastModified)).toBeInstanceOf(Date);
    });

    it('should track version number', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      expect(result.current.state.metadata.version).toBe(1);
    });

    it('should have autoSave enabled by default', () => {
      const { result } = renderHook(() => useFormStateManager());
      
      expect(result.current.state.metadata.autoSaveEnabled).toBe(true);
    });
  });
});