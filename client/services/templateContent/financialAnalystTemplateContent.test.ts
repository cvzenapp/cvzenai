import { describe, it, expect } from 'vitest';
import { financialAnalystContent } from './financialAnalystTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Financial Analyst Template Content', () => {
  it('should have correct template ID', () => {
    expect(financialAnalystContent.templateId).toBe(TEMPLATE_IDS.FINANCIAL_ANALYST);
  });

  it('should have appropriate personal info for financial analyst role', () => {
    const { personalInfo } = financialAnalystContent;
    
    expect(personalInfo.name).toBe('Sarah Martinez');
    expect(personalInfo.title).toBe('Senior Financial Analyst');
    expect(personalInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(personalInfo.location).toBeTruthy();
    expect(personalInfo.linkedin).toContain('linkedin.com');
  });

  it('should have finance focused professional summary', () => {
    const { professionalSummary } = financialAnalystContent;
    
    expect(professionalSummary).toContain('Financial Analyst');
    expect(professionalSummary).toContain('financial modeling');
    expect(professionalSummary.length).toBeGreaterThan(100);
  });

  it('should have financial analysis specific skills', () => {
    const { skills } = financialAnalystContent;
    
    const skillNames = skills.map(skill => skill.name.toLowerCase());
    
    // Check for core financial analysis skills
    expect(skillNames.some(name => name.includes('financial modeling'))).toBe(true);
    expect(skillNames.some(name => name.includes('excel'))).toBe(true);
    expect(skillNames.some(name => name.includes('sql'))).toBe(true);
    
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
    const { experiences } = financialAnalystContent;
    
    expect(experiences.length).toBeGreaterThan(0);
    
    experiences.forEach(exp => {
      expect(['Investment Management', 'Commercial Banking', 'Financial Advisory']).toContain(exp.industryContext);
      expect(exp.position.toLowerCase()).toMatch(/analyst|financial/);
      expect(exp.achievements.length).toBeGreaterThan(0);
      expect(exp.roleLevel).toMatch(/entry|mid|senior|executive/);
    });
  });

  it('should have correct metadata', () => {
    const { metadata } = financialAnalystContent;
    
    expect(metadata.targetRole).toBe('financial-analyst');
    expect(metadata.industry).toBe('finance');
    expect(metadata.experienceLevel).toBe('senior');
  });
});