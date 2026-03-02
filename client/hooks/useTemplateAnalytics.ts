import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  templateAnalyticsService, 
  TemplateAnalytics, 
  TemplatePerformanceMetrics,
  ABTest,
  ABTestResults,
  ABTestVariant
} from '../services/templateAnalyticsService';
import { UserProfile } from '../services/templateService';

// Hook for template analytics data
export function useTemplateAnalytics(templateId?: string) {
  const queryClient = useQueryClient();

  // Get analytics for a specific template
  const templateAnalytics = useQuery({
    queryKey: ['template-analytics', templateId],
    queryFn: () => templateId ? templateAnalyticsService.getTemplateAnalytics(templateId) : null,
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get performance metrics for a specific template
  const performanceMetrics = useQuery({
    queryKey: ['template-performance', templateId],
    queryFn: () => templateId ? templateAnalyticsService.getTemplatePerformanceMetrics(templateId) : null,
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });

  // Get all template analytics
  const allAnalytics = useQuery({
    queryKey: ['all-template-analytics'],
    queryFn: () => templateAnalyticsService.getAllTemplateAnalytics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get top performing templates
  const topTemplates = useQuery({
    queryKey: ['top-templates'],
    queryFn: () => templateAnalyticsService.getTopPerformingTemplates(10),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Mutation for tracking template view
  const trackView = useMutation({
    mutationFn: ({ templateId, userProfile }: { templateId: string; userProfile?: UserProfile }) =>
      templateAnalyticsService.trackTemplateView(templateId, userProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['all-template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['top-templates'] });
    },
  });

  // Mutation for tracking template selection
  const trackSelection = useMutation({
    mutationFn: ({ templateId, userProfile }: { templateId: string; userProfile?: UserProfile }) =>
      templateAnalyticsService.trackTemplateSelection(templateId, userProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['all-template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['top-templates'] });
    },
  });

  // Mutation for tracking template completion
  const trackCompletion = useMutation({
    mutationFn: ({ templateId, timeSpent, userProfile }: { 
      templateId: string; 
      timeSpent: number; 
      userProfile?: UserProfile 
    }) => templateAnalyticsService.trackTemplateCompletion(templateId, timeSpent, userProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['all-template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['top-templates'] });
    },
  });

  // Mutation for tracking template customization
  const trackCustomization = useMutation({
    mutationFn: ({ templateId, userProfile }: { templateId: string; userProfile?: UserProfile }) =>
      templateAnalyticsService.trackTemplateCustomization(templateId, userProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['all-template-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['top-templates'] });
    },
  });

  // Mutation for tracking template performance
  const trackPerformance = useMutation({
    mutationFn: ({ templateId, loadingTime, error }: { 
      templateId: string; 
      loadingTime: number; 
      error?: string 
    }) => templateAnalyticsService.trackTemplatePerformance(templateId, loadingTime, error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-performance'] });
    },
  });

  return {
    // Data
    analytics: templateAnalytics.data,
    performanceMetrics: performanceMetrics.data,
    allAnalytics: allAnalytics.data,
    topTemplates: topTemplates.data,
    
    // Loading states
    isLoading: templateAnalytics.isLoading || performanceMetrics.isLoading,
    isLoadingAll: allAnalytics.isLoading,
    isLoadingTop: topTemplates.isLoading,
    
    // Error states
    error: templateAnalytics.error || performanceMetrics.error,
    
    // Mutations
    trackView: trackView.mutate,
    trackSelection: trackSelection.mutate,
    trackCompletion: trackCompletion.mutate,
    trackCustomization: trackCustomization.mutate,
    trackPerformance: trackPerformance.mutate,
    
    // Mutation states
    isTracking: trackView.isPending || trackSelection.isPending || 
                trackCompletion.isPending || trackCustomization.isPending ||
                trackPerformance.isPending,
  };
}

// Hook for A/B testing functionality
export function useABTesting() {
  const queryClient = useQueryClient();

  // Get active A/B tests
  const activeTests = useQuery({
    queryKey: ['active-ab-tests'],
    queryFn: () => templateAnalyticsService.getActiveABTests(),
    staleTime: 5 * 60 * 1000,
  });

  // Get A/B test for specific template
  const getTestForTemplate = useCallback(async (templateId: string) => {
    return templateAnalyticsService.getABTestForTemplate(templateId);
  }, []);

  // Mutation for creating A/B test
  const createTest = useMutation({
    mutationFn: (testConfig: Omit<ABTest, 'id'>) =>
      templateAnalyticsService.createABTest(testConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-ab-tests'] });
    },
  });

  // Function to assign user to variant
  const assignUserToVariant = useCallback(async (
    testId: string, 
    userId: string, 
    userProfile?: UserProfile
  ) => {
    return templateAnalyticsService.assignUserToVariant(testId, userId, userProfile);
  }, []);

  // Function to analyze test results
  const analyzeResults = useCallback(async (testId: string) => {
    return templateAnalyticsService.analyzeABTestResults(testId);
  }, []);

  return {
    // Data
    activeTests: activeTests.data,
    
    // Loading states
    isLoading: activeTests.isLoading,
    
    // Error states
    error: activeTests.error,
    
    // Functions
    getTestForTemplate,
    assignUserToVariant,
    analyzeResults,
    
    // Mutations
    createTest: createTest.mutate,
    isCreatingTest: createTest.isPending,
    createTestError: createTest.error,
  };
}

// Hook for popularity scoring
export function usePopularityScoring() {
  const [popularityFactors, setPopularityFactors] = useState({
    viewWeight: 0.1,
    selectionWeight: 0.25,
    completionWeight: 0.3,
    customizationWeight: 0.15,
    timeSpentWeight: 0.1,
    recencyWeight: 0.05,
    industryRelevanceWeight: 0.05,
  });

  const calculateScore = useCallback((templateId: string, userProfile?: UserProfile) => {
    return templateAnalyticsService.calculatePopularityScore(templateId, userProfile);
  }, []);

  const updateFactors = useCallback((newFactors: Partial<typeof popularityFactors>) => {
    setPopularityFactors(prev => ({ ...prev, ...newFactors }));
  }, []);

  return {
    popularityFactors,
    calculateScore,
    updateFactors,
  };
}

// Hook for template performance monitoring
export function useTemplatePerformance(templateId?: string) {
  const [performanceData, setPerformanceData] = useState<{
    loadingTimes: number[];
    errorCount: number;
    lastError?: string;
  }>({
    loadingTimes: [],
    errorCount: 0,
  });

  const recordLoadingTime = useCallback((time: number) => {
    setPerformanceData(prev => ({
      ...prev,
      loadingTimes: [...prev.loadingTimes.slice(-9), time], // Keep last 10 measurements
    }));

    if (templateId) {
      templateAnalyticsService.trackTemplatePerformance(templateId, time);
    }
  }, [templateId]);

  const recordError = useCallback((error: string) => {
    setPerformanceData(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastError: error,
    }));

    if (templateId) {
      templateAnalyticsService.trackTemplatePerformance(templateId, 0, error);
    }
  }, [templateId]);

  const averageLoadingTime = performanceData.loadingTimes.length > 0
    ? performanceData.loadingTimes.reduce((sum, time) => sum + time, 0) / performanceData.loadingTimes.length
    : 0;

  return {
    performanceData,
    averageLoadingTime,
    recordLoadingTime,
    recordError,
  };
}

// Hook for real-time analytics updates
export function useRealTimeAnalytics(templateId: string, enabled: boolean = true) {
  const [startTime] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);
  const { trackView, trackSelection, trackCompletion, trackCustomization } = useTemplateAnalytics(templateId);

  // Auto-track view when component mounts
  useEffect(() => {
    if (enabled && templateId) {
      trackView({ templateId });
    }
  }, [templateId, enabled, trackView]);

  // Track interactions
  const recordInteraction = useCallback(() => {
    setInteractions(prev => prev + 1);
  }, []);

  // Track selection
  const recordSelection = useCallback((userProfile?: UserProfile) => {
    trackSelection({ templateId, userProfile });
    recordInteraction();
  }, [templateId, trackSelection, recordInteraction]);

  // Track completion
  const recordCompletion = useCallback((userProfile?: UserProfile) => {
    const timeSpent = (Date.now() - startTime) / (1000 * 60); // Convert to minutes
    trackCompletion({ templateId, timeSpent, userProfile });
    recordInteraction();
  }, [templateId, startTime, trackCompletion, recordInteraction]);

  // Track customization
  const recordCustomization = useCallback((userProfile?: UserProfile) => {
    trackCustomization({ templateId, userProfile });
    recordInteraction();
  }, [templateId, trackCustomization, recordInteraction]);

  const timeSpent = (Date.now() - startTime) / 1000; // in seconds

  return {
    timeSpent,
    interactions,
    recordSelection,
    recordCompletion,
    recordCustomization,
    recordInteraction,
  };
}