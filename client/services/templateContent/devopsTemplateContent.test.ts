import { describe, it, expect } from 'vitest';
import { seniorDevOpsEngineerContent, juniorDevOpsEngineerContent } from './devopsTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('DevOps Template Content', () => {
  describe('Senior DevOps Engineer Content', () => {
    it('should have correct template ID', () => {
      expect(seniorDevOpsEngineerContent.templateId).toBe(TEMPLATE_IDS.DEVOPS_SENIOR);
    });

    it('should have required DevOps skills', () => {
      const skillNames = seniorDevOpsEngineerContent.skills.map(skill => skill.name.toLowerCase());
      
      // Check for required skills from task specification
      expect(skillNames).toContain('docker');
      expect(skillNames).toContain('kubernetes');
      expect(skillNames).toContain('aws');
      expect(skillNames).toContain('terraform');
      expect(skillNames).toContain('jenkins');
      expect(skillNames).toContain('prometheus');
    });

    it('should have cloud infrastructure experience', () => {
      const experiences = seniorDevOpsEngineerContent.experiences;
      const hasCloudInfrastructure = experiences.some(exp => 
        exp.description.toLowerCase().includes('cloud') || 
        exp.description.toLowerCase().includes('infrastructure')
      );
      expect(hasCloudInfrastructure).toBe(true);
    });

    it('should have CI/CD pipeline experience', () => {
      const experiences = seniorDevOpsEngineerContent.experiences;
      const hasCICD = experiences.some(exp => 
        exp.description.toLowerCase().includes('ci/cd') || 
        exp.description.toLowerCase().includes('pipeline')
      );
      expect(hasCICD).toBe(true);
    });

    it('should have system monitoring experience', () => {
      const experiences = seniorDevOpsEngineerContent.experiences;
      const hasMonitoring = experiences.some(exp => 
        exp.description.toLowerCase().includes('monitoring') || 
        exp.achievements.some(achievement => 
          achievement.toLowerCase().includes('monitoring') || 
          achievement.toLowerCase().includes('uptime')
        )
      );
      expect(hasMonitoring).toBe(true);
    });

    it('should have infrastructure automation projects', () => {
      const projects = seniorDevOpsEngineerContent.projects;
      const hasInfrastructureAutomation = projects.some(project => 
        project.title.toLowerCase().includes('infrastructure') || 
        project.description.toLowerCase().includes('automation')
      );
      expect(hasInfrastructureAutomation).toBe(true);
    });

    it('should have deployment optimization projects', () => {
      const projects = seniorDevOpsEngineerContent.projects;
      const hasDeploymentOptimization = projects.some(project => 
        project.description.toLowerCase().includes('deployment') || 
        project.impact.toLowerCase().includes('deployment')
      );
      expect(hasDeploymentOptimization).toBe(true);
    });

    it('should have senior experience level', () => {
      expect(seniorDevOpsEngineerContent.metadata.experienceLevel).toBe('senior');
    });

    it('should have technology industry', () => {
      expect(seniorDevOpsEngineerContent.metadata.industry).toBe('technology');
    });

    it('should have devops-engineer target role', () => {
      expect(seniorDevOpsEngineerContent.metadata.targetRole).toBe('devops-engineer');
    });
  });

  describe('Junior DevOps Engineer Content', () => {
    it('should have correct template ID', () => {
      expect(juniorDevOpsEngineerContent.templateId).toBe(TEMPLATE_IDS.DEVOPS_JUNIOR);
    });

    it('should have entry-level experience', () => {
      expect(juniorDevOpsEngineerContent.metadata.experienceLevel).toBe('entry');
    });

    it('should have appropriate skill proficiency levels for junior role', () => {
      const skills = juniorDevOpsEngineerContent.skills;
      const avgProficiency = skills.reduce((sum, skill) => sum + skill.proficiency, 0) / skills.length;
      
      // Junior level should have lower average proficiency than senior
      expect(avgProficiency).toBeLessThan(85);
    });
  });
});