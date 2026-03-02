import { describe, it, expect } from 'vitest';
import { academicResearcherContent } from './academicResearcherTemplateContent';
import { templateContentRegistry } from '../templateContentRegistry';

describe('Academic Researcher Template Content', () => {
  it('should have valid template structure', () => {
    expect(academicResearcherContent.templateId).toBe('academic-researcher');
    expect(academicResearcherContent.personalInfo.name).toBe('Dr. Michael Chen');
    expect(academicResearcherContent.personalInfo.title).toBe('Associate Professor of Computer Science');
    expect(academicResearcherContent.metadata.targetRole).toBe('academic-researcher');
    expect(academicResearcherContent.metadata.industry).toBe('academia');
    expect(academicResearcherContent.metadata.experienceLevel).toBe('senior');
  });

  it('should have academic research-specific skills', () => {
    const skillNames = academicResearcherContent.skills.map(skill => skill.name);
    
    // Check for core academic research skills
    expect(skillNames).toContain('Research Methodology');
    expect(skillNames).toContain('Grant Writing');
    expect(skillNames).toContain('Academic Publishing');
    expect(skillNames).toContain('Teaching');
    expect(skillNames).toContain('Peer Review');
    
    // Verify all skills have high relevance scores for academic research
    academicResearcherContent.skills.forEach(skill => {
      expect(skill.relevanceScore).toBeGreaterThanOrEqual(8);
      expect(skill.proficiency).toBeGreaterThan(85);
      expect(skill.yearsOfExperience).toBeGreaterThan(0);
    });
  });

  it('should have academic industry experience', () => {
    academicResearcherContent.experiences.forEach(experience => {
      expect(['Higher Education', 'Academic Research']).toContain(experience.industryContext);
      expect(experience.company).toMatch(/University|Institute/);
      expect(experience.achievements.length).toBeGreaterThan(0);
    });
  });

  it('should have research-relevant projects', () => {
    const projectTitles = academicResearcherContent.projects.map(project => project.title);
    
    expect(projectTitles).toContain('Neural Language Understanding Framework');
    expect(projectTitles).toContain('Multimodal AI for Healthcare Diagnostics');
    expect(projectTitles).toContain('Open Source ML Education Platform');
    
    academicResearcherContent.projects.forEach(project => {
      expect(project.roleSpecific).toBe(true);
      expect(project.impact).toBeTruthy();
      expect(project.metrics).toBeDefined();
    });
  });

  it('should have appropriate academic education', () => {
    const degrees = academicResearcherContent.education.map(edu => edu.degree);
    expect(degrees).toContain('Ph.D.');
    expect(degrees).toContain('Master of Science');
    expect(degrees).toContain('Bachelor of Science');
    
    // Should have Computer Science field
    const fields = academicResearcherContent.education.map(edu => edu.field);
    expect(fields.every(field => field.includes('Computer Science'))).toBe(true);
  });

  it('should have realistic achievements for academic researcher role', () => {
    expect(academicResearcherContent.achievements.length).toBeGreaterThan(8);
    
    const achievementText = academicResearcherContent.achievements.join(' ');
    expect(achievementText).toMatch(/research|papers|publications|grants|citations/i);
    expect(achievementText).toMatch(/PhD|students|mentored/i);
  });

  it('should pass template content validation', () => {
    const validation = templateContentRegistry.validateTemplateContent(academicResearcherContent);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
    
    // May have warnings but should be valid
    if (validation.warnings.length > 0) {
      console.log('Academic Researcher content warnings:', validation.warnings);
    }
  });

  it('should have professional summary appropriate for academia', () => {
    expect(academicResearcherContent.professionalSummary).toMatch(/professor|research|academic|papers|citations/i);
    expect(academicResearcherContent.professionalSummary.length).toBeGreaterThan(150);
  });

  it('should have academic-specific technologies and tools', () => {
    const allTechnologies = [
      ...academicResearcherContent.experiences.flatMap(exp => exp.technologies),
      ...academicResearcherContent.projects.flatMap(project => project.technologies)
    ];
    
    expect(allTechnologies.some(tech => 
      tech.includes('Python') || 
      tech.includes('TensorFlow') || 
      tech.includes('Research') ||
      tech.includes('PyTorch')
    )).toBe(true);
  });

  it('should have academic certifications and awards', () => {
    const certificationNames = academicResearcherContent.certifications?.map(cert => cert.name) || [];
    expect(certificationNames.some(name => 
      name.includes('Fellow') || 
      name.includes('Award') || 
      name.includes('NSF')
    )).toBe(true);
  });

  it('should have quantified research impact metrics', () => {
    const achievementText = academicResearcherContent.achievements.join(' ');
    expect(achievementText).toMatch(/\d+\+?\s*(?:peer-reviewed\s+)?(papers|citations|grants|students)/i);
    
    academicResearcherContent.projects.forEach(project => {
      expect(project.impact).toMatch(/\d+/); // Should contain numbers/metrics
    });
  });
});