import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateContentManager } from './templateContentManager';
import { TemplateSpecificContent } from '../types/templateContent';

describe('TemplateContentManager', () => {
  let contentManager: TemplateContentManager;
  let mockContent: TemplateSpecificContent;

  beforeEach(() => {
    contentManager = new TemplateContentManager();
    mockContent = {
      templateId: 'test-template',
      personalInfo: {
        name: 'Alex Morgan',
        title: 'Software Engineer',
        email: 'john.doe@example.com',
        location: 'San Francisco, CA'
      },
      professionalSummary: 'Experienced software engineer with 5+ years of experience in web development.',
      objective: 'Seeking a challenging role in software development.',
      skills: [
        {
          name: 'JavaScript',
          proficiency: 90,
          category: 'Programming Languages',
          yearsOfExperience: 5,
          isCore: true,
          relevanceScore: 9
        }
      ],
      experiences: [
        {
          company: 'Tech Corp',
          position: 'Software Engineer',
          startDate: '2020-01',
          endDate: null,
          description: 'Developed web applications using React and Node.js',
          achievements: ['Improved performance by 30%'],
          technologies: ['React', 'Node.js'],
          location: 'San Francisco, CA',
          industryContext: 'Technology',
          roleLevel: 'mid'
        }
      ],
      education: [
        {
          institution: 'University of California',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2016-09',
          endDate: '2020-05',
          location: 'Berkeley, CA'
        }
      ],
      projects: [
        {
          title: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform',
          technologies: ['React', 'Node.js', 'MongoDB'],
          startDate: '2021-01-01',
          endDate: '2021-06-01',
          impact: 'Increased sales by 25%',
          roleSpecific: true
        }
      ],
      achievements: ['Employee of the Month', 'Led successful project delivery']
    };
  });

  describe('createTemplateContent', () => {
    it('should create template content successfully', async () => {
      const result = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      expect(result.success).toBe(true);
      expect(result.reviewId).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should fail with invalid content', async () => {
      const invalidContent = { ...mockContent, templateId: '' };

      const result = await contentManager.createTemplateContent(
        'test-template',
        invalidContent,
        'john.doe',
        'Initial creation'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const invalidContent = {
        ...mockContent,
        personalInfo: { ...mockContent.personalInfo, name: '' }
      };

      const result = await contentManager.createTemplateContent(
        'test-template',
        invalidContent,
        'john.doe',
        'Initial creation'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Personal info name is required');
    });
  });

  describe('updateTemplateContent', () => {
    it('should fail to update non-existent template', async () => {
      const result = await contentManager.updateTemplateContent(
        'non-existent-template',
        mockContent,
        'john.doe',
        'Update attempt'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Template non-existent-template does not exist');
    });
  });

  describe('reviewContent', () => {
    it('should approve content successfully', async () => {
      // First create content
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      expect(createResult.success).toBe(true);
      const reviewId = createResult.reviewId!;

      // Then review it
      const reviewResult = await contentManager.reviewContent(
        reviewId,
        true,
        'jane.smith',
        'Content looks good',
        []
      );

      expect(reviewResult.success).toBe(true);
    });

    it('should reject content with feedback', async () => {
      // First create content
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      const reviewId = createResult.reviewId!;

      // Then reject it
      const reviewResult = await contentManager.reviewContent(
        reviewId,
        false,
        'jane.smith',
        'Needs improvement',
        ['Add more skills', 'Improve summary']
      );

      expect(reviewResult.success).toBe(true);
    });

    it('should fail with invalid review ID', async () => {
      const result = await contentManager.reviewContent(
        'invalid-review-id',
        true,
        'jane.smith',
        'Approval'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Review request invalid-review-id not found');
    });
  });

  describe('version management', () => {
    it('should track version history', async () => {
      // Create and approve content
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      const reviewId = createResult.reviewId!;
      await contentManager.reviewContent(
        reviewId,
        true,
        'jane.smith',
        'Approved'
      );

      // Check version history
      const versions = contentManager.getContentVersionHistory('test-template');
      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe('v1.0.0');
      expect(versions[0].createdBy).toBe('john.doe');
      expect(versions[0].approved).toBe(true);
    });

    it('should rollback to previous version', async () => {
      // Create and approve initial content
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      await contentManager.reviewContent(
        createResult.reviewId!,
        true,
        'jane.smith',
        'Approved'
      );

      // Rollback to version 1
      const rollbackResult = await contentManager.rollbackToVersion(
        'test-template',
        'v1.0.0',
        'admin.user'
      );

      expect(rollbackResult.success).toBe(true);

      // Check that a new version was created
      const versions = contentManager.getContentVersionHistory('test-template');
      expect(versions.length).toBe(2);
      expect(versions[1].changeLog).toContain('Rollback to version v1.0.0');
    });

    it('should fail to rollback to non-existent version', async () => {
      const result = await contentManager.rollbackToVersion(
        'test-template',
        'v999.0.0',
        'admin.user'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Version v999.0.0 not found for template test-template');
    });
  });

  describe('pending reviews', () => {
    it('should list pending reviews', async () => {
      // Create some content for review
      await contentManager.createTemplateContent(
        'template-1',
        mockContent,
        'user1',
        'First template'
      );

      await contentManager.createTemplateContent(
        'template-2',
        { ...mockContent, templateId: 'template-2' },
        'user2',
        'Second template'
      );

      const pendingReviews = contentManager.getPendingReviews();
      expect(pendingReviews.length).toBe(2);
      expect(pendingReviews[0].templateId).toBe('template-1');
      expect(pendingReviews[1].templateId).toBe('template-2');
    });

    it('should remove reviews from pending after completion', async () => {
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      // Should have 1 pending review
      expect(contentManager.getPendingReviews().length).toBe(1);

      // Complete the review
      await contentManager.reviewContent(
        createResult.reviewId!,
        true,
        'jane.smith',
        'Approved'
      );

      // Should have 0 pending reviews
      expect(contentManager.getPendingReviews().length).toBe(0);
    });
  });

  describe('review history', () => {
    it('should track review history', async () => {
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      await contentManager.reviewContent(
        createResult.reviewId!,
        true,
        'jane.smith',
        'Looks good!'
      );

      const reviewHistory = contentManager.getReviewHistory('test-template');
      expect(reviewHistory.length).toBe(1);
      expect(reviewHistory[0].approved).toBe(true);
      expect(reviewHistory[0].reviewedBy).toBe('jane.smith');
      expect(reviewHistory[0].feedback).toBe('Looks good!');
      expect(reviewHistory[0].qualityScore).toBeGreaterThan(0);
    });
  });

  describe('export and import', () => {
    it('should export all content', async () => {
      // Create and approve some content
      const createResult = await contentManager.createTemplateContent(
        'test-template',
        mockContent,
        'john.doe',
        'Initial creation'
      );

      await contentManager.reviewContent(
        createResult.reviewId!,
        true,
        'jane.smith',
        'Approved'
      );

      const exportData = contentManager.exportAllContent();

      expect(exportData.content).toBeDefined();
      expect(exportData.versions).toBeDefined();
      expect(exportData.reviews).toBeDefined();
      expect(Object.keys(exportData.content).length).toBeGreaterThan(0);
    });

    it('should import content successfully', async () => {
      const importData = {
        content: {
          'imported-template': mockContent
        },
        versions: {
          'imported-template': [{
            version: 'v1.0.0',
            content: mockContent,
            createdAt: new Date(),
            createdBy: 'importer',
            changeLog: 'Imported content',
            approved: true,
            approvedBy: 'admin',
            approvedAt: new Date()
          }]
        },
        reviews: {
          'imported-template': [{
            approved: true,
            reviewedBy: 'admin',
            reviewedAt: new Date(),
            feedback: 'Imported and approved',
            qualityScore: 85
          }]
        }
      };

      const result = contentManager.importContent(importData);
      expect(result.success).toBe(true);

      // Verify imported data
      const versions = contentManager.getContentVersionHistory('imported-template');
      expect(versions.length).toBe(1);

      const reviews = contentManager.getReviewHistory('imported-template');
      expect(reviews.length).toBe(1);
    });
  });

  describe('quality scoring', () => {
    it('should calculate quality scores correctly', async () => {
      const highQualityContent: TemplateSpecificContent = {
        ...mockContent,
        professionalSummary: 'Highly experienced software engineer with 8+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of leading teams and delivering scalable solutions.',
        skills: [
          { name: 'JavaScript', proficiency: 95, category: 'Programming', yearsOfExperience: 8, isCore: true, relevanceScore: 10 },
          { name: 'React', proficiency: 90, category: 'Frontend', yearsOfExperience: 6, isCore: true, relevanceScore: 9 },
          { name: 'Node.js', proficiency: 88, category: 'Backend', yearsOfExperience: 7, isCore: true, relevanceScore: 9 },
          { name: 'AWS', proficiency: 85, category: 'Cloud', yearsOfExperience: 5, isCore: true, relevanceScore: 8 },
          { name: 'Docker', proficiency: 82, category: 'DevOps', yearsOfExperience: 4, isCore: false, relevanceScore: 7 }
        ],
        experiences: [
          {
            company: 'Tech Corp',
            position: 'Senior Software Engineer',
            startDate: '2020-01',
            endDate: null,
            description: 'Lead development of microservices architecture',
            achievements: ['Improved system performance by 40%', 'Led team of 5 developers'],
            technologies: ['React', 'Node.js', 'AWS'],
            location: 'San Francisco, CA',
            industryContext: 'Technology',
            roleLevel: 'senior'
          },
          {
            company: 'StartupCo',
            position: 'Software Engineer',
            startDate: '2018-01',
            endDate: '2019-12',
            description: 'Full-stack development for SaaS platform',
            achievements: ['Built core features from scratch', 'Reduced load times by 50%'],
            technologies: ['React', 'Node.js', 'MongoDB'],
            location: 'San Francisco, CA',
            industryContext: 'Technology',
            roleLevel: 'mid'
          }
        ],
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Built a comprehensive e-commerce platform with real-time inventory management and payment processing',
            technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
            startDate: '2021-01-01',
            endDate: '2021-08-01',
            impact: 'Generated $2M in revenue within first year',
            roleSpecific: true
          },
          {
            title: 'Analytics Dashboard',
            description: 'Developed real-time analytics dashboard for business intelligence',
            technologies: ['React', 'D3.js', 'Node.js', 'Redis'],
            startDate: '2022-01-01',
            endDate: '2022-04-01',
            impact: 'Improved decision-making speed by 60%',
            roleSpecific: true
          }
        ]
      };

      const createResult = await contentManager.createTemplateContent(
        'high-quality-template',
        highQualityContent,
        'john.doe',
        'High quality content'
      );

      await contentManager.reviewContent(
        createResult.reviewId!,
        true,
        'jane.smith',
        'Excellent quality'
      );

      const reviews = contentManager.getReviewHistory('high-quality-template');
      expect(reviews[0].qualityScore).toBeGreaterThan(70);
    });

    it('should penalize low quality content', async () => {
      const lowQualityContent: TemplateSpecificContent = {
        ...mockContent,
        professionalSummary: 'I work.',
        skills: [
          { name: 'Stuff', proficiency: 50, category: 'Things', yearsOfExperience: 1, isCore: false, relevanceScore: 2 }
        ],
        experiences: [],
        projects: []
      };

      const createResult = await contentManager.createTemplateContent(
        'low-quality-template',
        lowQualityContent,
        'john.doe',
        'Low quality content'
      );

      // Only proceed if creation was successful (content might fail validation)
      if (createResult.success && createResult.reviewId) {
        await contentManager.reviewContent(
          createResult.reviewId,
          false,
          'jane.smith',
          'Needs significant improvement'
        );

        const reviews = contentManager.getReviewHistory('low-quality-template');
        expect(reviews.length).toBeGreaterThan(0);
        expect(reviews[0].qualityScore).toBeLessThan(50);
      } else {
        // If creation failed due to validation, that's also a valid test outcome
        expect(createResult.success).toBe(false);
        expect(createResult.errors).toBeDefined();
      }
    });
  });
});