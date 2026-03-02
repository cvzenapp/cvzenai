import { describe, it, expect } from 'vitest';
import { k12TeacherContent } from './k12TeacherTemplateContent';
import { templateContentRegistry } from '../templateContentRegistry';

describe('K-12 Teacher Template Content', () => {
  it('should have valid template structure', () => {
    expect(k12TeacherContent.templateId).toBe('k12-teacher');
    expect(k12TeacherContent.personalInfo.name).toBe('Sarah Martinez');
    expect(k12TeacherContent.personalInfo.title).toBe('Elementary School Teacher');
    expect(k12TeacherContent.metadata.targetRole).toBe('k12-teacher');
    expect(k12TeacherContent.metadata.industry).toBe('education');
    expect(k12TeacherContent.metadata.experienceLevel).toBe('mid');
  });

  it('should have education-specific skills', () => {
    const skillNames = k12TeacherContent.skills.map(skill => skill.name);
    
    // Check for core education skills
    expect(skillNames).toContain('Curriculum Development');
    expect(skillNames).toContain('Classroom Management');
    expect(skillNames).toContain('Student Assessment');
    expect(skillNames).toContain('Differentiated Instruction');
    expect(skillNames).toContain('Educational Technology');
    
    // Verify all skills have high relevance scores for education
    k12TeacherContent.skills.forEach(skill => {
      expect(skill.relevanceScore).toBeGreaterThanOrEqual(8);
      expect(skill.proficiency).toBeGreaterThan(80);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
    });
  });

  it('should have education industry experience', () => {
    k12TeacherContent.experiences.forEach(experience => {
      expect(experience.industryContext).toBe('K-12 Education');
      expect(experience.company).toMatch(/School/);
      expect(experience.achievements.length).toBeGreaterThan(0);
    });
  });

  it('should have education-relevant projects', () => {
    const projectTitles = k12TeacherContent.projects.map(project => project.title);
    
    expect(projectTitles).toContain('STEM Integration Program');
    expect(projectTitles).toContain('Digital Literacy Curriculum');
    
    k12TeacherContent.projects.forEach(project => {
      expect(project.roleSpecific).toBe(true);
      expect(project.impact).toBeTruthy();
      expect(project.metrics).toBeDefined();
    });
  });

  it('should have appropriate education and certifications', () => {
    const educationFields = k12TeacherContent.education.map(edu => edu.field);
    expect(educationFields).toContain('Elementary Education');
    
    const certificationNames = k12TeacherContent.certifications?.map(cert => cert.name) || [];
    expect(certificationNames.some(name => name.includes('Teacher Certification'))).toBe(true);
  });

  it('should have realistic achievements for education role', () => {
    expect(k12TeacherContent.achievements.length).toBeGreaterThan(5);
    
    const achievementText = k12TeacherContent.achievements.join(' ');
    expect(achievementText).toMatch(/student|teaching|education|classroom/i);
  });

  it('should pass template content validation', () => {
    const validation = templateContentRegistry.validateTemplateContent(k12TeacherContent);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
    
    // May have warnings but should be valid
    if (validation.warnings.length > 0) {
      console.log('K-12 Teacher content warnings:', validation.warnings);
    }
  });

  it('should have professional summary appropriate for education', () => {
    expect(k12TeacherContent.professionalSummary).toMatch(/teacher|education|student|curriculum/i);
    expect(k12TeacherContent.professionalSummary.length).toBeGreaterThan(100);
  });

  it('should have education-specific technologies', () => {
    const allTechnologies = [
      ...k12TeacherContent.experiences.flatMap(exp => exp.technologies),
      ...k12TeacherContent.projects.flatMap(project => project.technologies)
    ];
    
    expect(allTechnologies.some(tech => tech.includes('Classroom') || tech.includes('Educational'))).toBe(true);
  });
});