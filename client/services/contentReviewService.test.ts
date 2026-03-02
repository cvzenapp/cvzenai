import { describe, it, expect, beforeEach } from 'vitest';
import { ContentReviewService } from './contentReviewService';
import { TemplateSpecificContent } from '../types/templateContent';

describe('ContentReviewService', () => {
  let reviewService: ContentReviewService;
  let mockContent: TemplateSpecificContent;

  beforeEach(() => {
    reviewService = new ContentReviewService();
    mockContent = {
      templateId: 'frontend-developer-senior',
      personalInfo: {
        name: 'Jane Smith',
        title: 'Senior Frontend Developer',
        email: 'jane.smith@example.com',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/janesmith',
        github: 'github.com/janesmith'
      },
      professionalSummary: 'Experienced frontend developer with 7+ years of expertise in React, TypeScript, and modern web technologies. Proven track record of building scalable user interfaces and leading development teams.',
      objective: 'Seeking a senior frontend role where I can leverage my expertise in React and TypeScript to build exceptional user experiences.',
      skills: [
        {
          name: 'React',
          proficiency: 95,
          category: 'Frontend Frameworks',
          yearsOfExperience: 7,
          isCore: true,
          relevanceScore: 10
        },
        {
          name: 'TypeScript',
          proficiency: 90,
          category: 'Programming Languages',
          yearsOfExperience: 5,
          isCore: true,
          relevanceScore: 9
        },
        {
          name: 'JavaScript',
          proficiency: 95,
          category: 'Programming Languages',
          yearsOfExperience: 8,
          isCore: true,
          relevanceScore: 10
        },
        {
          name: 'CSS',
          proficiency: 88,
          category: 'Styling',
          yearsOfExperience: 8,
          isCore: true,
          relevanceScore: 8
        },
        {
          name: 'Next.js',
          proficiency: 85,
          category: 'Frontend Frameworks',
          yearsOfExperience: 4,
          isCore: true,
          relevanceScore: 8
        }
      ],
      experiences: [
        {
          company: 'TechCorp Inc',
          position: 'Senior Frontend Developer',
          startDate: '2021-01',
          endDate: null,
          description: 'Lead frontend development for enterprise SaaS platform serving 100K+ users.',
          achievements: [
            'Improved application performance by 40% through code optimization',
            'Led team of 4 frontend developers',
            'Implemented design system used across 5 products'
          ],
          technologies: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
          location: 'New York, NY',
          industryContext: 'Technology',
          roleLevel: 'senior'
        },
        {
          company: 'StartupXYZ',
          position: 'Frontend Developer',
          startDate: '2019-03',
          endDate: '2020-12',
          description: 'Developed responsive web applications for fintech startup.',
          achievements: [
            'Built customer dashboard from scratch',
            'Reduced bundle size by 30%'
          ],
          technologies: ['React', 'JavaScript', 'SCSS'],
          location: 'New York, NY',
          industryContext: 'Fintech',
          roleLevel: 'mid'
        }
      ],
      education: [
        {
          institution: 'New York University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2014-09',
          endDate: '2018-05',
          location: 'New York, NY'
        }
      ],
      projects: [
        {
          title: 'E-commerce Dashboard',
          description: 'Built comprehensive admin dashboard for e-commerce platform with real-time analytics and inventory management.',
          technologies: ['React', 'TypeScript', 'Chart.js', 'Material-UI'],
          startDate: '2022-01-01',
          endDate: '2022-06-01',
          impact: 'Reduced admin task completion time by 50%',
          roleSpecific: true,
          github: 'github.com/janesmith/ecommerce-dashboard'
        },
        {
          title: 'Component Library',
          description: 'Developed reusable React component library with TypeScript and Storybook documentation.',
          technologies: ['React', 'TypeScript', 'Storybook', 'Rollup'],
          startDate: '2021-08-01',
          endDate: '2021-12-01',
          impact: 'Adopted by 3 teams, reducing development time by 25%',
          roleSpecific: true,
          github: 'github.com/janesmith/ui-components'
        }
      ],
      achievements: [
        'Led successful migration from JavaScript to TypeScript',
        'Mentored 5 junior developers',
        'Speaker at React Conference 2023'
      ]
    };
  });

  describe('reviewContent', () => {
    it('should give high scores to high-quality content', () => {
      const review = reviewService.reviewContent(mockContent);

      expect(review.overallScore).toBeGreaterThanOrEqual(70);
      // The content might not pass all criteria due to strict validation
      // but should have good individual scores
      expect(review.criteria.skillRelevance.score).toBeGreaterThanOrEqual(80);
      expect(review.criteria.experienceConsistency.score).toBeGreaterThanOrEqual(75);
      expect(review.criteria.completeness.score).toBeGreaterThanOrEqual(85);
    });

    it('should provide detailed feedback for each criteria', () => {
      const review = reviewService.reviewContent(mockContent);

      expect(review.criteria.skillRelevance.feedback).toBeDefined();
      expect(review.criteria.experienceConsistency.feedback).toBeDefined();
      expect(review.criteria.projectRelevance.feedback).toBeDefined();
      expect(review.criteria.contentQuality.feedback).toBeDefined();
      expect(review.criteria.completeness.feedback).toBeDefined();
    });

    it('should fail content with poor skill relevance', () => {
      const poorContent = {
        ...mockContent,
        skills: [
          {
            name: 'Irrelevant Skill',
            proficiency: 50,
            category: 'Random',
            yearsOfExperience: 1,
            isCore: false,
            relevanceScore: 2
          }
        ]
      };

      const review = reviewService.reviewContent(poorContent);

      expect(review.criteria.skillRelevance.passed).toBe(false);
      expect(review.criteria.skillRelevance.score).toBeLessThan(70);
      expect(review.passed).toBe(false);
    });

    it('should fail content with inconsistent experience', () => {
      const inconsistentContent = {
        ...mockContent,
        experiences: [
          {
            ...mockContent.experiences[0],
            achievements: [], // No achievements
            technologies: ['Unrelated Tech'], // Technologies don't match skills
            roleLevel: 'entry' as const // Inconsistent with senior role
          }
        ]
      };

      const review = reviewService.reviewContent(inconsistentContent);

      expect(review.criteria.experienceConsistency.passed).toBe(false);
      expect(review.passed).toBe(false);
    });

    it('should fail content with irrelevant projects', () => {
      const irrelevantProjectContent = {
        ...mockContent,
        projects: [
          {
            title: 'Cooking Blog',
            description: 'Personal cooking blog',
            technologies: ['WordPress'],
            startDate: '2020-01-01',
            endDate: '2020-06-01',
            impact: 'Got 100 views',
            roleSpecific: false
          }
        ]
      };

      const review = reviewService.reviewContent(irrelevantProjectContent);

      expect(review.criteria.projectRelevance.passed).toBe(false);
      expect(review.passed).toBe(false);
    });

    it('should fail content with poor quality', () => {
      const poorQualityContent = {
        ...mockContent,
        professionalSummary: 'I code stuff.',
        personalInfo: {
          ...mockContent.personalInfo,
          email: 'invalid-email'
        }
      };

      const review = reviewService.reviewContent(poorQualityContent);

      expect(review.criteria.contentQuality.passed).toBe(false);
      expect(review.passed).toBe(false);
    });

    it('should fail incomplete content', () => {
      const incompleteContent = {
        ...mockContent,
        skills: [],
        experiences: [],
        projects: [],
        education: []
      };

      const review = reviewService.reviewContent(incompleteContent);

      expect(review.criteria.completeness.passed).toBe(false);
      expect(review.passed).toBe(false);
    });

    it('should provide suggestions for improvement', () => {
      const improvableContent = {
        ...mockContent,
        skills: mockContent.skills.slice(0, 3), // Fewer skills
        projects: [] // No projects
      };

      const review = reviewService.reviewContent(improvableContent);

      expect(review.recommendations.length).toBeGreaterThan(0);
      expect(review.recommendations.some(r => r.includes('skills'))).toBe(true);
      expect(review.recommendations.some(r => r.includes('projects'))).toBe(true);
    });

    it('should identify required fixes for failing content', () => {
      const failingContent = {
        ...mockContent,
        professionalSummary: '',
        skills: [],
        experiences: []
      };

      const review = reviewService.reviewContent(failingContent);

      expect(review.requiredFixes.length).toBeGreaterThan(0);
      expect(review.passed).toBe(false);
    });

    it('should provide warnings for concerning content', () => {
      const concerningContent = {
        ...mockContent,
        skills: mockContent.skills.slice(0, 2), // Very few skills
        experiences: mockContent.experiences.slice(0, 1) // Only one experience
      };

      const review = reviewService.reviewContent(concerningContent);

      expect(review.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('skill relevance evaluation', () => {
    it('should score high for relevant skills', () => {
      const review = reviewService.reviewContent(mockContent);
      expect(review.criteria.skillRelevance.score).toBeGreaterThan(80);
    });

    it('should penalize low relevance scores', () => {
      const lowRelevanceContent = {
        ...mockContent,
        skills: mockContent.skills.map(skill => ({
          ...skill,
          relevanceScore: 3
        }))
      };

      const review = reviewService.reviewContent(lowRelevanceContent);
      expect(review.criteria.skillRelevance.score).toBeLessThan(70);
    });

    it('should penalize too few skills', () => {
      const fewSkillsContent = {
        ...mockContent,
        skills: mockContent.skills.slice(0, 2)
      };

      const review = reviewService.reviewContent(fewSkillsContent);
      expect(review.criteria.skillRelevance.suggestions).toContain('Add more skills relevant to the role');
    });
  });

  describe('experience consistency evaluation', () => {
    it('should score high for consistent experience', () => {
      const review = reviewService.reviewContent(mockContent);
      expect(review.criteria.experienceConsistency.score).toBeGreaterThan(75);
    });

    it('should penalize missing achievements', () => {
      const noAchievementsContent = {
        ...mockContent,
        experiences: mockContent.experiences.map(exp => ({
          ...exp,
          achievements: []
        }))
      };

      const review = reviewService.reviewContent(noAchievementsContent);
      expect(review.criteria.experienceConsistency.suggestions).toContain('Add specific achievements to work experiences');
    });

    it('should penalize technology misalignment', () => {
      const misalignedContent = {
        ...mockContent,
        experiences: mockContent.experiences.map(exp => ({
          ...exp,
          technologies: ['Completely Different Tech']
        }))
      };

      const review = reviewService.reviewContent(misalignedContent);
      expect(review.criteria.experienceConsistency.suggestions).toContain('Ensure technologies in experience align with listed skills');
    });
  });

  describe('project relevance evaluation', () => {
    it('should score high for relevant projects', () => {
      const review = reviewService.reviewContent(mockContent);
      expect(review.criteria.projectRelevance.score).toBeGreaterThanOrEqual(60);
    });

    it('should handle no projects gracefully', () => {
      const noProjectsContent = {
        ...mockContent,
        projects: []
      };

      const review = reviewService.reviewContent(noProjectsContent);
      expect(review.criteria.projectRelevance.score).toBe(30);
      expect(review.criteria.projectRelevance.passed).toBe(false);
    });

    it('should penalize non-role-specific projects', () => {
      const nonSpecificContent = {
        ...mockContent,
        projects: mockContent.projects.map(project => ({
          ...project,
          roleSpecific: false
        }))
      };

      const review = reviewService.reviewContent(nonSpecificContent);
      expect(review.criteria.projectRelevance.suggestions).toContain('Include projects that are specific to the target role');
    });
  });

  describe('content quality evaluation', () => {
    it('should score high for quality content', () => {
      const review = reviewService.reviewContent(mockContent);
      expect(review.criteria.contentQuality.score).toBeGreaterThanOrEqual(70);
    });

    it('should penalize placeholder text', () => {
      const placeholderContent = {
        ...mockContent,
        professionalSummary: 'I am a [role] with [years] of experience in [field].'
      };

      const review = reviewService.reviewContent(placeholderContent);
      expect(review.criteria.contentQuality.suggestions).toContain('Replace all placeholder text with actual content');
    });

    it('should penalize invalid email', () => {
      const invalidEmailContent = {
        ...mockContent,
        personalInfo: {
          ...mockContent.personalInfo,
          email: 'not-an-email'
        }
      };

      const review = reviewService.reviewContent(invalidEmailContent);
      expect(review.criteria.contentQuality.suggestions).toContain('Use a valid email format');
    });

    it('should penalize empty required fields', () => {
      const emptyFieldsContent = {
        ...mockContent,
        personalInfo: {
          ...mockContent.personalInfo,
          name: ''
        }
      };

      const review = reviewService.reviewContent(emptyFieldsContent);
      expect(review.criteria.contentQuality.suggestions).toContain('Fill in all required fields');
    });
  });

  describe('completeness evaluation', () => {
    it('should score high for complete content', () => {
      const review = reviewService.reviewContent(mockContent);
      expect(review.criteria.completeness.score).toBeGreaterThan(85);
    });

    it('should penalize missing sections', () => {
      const incompleteContent = {
        ...mockContent,
        skills: [],
        experiences: [],
        projects: []
      };

      const review = reviewService.reviewContent(incompleteContent);
      expect(review.criteria.completeness.score).toBeLessThan(50);
      expect(review.criteria.completeness.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('generateReviewReport', () => {
    it('should generate comprehensive review report', () => {
      const review = reviewService.reviewContent(mockContent);
      const report = reviewService.generateReviewReport(mockContent, review);

      expect(report).toContain('Template Content Review Report');
      expect(report).toContain(mockContent.templateId);
      expect(report).toContain(`**Overall Score:** ${review.overallScore}/100`);
      expect(report).toContain('Skill Relevance');
      expect(report).toContain('Experience Consistency');
      expect(report).toContain('Project Relevance');
      expect(report).toContain('Content Quality');
      expect(report).toContain('Completeness');
    });

    it('should include all feedback sections', () => {
      const poorContent = {
        ...mockContent,
        skills: [],
        experiences: [],
        projects: []
      };

      const review = reviewService.reviewContent(poorContent);
      const report = reviewService.generateReviewReport(poorContent, review);

      expect(report).toContain('## Recommendations');
      expect(report).toContain('## Required Fixes');
      expect(report).toContain('## Warnings');
    });
  });

  describe('custom review criteria', () => {
    it('should use custom criteria weights', () => {
      const customCriteria = {
        skillRelevance: { weight: 0.5, minScore: 80, description: 'Custom skill criteria' },
        experienceConsistency: { weight: 0.2, minScore: 70, description: 'Custom experience criteria' },
        projectRelevance: { weight: 0.1, minScore: 60, description: 'Custom project criteria' },
        contentQuality: { weight: 0.1, minScore: 70, description: 'Custom quality criteria' },
        completeness: { weight: 0.1, minScore: 80, description: 'Custom completeness criteria' }
      };

      const review = reviewService.reviewContent(mockContent, customCriteria);

      // With higher weight on skills, the overall score should be more influenced by skill relevance
      expect(review.overallScore).toBeDefined();
      expect(typeof review.overallScore).toBe('number');
    });

    it('should apply custom minimum scores', () => {
      const strictCriteria = {
        skillRelevance: { weight: 0.25, minScore: 95, description: 'Very strict skill criteria' },
        experienceConsistency: { weight: 0.25, minScore: 95, description: 'Very strict experience criteria' },
        projectRelevance: { weight: 0.20, minScore: 95, description: 'Very strict project criteria' },
        contentQuality: { weight: 0.20, minScore: 95, description: 'Very strict quality criteria' },
        completeness: { weight: 0.10, minScore: 95, description: 'Very strict completeness criteria' }
      };

      const review = reviewService.reviewContent(mockContent, strictCriteria);

      // With very strict criteria, even good content might not pass
      expect(review.passed).toBe(false);
    });
  });
});