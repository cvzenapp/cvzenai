import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { 
  useTemplateAnalytics, 
  useABTesting, 
  usePopularityScoring,
  useTemplatePerformance,
  useRealTimeAnalytics
} from './useTemplateAnalytics';
import { templateAnalyticsService } from '../services/templateAnalyticsService';

// Mock the analytics service
vi.mock('../services/templateAnalyticsService', () => ({
  templateAnalyticsService: {
    getTemplateAnalytics: vi.fn(),
    getTemplatePerformanceMetrics: vi.fn(),
    getAllTemplateAnalytics: vi.fn(),
    getTopPerformingTemplates: vi.fn(),
    trackTemplateView: vi.fn(),
    trackTemplateSelection: vi.fn(),
    trackTemplateCompletion: vi.fn(),
    trackTemplateCustomization: vi.fn(),
    trackTemplatePerformance: vi.fn(),
    getActiveABTests: vi.fn(),
    getABTestForTemplate: vi.fn(),
    createABTest: vi.fn(),
    assignUserToVariant: vi.fn(),
    analyzeABTestResults: vi.fn(),
    calculatePopularityScore: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useTemplateAnalytics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch template analytics for specific template', async () => {
    const mockAnalytics = {
      templateId: 'test-template',
      views: 100,
      selections: 50,
      completions: 25,
      customizations: 10,
      averageTimeSpent: 20,
      conversionRate: 0.5,
      completionRate: 0.5,
      popularityScore: 75,
      lastUpdated: new Date(),
    };

    vi.mocked(templateAnalyticsService.getTemplateAnalytics).mockResolvedValue(mockAnalytics);

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.analytics).toEqual(mockAnalytics);
    });

    expect(templateAnalyticsService.getTemplateAnalytics).toHaveBeenCalledWith('test-template');
  });

  it('should not fetch analytics when templateId is not provided', () => {
    renderHook(
      () => useTemplateAnalytics(),
      { wrapper: createWrapper() }
    );

    expect(templateAnalyticsService.getTemplateAnalytics).not.toHaveBeenCalled();
  });

  it('should fetch performance metrics for template', async () => {
    const mockMetrics = {
      templateId: 'test-template',
      loadingTime: 150,
      errorRate: 0.01,
      renderingErrors: [],
      userEngagement: {
        bounceRate: 0.2,
        timeOnTemplate: 300,
        customizationRate: 0.3,
      },
    };

    vi.mocked(templateAnalyticsService.getTemplatePerformanceMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.performanceMetrics).toEqual(mockMetrics);
    });

    expect(templateAnalyticsService.getTemplatePerformanceMetrics).toHaveBeenCalledWith('test-template');
  });

  it('should fetch all template analytics', async () => {
    const mockAllAnalytics = [
      { templateId: 'template-1', views: 100, selections: 50, completions: 25, customizations: 10, averageTimeSpent: 20, conversionRate: 0.5, completionRate: 0.5, popularityScore: 75, lastUpdated: new Date() },
      { templateId: 'template-2', views: 80, selections: 40, completions: 20, customizations: 8, averageTimeSpent: 18, conversionRate: 0.5, completionRate: 0.5, popularityScore: 65, lastUpdated: new Date() },
    ];

    vi.mocked(templateAnalyticsService.getAllTemplateAnalytics).mockResolvedValue(mockAllAnalytics);

    const { result } = renderHook(
      () => useTemplateAnalytics(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.allAnalytics).toEqual(mockAllAnalytics);
    });

    expect(templateAnalyticsService.getAllTemplateAnalytics).toHaveBeenCalled();
  });

  it('should fetch top performing templates', async () => {
    const mockTopTemplates = [
      { templateId: 'top-template-1', views: 200, selections: 100, completions: 80, customizations: 20, averageTimeSpent: 25, conversionRate: 0.5, completionRate: 0.8, popularityScore: 90, lastUpdated: new Date() },
      { templateId: 'top-template-2', views: 150, selections: 75, completions: 60, customizations: 15, averageTimeSpent: 22, conversionRate: 0.5, completionRate: 0.8, popularityScore: 85, lastUpdated: new Date() },
    ];

    vi.mocked(templateAnalyticsService.getTopPerformingTemplates).mockResolvedValue(mockTopTemplates);

    const { result } = renderHook(
      () => useTemplateAnalytics(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.topTemplates).toEqual(mockTopTemplates);
    });

    expect(templateAnalyticsService.getTopPerformingTemplates).toHaveBeenCalledWith(10);
  });

  it('should track template view', async () => {
    vi.mocked(templateAnalyticsService.trackTemplateView).mockResolvedValue();

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.trackView({ templateId: 'test-template' });
    });

    expect(templateAnalyticsService.trackTemplateView).toHaveBeenCalledWith('test-template', undefined);
  });

  it('should track template selection with user profile', async () => {
    vi.mocked(templateAnalyticsService.trackTemplateSelection).mockResolvedValue();

    const userProfile = { industry: 'technology', experienceLevel: 'mid' as const };

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.trackSelection({ templateId: 'test-template', userProfile });
    });

    expect(templateAnalyticsService.trackTemplateSelection).toHaveBeenCalledWith('test-template', userProfile);
  });

  it('should track template completion', async () => {
    vi.mocked(templateAnalyticsService.trackTemplateCompletion).mockResolvedValue();

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.trackCompletion({ templateId: 'test-template', timeSpent: 30 });
    });

    expect(templateAnalyticsService.trackTemplateCompletion).toHaveBeenCalledWith('test-template', 30, undefined);
  });

  it('should track template customization', async () => {
    vi.mocked(templateAnalyticsService.trackTemplateCustomization).mockResolvedValue();

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.trackCustomization({ templateId: 'test-template' });
    });

    expect(templateAnalyticsService.trackTemplateCustomization).toHaveBeenCalledWith('test-template', undefined);
  });

  it('should track template performance', async () => {
    vi.mocked(templateAnalyticsService.trackTemplatePerformance).mockResolvedValue();

    const { result } = renderHook(
      () => useTemplateAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.trackPerformance({ templateId: 'test-template', loadingTime: 200, error: 'Render error' });
    });

    expect(templateAnalyticsService.trackTemplatePerformance).toHaveBeenCalledWith('test-template', 200, 'Render error');
  });
});

