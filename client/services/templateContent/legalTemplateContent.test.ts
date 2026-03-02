import { describe, it, expect } from 'vitest';
import { legalContent } from './legalTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Legal Template Content', () => {
  it('should have correct template ID', () => {
    expect(legalContent.templateId).toBe(TEMPLATE_IDS.LEGAL_COUNSEL);
  });

  it('should have legal-specific personal info', () => {
    expect(legalContent.personalInfo.name).toBe('Alexandra Chen');
    expect(legalContent.personalInfo.title).toBe('Senior Legal Counsel');
    expect(legalContent.personalInfo.email).toContain('@lawfirm.com');
    expect(legalContent.personalInfo.linkedin).toContain('alexandrachen-esq');
  });

  it('should have legal-focused professional summary', () => {
    const summary = legalContent.professionalSummary;
    expect(summary).toContain('Legal Counsel');
    expect(summary).toContain('corporate law');
    expect(summary).toContain('mergers & acquisitions');
    expect(summary).toContain('regulatory compliance');
    expect(summary).toContain('contract negotiation');
  });

  it('should have legal-specific skills', () => {
    const skillNames = legalContent.skills.map(skill => skill.name);
    
    // Core legal skills
    expect(skillNames).toContain('Contract Law');
    expect(skillNames).toContain('Corporate Governance');
    expect(skillNames).toContain('Mergers & Acquisitions');
    expect(skillNames).toContain('Regulatory Compliance');
    expect(skillNames).toContain('Securities Law');
    expect(skillNames).toContain('Employment Law');
    
    // All skills should have appropriate proficiency levels
    legalContent.skills.forEach(skill => {
      expect(skill.proficiency).toBeGreaterThanOrEqual(80);
      expect(skill.proficiency).toBeLessThanOrEqual(100);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
      expect(skill.relevanceScore).toBeGreaterThanOrEqual(7);
    });
  });

  it('should have legal industry experience', () => {
    const experiences = legalContent.experiences;
    
    // Should have legal/corporate experience
    const industryContexts = experiences.map(exp => exp.industryContext);
    expect(industryContexts).toContain('Technology');
    expect(industryContexts).toContain('Financial Services');
    expect(industryContexts).toContain('Legal Services');
    
    // Should have appropriate legal positions
    const positions = experiences.map(exp => exp.position);
    expect(positions.some(pos => pos.includes('Legal Counsel'))).toBe(true);
    expect(positions.some(pos => pos.includes('Attorney'))).toBe(true);
  });

  it('should have legal-relevant achievements', () => {
    const achievements = legalContent.experiences.flatMap(exp => exp.achievements);
    
    // Should mention legal-specific accomplishments
    const achievementText = achievements.join(' ').toLowerCase();
    expect(achievementText).toContain('legal');
    expect(achievementText).toContain('compliance');
    expect(achievementText).toContain('contract');
    expect(achievementText).toContain('regulatory');
  });

  it('should have law degree education', () => {
    const education = legalContent.education;
    
    // Should have law degree
    const degrees = education.map(edu => edu.degree);
    expect(degrees.some(degree => degree.includes('Juris Doctor') || degree.includes('J.D.'))).toBe(true);
    
    // Should have relevant coursework
    const lawEducation = education.find(edu => edu.degree.includes('Juris Doctor'));
    expect(lawEducation?.relevantCoursework).toContain('Corporate Law');
    expect(lawEducation?.relevantCoursework).toContain('Securities Regulation');
    expect(lawEducation?.relevantCoursework).toContain('Mergers & Acquisitions');
  });

  it('should have legal-specific projects', () => {
    const projects = legalContent.projects;
    
    // All projects should be role-specific
    projects.forEach(project => {
      expect(project.roleSpecific).toBe(true);
    });
    
    // Should have legal project types
    const projectTitles = projects.map(project => project.title);
    expect(projectTitles.some(title => title.includes('Compliance'))).toBe(true);
    expect(projectTitles.some(title => title.includes('Legal') || title.includes('M&A'))).toBe(true);
  });

  it('should have legal certifications', () => {
    const certifications = legalContent.certifications || [];
    
    // Should have bar licenses
    const certNames = certifications.map(cert => cert.name);
    expect(certNames.some(name => name.includes('Bar License'))).toBe(true);
    
    // Should have legal-specific certifications
    expect(certNames.some(name => name.includes('Privacy Professional') || name.includes('Compliance'))).toBe(true);
  });

  it('should have appropriate metadata', () => {
    const metadata = legalContent.metadata;
    
    expect(metadata.targetRole).toBe('legal-counsel');
    expect(metadata.industry).toBe('legal');
    expect(metadata.experienceLevel).toBe('senior');
    expect(metadata.tags).toContain('contract-law');
    expect(metadata.tags).toContain('corporate-governance');
    expect(metadata.tags).toContain('mergers-acquisitions');
    expect(metadata.tags).toContain('compliance');
  });

  it('should have realistic legal achievements', () => {
    const achievements = legalContent.achievements;
    
    // Should mention bar licenses
    expect(achievements.some(achievement => achievement.includes('Licensed to practice law'))).toBe(true);
    
    // Should mention legal publications or speaking
    expect(achievements.some(achievement => 
      achievement.includes('Speaker') || achievement.includes('Published')
    )).toBe(true);
    
    // Should mention transaction values
    expect(achievements.some(achievement => achievement.includes('$'))).toBe(true);
  });

  it('should have consistent experience progression', () => {
    const experiences = legalContent.experiences;
    
    // Should show career progression
    const roleLevels = experiences.map(exp => exp.roleLevel);
    expect(roleLevels).toContain('entry');
    expect(roleLevels).toContain('mid');
    expect(roleLevels).toContain('senior');
    
    // Most recent role should be senior level
    expect(experiences[0].roleLevel).toBe('senior');
  });

  it('should have legal-appropriate technologies', () => {
    const allTechnologies = legalContent.experiences.flatMap(exp => exp.technologies);
    
    // Should include legal research tools
    expect(allTechnologies.some(tech => tech.includes('Legal Research'))).toBe(true);
    expect(allTechnologies.some(tech => tech.includes('Contract Management'))).toBe(true);
    expect(allTechnologies.some(tech => tech.includes('Compliance'))).toBe(true);
  });
});