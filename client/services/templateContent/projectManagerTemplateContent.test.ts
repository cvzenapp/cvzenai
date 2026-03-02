import { describe, it, expect } from 'vitest';
import { projectManagerContent } from './projectManagerTemplateContent';
import { templateContentRegistry } from '../templateContentRegistry';

describe('Project Manager Template Content', () => {
  describe('Project Manager Content', () => {
    it('should have correct template ID', () => {
      expect(projectManagerContent.templateId).toBe('project-manager');
    });

    it('should have appropriate personal info for project manager role', () => {
      const { personalInfo } = projectManagerContent;
      expect(personalInfo.name).toBe('Michael Chen');
      expect(personalInfo.title).toBe('Senior Project Manager');
      expect(personalInfo.email).toContain('@projectpro.com');
      expect(personalInfo.linkedin).toContain('linkedin.com/in/');
      expect(personalInfo.website).toContain('michaelchen.pm');
    });

    it('should have senior-level professional summary', () => {
      const { professionalSummary } = projectManagerContent;
      expect(professionalSummary).toContain('8+ years');
      expect(professionalSummary).toContain('Senior Project Manager');
      expect(professionalSummary).toContain('cross-functional');
      expect(professionalSummary).toContain('$10M+');
      expect(professionalSummary).toContain('95% on-time completion');
      expect(professionalSummary.length).toBeGreaterThan(200);
    });

    it('should have project management-specific core skills', () => {
      const { skills } = projectManagerContent;
      const coreSkills = skills.filter(skill => skill.isCore);
      
      // Check for required project management skills
      const skillNames = coreSkills.map(skill => skill.name.toLowerCase());
      expect(skillNames).toContain('agile');
      expect(skillNames).toContain('scrum');
      expect(skillNames).toContain('risk management');
      expect(skillNames).toContain('budget planning');
      expect(skillNames).toContain('team leadership');
      expect(skillNames).toContain('project planning');
      
      // Check skill proficiency levels are appropriate for senior role
      coreSkills.forEach(skill => {
        expect(skill.proficiency).toBeGreaterThanOrEqual(85);
        expect(skill.yearsOfExperience).toBeGreaterThanOrEqual(5);
        expect(skill.relevanceScore).toBeGreaterThanOrEqual(8);
      });
    });

    it('should have senior-level work experience', () => {
      const { experiences } = projectManagerContent;
      expect(experiences.length).toBeGreaterThanOrEqual(3);
      
      // Check current role
      const currentRole = experiences[0];
      expect(currentRole.endDate).toBeNull();
      expect(currentRole.position).toContain('Senior Project Manager');
      expect(currentRole.roleLevel).toBe('senior');
      
      // Check achievements are quantified and impressive
      currentRole.achievements.forEach(achievement => {
        expect(achievement.length).toBeGreaterThan(30);
        expect(achievement).toMatch(/\d+/); // Should contain numbers/metrics
      });
      
      // Check technologies match project management tools
      const allTechnologies = experiences.flatMap(exp => exp.technologies);
      expect(allTechnologies).toContain('Jira');
      expect(allTechnologies).toContain('Microsoft Project');
    });

    it('should have role-specific projects with impact metrics', () => {
      const { projects } = projectManagerContent;
      expect(projects.length).toBeGreaterThanOrEqual(3);
      
      projects.forEach(project => {
        expect(project.roleSpecific).toBe(true);
        expect(project.impact).toBeDefined();
        expect(project.impact.length).toBeGreaterThan(50);
        expect(project.metrics).toBeDefined();
        expect(project.technologies.length).toBeGreaterThanOrEqual(3);
        
        // Should contain project management-relevant technologies/methodologies
        const techString = project.technologies.join(' ').toLowerCase();
        expect(techString).toMatch(/(project|management|agile|scrum|risk|change|stakeholder)/);
      });
    });

    it('should have appropriate certifications for project management', () => {
      const { certifications } = projectManagerContent;
      expect(certifications).toBeDefined();
      expect(certifications!.length).toBeGreaterThanOrEqual(3);
      
      const certNames = certifications!.map(cert => cert.name.toLowerCase());
      expect(certNames.some(name => name.includes('pmp'))).toBe(true);
      expect(certNames.some(name => name.includes('scrum'))).toBe(true);
    });

    it('should have appropriate metadata', () => {
      const { metadata } = projectManagerContent;
      expect(metadata.targetRole).toBe('project-manager');
      expect(metadata.industry).toBe('business');
      expect(metadata.experienceLevel).toBe('senior');
      expect(metadata.tags).toContain('project-management');
      expect(metadata.tags).toContain('senior');
    });

    it('should pass content validation', () => {
      const validation = templateContentRegistry.validateTemplateContent(projectManagerContent);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Project Management-Specific Content Validation', () => {
    it('should contain project management-relevant skills', () => {
      const pmSkills = ['agile', 'scrum', 'risk management', 'budget', 'leadership', 'stakeholder', 'planning'];
      
      const skillNames = projectManagerContent.skills.map(skill => skill.name.toLowerCase());
      const hasPMSkills = pmSkills.some(pmSkill => 
        skillNames.some(skillName => skillName.includes(pmSkill))
      );
      expect(hasPMSkills).toBe(true);
    });

    it('should have project management-focused project technologies', () => {
      projectManagerContent.projects.forEach(project => {
        const techString = project.technologies.join(' ').toLowerCase();
        const hasPMTech = /project|management|agile|scrum|risk|change|stakeholder|planning/.test(techString);
        expect(hasPMTech).toBe(true);
      });
    });

    it('should have appropriate industry context in experiences', () => {
      projectManagerContent.experiences.forEach(experience => {
        expect(experience.industryContext).toBeDefined();
        expect(experience.industryContext.length).toBeGreaterThan(0);
        expect(['Enterprise Software', 'SaaS', 'Construction'].includes(experience.industryContext)).toBe(true);
      });
    });

    it('should have project delivery focus in achievements', () => {
      const allAchievements = projectManagerContent.experiences.flatMap(exp => exp.achievements);
      const hasDeliveryFocus = allAchievements.some(achievement => 
        achievement.toLowerCase().includes('delivered') || 
        achievement.toLowerCase().includes('project') ||
        achievement.toLowerCase().includes('completion')
      );
      expect(hasDeliveryFocus).toBe(true);
    });

    it('should have budget and timeline metrics in projects', () => {
      projectManagerContent.projects.forEach(project => {
        const impactText = project.impact.toLowerCase();
        const hasFinancialMetrics = impactText.includes('$') || 
                                   impactText.includes('budget') || 
                                   impactText.includes('cost');
        const hasTimelineMetrics = impactText.includes('time') || 
                                  impactText.includes('month') || 
                                  impactText.includes('delivery');
        
        expect(hasFinancialMetrics || hasTimelineMetrics).toBe(true);
      });
    });

    it('should have team coordination experience', () => {
      const allDescriptions = projectManagerContent.experiences.map(exp => exp.description.toLowerCase());
      const hasTeamCoordination = allDescriptions.some(desc => 
        desc.includes('team') || 
        desc.includes('cross-functional') || 
        desc.includes('coordin')
      );
      expect(hasTeamCoordination).toBe(true);
    });

    it('should have appropriate education for project management role', () => {
      const { education } = projectManagerContent;
      expect(education.length).toBeGreaterThanOrEqual(2);
      
      const hasBusinessEducation = education.some(edu => 
        edu.field.toLowerCase().includes('business') || 
        edu.field.toLowerCase().includes('management') || 
        edu.field.toLowerCase().includes('operations')
      );
      expect(hasBusinessEducation).toBe(true);
    });

    it('should have project management tools in technologies', () => {
      const allTechnologies = projectManagerContent.experiences.flatMap(exp => exp.technologies);
      const pmTools = ['jira', 'microsoft project', 'confluence', 'trello', 'azure devops'];
      
      const hasPMTools = pmTools.some(tool => 
        allTechnologies.some(tech => tech.toLowerCase().includes(tool))
      );
      expect(hasPMTools).toBe(true);
    });

    it('should have measurable achievements with percentages and dollar amounts', () => {
      const allAchievements = projectManagerContent.experiences.flatMap(exp => exp.achievements);
      
      const hasPercentages = allAchievements.some(achievement => achievement.includes('%'));
      const hasDollarAmounts = allAchievements.some(achievement => achievement.includes('$'));
      
      expect(hasPercentages).toBe(true);
      expect(hasDollarAmounts).toBe(true);
    });
  });

  describe('Content Quality Validation', () => {
    it('should have professional and error-free content', () => {
      const { professionalSummary, objective } = projectManagerContent;
      
      // Check for basic grammar and professionalism
      expect(professionalSummary).not.toMatch(/\b(um|uh|like|you know)\b/i);
      expect(objective).not.toMatch(/\b(um|uh|like|you know)\b/i);
      
      // Check for proper capitalization
      expect(professionalSummary[0]).toMatch(/[A-Z]/);
      expect(objective[0]).toMatch(/[A-Z]/);
    });

    it('should have realistic and believable metrics', () => {
      const allAchievements = projectManagerContent.experiences.flatMap(exp => exp.achievements);
      
      allAchievements.forEach(achievement => {
        // Check for realistic percentages (not over 100% for most metrics)
        const percentageMatches = achievement.match(/(\d+)%/g);
        if (percentageMatches) {
          percentageMatches.forEach(match => {
            const percentage = parseInt(match.replace('%', ''));
            // Allow higher percentages for improvement metrics but flag unrealistic ones
            expect(percentage).toBeLessThanOrEqual(500); // Reasonable upper bound
          });
        }
      });
    });

    it('should have consistent experience progression', () => {
      const { experiences } = projectManagerContent;
      
      // Check that roles progress logically (entry -> mid -> senior)
      const roleLevels = experiences.map(exp => exp.roleLevel);
      expect(roleLevels).toContain('senior');
      
      // Current role should be the most senior
      expect(experiences[0].roleLevel).toBe('senior');
    });

    it('should have appropriate skill years of experience', () => {
      const { skills } = projectManagerContent;
      
      skills.forEach(skill => {
        // Years of experience should be reasonable (not more than 20 years for most skills)
        expect(skill.yearsOfExperience).toBeLessThanOrEqual(20);
        expect(skill.yearsOfExperience).toBeGreaterThanOrEqual(0);
        
        // Proficiency should correlate somewhat with years of experience
        if (skill.yearsOfExperience >= 8) {
          expect(skill.proficiency).toBeGreaterThanOrEqual(85);
        }
      });
    });
  });
});