/**
 * Unit tests for TemplateRecommendationService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateRecommendationService } from './templateRecommendationService';
import { TemplateConfig, UserProfile } from './templateService';
import { Resume } from '@shared/api';

describe('TemplateRecommendationService', () => {
  const mockUserProfile: UserProfile = {
    industry: 'technology',
    experienceLevel: 'senior',
    role: 'Senior Software Engineer',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    careerStage: 'advancement',
    technicalProficiency: 'high',
    leadershipLevel: 'team-lead',
    workEnvironment: 'startup'
  };

  const mockResume: Resume = {
    id: "test-resume-1",
    personalInfo: {
      name: "Alex Morgan",
      title: "Senior Software Engineer",
      email: "john@example.com",
      phone: "+1234567890",
      location: "San Francisco, CA"
    },
    summary: "Experienced software engineer with 5 years in web development",
    objective: "Seeking senior software engineer role",
    skills: [
      { id: "1", name: "JavaScript", level: 90, category: "Programming" },
      { id: "2", name: "React", level: 85, category: "Frontend" },
      { id: "3", name: "Node.js", level: 80, category: "Backend" }
    ],
    experiences: [
      {
        id: "1",
        company: "Tech Startup Inc",
        position: "Senior Software Engineer",
        startDate: "2021-01-01",
        endDate: null,
        description: "Lead development of web applications using React and Node.js."
      }
    ],
    education: [
      {
        id: "1",
        institution: "University of Technology",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2015-09-01",
        endDate: "2019-05-31"
      }
    ],
    projects: [],
    upvotes: 0,
    rating: 0,
    isShortlisted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockTemplates: TemplateConfig[] = [
    {
      id: "tech-template-1",
      name: "Modern Tech Professional",
      category: "technology",
      description: "Perfect for software engineers and tech professionals",
      industry: "Technology",
      colors: {
        primary: "#3b82f6",
        secondary: "#1e40af",
        accent: "#06b6d4",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#6b7280"
      },
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
        codeFont: "JetBrains Mono"
      },
      layout: {
        headerStyle: "tech-focused",
        sidebarPosition: "left",
        sectionPriority: ["skills", "experience", "projects"],
        cardStyle: "code-blocks"
      },
      sections: {
        required: ["contact", "summary", "experience", "skills"],
        optional: ["projects", "education"],
        industrySpecific: ["techStack", "github", "portfolio"]
      },
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false
      }
    },
    {
      id: "healthcare-template-1",
      name: "Healthcare Professional",
      category: "healthcare",
      description: "Designed for healthcare professionals and medical staff",
      industry: "Healthcare",
      colors: {
        primary: "#059669",
        secondary: "#047857",
        accent: "#0369a1",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#6b7280"
      },
      typography: {
        headingFont: "Merriweather",
        bodyFont: "Inter",
        codeFont: "JetBrains Mono"
      },
      layout: {
        headerStyle: "academic-formal",
        sidebarPosition: "left",
        sectionPriority: ["licenses", "experience", "education"],
        cardStyle: "publication-style"
      },
      sections: {
        required: ["contact", "summary", "experience", "licenses"],
        optional: ["education", "certifications"],
        industrySpecific: ["medicalLicenses", "clinicalExperience"]
      },
      features: {
        showTechStack: false,
        showPortfolio: false,
        showMetrics: true,
        showPublications: true,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: false,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: true
      }
    },
    {
      id: "creative-template-1",
      name: "Creative Professional",
      category: "design",
      description: "Perfect for designers and creative professionals",
      industry: "Design",
      colors: {
        primary: "#ec4899",
        secondary: "#be185d",
        accent: "#f59e0b",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#6b7280"
      },
      typography: {
        headingFont: "Playfair Display",
        bodyFont: "Inter",
        codeFont: "JetBrains Mono"
      },
      layout: {
        headerStyle: "brand-creative",
        sidebarPosition: "right",
        sectionPriority: ["portfolio", "experience", "skills"],
        cardStyle: "portfolio-cards"
      },
      sections: {
        required: ["contact", "summary", "portfolio", "experience"],
        optional: ["education", "awards"],
        industrySpecific: ["designTools", "portfolio", "awards"]
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: false,
        showPublications: false,
        showCampaigns: true,
        showTeamSize: false,
        showGithub: false,
        showDesignTools: true,
        showCertifications: false,
        showLanguages: false
      }
    }
  ];

  describe('generateRecommendations', () => {
    it('should generate recommendations for a user', async () => {
      const recommendations = await TemplateRecommendationService.generateRecommendations(
        mockResume,
        mockTemplates
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(12);
      
      // Should be sorted by score (highest first)
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].score).toBeGreaterThanOrEqual(recommendations[i].score);
      }
    });

    it('should prioritize technology templates for tech professionals', async () => {
      const recommendations = await TemplateRecommendationService.generateRecommendations(
        mockResume,
        mockTemplates
      );

      const topRecommendation = recommendations[0];
      expect(topRecommendation.template.category).toBe('technology');
      expect(topRecommendation.score).toBeGreaterThan(70);
    });

    it('should provide reasons for recommendations', async () => {
      const recommendations = await TemplateRecommendationService.generateRecommendations(
        mockResume,
        mockTemplates
      );

      recommendations.forEach(rec => {
        expect(rec.reasons).toBeDefined();
        expect(rec.reasons.length).toBeGreaterThan(0);
        expect(rec.reasons.length).toBeLessThanOrEqual(3);
      });
    });

    it('should categorize recommendations correctly', async () => {
      const recommendations = await TemplateRecommendationService.generateRecommendations(
        mockResume,
        mockTemplates
      );

      recommendations.forEach(rec => {
        expect(['perfect-match', 'good-fit', 'alternative']).toContain(rec.category);
      });

      // Top recommendations should be better categories
      const topRec = recommendations[0];
      expect(['perfect-match', 'good-fit']).toContain(topRec.category);
    });

    it('should handle empty template list', async () => {
      const recommendations = await TemplateRecommendationService.generateRecommendations(
        mockResume,
        []
      );

      expect(recommendations).toHaveLength(0);
    });
  });

  describe('getPersonalizedSuggestions', () => {
    it('should return limited number of suggestions', async () => {
      const suggestions = await TemplateRecommendationService.getPersonalizedSuggestions(
        mockResume,
        mockTemplates,
        3
      );

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should return top recommendations', async () => {
      const allRecommendations = await TemplateRecommendationService.generateRecommendations(
        mockResume,
        mockTemplates
      );
      
      const suggestions = await TemplateRecommendationService.getPersonalizedSuggestions(
        mockResume,
        mockTemplates,
        2
      );

      expect(suggestions[0].template.id).toBe(allRecommendations[0].template.id);
      expect(suggestions[1].template.id).toBe(allRecommendations[1].template.id);
    });
  });

  describe('trackRecommendationAccuracy', () => {
    it('should track recommendation interactions', () => {
      const templateId = 'tech-template-1';
      const userProfile = mockUserProfile;
      const action = 'selected';
      const context = {
        position: 1,
        category: 'perfect-match' as const,
        reasons: ['Perfect match for technology professionals'],
        score: 95
      };

      // Should not throw
      expect(() => {
        TemplateRecommendationService.trackRecommendationAccuracy(
          templateId,
          userProfile,
          action,
          context
        );
      }).not.toThrow();
    });
  });

  describe('getRecommendationAnalytics', () => {
    it('should return analytics data', () => {
      const analytics = TemplateRecommendationService.getRecommendationAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.metrics).toBeDefined();
      expect(analytics.underperforming).toBeDefined();
      expect(analytics.insights).toBeDefined();
      expect(analytics.dailyReport).toBeDefined();
      expect(analytics.weeklyReport).toBeDefined();
      expect(analytics.monthlyReport).toBeDefined();
    });
  });

  describe('scoring algorithm', () => {
    it('should give higher scores to industry matches', async () => {
      const techResume = { ...mockResume };
      const healthcareResume = {
        ...mockResume,
        personalInfo: { ...mockResume.personalInfo, title: "Registered Nurse" },
        experiences: [{
          id: "1",
          company: "General Hospital",
          position: "Registered Nurse",
          startDate: "2020-01-01",
          endDate: null,
          description: "Provided patient care in medical unit"
        }],
        skills: [
          { id: "1", name: "Patient Care", level: 90, category: "Clinical" }
        ]
      };

      const techRecommendations = await TemplateRecommendationService.generateRecommendations(
        techResume,
        mockTemplates
      );
      
      const healthcareRecommendations = await TemplateRecommendationService.generateRecommendations(
        healthcareResume,
        mockTemplates
      );

      // Tech resume should score tech template higher
      const techTemplateForTech = techRecommendations.find(r => r.template.category === 'technology');
      const techTemplateForHealthcare = healthcareRecommendations.find(r => r.template.category === 'technology');
      
      expect(techTemplateForTech?.score).toBeGreaterThan(techTemplateForHealthcare?.score || 0);
    });

    it('should consider experience level in scoring', async () => {
      const seniorResume = { ...mockResume };
      const juniorResume = {
        ...mockResume,
        personalInfo: { ...mockResume.personalInfo, title: "Junior Developer" },
        experiences: [{
          id: "1",
          company: "Tech Company",
          position: "Junior Developer",
          startDate: "2023-01-01",
          endDate: null,
          description: "Entry level development work"
        }]
      };

      const seniorRecommendations = await TemplateRecommendationService.generateRecommendations(
        seniorResume,
        mockTemplates
      );
      
      const juniorRecommendations = await TemplateRecommendationService.generateRecommendations(
        juniorResume,
        mockTemplates
      );

      // Both should get recommendations but with different scores
      expect(seniorRecommendations.length).toBeGreaterThan(0);
      expect(juniorRecommendations.length).toBeGreaterThan(0);
    });
  });
});