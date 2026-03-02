import { describe, it, expect } from 'vitest';
import { seniorFrontendDeveloperContent, juniorFrontendDeveloperContent } from './frontendTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Frontend Developer Template Content', () => {
  describe('Senior Frontend Developer Content', () => {
    it('should have correct template ID', () => {
      expect(seniorFrontendDeveloperContent.templateId).toBe(TEMPLATE_IDS.FRONTEND_SENIOR);
    });

    it('should have appropriate personal info for senior role', () => {
      const personalInfo = seniorFrontendDeveloperContent.personalInfo;
      expect(personalInfo.name).toBe('Alexandra Chen');
      expect(personalInfo.title).toBe('Senior Frontend Developer');
      expect(personalInfo.email).toContain('@frontend.dev');
      expect(personalInfo.github).toContain('github.com/');
      expect(personalInfo.linkedin).toContain('linkedin.com/in/');
    });

    it('should have senior-level skills with appropriate proficiency', () => {
      const skills = seniorFrontendDeveloperContent.skills;
      
      // Check for core frontend skills
      const reactSkill = skills.find(s => s.name === 'React');
      expect(reactSkill).toBeDefined();
      expect(reactSkill?.proficiency).toBeGreaterThan(90);
      expect(reactSkill?.isCore).toBe(true);
      expect(reactSkill?.relevanceScore).toBe(10);

      const typescriptSkill = skills.find(s => s.name === 'TypeScript');
      expect(typescriptSkill).toBeDefined();
      expect(typescriptSkill?.proficiency).toBeGreaterThan(90);
      expect(typescriptSkill?.isCore).toBe(true);

      const nextjsSkill = skills.find(s => s.name === 'Next.js');
      expect(nextjsSkill).toBeDefined();
      expect(nextjsSkill?.proficiency).toBeGreaterThan(85);

      const graphqlSkill = skills.find(s => s.name === 'GraphQL');
      expect(graphqlSkill).toBeDefined();
      expect(graphqlSkill?.proficiency).toBeGreaterThan(85);

      const webpackSkill = skills.find(s => s.name === 'Webpack');
      expect(webpackSkill).toBeDefined();
      expect(webpackSkill?.proficiency).toBeGreaterThan(80);
    });

    it('should have senior-level work experience', () => {
      const experiences = seniorFrontendDeveloperContent.experiences;
      expect(experiences).toHaveLength(3);

      const currentRole = experiences[0];
      expect(currentRole.position).toBe('Senior Frontend Developer');
      expect(currentRole.endDate).toBeNull(); // Current role
      expect(currentRole.roleLevel).toBe('senior');
      expect(currentRole.achievements).toHaveLength(5);
      expect(currentRole.technologies).toContain('React');
      expect(currentRole.technologies).toContain('TypeScript');
    });

    it('should have role-specific projects with performance metrics', () => {
      const projects = seniorFrontendDeveloperContent.projects;
      expect(projects).toHaveLength(3);

      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.impact).toBeDefined();
        expect(project.impact.length).toBeGreaterThan(20);
        expect(project.technologies).toContain('React');
        expect(project.metrics).toBeDefined();
      });

      // Check specific project
      const collabProject = projects.find(p => p.title.includes('Collaboration Platform'));
      expect(collabProject).toBeDefined();
      expect(collabProject?.technologies).toContain('TypeScript');
      expect(collabProject?.technologies).toContain('Next.js');
    });

    it('should have appropriate metadata for senior frontend role', () => {
      const metadata = seniorFrontendDeveloperContent.metadata;
      expect(metadata.targetRole).toBe('frontend-developer');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('senior');
      expect(metadata.tags).toContain('frontend');
      expect(metadata.tags).toContain('react');
      expect(metadata.tags).toContain('typescript');
      expect(metadata.tags).toContain('senior');
    });

    it('should have professional achievements for senior level', () => {
      const achievements = seniorFrontendDeveloperContent.achievements;
      expect(achievements.length).toBeGreaterThan(4);
      expect(achievements.some(a => a.includes('10M+ users'))).toBe(true);
      expect(achievements.some(a => a.includes('conference'))).toBe(true);
      expect(achievements.some(a => a.toLowerCase().includes('mentor'))).toBe(true);
    });

    it('should have relevant certifications', () => {
      const certifications = seniorFrontendDeveloperContent.certifications;
      expect(certifications).toBeDefined();
      expect(certifications?.length).toBeGreaterThan(0);
      
      const awsCert = certifications?.find(c => c.name.includes('AWS'));
      expect(awsCert).toBeDefined();
    });
  });

  describe('Junior Frontend Developer Content', () => {
    it('should have correct template ID', () => {
      expect(juniorFrontendDeveloperContent.templateId).toBe(TEMPLATE_IDS.FRONTEND_JUNIOR);
    });

    it('should have appropriate personal info for junior role', () => {
      const personalInfo = juniorFrontendDeveloperContent.personalInfo;
      expect(personalInfo.name).toBe('Michael Johnson');
      expect(personalInfo.title).toBe('Frontend Developer');
      expect(personalInfo.email).toContain('@frontend.dev');
      expect(personalInfo.github).toContain('github.com/');
    });

    it('should have entry-level skills with appropriate proficiency', () => {
      const skills = juniorFrontendDeveloperContent.skills;
      
      // Check for core frontend skills at entry level
      const htmlSkill = skills.find(s => s.name === 'HTML5');
      expect(htmlSkill).toBeDefined();
      expect(htmlSkill?.proficiency).toBeGreaterThan(80);
      expect(htmlSkill?.isCore).toBe(true);

      const cssSkill = skills.find(s => s.name === 'CSS3');
      expect(cssSkill).toBeDefined();
      expect(cssSkill?.proficiency).toBeGreaterThan(80);
      expect(cssSkill?.isCore).toBe(true);

      const jsSkill = skills.find(s => s.name === 'JavaScript');
      expect(jsSkill).toBeDefined();
      expect(jsSkill?.proficiency).toBeGreaterThan(75);
      expect(jsSkill?.isCore).toBe(true);
      expect(jsSkill?.relevanceScore).toBe(10);

      const reactSkill = skills.find(s => s.name === 'React');
      expect(reactSkill).toBeDefined();
      expect(reactSkill?.proficiency).toBeGreaterThan(70);
      expect(reactSkill?.proficiency).toBeLessThan(80); // Entry level
      expect(reactSkill?.isCore).toBe(true);

      // TypeScript should be lower proficiency for junior
      const typescriptSkill = skills.find(s => s.name === 'TypeScript');
      expect(typescriptSkill).toBeDefined();
      expect(typescriptSkill?.proficiency).toBeLessThan(60); // Learning level
    });

    it('should have entry-level work experience', () => {
      const experiences = juniorFrontendDeveloperContent.experiences;
      expect(experiences).toHaveLength(3);

      const currentRole = experiences[0];
      expect(currentRole.position).toBe('Frontend Developer');
      expect(currentRole.endDate).toBeNull(); // Current role
      expect(currentRole.roleLevel).toBe('entry');
      expect(currentRole.achievements).toHaveLength(4);

      // Should have progression from freelance to junior to current
      const freelanceRole = experiences[2];
      expect(freelanceRole.position).toBe('Web Developer');
      expect(freelanceRole.employmentType).toBe('Freelance');
    });

    it('should have entry-level projects', () => {
      const projects = juniorFrontendDeveloperContent.projects;
      expect(projects).toHaveLength(3);

      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.impact).toBeDefined();
        expect(project.metrics).toBeDefined();
      });

      // Check for portfolio project
      const portfolioProject = projects.find(p => p.title.includes('Portfolio'));
      expect(portfolioProject).toBeDefined();
      expect(portfolioProject?.technologies).toContain('React');
      expect(portfolioProject?.url).toBeDefined();
    });

    it('should have appropriate metadata for junior frontend role', () => {
      const metadata = juniorFrontendDeveloperContent.metadata;
      expect(metadata.targetRole).toBe('frontend-developer');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('entry');
      expect(metadata.tags).toContain('frontend');
      expect(metadata.tags).toContain('html');
      expect(metadata.tags).toContain('css');
      expect(metadata.tags).toContain('javascript');
      expect(metadata.tags).toContain('entry-level');
    });

    it('should have entry-level achievements', () => {
      const achievements = juniorFrontendDeveloperContent.achievements;
      expect(achievements.length).toBeGreaterThan(3);
      expect(achievements.some(a => a.includes('freeCodeCamp'))).toBe(true);
      expect(achievements.some(a => a.includes('open source'))).toBe(true);
      expect(achievements.some(a => a.includes('hackathon'))).toBe(true);
    });

    it('should have entry-level relevant certifications', () => {
      const certifications = juniorFrontendDeveloperContent.certifications;
      expect(certifications).toBeDefined();
      expect(certifications?.length).toBeGreaterThan(0);
      
      const fccCert = certifications?.find(c => c.name.includes('freeCodeCamp'));
      expect(fccCert).toBeDefined();
    });
  });

  describe('Content Quality Validation', () => {
    it('should have all required fields for senior content', () => {
      expect(seniorFrontendDeveloperContent.personalInfo).toBeDefined();
      expect(seniorFrontendDeveloperContent.professionalSummary).toBeDefined();
      expect(seniorFrontendDeveloperContent.objective).toBeDefined();
      expect(seniorFrontendDeveloperContent.skills.length).toBeGreaterThan(0);
      expect(seniorFrontendDeveloperContent.experiences.length).toBeGreaterThan(0);
      expect(seniorFrontendDeveloperContent.education.length).toBeGreaterThan(0);
      expect(seniorFrontendDeveloperContent.projects.length).toBeGreaterThan(0);
      expect(seniorFrontendDeveloperContent.achievements.length).toBeGreaterThan(0);
      expect(seniorFrontendDeveloperContent.metadata).toBeDefined();
    });

    it('should have all required fields for junior content', () => {
      expect(juniorFrontendDeveloperContent.personalInfo).toBeDefined();
      expect(juniorFrontendDeveloperContent.professionalSummary).toBeDefined();
      expect(juniorFrontendDeveloperContent.objective).toBeDefined();
      expect(juniorFrontendDeveloperContent.skills.length).toBeGreaterThan(0);
      expect(juniorFrontendDeveloperContent.experiences.length).toBeGreaterThan(0);
      expect(juniorFrontendDeveloperContent.education.length).toBeGreaterThan(0);
      expect(juniorFrontendDeveloperContent.projects.length).toBeGreaterThan(0);
      expect(juniorFrontendDeveloperContent.achievements.length).toBeGreaterThan(0);
      expect(juniorFrontendDeveloperContent.metadata).toBeDefined();
    });

    it('should have professional email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(seniorFrontendDeveloperContent.personalInfo.email)).toBe(true);
      expect(emailRegex.test(juniorFrontendDeveloperContent.personalInfo.email)).toBe(true);
    });

    it('should have meaningful professional summaries', () => {
      expect(seniorFrontendDeveloperContent.professionalSummary.length).toBeGreaterThan(100);
      expect(juniorFrontendDeveloperContent.professionalSummary.length).toBeGreaterThan(100);
      
      expect(seniorFrontendDeveloperContent.professionalSummary).toContain('Senior Frontend Developer');
      expect(juniorFrontendDeveloperContent.professionalSummary).toContain('Frontend Developer');
    });

    it('should have skills with valid proficiency ranges', () => {
      [...seniorFrontendDeveloperContent.skills, ...juniorFrontendDeveloperContent.skills].forEach(skill => {
        expect(skill.proficiency).toBeGreaterThanOrEqual(0);
        expect(skill.proficiency).toBeLessThanOrEqual(100);
        expect(skill.relevanceScore).toBeGreaterThanOrEqual(1);
        expect(skill.relevanceScore).toBeLessThanOrEqual(10);
        expect(skill.yearsOfExperience).toBeGreaterThan(0);
      });
    });
  });
});