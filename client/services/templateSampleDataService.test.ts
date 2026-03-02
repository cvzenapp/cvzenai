import { describe, it, expect } from 'vitest';
import { getTemplateSampleData, getAvailableSampleCategories } from './templateSampleDataService';

describe('TemplateS ampleDataService', () => {
  describe('getTemplateSampleData', () => {
    it('should return technology sample data for technology template', () => {
      const sampleData = getTemplateSampleData('technology');
      
      expect(sampleData.personalInfo.name).toBe('Alex Johnson');
      expect(sampleData.personalInfo.title).toBe('Senior Software Engineer');
      expect(sampleData.skills.some(skill => skill.name === 'JavaScript')).toBe(true);
      expect(sampleData.experiences[0].company).toBe('TechCorp Inc.');
    });

    it('should return design sample data for design template', () => {
      const sampleData = getTemplateSampleData('design');
      
      expect(sampleData.personalInfo.name).toBe('Maya Chen');
      expect(sampleData.personalInfo.title).toBe('Creative Director & UX Designer');
      expect(sampleData.skills.some(skill => skill.name === 'Adobe Creative Suite')).toBe(true);
      expect(sampleData.experiences[0].company).toBe('Design Studio Pro');
    });

    it('should return management sample data for management template', () => {
      const sampleData = getTemplateSampleData('management');
      
      expect(sampleData.personalInfo.name).toBe('Robert Martinez');
      expect(sampleData.personalInfo.title).toBe('VP of Engineering & Technology Leader');
      expect(sampleData.skills.some(skill => skill.name === 'Strategic Planning')).toBe(true);
      expect(sampleData.experiences[0].company).toBe('TechCorp Global');
    });

    it('should return academic sample data for academic template', () => {
      const sampleData = getTemplateSampleData('academic');
      
      expect(sampleData.personalInfo.name).toBe('Dr. Sarah Williams');
      expect(sampleData.personalInfo.title).toBe('Associate Professor of Computer Science');
      expect(sampleData.skills.some(skill => skill.name === 'Machine Learning')).toBe(true);
      expect(sampleData.experiences[0].company).toBe('Harvard University');
    });

    it('should return sales sample data for sales template', () => {
      const sampleData = getTemplateSampleData('sales');
      
      expect(sampleData.personalInfo.name).toBe('Michael Thompson');
      expect(sampleData.personalInfo.title).toBe('VP of Sales & Revenue Growth');
      expect(sampleData.skills.some(skill => skill.name === 'Sales Strategy')).toBe(true);
      expect(sampleData.experiences[0].company).toBe('SalesForce Technologies');
    });

    it('should return marketing sample data for marketing template', () => {
      const sampleData = getTemplateSampleData('marketing');
      
      expect(sampleData.personalInfo.name).toBe('Jessica Rodriguez');
      expect(sampleData.personalInfo.title).toBe('Chief Marketing Officer & Growth Strategist');
      expect(sampleData.skills.some(skill => skill.name === 'Digital Marketing')).toBe(true);
      expect(sampleData.experiences[0].company).toBe('GrowthCo Technologies');
    });

    it('should map industry-specific templates to appropriate categories', () => {
      // Healthcare templates
      const healthcareResearch = getTemplateSampleData('healthcare-research');
      expect(healthcareResearch.personalInfo.name).toBe('Dr. Sarah Williams'); // Academic

      const healthcareAdmin = getTemplateSampleData('healthcare-admin');
      expect(healthcareAdmin.personalInfo.name).toBe('Robert Martinez'); // Management

      // Finance templates
      const financeAnalyst = getTemplateSampleData('finance-analyst');
      expect(financeAnalyst.personalInfo.name).toBe('Robert Martinez'); // Management

      const financeAdvisor = getTemplateSampleData('finance-advisor');
      expect(financeAdvisor.personalInfo.name).toBe('Michael Thompson'); // Sales

      // Education templates
      const educationK12 = getTemplateSampleData('education-k12');
      expect(educationK12.personalInfo.name).toBe('Dr. Sarah Williams'); // Academic

      const educationAdmin = getTemplateSampleData('education-administration');
      expect(educationAdmin.personalInfo.name).toBe('Robert Martinez'); // Management

      // Nonprofit templates
      const nonprofitFundraising = getTemplateSampleData('nonprofit-fundraising');
      expect(nonprofitFundraising.personalInfo.name).toBe('Michael Thompson'); // Sales
    });

    it('should return technology sample data for unknown templates', () => {
      const sampleData = getTemplateSampleData('unknown-template');
      
      expect(sampleData.personalInfo.name).toBe('Alex Johnson');
      expect(sampleData.personalInfo.title).toBe('Senior Software Engineer');
    });

    it('should return technology sample data for tech variations', () => {
      const techModern = getTemplateSampleData('tech-modern');
      const techMinimal = getTemplateSampleData('tech-minimal');
      const techSenior = getTemplateSampleData('tech-senior');
      
      expect(techModern.personalInfo.name).toBe('Alex Johnson');
      expect(techMinimal.personalInfo.name).toBe('Alex Johnson');
      expect(techSenior.personalInfo.name).toBe('Alex Johnson');
    });
  });

  describe('getAvailableSampleCategories', () => {
    it('should return all available sample data categories', () => {
      const categories = getAvailableSampleCategories();
      
      expect(categories).toContain('technology');
      expect(categories).toContain('design');
      expect(categories).toContain('management');
      expect(categories).toContain('academic');
      expect(categories).toContain('sales');
      expect(categories).toContain('marketing');
      expect(categories.length).toBe(6);
    });
  });

  describe('Sample Data Quality', () => {
    it('should have complete resume data for all categories', () => {
      const categories = getAvailableSampleCategories();
      
      categories.forEach(category => {
        const sampleData = getTemplateSampleData(category);
        
        // Check required fields
        expect(sampleData.personalInfo.name).toBeTruthy();
        expect(sampleData.personalInfo.title).toBeTruthy();
        expect(sampleData.personalInfo.email).toBeTruthy();
        expect(sampleData.summary).toBeTruthy();
        expect(sampleData.skills.length).toBeGreaterThan(0);
        expect(sampleData.experiences.length).toBeGreaterThan(0);
        expect(sampleData.education.length).toBeGreaterThan(0);
        
        // Check skills have required properties
        sampleData.skills.forEach(skill => {
          expect(skill.name).toBeTruthy();
          expect(skill.proficiency).toBeGreaterThan(0);
          expect(skill.category).toBeTruthy();
        });
        
        // Check experiences have required properties
        sampleData.experiences.forEach(experience => {
          expect(experience.company).toBeTruthy();
          expect(experience.position).toBeTruthy();
          expect(experience.description).toBeTruthy();
        });
      });
    });

    it('should have category-appropriate skills and experiences', () => {
      // Technology should have programming skills
      const techData = getTemplateSampleData('technology');
      expect(techData.skills.some(skill => 
        skill.category.toLowerCase().includes('programming') || 
        skill.name.toLowerCase().includes('javascript')
      )).toBe(true);

      // Design should have design tools
      const designData = getTemplateSampleData('design');
      expect(designData.skills.some(skill => 
        skill.category.toLowerCase().includes('design') || 
        skill.name.toLowerCase().includes('adobe')
      )).toBe(true);

      // Management should have leadership skills
      const mgmtData = getTemplateSampleData('management');
      expect(mgmtData.skills.some(skill => 
        skill.category.toLowerCase().includes('leadership') || 
        skill.name.toLowerCase().includes('strategic')
      )).toBe(true);

      // Academic should have research skills
      const academicData = getTemplateSampleData('academic');
      expect(academicData.skills.some(skill => 
        skill.category.toLowerCase().includes('research') || 
        skill.name.toLowerCase().includes('machine learning')
      )).toBe(true);

      // Sales should have sales skills
      const salesData = getTemplateSampleData('sales');
      expect(salesData.skills.some(skill => 
        skill.category.toLowerCase().includes('sales') || 
        skill.name.toLowerCase().includes('sales')
      )).toBe(true);

      // Marketing should have marketing skills
      const marketingData = getTemplateSampleData('marketing');
      expect(marketingData.skills.some(skill => 
        skill.category.toLowerCase().includes('marketing') || 
        skill.name.toLowerCase().includes('digital marketing')
      )).toBe(true);
    });
  });
});