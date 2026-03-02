import { describe, it, expect } from 'vitest';
import { seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent } from './fullstackTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Full Stack Developer Template Content', () => {
  describe('Senior Full Stack Developer Content', () => {
    it('should have correct template ID', () => {
      expect(seniorFullstackDeveloperContent.templateId).toBe(TEMPLATE_IDS.FULLSTACK_SENIOR);
    });

    it('should have appropriate senior-level skills', () => {
      const coreSkills = seniorFullstackDeveloperContent.skills.filter(skill => skill.isCore);
      expect(coreSkills.length).toBeGreaterThan(5);
      
      // Check for key full-stack skills
      const skillNames = seniorFullstackDeveloperContent.skills.map(skill => skill.name);
      expect(skillNames).toContain('React');
      expect(skillNames).toContain('Node.js');
      expect(skillNames).toContain('TypeScript');
      expect(skillNames).toContain('PostgreSQL');
      expect(skillNames).toContain('AWS');
      expect(skillNames).toContain('Docker');
    });

    it('should have senior-level experience', () => {
      const experiences = seniorFullstackDeveloperContent.experiences;
      expect(experiences.length).toBeGreaterThan(2);
      
      // Check for senior-level responsibilities
      const currentRole = experiences[0];
      expect(currentRole.roleLevel).toBe('senior');
      expect(currentRole.achievements.length).toBeGreaterThan(4);
      
      // Check for leadership and mentoring achievements
      const allAchievements = experiences.flatMap(exp => exp.achievements).join(' ');
      expect(allAchievements.toLowerCase()).toMatch(/led|mentored|architected/);
    });

    it('should have appropriate full-stack projects', () => {
      const projects = seniorFullstackDeveloperContent.projects;
      expect(projects.length).toBeGreaterThan(2);
      
      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.technologies).toContain('React');
        expect(project.technologies).toContain('Node.js');
        expect(project.impact).toBeTruthy();
        expect(project.metrics).toBeDefined();
      });
    });

    it('should have senior-level metadata', () => {
      const metadata = seniorFullstackDeveloperContent.metadata;
      expect(metadata.targetRole).toBe('fullstack-developer');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('senior');
      expect(metadata.tags).toContain('fullstack');
      expect(metadata.tags).toContain('senior');
    });

    it('should have professional certifications', () => {
      const certifications = seniorFullstackDeveloperContent.certifications;
      expect(certifications).toBeDefined();
      expect(certifications!.length).toBeGreaterThan(2);
      
      // Check for relevant certifications
      const certNames = certifications!.map(cert => cert.name);
      expect(certNames.some(name => name.includes('AWS'))).toBe(true);
    });

    it('should have high skill proficiency levels', () => {
      const coreSkills = seniorFullstackDeveloperContent.skills.filter(skill => skill.isCore);
      coreSkills.forEach(skill => {
        expect(skill.proficiency).toBeGreaterThan(80);
        expect(skill.yearsOfExperience).toBeGreaterThan(4);
      });
    });
  });

  describe('Mid-Level Full Stack Developer Content', () => {
    it('should have correct template ID', () => {
      expect(midLevelFullstackDeveloperContent.templateId).toBe(TEMPLATE_IDS.FULLSTACK_MID);
    });

    it('should have appropriate mid-level skills', () => {
      const coreSkills = midLevelFullstackDeveloperContent.skills.filter(skill => skill.isCore);
      expect(coreSkills.length).toBeGreaterThan(5);
      
      // Check for key full-stack skills
      const skillNames = midLevelFullstackDeveloperContent.skills.map(skill => skill.name);
      expect(skillNames).toContain('React');
      expect(skillNames).toContain('Node.js');
      expect(skillNames).toContain('JavaScript');
      expect(skillNames).toContain('MySQL');
      expect(skillNames).toContain('Express.js');
    });

    it('should have mid-level experience', () => {
      const experiences = midLevelFullstackDeveloperContent.experiences;
      expect(experiences.length).toBeGreaterThan(2);
      
      // Check for mid-level responsibilities
      const currentRole = experiences[0];
      expect(currentRole.roleLevel).toBe('mid');
      expect(currentRole.achievements.length).toBeGreaterThan(3);
    });

    it('should have appropriate full-stack projects', () => {
      const projects = midLevelFullstackDeveloperContent.projects;
      expect(projects.length).toBeGreaterThan(2);
      
      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.technologies).toContain('React');
        expect(project.technologies).toContain('Node.js');
        expect(project.impact).toBeTruthy();
        expect(project.metrics).toBeDefined();
      });
    });

    it('should have mid-level metadata', () => {
      const metadata = midLevelFullstackDeveloperContent.metadata;
      expect(metadata.targetRole).toBe('fullstack-developer');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('mid');
      expect(metadata.tags).toContain('fullstack');
      expect(metadata.tags).toContain('mid-level');
    });

    it('should have relevant certifications', () => {
      const certifications = midLevelFullstackDeveloperContent.certifications;
      expect(certifications).toBeDefined();
      expect(certifications!.length).toBeGreaterThan(2);
      
      // Check for relevant certifications
      const certNames = certifications!.map(cert => cert.name);
      expect(certNames.some(name => name.includes('Full Stack') || name.includes('React') || name.includes('Node.js'))).toBe(true);
    });

    it('should have moderate skill proficiency levels', () => {
      const coreSkills = midLevelFullstackDeveloperContent.skills.filter(skill => skill.isCore);
      coreSkills.forEach(skill => {
        expect(skill.proficiency).toBeGreaterThan(70);
        expect(skill.proficiency).toBeLessThan(95);
        expect(skill.yearsOfExperience).toBeGreaterThan(2);
        expect(skill.yearsOfExperience).toBeLessThan(8);
      });
    });
  });

  describe('Content Quality Validation', () => {
    it('should have professional and error-free content', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        expect(content.professionalSummary).toBeTruthy();
        expect(content.professionalSummary.length).toBeGreaterThan(100);
        expect(content.objective).toBeTruthy();
        expect(content.achievements.length).toBeGreaterThan(3);
      });
    });

    it('should have realistic metrics and achievements', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        content.projects.forEach(project => {
          expect(project.metrics).toBeDefined();
          expect(project.impact).toBeTruthy();
          expect(project.impact.length).toBeGreaterThan(20);
        });
      });
    });

    it('should have appropriate technology stacks', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        content.experiences.forEach(experience => {
          expect(experience.technologies.length).toBeGreaterThan(3);
          // Should include both frontend and backend technologies
          const techString = experience.technologies.join(' ').toLowerCase();
          expect(techString).toMatch(/react|vue|angular/); // Frontend
          expect(techString).toMatch(/node|express|api/); // Backend
        });
      });
    });

    it('should have consistent experience progression', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        const experiences = content.experiences;
        // Most recent experience should be current (endDate: null)
        expect(experiences[0].endDate).toBeNull();
        
        // Should show career progression
        expect(experiences.length).toBeGreaterThan(2);
      });
    });
  });

  describe('Full Stack Specific Requirements', () => {
    it('should demonstrate end-to-end development capabilities', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        const summary = content.professionalSummary.toLowerCase();
        expect(summary).toMatch(/full.stack|end.to.end|frontend.*backend|react.*node/);
        
        // Should have both frontend and backend skills
        const skillNames = content.skills.map(skill => skill.name.toLowerCase());
        const hasFrontend = skillNames.some(name => ['react', 'javascript', 'html', 'css'].includes(name));
        const hasBackend = skillNames.some(name => ['node.js', 'express', 'api', 'database'].some(tech => name.includes(tech)));
        
        expect(hasFrontend).toBe(true);
        expect(hasBackend).toBe(true);
      });
    });

    it('should show database and deployment experience', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        const skillNames = content.skills.map(skill => skill.name.toLowerCase());
        const hasDatabase = skillNames.some(name => ['postgresql', 'mysql', 'mongodb'].some(db => name.includes(db)));
        
        expect(hasDatabase).toBe(true);
        
        // Should have some deployment/DevOps skills
        const hasDeployment = skillNames.some(name => ['aws', 'docker', 'heroku', 'git'].some(tool => name.includes(tool)));
        expect(hasDeployment).toBe(true);
      });
    });

    it('should have projects demonstrating full-stack capabilities', () => {
      [seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent].forEach(content => {
        content.projects.forEach(project => {
          const techString = project.technologies.join(' ').toLowerCase();
          // Each project should use both frontend and backend technologies
          expect(techString).toMatch(/react|vue|angular|frontend/);
          expect(techString).toMatch(/node|express|backend|api|database/);
        });
      });
    });
  });
});