import { describe, it, expect } from 'vitest';
import { seniorDataScientistContent, entryLevelDataAnalystContent } from './dataScientistTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Data Scientist Template Content', () => {
  describe('Senior Data Scientist Content', () => {
    it('should have correct template ID', () => {
      expect(seniorDataScientistContent.templateId).toBe(TEMPLATE_IDS.DATA_SCIENTIST_SENIOR);
    });

    it('should have appropriate skills for senior data scientist role', () => {
      const skills = seniorDataScientistContent.skills;
      const skillNames = skills.map(s => s.name.toLowerCase());
      
      // Check for required senior data scientist skills
      expect(skillNames).toContain('python');
      expect(skillNames).toContain('r');
      expect(skillNames).toContain('tensorflow');
      expect(skillNames).toContain('pytorch');
      expect(skillNames).toContain('sql');
      expect(skillNames).toContain('apache spark');
      
      // Check skill proficiency levels are appropriate for senior level
      const coreSkills = skills.filter(s => s.isCore);
      expect(coreSkills.length).toBeGreaterThan(5);
      
      const pythonSkill = skills.find(s => s.name === 'Python');
      expect(pythonSkill?.proficiency).toBeGreaterThan(90);
      expect(pythonSkill?.yearsOfExperience).toBeGreaterThan(5);
    });

    it('should have senior-level experience', () => {
      const experiences = seniorDataScientistContent.experiences;
      expect(experiences.length).toBeGreaterThan(2);
      
      // Check for senior role level
      const seniorExperiences = experiences.filter(exp => exp.roleLevel === 'senior');
      expect(seniorExperiences.length).toBeGreaterThan(0);
      
      // Check for quantified achievements
      experiences.forEach(exp => {
        expect(exp.achievements.length).toBeGreaterThan(0);
        expect(exp.technologies.length).toBeGreaterThan(0);
      });
    });

    it('should have role-specific projects with business impact', () => {
      const projects = seniorDataScientistContent.projects;
      expect(projects.length).toBeGreaterThan(2);
      
      const roleSpecificProjects = projects.filter(p => p.roleSpecific);
      expect(roleSpecificProjects.length).toBe(projects.length);
      
      projects.forEach(project => {
        expect(project.impact).toBeTruthy();
        expect(project.impact.length).toBeGreaterThan(10);
        expect(project.technologies.length).toBeGreaterThan(0);
        expect(project.metrics).toBeDefined();
      });
    });

    it('should have appropriate metadata', () => {
      const metadata = seniorDataScientistContent.metadata;
      expect(metadata.targetRole).toBe('data-scientist');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('senior');
      expect(metadata.tags).toContain('data-science');
      expect(metadata.tags).toContain('machine-learning');
      expect(metadata.tags).toContain('senior');
    });

    it('should have advanced education', () => {
      const education = seniorDataScientistContent.education;
      expect(education.length).toBeGreaterThan(0);
      
      const advancedDegrees = education.filter(edu => 
        edu.degree.includes('Ph.D.') || edu.degree.includes('Master')
      );
      expect(advancedDegrees.length).toBeGreaterThan(0);
    });

    it('should have professional achievements', () => {
      const achievements = seniorDataScientistContent.achievements;
      expect(achievements.length).toBeGreaterThan(3);
      
      // Check for research/publication achievements
      const researchAchievements = achievements.filter(a => 
        a.toLowerCase().includes('research') || 
        a.toLowerCase().includes('paper') ||
        a.toLowerCase().includes('publication')
      );
      expect(researchAchievements.length).toBeGreaterThan(0);
    });
  });

  describe('Entry-Level Data Analyst Content', () => {
    it('should have correct template ID', () => {
      expect(entryLevelDataAnalystContent.templateId).toBe(TEMPLATE_IDS.DATA_ANALYST_ENTRY);
    });

    it('should have appropriate skills for entry-level data analyst', () => {
      const skills = entryLevelDataAnalystContent.skills;
      const skillNames = skills.map(s => s.name.toLowerCase());
      
      // Check for required entry-level data analyst skills
      expect(skillNames).toContain('python');
      expect(skillNames).toContain('sql');
      expect(skillNames).toContain('pandas');
      expect(skillNames).toContain('matplotlib');
      expect(skillNames).toContain('excel');
      
      // Check skill proficiency levels are appropriate for entry level
      const pythonSkill = skills.find(s => s.name === 'Python');
      expect(pythonSkill?.proficiency).toBeLessThan(85);
      expect(pythonSkill?.yearsOfExperience).toBeLessThan(4);
      
      // Should have some basic ML knowledge but not advanced
      const mlSkill = skills.find(s => s.name.toLowerCase().includes('machine learning'));
      if (mlSkill) {
        expect(mlSkill.proficiency).toBeLessThan(70);
      }
    });

    it('should have entry-level experience', () => {
      const experiences = entryLevelDataAnalystContent.experiences;
      expect(experiences.length).toBeGreaterThan(0);
      
      // Check for entry role level
      const entryExperiences = experiences.filter(exp => exp.roleLevel === 'entry');
      expect(entryExperiences.length).toBeGreaterThan(0);
      
      // Should include internship or junior positions
      const juniorPositions = experiences.filter(exp => 
        exp.position.toLowerCase().includes('junior') || 
        exp.position.toLowerCase().includes('intern') ||
        exp.employmentType === 'Internship'
      );
      expect(juniorPositions.length).toBeGreaterThan(0);
    });

    it('should have appropriate projects for entry level', () => {
      const projects = entryLevelDataAnalystContent.projects;
      expect(projects.length).toBeGreaterThan(2);
      
      projects.forEach(project => {
        expect(project.impact).toBeTruthy();
        expect(project.technologies.length).toBeGreaterThan(0);
        
        // Projects should be simpler than senior level
        const technologies = project.technologies.map(t => t.toLowerCase());
        expect(technologies).toContain('python');
      });
    });

    it('should have appropriate metadata', () => {
      const metadata = entryLevelDataAnalystContent.metadata;
      expect(metadata.targetRole).toBe('data-analyst');
      expect(metadata.industry).toBe('technology');
      expect(metadata.experienceLevel).toBe('entry');
      expect(metadata.tags).toContain('data-analysis');
      expect(metadata.tags).toContain('entry-level');
    });

    it('should have bachelor degree education', () => {
      const education = entryLevelDataAnalystContent.education;
      expect(education.length).toBeGreaterThan(0);
      
      const bachelorDegree = education.find(edu => 
        edu.degree.includes('Bachelor')
      );
      expect(bachelorDegree).toBeDefined();
    });

    it('should have entry-level appropriate achievements', () => {
      const achievements = entryLevelDataAnalystContent.achievements;
      expect(achievements.length).toBeGreaterThan(0);
      
      // Should focus on certifications and learning achievements
      const certificationAchievements = achievements.filter(a => 
        a.toLowerCase().includes('certificate') || 
        a.toLowerCase().includes('certification')
      );
      expect(certificationAchievements.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality Validation', () => {
    it('should have professional email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(seniorDataScientistContent.personalInfo.email)).toBe(true);
      expect(emailRegex.test(entryLevelDataAnalystContent.personalInfo.email)).toBe(true);
    });

    it('should have meaningful professional summaries', () => {
      expect(seniorDataScientistContent.professionalSummary.length).toBeGreaterThan(100);
      expect(entryLevelDataAnalystContent.professionalSummary.length).toBeGreaterThan(50);
      
      // Should mention years of experience
      expect(seniorDataScientistContent.professionalSummary).toMatch(/\d+\+?\s*years?/i);
      expect(entryLevelDataAnalystContent.professionalSummary).toMatch(/\d+\+?\s*years?/i);
    });

    it('should have realistic skill relevance scores', () => {
      const allSkills = [
        ...seniorDataScientistContent.skills,
        ...entryLevelDataAnalystContent.skills
      ];
      
      allSkills.forEach(skill => {
        expect(skill.relevanceScore).toBeGreaterThanOrEqual(1);
        expect(skill.relevanceScore).toBeLessThanOrEqual(10);
        expect(skill.proficiency).toBeGreaterThanOrEqual(0);
        expect(skill.proficiency).toBeLessThanOrEqual(100);
      });
    });

    it('should have consistent date formats', () => {
      const dateRegex = /^\d{4}-\d{2}$/;
      
      [seniorDataScientistContent, entryLevelDataAnalystContent].forEach(content => {
        content.experiences.forEach(exp => {
          expect(dateRegex.test(exp.startDate)).toBe(true);
          if (exp.endDate) {
            expect(dateRegex.test(exp.endDate)).toBe(true);
          }
        });
        
        content.projects.forEach(project => {
          expect(project.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(project.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
      });
    });
  });
});