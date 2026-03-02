import { describe, it, expect } from 'vitest';
import { TemplateContentValidationService } from './templateContentValidationService';
import { TemplateSpecificContent, SkillContent, ExperienceContent, ProjectContent } from '../types/templateContent';

describe('TemplateContentValidationService', () => {
  const validationService = new TemplateContentValidationService();

  describe('validateSkillsForRole', () => {
    it('should validate DevOps skills correctly', () => {
      const devopsSkills: SkillContent[] = [
        { name: 'Docker', proficiency: 90, category: 'Containerization', yearsOfExperience: 5, isCore: true, relevanceScore: 10 },
        { name: 'Kubernetes', proficiency: 85, category: 'Orchestration', yearsOfExperience: 4, isCore: true, relevanceScore: 10 },
        { name: 'AWS', proficiency: 88, category: 'Cloud', yearsOfExperience: 6, isCore: true, relevanceScore: 9 },
        { name: 'Terraform', proficiency: 82, category: 'IaC', yearsOfExperience: 3, isCore: true, relevanceScore: 9 },
        { name: 'Jenkins', proficiency: 80, category: 'CI/CD', yearsOfExperience: 4, isCore: false, relevanceScore: 8 }
      ];

      const result = validationService.validateSkillsForRole(devopsSkills, 'devops-engineer');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag irrelevant skills for role', () => {
      const irrelevantSkills: SkillContent[] = [
        { name: 'Photoshop', proficiency: 90, category: 'Design', yearsOfExperience: 5, isCore: true, relevanceScore: 2 },
        { name: 'Marketing', proficiency: 85, category: 'Business', yearsOfExperience: 4, isCore: true, relevanceScore: 1 },
        { name: 'Cooking', proficiency: 70, category: 'Life', yearsOfExperience: 2, isCore: false, relevanceScore: 1 }
      ];

      const result = validationService.validateSkillsForRole(irrelevantSkills, 'devops-engineer');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('0% of skills are relevant');
    });

    it('should warn about unrealistic proficiency levels', () => {
      const unrealisticSkills: SkillContent[] = [
        { name: 'Docker', proficiency: 98, category: 'Containerization', yearsOfExperience: 1, isCore: true, relevanceScore: 10 },
        { name: 'Kubernetes', proficiency: 95, category: 'Orchestration', yearsOfExperience: 6, isCore: true, relevanceScore: 10 }
      ];

      const result = validationService.validateSkillsForRole(unrealisticSkills, 'devops-engineer');
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('unrealistic proficiency levels'))).toBe(true);
    });
  });

  describe('validateExperienceContext', () => {
    it('should validate appropriate experience for tech roles', () => {
      const techExperience: ExperienceContent[] = [
        {
          company: 'TechCorp',
          position: 'Senior DevOps Engineer',
          startDate: '2020-01-01',
          endDate: null,
          description: 'Leading DevOps initiatives',
          achievements: ['Reduced deployment time by 75%', 'Achieved 99.9% uptime'],
          technologies: ['Docker', 'Kubernetes', 'AWS'],
          location: 'San Francisco, CA',
          industryContext: 'SaaS',
          roleLevel: 'senior'
        }
      ];

      const result = validationService.validateExperienceContext(techExperience, 'devops-engineer');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about inconsistent experience levels', () => {
      const inconsistentExperience: ExperienceContent[] = [
        {
          company: 'StartupCorp',
          position: 'Senior DevOps Engineer',
          startDate: '2023-01-01',
          endDate: null,
          description: 'Senior role',
          achievements: ['Led team'],
          technologies: ['Docker'],
          location: 'Remote',
          industryContext: 'Startup',
          roleLevel: 'senior'
        }
      ];

      const result = validationService.validateExperienceContext(inconsistentExperience, 'devops-engineer');
      
      expect(result.warnings.some(w => w.includes('Senior/Executive roles present but total experience'))).toBe(true);
    });
  });

  describe('validateProjectRelevance', () => {
    it('should validate relevant projects for role', () => {
      const relevantProjects: ProjectContent[] = [
        {
          title: 'Kubernetes Migration',
          description: 'Migrated legacy infrastructure to Kubernetes',
          technologies: ['Kubernetes', 'Docker', 'AWS'],
          startDate: '2022-01-01',
          endDate: '2022-06-01',
          impact: 'Reduced infrastructure costs by 40%',
          roleSpecific: true
        }
      ];

      const result = validationService.validateProjectRelevance(relevantProjects, 'devops-engineer');
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about projects with no role-specific technologies', () => {
      const irrelevantProjects: ProjectContent[] = [
        {
          title: 'Marketing Website',
          description: 'Built a marketing website',
          technologies: ['WordPress', 'PHP'],
          startDate: '2022-01-01',
          endDate: '2022-03-01',
          impact: 'Increased traffic',
          roleSpecific: false
        }
      ];

      const result = validationService.validateProjectRelevance(irrelevantProjects, 'devops-engineer');
      
      expect(result.warnings.some(w => w.includes('has no technologies relevant to'))).toBe(true);
    });
  });

  describe('validateExperienceLevel', () => {
    it('should validate consistent experience levels', () => {
      const consistentContent: TemplateSpecificContent = {
        templateId: 'devops-senior',
        personalInfo: {
          name: 'Alex Morgan',
          title: 'Senior DevOps Engineer',
          email: 'john@example.com',
          location: 'San Francisco, CA'
        },
        professionalSummary: 'Senior DevOps Engineer with 8+ years of experience',
        objective: 'Seeking senior DevOps role',
        skills: [
          { name: 'Docker', proficiency: 90, category: 'Tech', yearsOfExperience: 6, isCore: true, relevanceScore: 10 }
        ],
        experiences: [
          {
            company: 'TechCorp',
            position: 'Senior DevOps Engineer',
            startDate: '2018-01-01',
            endDate: null,
            description: 'Senior role',
            achievements: ['Led team'],
            technologies: ['Docker'],
            location: 'SF',
            industryContext: 'Tech',
            roleLevel: 'senior'
          }
        ],
        education: [],
        projects: [],
        achievements: []
      };

      const result = validationService.validateExperienceLevel(consistentContent);
      
      expect(result.isValid).toBe(true);
    });

    it('should flag skills with more experience than total career', () => {
      const inconsistentContent: TemplateSpecificContent = {
        templateId: 'devops-junior',
        personalInfo: {
          name: 'Jane Doe',
          title: 'Junior DevOps Engineer',
          email: 'jane@example.com',
          location: 'Austin, TX'
        },
        professionalSummary: 'Junior DevOps Engineer with 2 years of experience',
        objective: 'Seeking junior DevOps role',
        skills: [
          { name: 'Docker', proficiency: 80, category: 'Tech', yearsOfExperience: 5, isCore: true, relevanceScore: 10 }
        ],
        experiences: [
          {
            company: 'StartupCorp',
            position: 'Junior DevOps Engineer',
            startDate: '2022-01-01',
            endDate: null,
            description: 'Junior role',
            achievements: ['Learned Docker'],
            technologies: ['Docker'],
            location: 'Austin',
            industryContext: 'Startup',
            roleLevel: 'entry'
          }
        ],
        education: [],
        projects: [],
        achievements: []
      };

      const result = validationService.validateExperienceLevel(inconsistentContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('more years of experience than total career'))).toBe(true);
    });
  });

  describe('validateContentQuality', () => {
    it('should validate high-quality content', () => {
      const qualityContent: TemplateSpecificContent = {
        templateId: 'devops-senior',
        personalInfo: {
          name: 'John Smith',
          title: 'Senior DevOps Engineer',
          email: 'john.smith@example.com',
          location: 'Seattle, WA'
        },
        professionalSummary: 'Senior DevOps Engineer with 8+ years of experience building and maintaining scalable cloud infrastructure. Expert in containerization, CI/CD pipelines, and infrastructure as code.',
        objective: 'Seeking senior DevOps engineering role to leverage expertise in cloud infrastructure',
        skills: [
          { name: 'Docker', proficiency: 90, category: 'Containerization', yearsOfExperience: 6, isCore: true, relevanceScore: 10 },
          { name: 'Kubernetes', proficiency: 85, category: 'Orchestration', yearsOfExperience: 5, isCore: true, relevanceScore: 10 },
          { name: 'AWS', proficiency: 88, category: 'Cloud', yearsOfExperience: 7, isCore: true, relevanceScore: 9 },
          { name: 'Terraform', proficiency: 82, category: 'IaC', yearsOfExperience: 4, isCore: true, relevanceScore: 9 },
          { name: 'Jenkins', proficiency: 80, category: 'CI/CD', yearsOfExperience: 5, isCore: false, relevanceScore: 8 }
        ],
        experiences: [
          {
            company: 'CloudTech Solutions',
            position: 'Senior DevOps Engineer',
            startDate: '2020-01-01',
            endDate: null,
            description: 'Leading DevOps initiatives for cloud-native platform',
            achievements: [
              'Reduced deployment time from 2 hours to 15 minutes using automated CI/CD pipelines',
              'Achieved 99.9% uptime through proactive monitoring and automated incident response',
              'Implemented infrastructure as code reducing provisioning time by 80%'
            ],
            technologies: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
            location: 'Seattle, WA',
            industryContext: 'SaaS',
            roleLevel: 'senior'
          }
        ],
        education: [],
        projects: [],
        achievements: []
      };

      const result = validationService.validateContentQuality(qualityContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag poor quality content', () => {
      const poorContent: TemplateSpecificContent = {
        templateId: 'devops-poor',
        personalInfo: {
          name: 'Bad Example',
          title: 'DevOps',
          email: 'bad@example.com',
          location: 'Somewhere'
        },
        professionalSummary: 'I am awesome at DevOps',
        objective: 'Get job',
        skills: [
          { name: 'Docker', proficiency: 50, category: 'Tech', yearsOfExperience: 1, isCore: false, relevanceScore: 5 }
        ],
        experiences: [
          {
            company: 'Company',
            position: 'DevOps Person',
            startDate: '2023-01-01',
            endDate: null,
            description: 'Did DevOps stuff',
            achievements: ['Worked hard', 'Did good job'],
            technologies: ['Docker'],
            location: 'Office',
            industryContext: 'Business',
            roleLevel: 'entry'
          }
        ],
        education: [],
        projects: [],
        achievements: []
      };

      const result = validationService.validateContentQuality(poorContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Professional summary is missing or too short'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Only 1 skills listed'))).toBe(true);
      expect(result.warnings.some(w => w.includes('contains informal language'))).toBe(true);
    });
  });

  describe('validateTemplateContent', () => {
    it('should perform comprehensive validation', () => {
      const sampleContent: TemplateSpecificContent = {
        templateId: 'devops-engineer-senior',
        personalInfo: {
          name: 'Marcus Rodriguez',
          title: 'Senior DevOps Engineer',
          email: 'marcus.rodriguez@example.com',
          location: 'Seattle, WA',
          github: 'github.com/marcusdevops',
          linkedin: 'linkedin.com/in/marcusrodriguez'
        },
        professionalSummary: 'Senior DevOps Engineer with 8+ years of experience building and maintaining scalable cloud infrastructure. Expert in containerization, CI/CD pipelines, and infrastructure as code. Led DevOps transformation initiatives that reduced deployment time by 75% and improved system reliability to 99.9% uptime.',
        objective: 'Seeking senior DevOps engineering role to leverage expertise in cloud infrastructure and team leadership',
        skills: [
          { name: 'Docker', proficiency: 95, category: 'Containerization', yearsOfExperience: 6, isCore: true, relevanceScore: 10 },
          { name: 'Kubernetes', proficiency: 90, category: 'Orchestration', yearsOfExperience: 5, isCore: true, relevanceScore: 10 },
          { name: 'AWS', proficiency: 92, category: 'Cloud Platforms', yearsOfExperience: 7, isCore: true, relevanceScore: 9 },
          { name: 'Terraform', proficiency: 88, category: 'Infrastructure as Code', yearsOfExperience: 4, isCore: true, relevanceScore: 9 },
          { name: 'Jenkins', proficiency: 85, category: 'CI/CD', yearsOfExperience: 6, isCore: true, relevanceScore: 8 }
        ],
        experiences: [
          {
            company: 'CloudTech Solutions',
            position: 'Senior DevOps Engineer',
            startDate: '2016-03-01',
            endDate: null,
            description: 'Leading DevOps initiatives for a cloud-native SaaS platform serving 500K+ users',
            achievements: [
              'Reduced deployment time from 2 hours to 15 minutes using automated CI/CD pipelines',
              'Achieved 99.9% uptime through proactive monitoring and automated incident response',
              'Implemented infrastructure as code reducing provisioning time by 80%'
            ],
            technologies: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Jenkins'],
            location: 'Seattle, WA',
            industryContext: 'SaaS',
            roleLevel: 'senior'
          }
        ],
        education: [],
        projects: [
          {
            title: 'Multi-Cloud Infrastructure Migration',
            description: 'Led migration of legacy infrastructure to multi-cloud architecture using Kubernetes and Terraform',
            technologies: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Prometheus'],
            startDate: '2022-01-01',
            endDate: '2022-08-01',
            impact: 'Reduced infrastructure costs by 40% and improved deployment reliability by 85%',
            roleSpecific: true
          }
        ],
        achievements: []
      };

      const result = validationService.validateTemplateContent(sampleContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});