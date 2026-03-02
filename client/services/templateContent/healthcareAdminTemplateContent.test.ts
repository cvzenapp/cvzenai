import { describe, it, expect } from 'vitest';
import { healthcareAdminContent } from './healthcareAdminTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Healthcare Administrator Template Content', () => {
  it('should have correct template ID', () => {
    expect(healthcareAdminContent.templateId).toBe(TEMPLATE_IDS.HEALTHCARE_ADMIN);
  });

  it('should have healthcare industry context', () => {
    expect(healthcareAdminContent.metadata.industry).toBe('healthcare');
    expect(healthcareAdminContent.metadata.targetRole).toBe('healthcare-admin');
  });

  it('should have healthcare administration specific skills', () => {
    const skillNames = healthcareAdminContent.skills.map(skill => skill.name.toLowerCase());
    
    // Core healthcare administration skills
    expect(skillNames).toContain('budget management');
    expect(skillNames).toContain('healthcare compliance');
    expect(skillNames).toContain('quality improvement');
    expect(skillNames).toContain('staff management');
    expect(skillNames).toContain('hipaa compliance');
  });

  it('should have healthcare regulatory and compliance skills', () => {
    const skillNames = healthcareAdminContent.skills.map(skill => skill.name.toLowerCase());
    
    expect(skillNames).toContain('joint commission standards');
    expect(skillNames).toContain('patient safety');
    expect(skillNames).toContain('risk management');
  });

  it('should have healthcare industry experience', () => {
    healthcareAdminContent.experiences.forEach(experience => {
      expect(experience.industryContext).toBe('Healthcare');
    });
  });

  it('should have healthcare administration specific projects', () => {
    const projects = healthcareAdminContent.projects;
    
    expect(projects.length).toBeGreaterThan(0);
    projects.forEach(project => {
      expect(project.roleSpecific).toBe(true);
    });

    // Check for healthcare administration related projects
    const projectTitles = projects.map(p => p.title.toLowerCase());
    expect(projectTitles.some(title => 
      title.includes('quality') || 
      title.includes('compliance') || 
      title.includes('hospital') ||
      title.includes('healthcare') ||
      title.includes('ehr')
    )).toBe(true);
  });

  it('should have appropriate experience progression', () => {
    const experiences = healthcareAdminContent.experiences;
    
    // Should have progression from entry to senior level
    const roleLevels = experiences.map(exp => exp.roleLevel);
    expect(roleLevels).toContain('entry');
    expect(roleLevels).toContain('mid');
    expect(roleLevels).toContain('senior');
  });

  it('should have healthcare-relevant education', () => {
    const education = healthcareAdminContent.education;
    
    expect(education.length).toBeGreaterThan(0);
    
    // Should have healthcare administration degree
    const fields = education.map(edu => edu.field.toLowerCase());
    expect(fields.some(field => 
      field.includes('healthcare administration') || 
      field.includes('health administration') || 
      field.includes('business administration')
    )).toBe(true);
  });

  it('should have healthcare administration certifications', () => {
    const certifications = healthcareAdminContent.certifications;
    
    expect(certifications).toBeDefined();
    expect(certifications!.length).toBeGreaterThan(0);
    
    const certNames = certifications!.map(cert => cert.name.toLowerCase());
    expect(certNames.some(name => 
      name.includes('healthcare') || 
      name.includes('administrative') || 
      name.includes('compliance') ||
      name.includes('quality')
    )).toBe(true);
  });

  it('should have quantified achievements with healthcare metrics', () => {
    const achievements = healthcareAdminContent.achievements;
    
    expect(achievements.length).toBeGreaterThan(0);
    
    // Should include cost savings, compliance, or patient satisfaction metrics
    const achievementText = achievements.join(' ').toLowerCase();
    expect(achievementText.includes('cost savings') || 
           achievementText.includes('compliance') || 
           achievementText.includes('patient satisfaction') ||
           achievementText.includes('budget')).toBe(true);
  });

  it('should have high relevance scores for core healthcare admin skills', () => {
    const coreSkills = healthcareAdminContent.skills.filter(skill => skill.isCore);
    
    expect(coreSkills.length).toBeGreaterThan(0);
    
    coreSkills.forEach(skill => {
      expect(skill.relevanceScore).toBeGreaterThanOrEqual(8);
    });
  });

  it('should have realistic proficiency levels', () => {
    healthcareAdminContent.skills.forEach(skill => {
      expect(skill.proficiency).toBeGreaterThanOrEqual(0);
      expect(skill.proficiency).toBeLessThanOrEqual(100);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
    });
  });

  it('should have professional summary mentioning healthcare administration', () => {
    const summary = healthcareAdminContent.professionalSummary.toLowerCase();
    
    expect(summary.includes('healthcare') || 
           summary.includes('hospital') || 
           summary.includes('administration') ||
           summary.includes('compliance')).toBe(true);
  });

  it('should have appropriate metadata tags', () => {
    const tags = healthcareAdminContent.metadata.tags;
    
    expect(tags).toContain('healthcare-administration');
    expect(tags).toContain('healthcare');
    expect(tags.some(tag => 
      tag.includes('budget') || 
      tag.includes('compliance') || 
      tag.includes('quality')
    )).toBe(true);
  });

  it('should have healthcare-specific companies and positions', () => {
    const companies = healthcareAdminContent.experiences.map(exp => exp.company.toLowerCase());
    const positions = healthcareAdminContent.experiences.map(exp => exp.position.toLowerCase());
    
    // Companies should be healthcare-related
    expect(companies.some(company => 
      company.includes('medical') || 
      company.includes('hospital') || 
      company.includes('health') ||
      company.includes('clinic')
    )).toBe(true);

    // Positions should be administration-related
    expect(positions.some(position => 
      position.includes('administrator') || 
      position.includes('director') || 
      position.includes('manager') ||
      position.includes('coordinator')
    )).toBe(true);
  });

  it('should have projects with healthcare operational improvements', () => {
    const projects = healthcareAdminContent.projects;
    
    projects.forEach(project => {
      expect(project.impact).toBeDefined();
      expect(project.impact.length).toBeGreaterThan(0);
      
      // Impact should mention healthcare-specific metrics
      const impact = project.impact.toLowerCase();
      expect(impact.includes('patient') || 
             impact.includes('cost') || 
             impact.includes('compliance') ||
             impact.includes('quality') ||
             impact.includes('safety')).toBe(true);
    });
  });
});