describe('useABTesting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch active A/B tests', async () => {
    const mockActiveTests = [
      {
        id: 'test-1',
        name: 'Color Test',
        description: 'Testing color schemes',
        hypothesis: 'Blue will perform better',
        variants: [],
        targetAudience: {},
        successMetrics: ['conversion_rate'],
        startDate: new Date(),
        status: 'active' as const,
      },
    ];

    vi.mocked(templateAnalyticsService.getActiveABTests).mockResolvedValue(mockActiveTests);

    const { result } = renderHook(
      () => useABTesting(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.activeTests).toEqual(mockActiveTests);
    });

    expect(templateAnalyticsService.getActiveABTests).toHaveBeenCalled();
  });

  it('should create A/B test', async () => {
    const testId = 'new-test-123';
    vi.mocked(templateAnalyticsService.createABTest).mockResolvedValue(testId);

    const testConfig = {
      name: 'New Test',
      description: 'Testing new feature',
      hypothesis: 'New feature will improve conversions',
      variants: [],
      targetAudience: {},
      successMetrics: ['conversion_rate'],
      startDate: new Date(),
      status: 'active' as const,
    };

    const { result } = renderHook(
      () => useABTesting(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.createTest(testConfig);
    });

    expect(templateAnalyticsService.createABTest).toHaveBeenCalledWith(testConfig);
  });

  it('should get test for template', async () => {
    const mockTest = {
      id: 'template-test-1',
      name: 'Template Test',
      description: 'Testing template variations',
      hypothesis: 'Variant will outperform control',
      variants: [],
      targetAudience: {},
      successMetrics: ['conversion_rate'],
      startDate: new Date(),
      status: 'active' as const,
    };

    vi.mocked(templateAnalyticsService.getABTestForTemplate).mockResolvedValue(mockTest);

    const { result } = renderHook(
      () => useABTesting(),
      { wrapper: createWrapper() }
    );

    const test = await result.current.getTestForTemplate('test-template');
    expect(test).toEqual(mockTest);
    expect(templateAnalyticsService.getABTestForTemplate).toHaveBeenCalledWith('test-template');
  });

  it('should assign user to variant', async () => {
    const mockVariant = {
      id: 'variant-a',
      templateId: 'test-template',
      variantName: 'Variant A',
      description: 'Test variant',
      isControl: false,
      trafficAllocation: 50,
      metrics: {} as any,
      startDate: new Date(),
      status: 'active' as const,
    };

    vi.mocked(templateAnalyticsService.assignUserToVariant).mockResolvedValue(mockVariant);

    const { result } = renderHook(
      () => useABTesting(),
      { wrapper: createWrapper() }
    );

    const variant = await result.current.assignUserToVariant('test-123', 'user-456');
    expect(variant).toEqual(mockVariant);
    expect(templateAnalyticsService.assignUserToVariant).toHaveBeenCalledWith('test-123', 'user-456', undefined);
  });

  it('should analyze test results', async () => {
    const mockResults = {
      testId: 'test-123',
      winningVariant: 'variant-a',
      confidenceLevel: 85,
      statisticalSignificance: true,
      metrics: {},
      recommendations: ['Deploy winning variant'],
      generatedAt: new Date(),
    };

    vi.mocked(templateAnalyticsService.analyzeABTestResults).mockResolvedValue(mockResults);

    const { result } = renderHook(
      () => useABTesting(),
      { wrapper: createWrapper() }
    );

    const results = await result.current.analyzeResults('test-123');
    expect(results).toEqual(mockResults);
    expect(templateAnalyticsService.analyzeABTestResults).toHaveBeenCalledWith('test-123');
  });
});

