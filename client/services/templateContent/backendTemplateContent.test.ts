import { describe, it, expect } from 'vitest';
import { seniorBackendDeveloperContent, juniorBackendDeveloperContent } from './backendTemplateContent';
import { templateContentRegistry } from '../templateContentRegistry';

describe('Backend Developer Template Content', () => {
  describe('Senior Backend Developer Content', () => {
    it('should have correct template ID', () => {
      expect(seniorBackendDeveloperContent.templateId).toBe('backend-developer-senior');
    });

    it('should have appropriate personal info for senior role', () => {
      const { personalInfo } = seniorBackendDeveloperContent;
      expect(personalInfo.name).toBe('David Rodriguez');
      expect(personalInfo.title).toBe('Senior Backend Developer');
      expect(personalInfo.email).toContain('@backend.dev');
      expect(personalInfo.github).toContain('github.com/');
      expect(personalInfo.linkedin).toContain('linkedin.com/in/');
    });

    it('should have senior-level professional summary', () => {
      const { professionalSummary } = seniorBackendDeveloperContent;
      expect(professionalSummary).toContain('8+ years');
      expect(professionalSummary).toContain('Senior Backend Developer');
      expect(professionalSummary).toContain('scalable');
      expect(professionalSummary).toContain('50M+ requests');
      expect(professionalSummary.length).toBeGreaterThan(200);
    });

    it('should have backend-specific core skills', () => {
      const { skills } = seniorBackendDeveloperContent;
      const coreSkills = skills.filter(skill => skill.isCore);
      
      // Check for required backend skills
      const skillNames = coreSkills.map(skill => skill.name.toLowerCase());
      expect(skillNames).toContain('node.js');
      expect(skillNames).toContain('python');
      expect(skillNames).toContain('postgresql');
      expect(skillNames).toContain('redis');
      expect(skillNames).toContain('docker');
      expect(skillNames).toContain('aws');
      
      // Check skill proficiency levels are appropriate for senior role
      coreSkills.forEach(skill => {
        expect(skill.proficiency).toBeGreaterThanOrEqual(85);
        expect(skill.yearsOfExperience).toBeGreaterThanOrEqual(5);
        expect(skill.relevanceScore).toBeGreaterThanOrEqual(8);
      });
    });

    it('should have senior-level work experience', () => {
      const { experiences } = seniorBackendDeveloperContent;
      expect(experiences.length).toBeGreaterThanOrEqual(3);
      
      // Check current role
      const currentRole = experiences[0];
      expect(currentRole.endDate).toBeNull();
      expect(currentRole.position).toContain('Senior');
      expect(currentRole.roleLevel).toBe('senior');
      
      // Check achievements are quantified and impressive
      currentRole.achievements.forEach(achievement => {
        expect(achievement.length).toBeGreaterThan(30);
        expect(achievement).toMatch(/\d+/); // Should contain numbers/metrics
      });
      
      // Check technologies match required skills
      const allTechnologies = experiences.flatMap(exp => exp.technologies);
      expect(allTechnologies).toContain('Node.js');
      expect(allTechnologies).toContain('Python');
      expect(allTechnologies).toContain('PostgreSQL');
    });

    it('should have role-specific projects with impact metrics', () => {
      const { projects } = seniorBackendDeveloperContent;
      expect(projects.length).toBeGreaterThanOrEqual(3);
      
      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.impact).toBeDefined();
        expect(project.impact.length).toBeGreaterThan(50);
        expect(project.metrics).toBeDefined();
        expect(project.technologies.length).toBeGreaterThanOrEqual(3);
        
        // Should contain backend-relevant technologies
        const techString = project.technologies.join(' ').toLowerCase();
        expect(techString).toMatch(/(node\.js|python|postgresql|redis|docker|aws)/);
      });
    });

    it('should have appropriate metadata', () => {
      const { metadata } = seniorBackendDeveloperContent;
      expect(metadata.targetRole).toBe('backend-developer');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('senior');
      expect(metadata.tags).toContain('backend');
      expect(metadata.tags).toContain('senior');
    });

    it('should pass content validation', () => {
      const validation = templateContentRegistry.validateTemplateContent(seniorBackendDeveloperContent);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Junior Backend Developer Content', () => {
    it('should have correct template ID', () => {
      expect(juniorBackendDeveloperContent.templateId).toBe('backend-developer-junior');
    });

    it('should have appropriate personal info for junior role', () => {
      const { personalInfo } = juniorBackendDeveloperContent;
      expect(personalInfo.name).toBe('Sarah Kim');
      expect(personalInfo.title).toBe('Backend Developer');
      expect(personalInfo.email).toContain('@backend.dev');
      expect(personalInfo.github).toContain('github.com/');
      expect(personalInfo.linkedin).toContain('linkedin.com/in/');
    });

    it('should have entry-level professional summary', () => {
      const { professionalSummary } = juniorBackendDeveloperContent;
      expect(professionalSummary).toContain('2+ years');
      expect(professionalSummary).toContain('Backend Developer');
      expect(professionalSummary).toContain('REST APIs');
      expect(professionalSummary).toContain('Node.js');
      expect(professionalSummary.length).toBeGreaterThan(150);
    });

    it('should have backend-specific entry-level skills', () => {
      const { skills } = juniorBackendDeveloperContent;
      const coreSkills = skills.filter(skill => skill.isCore);
      
      // Check for required entry-level backend skills
      const skillNames = coreSkills.map(skill => skill.name.toLowerCase());
      expect(skillNames).toContain('node.js');
      expect(skillNames).toContain('express.js');
      expect(skillNames).toContain('mongodb');
      expect(skillNames).toContain('rest apis');
      expect(skillNames).toContain('git');
      
      // Check skill proficiency levels are appropriate for entry role
      coreSkills.forEach(skill => {
        expect(skill.proficiency).toBeGreaterThanOrEqual(70);
        expect(skill.proficiency).toBeLessThanOrEqual(90);
        expect(skill.yearsOfExperience).toBeLessThanOrEqual(3);
        expect(skill.relevanceScore).toBeGreaterThanOrEqual(8);
      });
    });

    it('should have entry-level work experience', () => {
      const { experiences } = juniorBackendDeveloperContent;
      expect(experiences.length).toBeGreaterThanOrEqual(2);
      
      // Check current role
      const currentRole = experiences[0];
      expect(currentRole.endDate).toBeNull();
      expect(currentRole.position).toContain('Backend Developer');
      expect(currentRole.roleLevel).toBe('entry');
      
      // Check achievements are appropriate for entry level
      currentRole.achievements.forEach(achievement => {
        expect(achievement.length).toBeGreaterThan(20);
      });
      
      // Check technologies match entry-level skills
      const allTechnologies = experiences.flatMap(exp => exp.technologies);
      expect(allTechnologies).toContain('Node.js');
      expect(allTechnologies).toContain('Express.js');
      expect(allTechnologies).toContain('MongoDB');
    });

    it('should have role-specific entry-level projects', () => {
      const { projects } = juniorBackendDeveloperContent;
      expect(projects.length).toBeGreaterThanOrEqual(3);
      
      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.impact).toBeDefined();
        expect(project.impact.length).toBeGreaterThan(30);
        expect(project.metrics).toBeDefined();
        expect(project.technologies.length).toBeGreaterThanOrEqual(3);
        
        // Should contain entry-level backend technologies
        const techString = project.technologies.join(' ').toLowerCase();
        expect(techString).toMatch(/(node\.js|express|mongodb|mysql|jwt)/);
      });
    });

    it('should have appropriate metadata', () => {
      const { metadata } = juniorBackendDeveloperContent;
      expect(metadata.targetRole).toBe('backend-developer');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('entry');
      expect(metadata.tags).toContain('backend');
      expect(metadata.tags).toContain('entry-level');
    });

    it('should pass content validation', () => {
      const validation = templateContentRegistry.validateTemplateContent(juniorBackendDeveloperContent);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Content Comparison', () => {
    it('should have different experience levels between senior and junior', () => {
      expect(seniorBackendDeveloperContent.metadata.experienceLevel).toBe('senior');
      expect(juniorBackendDeveloperContent.metadata.experienceLevel).toBe('entry');
    });

    it('should have higher skill proficiencies for senior role', () => {
      const seniorSkills = seniorBackendDeveloperContent.skills.filter(s => s.isCore);
      const juniorSkills = juniorBackendDeveloperContent.skills.filter(s => s.isCore);
      
      const seniorAvgProficiency = seniorSkills.reduce((sum, skill) => sum + skill.proficiency, 0) / seniorSkills.length;
      const juniorAvgProficiency = juniorSkills.reduce((sum, skill) => sum + skill.proficiency, 0) / juniorSkills.length;
      
      expect(seniorAvgProficiency).toBeGreaterThan(juniorAvgProficiency);
    });

    it('should have more years of experience for senior role', () => {
      const seniorTotalYears = seniorBackendDeveloperContent.experiences.reduce((total, exp) => {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return total + years;
      }, 0);
      
      const juniorTotalYears = juniorBackendDeveloperContent.experiences.reduce((total, exp) => {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return total + years;
      }, 0);
      
      expect(seniorTotalYears).toBeGreaterThan(juniorTotalYears);
    });

    it('should have different complexity in project descriptions', () => {
      const seniorProjectComplexity = seniorBackendDeveloperContent.projects[0].description.length;
      const juniorProjectComplexity = juniorBackendDeveloperContent.projects[0].description.length;
      
      // Senior projects should generally have more detailed descriptions
      expect(seniorProjectComplexity).toBeGreaterThan(juniorProjectComplexity * 0.8);
    });
  });

  describe('Backend-Specific Content Validation', () => {
    it('should contain backend-relevant skills in both templates', () => {
      const backendSkills = ['node.js', 'python', 'express', 'mongodb', 'postgresql', 'rest api', 'api'];
      
      [seniorBackendDeveloperContent, juniorBackendDeveloperContent].forEach(content => {
        const skillNames = content.skills.map(skill => skill.name.toLowerCase());
        const hasBackendSkills = backendSkills.some(backendSkill => 
          skillNames.some(skillName => skillName.includes(backendSkill))
        );
        expect(hasBackendSkills).toBe(true);
      });
    });

    it('should have backend-focused project technologies', () => {
      [seniorBackendDeveloperContent, juniorBackendDeveloperContent].forEach(content => {
        content.projects.forEach(project => {
          const techString = project.technologies.join(' ').toLowerCase();
          const hasBackendTech = /node\.js|python|express|mongodb|postgresql|mysql|redis|docker|aws/.test(techString);
          expect(hasBackendTech).toBe(true);
        });
      });
    });

    it('should have appropriate industry context in experiences', () => {
      [seniorBackendDeveloperContent, juniorBackendDeveloperContent].forEach(content => {
        content.experiences.forEach(experience => {
          expect(experience.industryContext).toBeDefined();
          expect(experience.industryContext.length).toBeGreaterThan(0);
        });
      });
    });
  });
});