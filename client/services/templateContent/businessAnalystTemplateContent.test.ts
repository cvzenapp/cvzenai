import { describe, it, expect } from 'vitest';
import { businessAnalystContent } from './businessAnalystTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Business Analyst Template Content', () => {
  it('should have correct template ID', () => {
    expect(businessAnalystContent.templateId).toBe(TEMPLATE_IDS.BUSINESS_ANALYST);
  });

  it('should have complete personal information', () => {
    const { personalInfo } = businessAnalystContent;
    
    expect(personalInfo.name).toBe('Michael Chen');
    expect(personalInfo.title).toBe('Senior Business Analyst');
    expect(personalInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(personalInfo.phone).toMatch(/^\+1 \(\d{3}\) \d{3}-\d{4}$/);
    expect(personalInfo.location).toBe('Chicago, IL');
    expect(personalInfo.linkedin).toContain('linkedin.com');
  });

  it('should have professional summary with appropriate length', () => {
    expect(businessAnalystContent.professionalSummary).toBeDefined();
    expect(businessAnalystContent.professionalSummary.length).toBeGreaterThan(100);
    expect(businessAnalystContent.professionalSummary).toContain('Business Analyst');
    expect(businessAnalystContent.professionalSummary).toContain('requirements analysis');
    expect(businessAnalystContent.professionalSummary).toContain('process');
  });

  it('should have business analyst specific skills', () => {
    const { skills } = businessAnalystContent;
    
    expect(skills.length).toBeGreaterThan(8);
    
    // Check for core business analyst skills
    const skillNames = skills.map(s => s.name.toLowerCase());
    expect(skillNames).toContain('requirements analysis');
    expect(skillNames).toContain('process mapping');
    expect(skillNames).toContain('sql');
    expect(skillNames).toContain('tableau');
    expect(skillNames).toContain('stakeholder management');
    expect(skillNames).toContain('data analysis');
    
    // Check skill properties
    skills.forEach(skill => {
      expect(skill.proficiency).toBeGreaterThanOrEqual(70);
      expect(skill.proficiency).toBeLessThanOrEqual(100);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
      expect(skill.relevanceScore).toBeGreaterThanOrEqual(6);
      expect(skill.relevanceScore).toBeLessThanOrEqual(10);
    });
  });

  it('should have relevant work experiences', () => {
    const { experiences } = businessAnalystContent;
    
    expect(experiences.length).toBe(3);
    
    // Check experience progression
    expect(experiences[0].roleLevel).toBe('senior');
    expect(experiences[1].roleLevel).toBe('mid');
    expect(experiences[2].roleLevel).toBe('entry');
    
    // Check for business analyst relevant companies and roles
    experiences.forEach(exp => {
      expect(exp.position.toLowerCase()).toContain('analyst');
      expect(exp.achievements.length).toBeGreaterThan(3);
      expect(exp.technologies.length).toBeGreaterThan(3);
      expect(exp.industryContext).toBeDefined();
    });
  });

  it('should have appropriate education background', () => {
    const { education } = businessAnalystContent;
    
    expect(education.length).toBe(2);
    
    // Check for MBA and relevant undergraduate degree
    const degrees = education.map(edu => edu.degree.toLowerCase());
    expect(degrees.some(degree => degree.includes('master') || degree.includes('mba'))).toBe(true);
    expect(degrees.some(degree => degree.includes('bachelor'))).toBe(true);
    
    // Check for relevant fields
    const fields = education.map(edu => edu.field.toLowerCase());
    expect(fields.some(field => 
      field.includes('business') || 
      field.includes('information') || 
      field.includes('analytics')
    )).toBe(true);
  });

  it('should have business analyst specific projects', () => {
    const { projects } = businessAnalystContent;
    
    expect(projects.length).toBe(3);
    
    // Check for role-specific projects
    const roleSpecificProjects = projects.filter(p => p.roleSpecific);
    expect(roleSpecificProjects.length).toBe(3);
    
    // Check project content
    projects.forEach(project => {
      expect(project.title).toBeDefined();
      expect(project.description.length).toBeGreaterThan(100);
      expect(project.impact).toBeDefined();
      expect(project.technologies.length).toBeGreaterThan(2);
      expect(project.metrics).toBeDefined();
    });
    
    // Check for business analysis specific project types
    const projectTitles = projects.map(p => p.title.toLowerCase());
    expect(projectTitles.some(title => 
      title.includes('process') || 
      title.includes('requirements') || 
      title.includes('analysis') ||
      title.includes('optimization')
    )).toBe(true);
  });

  it('should have relevant achievements', () => {
    const { achievements } = businessAnalystContent;
    
    expect(achievements.length).toBeGreaterThan(5);
    
    // Check for business analyst specific achievements
    const achievementText = achievements.join(' ').toLowerCase();
    expect(achievementText).toContain('business analysis');
    expect(achievementText).toContain('certified');
    expect(achievementText).toContain('cost savings');
  });

  it('should have relevant certifications', () => {
    const { certifications } = businessAnalystContent;
    
    expect(certifications).toBeDefined();
    expect(certifications!.length).toBeGreaterThan(2);
    
    // Check for business analyst specific certifications
    const certNames = certifications!.map(cert => cert.name.toLowerCase());
    expect(certNames.some(name => name.includes('business analysis'))).toBe(true);
    expect(certNames.some(name => name.includes('tableau'))).toBe(true);
    
    // Check certification structure
    certifications!.forEach(cert => {
      expect(cert.issuer).toBeDefined();
      expect(cert.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(cert.credentialId).toBeDefined();
    });
  });

  it('should have correct metadata', () => {
    const { metadata } = businessAnalystContent;
    
    expect(metadata.targetRole).toBe('business-analyst');
    expect(metadata.industry).toBe('business');
    expect(metadata.experienceLevel).toBe('senior');
    expect(metadata.tags).toContain('business-analysis');
    expect(metadata.tags).toContain('requirements-analysis');
    expect(metadata.tags).toContain('process-improvement');
    expect(metadata.contentVersion).toBe('1.0.0');
  });

  it('should have consistent experience level across content', () => {
    const { experiences, skills, metadata } = businessAnalystContent;
    
    // Check that experience level matches metadata
    expect(metadata.experienceLevel).toBe('senior');
    
    // Check that most recent experience is senior level
    expect(experiences[0].roleLevel).toBe('senior');
    
    // Check that skills reflect senior level proficiency
    const coreSkills = skills.filter(s => s.isCore);
    const avgProficiency = coreSkills.reduce((sum, skill) => sum + skill.proficiency, 0) / coreSkills.length;
    expect(avgProficiency).toBeGreaterThan(85); // Senior level should have high proficiency
  });

  it('should have quantified achievements and metrics', () => {
    const { experiences, projects } = businessAnalystContent;
    
    // Check that achievements contain quantified results
    experiences.forEach(exp => {
      const achievementText = exp.achievements.join(' ');
      expect(achievementText).toMatch(/\d+%|\$[\d,]+|[\d,]+\+/); // Contains percentages, dollar amounts, or numbers
    });
    
    // Check that projects have metrics
    projects.forEach(project => {
      expect(project.metrics).toBeDefined();
      expect(project.impact).toMatch(/\d+%|\$[\d,]+|[\d,]+/); // Contains quantified impact
    });
  });
});