/**
 * Unit tests for UserProfileAnalysisService
 */

import { describe, it, expect } from 'vitest';
import { UserProfileAnalysisService } from './userProfileAnalysisService';
import { Resume } from '@shared/api';

describe('UserProfileAnalysisService', () => {
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
      { id: "3", name: "Node.js", level: 80, category: "Backend" },
      { id: "4", name: "Python", level: 75, category: "Programming" },
      { id: "5", name: "AWS", level: 70, category: "Cloud" }
    ],
    experiences: [
      {
        id: "1",
        company: "Tech Startup Inc",
        position: "Senior Software Engineer",
        startDate: "2021-01-01",
        endDate: null,
        description: "Lead development of web applications using React and Node.js. Managed team of 3 developers."
      },
      {
        id: "2",
        company: "Software Solutions LLC",
        position: "Software Engineer",
        startDate: "2019-06-01",
        endDate: "2020-12-31",
        description: "Developed full-stack web applications using modern JavaScript frameworks."
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
    projects: [
      {
        id: "1",
        name: "E-commerce Platform",
        description: "Built a full-stack e-commerce platform using React and Node.js",
        technologies: ["React", "Node.js", "MongoDB"],
        startDate: "2020-01-01"
      }
    ],
    upvotes: 0,
    rating: 0,
    isShortlisted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('analyzeUserProfile', () => {
    it('should analyze user profile correctly', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);

      expect(profile).toBeDefined();
      expect(profile.industry).toBe('technology');
      expect(profile.experienceLevel).toBe('senior');
      expect(profile.role).toBe('Senior Software Engineer');
      expect(profile.skills).toContain('JavaScript');
      expect(profile.skills).toContain('React');
      expect(profile.technicalProficiency).toBe('high');
      expect(profile.leadershipLevel).toBe('team-lead');
    });

    it('should determine correct industry for technology professional', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.industry).toBe('technology');
    });

    it('should determine correct experience level', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.experienceLevel).toBe('senior');
    });

    it('should extract primary role correctly', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.role).toBe('Senior Software Engineer');
    });

    it('should extract key skills correctly', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.skills).toHaveLength(5);
      expect(profile.skills?.[0]).toBe('JavaScript'); // Highest proficiency
    });

    it('should determine career stage correctly', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.careerStage).toBe('advancement');
    });

    it('should assess technical proficiency correctly', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.technicalProficiency).toBe('high');
    });

    it('should determine leadership level correctly', () => {
      const profile = UserProfileAnalysisService.analyzeUserProfile(mockResume);
      expect(profile.leadershipLevel).toBe('team-lead');
    });
  });

  describe('industry detection', () => {
    it('should detect healthcare industry', () => {
      const healthcareResume: Resume = {
        ...mockResume,
        experiences: [
          {
            id: "1",
            company: "General Hospital",
            position: "Registered Nurse",
            startDate: "2020-01-01",
            endDate: null,
            description: "Provided patient care in medical surgical unit. Administered medications and monitored patient health."
          }
        ],
        skills: [
          { id: "1", name: "Patient Care", level: 90, category: "Clinical" },
          { id: "2", name: "Medical Records", level: 85, category: "Administrative" }
        ]
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(healthcareResume);
      expect(profile.industry).toBe('healthcare');
    });

    it('should detect finance industry', () => {
      const financeResume: Resume = {
        ...mockResume,
        experiences: [
          {
            id: "1",
            company: "Investment Bank",
            position: "Financial Analyst",
            startDate: "2020-01-01",
            endDate: null,
            description: "Performed financial modeling and analysis for investment decisions."
          }
        ],
        skills: [
          { id: "1", name: "Financial Modeling", level: 90, category: "Analysis" },
          { id: "2", name: "Excel", level: 95, category: "Tools" }
        ]
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(financeResume);
      expect(profile.industry).toBe('finance');
    });
  });

  describe('experience level detection', () => {
    it('should detect entry level for new graduates', () => {
      const entryResume: Resume = {
        ...mockResume,
        experiences: [
          {
            id: "1",
            company: "Tech Company",
            position: "Junior Developer",
            startDate: "2023-06-01",
            endDate: null,
            description: "Entry level software development role."
          }
        ]
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(entryResume);
      expect(profile.experienceLevel).toBe('entry');
    });

    it('should detect executive level for leadership roles', () => {
      const executiveResume: Resume = {
        ...mockResume,
        experiences: [
          {
            id: "1",
            company: "Tech Corporation",
            position: "Chief Technology Officer",
            startDate: "2015-01-01",
            endDate: null,
            description: "Lead technology strategy and engineering teams."
          }
        ]
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(executiveResume);
      expect(profile.experienceLevel).toBe('executive');
    });
  });

  describe('edge cases', () => {
    it('should handle resume with no experience', () => {
      const noExperienceResume: Resume = {
        ...mockResume,
        experiences: []
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(noExperienceResume);
      expect(profile.experienceLevel).toBe('entry');
      expect(profile.role).toBe('');
    });

    it('should handle resume with no skills', () => {
      const noSkillsResume: Resume = {
        ...mockResume,
        skills: []
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(noSkillsResume);
      expect(profile.skills).toHaveLength(0);
      expect(profile.technicalProficiency).toBe('low');
    });

    it('should handle resume with minimal data', () => {
      const minimalResume: Resume = {
        ...mockResume,
        experiences: [],
        skills: [],
        projects: []
      };

      const profile = UserProfileAnalysisService.analyzeUserProfile(minimalResume);
      expect(profile.industry).toBe('general');
      expect(profile.experienceLevel).toBe('entry');
      expect(profile.technicalProficiency).toBe('low');
    });
  });
});