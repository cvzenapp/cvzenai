import { describe, it, expect } from 'vitest';
import { riskManagerContent } from './riskManagerTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Risk Manager Template Content', () => {
  it('should have correct template ID', () => {
    expect(riskManagerContent.templateId).toBe(TEMPLATE_IDS.RISK_MANAGER);
  });

  it('should have appropriate personal info for risk manager role', () => {
    const { personalInfo } = riskManagerContent;
    
    expect(personalInfo.name).toBe('Michael Thompson');
    expect(personalInfo.title).toBe('Senior Risk Manager');
    expect(personalInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(personalInfo.location).toBeTruthy();
    expect(personalInfo.linkedin).toContain('linkedin.com');
  });

  it('should have risk management focused professional summary', () => {
    const { professionalSummary } = riskManagerContent;
    
    expect(professionalSummary).toContain('Risk Manager');
    expect(professionalSummary).toContain('risk assessment');
    expect(professionalSummary).toContain('compliance');
    expect(professionalSummary.length).toBeGreaterThan(100);
  });

  it('should have risk management specific skills', () => {
    const { skills } = riskManagerContent;
    
    const skillNames = skills.map(skill => skill.name.toLowerCase());
    
    // Check for core risk management skills
    expect(skillNames.some(name => name.includes('risk assessment'))).toBe(true);
    expect(skillNames.some(name => name.includes('compliance'))).toBe(true);
    expect(skillNames.some(name => name.includes('basel'))).toBe(true);
    expect(skillNames.some(name => name.includes('data analysis'))).toBe(true);
    
    // Check skill properties
    skills.forEach(skill => {
      expect(skill.proficiency).toBeGreaterThan(0);
      expect(skill.proficiency).toBeLessThanOrEqual(100);
      expect(skill.relevanceScore).toBeGreaterThan(0);
      expect(skill.relevanceScore).toBeLessThanOrEqual(10);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
      expect(skill.category).toBeTruthy();
    });
  });

  it('should have finance industry experience', () => {
    const { experiences } = riskManagerContent;
    
    expect(experiences.length).toBeGreaterThan(0);
    
    experiences.forEach(exp => {
      expect(['Financial Services', 'Commercial Banking', 'Insurance', 'Financial Consulting']).toContain(exp.industryContext);
      expect(exp.position.toLowerCase()).toMatch(/risk|analyst|manager/);
      expect(exp.achievements.length).toBeGreaterThan(0);
      expect(exp.roleLevel).toMatch(/entry|mid|senior|executive/);
    });
  });

  it('should have risk management specific projects', () => {
    const { projects } = riskManagerContent;
    
    expect(projects.length).toBeGreaterThan(0);
    
    const projectTitles = projects.map(p => p.title.toLowerCase());
    expect(projectTitles.some(title => title.includes('risk'))).toBe(true);
    
    projects.forEach(project => {
      expect(project.roleSpecific).toBe(true);
      expect(project.impact).toBeTruthy();
      expect(project.technologies.length).toBeGreaterThan(0);
      expect(project.metrics).toBeTruthy();
    });
  });

  it('should have appropriate education for finance role', () => {
    const { education } = riskManagerContent;
    
    expect(education.length).toBeGreaterThan(0);
    
    const fields = education.map(edu => edu.field.toLowerCase());
    expect(fields.some(field => 
      field.includes('finance') || 
      field.includes('mathematics') || 
      field.includes('risk') ||
      field.includes('statistics')
    )).toBe(true);
  });

  it('should have risk management certifications', () => {
    const { certifications } = riskManagerContent;
    
    expect(certifications).toBeTruthy();
    expect(certifications!.length).toBeGreaterThan(0);
    
    const certNames = certifications!.map(cert => cert.name.toLowerCase());
    expect(certNames.some(name => name.includes('risk'))).toBe(true);
    
    certifications!.forEach(cert => {
      expect(cert.issuer).toBeTruthy();
      expect(cert.issueDate).toBeTruthy();
      expect(cert.credentialId).toBeTruthy();
    });
  });

  it('should have appropriate achievements for senior level', () => {
    const { achievements } = riskManagerContent;
    
    expect(achievements.length).toBeGreaterThan(0);
    
    const achievementText = achievements.join(' ').toLowerCase();
    expect(achievementText).toContain('risk');
    expect(achievementText).toMatch(/\$\d+[mk]/); // Should contain monetary amounts
  });

  it('should have correct metadata', () => {
    const { metadata } = riskManagerContent;
    
    expect(metadata.targetRole).toBe('risk-manager');
    expect(metadata.industry).toBe('finance');
    expect(metadata.experienceLevel).toBe('senior');
    expect(metadata.tags).toContain('risk-assessment');
    expect(metadata.tags).toContain('compliance');
    expect(metadata.tags).toContain('senior');
  });

  it('should have quantified achievements with metrics', () => {
    const { experiences, projects } = riskManagerContent;
    
    // Check experience achievements have metrics
    experiences.forEach(exp => {
      const achievementText = exp.achievements.join(' ');
      expect(achievementText).toMatch(/\d+%|\$\d+/); // Should contain percentages or dollar amounts
    });
    
    // Check project metrics
    projects.forEach(project => {
      expect(project.metrics).toBeTruthy();
      const metricsText = JSON.stringify(project.metrics);
      expect(metricsText).toMatch(/\d+%|\$\d+/); // Should contain quantified metrics
    });
  });

  it('should have realistic years of experience for skills', () => {
    const { skills } = riskManagerContent;
    
    skills.forEach(skill => {
      // Years of experience should be reasonable (not more than 15 years for any skill)
      expect(skill.yearsOfExperience).toBeLessThanOrEqual(15);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
      
      // Core skills should have higher relevance scores
      if (skill.isCore) {
        expect(skill.relevanceScore).toBeGreaterThanOrEqual(7);
      }
    });
  });
});