describe('usePopularityScoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide default popularity factors', () => {
    const { result } = renderHook(() => usePopularityScoring());

    expect(result.current.popularityFactors).toEqual({
      viewWeight: 0.1,
      selectionWeight: 0.25,
      completionWeight: 0.3,
      customizationWeight: 0.15,
      timeSpentWeight: 0.1,
      recencyWeight: 0.05,
      industryRelevanceWeight: 0.05,
    });
  });

  it('should update popularity factors', () => {
    const { result } = renderHook(() => usePopularityScoring());

    act(() => {
      result.current.updateFactors({ viewWeight: 0.2, selectionWeight: 0.3 });
    });

    expect(result.current.popularityFactors.viewWeight).toBe(0.2);
    expect(result.current.popularityFactors.selectionWeight).toBe(0.3);
    expect(result.current.popularityFactors.completionWeight).toBe(0.3); // Unchanged
  });

  it('should calculate popularity score', () => {
    const mockScore = 85;
    vi.mocked(templateAnalyticsService.calculatePopularityScore).mockReturnValue(mockScore);

    const { result } = renderHook(() => usePopularityScoring());

    const score = result.current.calculateScore('test-template');
    expect(score).toBe(mockScore);
    expect(templateAnalyticsService.calculatePopularityScore).toHaveBeenCalledWith('test-template', undefined);
  });
});

