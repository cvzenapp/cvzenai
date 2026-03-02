import { describe, it, expect } from 'vitest';
import { clinicalResearcherContent } from './clinicalResearcherTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Clinical Researcher Template Content', () => {
  it('should have correct template ID', () => {
    expect(clinicalResearcherContent.templateId).toBe(TEMPLATE_IDS.CLINICAL_RESEARCHER);
  });

  it('should have appropriate personal info for clinical researcher', () => {
    const { personalInfo } = clinicalResearcherContent;
    expect(personalInfo.name).toBeTruthy();
    expect(personalInfo.title).toContain('Clinical Research');
    expect(personalInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(personalInfo.phone).toMatch(/^\+1 \(\d{3}\) \d{3}-\d{4}$/);
    expect(personalInfo.location).toBeTruthy();
  });

  it('should have professional summary relevant to clinical research', () => {
    const summary = clinicalResearcherContent.professionalSummary;
    expect(summary).toContain('Clinical Research');
    expect(summary).toContain('clinical trials');
    expect(summary).toContain('FDA');
    expect(summary.length).toBeGreaterThan(200);
  });

  it('should have clinical research specific skills', () => {
    const skills = clinicalResearcherContent.skills;
    const skillNames = skills.map(skill => skill.name);
    
    // Check for required skills from task requirements
    expect(skillNames).toContain('Clinical Trial Design');
    expect(skillNames).toContain('Statistical Analysis');
    expect(skillNames).toContain('Regulatory Compliance');
    expect(skillNames).toContain('Medical Writing');
    
    // Check for additional relevant skills
    expect(skillNames).toContain('Good Clinical Practice (GCP)');
    expect(skillNames).toContain('FDA Regulations (21 CFR)');
    expect(skillNames).toContain('Protocol Development');
    
    // Verify skill proficiency levels are realistic for senior level
    const coreSkills = skills.filter(skill => skill.isCore);
    expect(coreSkills.length).toBeGreaterThan(5);
    
    coreSkills.forEach(skill => {
      expect(skill.proficiency).toBeGreaterThan(80);
      expect(skill.yearsOfExperience).toBeGreaterThan(5);
      expect(skill.relevanceScore).toBeGreaterThan(7);
    });
  });

  it('should have healthcare industry experience', () => {
    const experiences = clinicalResearcherContent.experiences;
    expect(experiences.length).toBeGreaterThan(0);
    
    experiences.forEach(exp => {
      expect(['Healthcare', 'Pharmaceutical', 'Academic Medicine']).toContain(exp.industryContext);
      expect(exp.position).toMatch(/research|clinical|scientist/i);
      expect(exp.achievements.length).toBeGreaterThan(0);
    });
    
    // Check for progression in role levels
    const roleLevels = experiences.map(exp => exp.roleLevel);
    expect(roleLevels).toContain('senior');
  });

  it('should have relevant education for clinical research', () => {
    const education = clinicalResearcherContent.education;
    expect(education.length).toBeGreaterThan(0);
    
    const degrees = education.map(edu => edu.degree);
    expect(degrees.some(degree => degree.includes('Ph.D.') || degree.includes('Master'))).toBe(true);
    
    const fields = education.map(edu => edu.field);
    expect(fields.some(field => 
      field.includes('Biostatistics') || 
      field.includes('Biology') || 
      field.includes('Medicine') ||
      field.includes('Computational')
    )).toBe(true);
  });

  it('should have clinical research specific projects', () => {
    const projects = clinicalResearcherContent.projects;
    expect(projects.length).toBeGreaterThan(0);
    
    projects.forEach(project => {
      expect(project.roleSpecific).toBe(true);
      expect(project.description).toMatch(/clinical|trial|study|research/i);
      expect(project.impact).toBeTruthy();
      expect(project.metrics).toBeTruthy();
    });
    
    // Check for clinical trial specific terminology
    const projectDescriptions = projects.map(p => p.description).join(' ');
    expect(projectDescriptions).toMatch(/phase|FDA|patients|trial/i);
  });

  it('should have realistic achievements for clinical researcher', () => {
    const achievements = clinicalResearcherContent.achievements;
    expect(achievements.length).toBeGreaterThan(0);
    
    achievements.forEach(achievement => {
      expect(achievement.length).toBeGreaterThan(20);
    });
    
    // Check for clinical research specific achievements
    const achievementText = achievements.join(' ');
    expect(achievementText).toMatch(/FDA|clinical|trials|publications|research/i);
  });

  it('should have relevant certifications', () => {
    const certifications = clinicalResearcherContent.certifications;
    expect(certifications).toBeTruthy();
    expect(certifications!.length).toBeGreaterThan(0);
    
    const certNames = certifications!.map(cert => cert.name);
    expect(certNames.some(name => 
      name.includes('Clinical Research') || 
      name.includes('GCP') || 
      name.includes('Regulatory')
    )).toBe(true);
  });

  it('should have correct metadata', () => {
    const { metadata } = clinicalResearcherContent;
    expect(metadata.targetRole).toBe('clinical-researcher');
    expect(metadata.industry).toBe('healthcare');
    expect(metadata.experienceLevel).toBe('senior');
    expect(metadata.tags).toContain('clinical-research');
    expect(metadata.tags).toContain('clinical-trials');
    expect(metadata.tags).toContain('statistical-analysis');
    expect(metadata.tags).toContain('regulatory-compliance');
    expect(metadata.tags).toContain('medical-writing');
  });

  it('should have consistent experience progression', () => {
    const experiences = clinicalResearcherContent.experiences;
    
    // Sort by start date to check progression
    const sortedExperiences = [...experiences].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Check that roles progress appropriately
    const roleLevels = sortedExperiences.map(exp => exp.roleLevel);
    expect(roleLevels[0]).toBe('entry');
    expect(roleLevels[roleLevels.length - 1]).toBe('senior');
  });

  it('should have quantifiable project impacts', () => {
    const projects = clinicalResearcherContent.projects;
    
    projects.forEach(project => {
      expect(project.impact).toMatch(/\d+%|\$\d+|FDA|approval|patients/i);
      if (project.metrics) {
        const metricsValues = Object.values(project.metrics);
        expect(metricsValues.some(value => value.includes('%') || value.includes('$') || value.includes('FDA'))).toBe(true);
      }
    });
  });

  it('should have appropriate technologies for clinical research', () => {
    const allTechnologies = [
      ...clinicalResearcherContent.experiences.flatMap(exp => exp.technologies),
      ...clinicalResearcherContent.projects.flatMap(project => project.technologies)
    ];
    
    // Check for clinical research specific technologies
    expect(allTechnologies.some(tech => 
      tech.includes('SAS') || 
      tech.includes('Clinical') || 
      tech.includes('Statistical') ||
      tech.includes('EDC') ||
      tech.includes('REDCap')
    )).toBe(true);
  });
});