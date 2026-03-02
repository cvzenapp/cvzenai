import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateAnalyticsService, ABTest, ABTestVariant } from './templateAnalyticsService';
import { UserProfile } from './templateService';

describe('TemplateAnalyticsService', () => {
  let service: TemplateAnalyticsService;

  beforeEach(() => {
    service = new TemplateAnalyticsService();
  });

  describe('Template Usage Tracking', () => {
    it('should track template views correctly', async () => {
      const templateId = 'test-template-1';
      
      await service.trackTemplateView(templateId);
      await service.trackTemplateView(templateId);
      
      const analytics = await service.getTemplateAnalytics(templateId);
      expect(analytics?.views).toBe(2);
      expect(analytics?.templateId).toBe(templateId);
    });

    it('should track template selections and update conversion rate', async () => {
      const templateId = 'test-template-2';
      
      // Track views and selections
      await service.trackTemplateView(templateId);
      await service.trackTemplateView(templateId);
      await service.trackTemplateSelection(templateId);
      
      const analytics = await service.getTemplateAnalytics(templateId);
      expect(analytics?.views).toBe(2);
      expect(analytics?.selections).toBe(1);
      expect(analytics?.conversionRate).toBe(0.5);
    });

    it('should track template completions and update completion rate', async () => {
      const templateId = 'test-template-3';
      const timeSpent = 25; // minutes
      
      // Track full funnel
      await service.trackTemplateView(templateId);
      await service.trackTemplateSelection(templateId);
      await service.trackTemplateCompletion(templateId, timeSpent);
      
      const analytics = await service.getTemplateAnalytics(templateId);
      expect(analytics?.completions).toBe(1);
      expect(analytics?.completionRate).toBe(1.0);
      expect(analytics?.averageTimeSpent).toBe(timeSpent);
    });

    it('should track template customizations', async () => {
      const templateId = 'test-template-4';
      
      await service.trackTemplateCustomization(templateId);
      await service.trackTemplateCustomization(templateId);
      
      const analytics = await service.getTemplateAnalytics(templateId);
      expect(analytics?.customizations).toBe(2);
    });

    it('should update average time spent correctly with multiple completions', async () => {
      const templateId = 'test-template-5';
      
      await service.trackTemplateView(templateId);
      await service.trackTemplateSelection(templateId);
      await service.trackTemplateCompletion(templateId, 20);
      
      await service.trackTemplateView(templateId);
      await service.trackTemplateSelection(templateId);
      await service.trackTemplateCompletion(templateId, 30);
      
      const analytics = await service.getTemplateAnalytics(templateId);
      expect(analytics?.completions).toBe(2);
      expect(analytics?.averageTimeSpent).toBe(25); // (20 + 30) / 2
    });
  });

  describe('Performance Monitoring', () => {
    it('should track template loading performance', async () => {
      const templateId = 'perf-template-1';
      const loadingTime = 150; // milliseconds
      
      await service.trackTemplatePerformance(templateId, loadingTime);
      
      const metrics = await service.getTemplatePerformanceMetrics(templateId);
      expect(metrics?.loadingTime).toBe(loadingTime); // First time should be exact
      expect(metrics?.errorRate).toBe(0);
    });

    it('should track template errors and update error rate', async () => {
      const templateId = 'perf-template-2';
      const error = 'Template rendering failed';
      
      await service.trackTemplatePerformance(templateId, 100, error);
      
      const metrics = await service.getTemplatePerformanceMetrics(templateId);
      expect(metrics?.renderingErrors).toContain(error);
      expect(metrics?.errorRate).toBeGreaterThan(0);
    });

    it('should use moving average for loading time', async () => {
      const templateId = 'perf-template-3';
      
      await service.trackTemplatePerformance(templateId, 100);
      await service.trackTemplatePerformance(templateId, 200);
      
      const metrics = await service.getTemplatePerformanceMetrics(templateId);
      // Moving average: (100 * 0.8) + (200 * 0.2) = 80 + 40 = 120
      expect(metrics?.loadingTime).toBeCloseTo(120, 1);
    });
  });

  describe('Popularity Scoring', () => {
    it('should calculate popularity score based on multiple factors', async () => {
      const templateId = 'popular-template-1';
      
      // Generate some activity
      for (let i = 0; i < 10; i++) {
        await service.trackTemplateView(templateId);
      }
      for (let i = 0; i < 5; i++) {
        await service.trackTemplateSelection(templateId);
      }
      for (let i = 0; i < 3; i++) {
        await service.trackTemplateCompletion(templateId, 20);
      }
      await service.trackTemplateCustomization(templateId);
      
      const analytics = await service.getTemplateAnalytics(templateId);
      expect(analytics?.popularityScore).toBeGreaterThan(0);
      expect(analytics?.popularityScore).toBeLessThanOrEqual(100);
    });

    it('should return higher scores for more active templates', async () => {
      const template1 = 'template-low-activity';
      const template2 = 'template-high-activity';
      
      // Low activity template
      await service.trackTemplateView(template1);
      await service.trackTemplateSelection(template1);
      
      // High activity template
      for (let i = 0; i < 20; i++) {
        await service.trackTemplateView(template2);
      }
      for (let i = 0; i < 10; i++) {
        await service.trackTemplateSelection(template2);
      }
      for (let i = 0; i < 8; i++) {
        await service.trackTemplateCompletion(template2, 25);
      }
      
      const analytics1 = await service.getTemplateAnalytics(template1);
      const analytics2 = await service.getTemplateAnalytics(template2);
      
      expect(analytics2?.popularityScore).toBeGreaterThan(analytics1?.popularityScore || 0);
    });

    it('should get top performing templates in correct order', async () => {
      const templates = ['template-a', 'template-b', 'template-c'];
      
      // Create different activity levels
      for (let i = 0; i < templates.length; i++) {
        const templateId = templates[i];
        const activityLevel = (i + 1) * 5; // 5, 10, 15
        
        for (let j = 0; j < activityLevel; j++) {
          await service.trackTemplateView(templateId);
          if (j < activityLevel / 2) {
            await service.trackTemplateSelection(templateId);
          }
          if (j < activityLevel / 3) {
            await service.trackTemplateCompletion(templateId, 20);
          }
        }
      }
      
      const topTemplates = await service.getTopPerformingTemplates(3);
      expect(topTemplates).toHaveLength(3);
      
      // Should be ordered by popularity score (descending)
      expect(topTemplates[0].popularityScore).toBeGreaterThanOrEqual(topTemplates[1].popularityScore);
      expect(topTemplates[1].popularityScore).toBeGreaterThanOrEqual(topTemplates[2].popularityScore);
    });
  });

  describe('A/B Testing Framework', () => {
    it('should create A/B test with valid configuration', async () => {
      const testConfig = {
        name: 'Template Color Test',
        description: 'Testing different color schemes',
        hypothesis: 'Blue color scheme will increase conversions',
        variants: [
          {
            id: 'control',
            templateId: 'template-original',
            variantName: 'Original',
            description: 'Current template',
            isControl: true,
            trafficAllocation: 50,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
          {
            id: 'variant-a',
            templateId: 'template-blue',
            variantName: 'Blue Theme',
            description: 'Template with blue color scheme',
            isControl: false,
            trafficAllocation: 50,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
        ],
        targetAudience: {
          industries: ['technology'],
          experienceLevels: ['mid', 'senior'],
        },
        successMetrics: ['conversion_rate', 'completion_rate'],
        startDate: new Date(),
        status: 'active' as const,
      };

      const testId = await service.createABTest(testConfig);
      expect(testId).toBeTruthy();
      expect(testId).toMatch(/^ab_test_/);
    });

    it('should reject A/B test with invalid traffic allocation', async () => {
      const testConfig = {
        name: 'Invalid Test',
        description: 'Test with invalid allocation',
        hypothesis: 'This should fail',
        variants: [
          {
            id: 'control',
            templateId: 'template-1',
            variantName: 'Control',
            description: 'Control variant',
            isControl: true,
            trafficAllocation: 60, // Invalid: doesn't sum to 100
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
          {
            id: 'variant-a',
            templateId: 'template-2',
            variantName: 'Variant A',
            description: 'Test variant',
            isControl: false,
            trafficAllocation: 30, // Invalid: doesn't sum to 100
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
        ],
        targetAudience: {},
        successMetrics: ['conversion_rate'],
        startDate: new Date(),
        status: 'active' as const,
      };

      await expect(service.createABTest(testConfig)).rejects.toThrow('Traffic allocation must sum to 100%');
    });

    it('should assign users to variants deterministically', async () => {
      const testConfig = {
        name: 'User Assignment Test',
        description: 'Testing user assignment',
        hypothesis: 'Users should be assigned consistently',
        variants: [
          {
            id: 'control',
            templateId: 'template-control',
            variantName: 'Control',
            description: 'Control variant',
            isControl: true,
            trafficAllocation: 50,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
          {
            id: 'variant-a',
            templateId: 'template-variant',
            variantName: 'Variant A',
            description: 'Test variant',
            isControl: false,
            trafficAllocation: 50,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
        ],
        targetAudience: {},
        successMetrics: ['conversion_rate'],
        startDate: new Date(),
        status: 'active' as const,
      };

      const testId = await service.createABTest(testConfig);
      const userId = 'user-123';

      // Same user should get same variant consistently
      const assignment1 = await service.assignUserToVariant(testId, userId);
      const assignment2 = await service.assignUserToVariant(testId, userId);
      
      expect(assignment1?.id).toBe(assignment2?.id);
    });

    it('should respect target audience filtering', async () => {
      const testConfig = {
        name: 'Audience Filtering Test',
        description: 'Testing audience targeting',
        hypothesis: 'Only tech users should see this test',
        variants: [
          {
            id: 'control',
            templateId: 'template-tech',
            variantName: 'Tech Control',
            description: 'Control for tech users',
            isControl: true,
            trafficAllocation: 100,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
        ],
        targetAudience: {
          industries: ['technology'],
        },
        successMetrics: ['conversion_rate'],
        startDate: new Date(),
        status: 'active' as const,
      };

      const testId = await service.createABTest(testConfig);

      // Tech user should be included
      const techUser: UserProfile = { industry: 'technology', experienceLevel: 'mid' };
      const techAssignment = await service.assignUserToVariant(testId, 'tech-user', techUser);
      expect(techAssignment).toBeTruthy();

      // Non-tech user should be excluded
      const financeUser: UserProfile = { industry: 'finance', experienceLevel: 'mid' };
      const financeAssignment = await service.assignUserToVariant(testId, 'finance-user', financeUser);
      expect(financeAssignment).toBeNull();
    });

    it('should analyze A/B test results correctly', async () => {
      // Create test with some mock data
      const testConfig = {
        name: 'Results Analysis Test',
        description: 'Testing results analysis',
        hypothesis: 'Variant should outperform control',
        variants: [
          {
            id: 'control',
            templateId: 'results-control',
            variantName: 'Control',
            description: 'Control variant',
            isControl: true,
            trafficAllocation: 50,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
          {
            id: 'variant-a',
            templateId: 'results-variant',
            variantName: 'Variant A',
            description: 'Test variant',
            isControl: false,
            trafficAllocation: 50,
            metrics: {} as any,
            startDate: new Date(),
            status: 'active' as const,
          },
        ],
        targetAudience: {},
        successMetrics: ['conversion_rate', 'completion_rate'],
        startDate: new Date(),
        status: 'active' as const,
      };

      const testId = await service.createABTest(testConfig);

      // Generate some activity for both variants
      // Control: lower performance (30% conversion rate)
      for (let i = 0; i < 10; i++) {
        await service.trackTemplateView('results-control');
      }
      for (let i = 0; i < 3; i++) {
        await service.trackTemplateSelection('results-control');
      }
      for (let i = 0; i < 2; i++) {
        await service.trackTemplateCompletion('results-control', 20);
      }

      // Variant: higher performance (60% conversion rate)
      for (let i = 0; i < 10; i++) {
        await service.trackTemplateView('results-variant');
      }
      for (let i = 0; i < 6; i++) {
        await service.trackTemplateSelection('results-variant');
      }
      for (let i = 0; i < 5; i++) {
        await service.trackTemplateCompletion('results-variant', 20);
      }

      const results = await service.analyzeABTestResults(testId);
      
      expect(results.testId).toBe(testId);
      expect(results.metrics).toHaveProperty('control');
      expect(results.metrics).toHaveProperty('variant-a');
      expect(results.recommendations).toBeInstanceOf(Array);
      expect(results.recommendations.length).toBeGreaterThan(0);
      
      // Variant should have higher conversion rate
      const controlMetrics = results.metrics['control'];
      const variantMetrics = results.metrics['variant-a'];
      expect(variantMetrics.conversionRate).toBeGreaterThan(controlMetrics.conversionRate);
    });
  });

  describe('Analytics Retrieval', () => {
    it('should return null for non-existent template analytics', async () => {
      const analytics = await service.getTemplateAnalytics('non-existent-template');
      expect(analytics).toBeNull();
    });

    it('should return all template analytics', async () => {
      const templateIds = ['analytics-1', 'analytics-2', 'analytics-3'];
      
      // Generate some activity
      for (const templateId of templateIds) {
        await service.trackTemplateView(templateId);
        await service.trackTemplateSelection(templateId);
      }
      
      const allAnalytics = await service.getAllTemplateAnalytics();
      
      // Should include our test templates plus any initialized ones
      expect(allAnalytics.length).toBeGreaterThanOrEqual(templateIds.length);
      
      // Check that our templates are included
      const ourTemplateIds = allAnalytics.map(a => a.templateId);
      templateIds.forEach(id => {
        expect(ourTemplateIds).toContain(id);
      });
    });

    it('should return performance metrics for templates', async () => {
      const templateId = 'perf-analytics-1';
      
      await service.trackTemplatePerformance(templateId, 100);
      
      const metrics = await service.getTemplatePerformanceMetrics(templateId);
      expect(metrics).toBeTruthy();
      expect(metrics?.templateId).toBe(templateId);
      expect(metrics?.loadingTime).toBe(100);
    });
  });
});