describe('useTemplatePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty performance data', () => {
    const { result } = renderHook(() => useTemplatePerformance());

    expect(result.current.performanceData).toEqual({
      loadingTimes: [],
      errorCount: 0,
    });
    expect(result.current.averageLoadingTime).toBe(0);
  });

  it('should record loading times', () => {
    const { result } = renderHook(() => useTemplatePerformance('test-template'));

    act(() => {
      result.current.recordLoadingTime(100);
      result.current.recordLoadingTime(200);
    });

    expect(result.current.performanceData.loadingTimes).toEqual([100, 200]);
    expect(result.current.averageLoadingTime).toBe(150);
  });

  it('should record errors', () => {
    const { result } = renderHook(() => useTemplatePerformance('test-template'));

    act(() => {
      result.current.recordError('Render failed');
    });

    expect(result.current.performanceData.errorCount).toBe(1);
    expect(result.current.performanceData.lastError).toBe('Render failed');
  });

  it('should limit loading times to last 10 measurements', () => {
    const { result } = renderHook(() => useTemplatePerformance());

    act(() => {
      // Record 15 measurements
      for (let i = 1; i <= 15; i++) {
        result.current.recordLoadingTime(i * 10);
      }
    });

    expect(result.current.performanceData.loadingTimes).toHaveLength(10);
    expect(result.current.performanceData.loadingTimes[0]).toBe(60); // 6th measurement
    expect(result.current.performanceData.loadingTimes[9]).toBe(150); // 15th measurement
  });

  it('should track performance with analytics service when templateId provided', () => {
    vi.mocked(templateAnalyticsService.trackTemplatePerformance).mockResolvedValue();

    const { result } = renderHook(() => useTemplatePerformance('test-template'));

    act(() => {
      result.current.recordLoadingTime(100);
      result.current.recordError('Test error');
    });

    expect(templateAnalyticsService.trackTemplatePerformance).toHaveBeenCalledWith('test-template', 100);
    expect(templateAnalyticsService.trackTemplatePerformance).toHaveBeenCalledWith('test-template', 0, 'Test error');
  });
});

describe('useRealTimeAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(templateAnalyticsService.trackTemplateView).mockResolvedValue();
    vi.mocked(templateAnalyticsService.trackTemplateSelection).mockResolvedValue();
    vi.mocked(templateAnalyticsService.trackTemplateCompletion).mockResolvedValue();
    vi.mocked(templateAnalyticsService.trackTemplateCustomization).mockResolvedValue();
  });

  it('should auto-track view when enabled', () => {
    renderHook(
      () => useRealTimeAnalytics('test-template', true),
      { wrapper: createWrapper() }
    );

    expect(templateAnalyticsService.trackTemplateView).toHaveBeenCalledWith('test-template');
  });

  it('should not auto-track view when disabled', () => {
    renderHook(
      () => useRealTimeAnalytics('test-template', false),
      { wrapper: createWrapper() }
    );

    expect(templateAnalyticsService.trackTemplateView).not.toHaveBeenCalled();
  });

  it('should track interactions and increment counter', () => {
    const { result } = renderHook(
      () => useRealTimeAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    expect(result.current.interactions).toBe(0);

    act(() => {
      result.current.recordInteraction();
      result.current.recordInteraction();
    });

    expect(result.current.interactions).toBe(2);
  });

  it('should record selection and track with service', () => {
    const userProfile = { industry: 'technology', experienceLevel: 'mid' as const };

    const { result } = renderHook(
      () => useRealTimeAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.recordSelection(userProfile);
    });

    expect(templateAnalyticsService.trackTemplateSelection).toHaveBeenCalledWith('test-template', userProfile);
    expect(result.current.interactions).toBe(1);
  });

  it('should record completion with calculated time spent', () => {
    const userProfile = { industry: 'technology', experienceLevel: 'mid' as const };

    const { result } = renderHook(
      () => useRealTimeAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.recordCompletion(userProfile);
    });

    expect(templateAnalyticsService.trackTemplateCompletion).toHaveBeenCalledWith(
      'test-template',
      expect.any(Number), // time spent in minutes
      userProfile
    );
    expect(result.current.interactions).toBe(1);
  });

  it('should record customization', () => {
    const userProfile = { industry: 'technology', experienceLevel: 'mid' as const };

    const { result } = renderHook(
      () => useRealTimeAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.recordCustomization(userProfile);
    });

    expect(templateAnalyticsService.trackTemplateCustomization).toHaveBeenCalledWith('test-template', userProfile);
    expect(result.current.interactions).toBe(1);
  });

  it('should calculate time spent', () => {
    const { result } = renderHook(
      () => useRealTimeAnalytics('test-template'),
      { wrapper: createWrapper() }
    );

    expect(result.current.timeSpent).toBeGreaterThanOrEqual(0);
    expect(typeof result.current.timeSpent).toBe('number');
  });
});