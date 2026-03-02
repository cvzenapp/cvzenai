import { TemplateConfig, TemplateUsageRecord, UserProfile } from './templateService';

// Template analytics interfaces
export interface TemplateAnalytics {
  templateId: string;
  views: number;
  selections: number;
  completions: number;
  customizations: number;
  averageTimeSpent: number; // in minutes
  conversionRate: number; // selections / views
  completionRate: number; // completions / selections
  popularityScore: number;
  lastUpdated: Date;
}

export interface TemplatePerformanceMetrics {
  templateId: string;
  loadingTime: number; // in milliseconds
  errorRate: number; // percentage
  renderingErrors: string[];
  userEngagement: {
    bounceRate: number;
    timeOnTemplate: number;
    customizationRate: number;
  };
}

export interface ABTestVariant {
  id: string;
  templateId: string;
  variantName: string;
  description: string;
  isControl: boolean;
  trafficAllocation: number; // percentage 0-100
  metrics: TemplateAnalytics;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABTestVariant[];
  targetAudience: {
    industries?: string[];
    experienceLevels?: string[];
    userSegments?: string[];
  };
  successMetrics: string[];
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
  results?: ABTestResults;
}

export interface ABTestResults {
  testId: string;
  winningVariant?: string;
  confidenceLevel: number;
  statisticalSignificance: boolean;
  metrics: {
    [variantId: string]: {
      conversionRate: number;
      completionRate: number;
      userSatisfaction: number;
      performanceScore: number;
    };
  };
  recommendations: string[];
  generatedAt: Date;
}

export interface PopularityFactors {
  viewWeight: number;
  selectionWeight: number;
  completionWeight: number;
  customizationWeight: number;
  timeSpentWeight: number;
  recencyWeight: number;
  industryRelevanceWeight: number;
}

// Template Analytics Service
export class TemplateAnalyticsService {
  private analytics: Map<string, TemplateAnalytics> = new Map();
  private performanceMetrics: Map<string, TemplatePerformanceMetrics> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  
  // Default popularity scoring weights
  private popularityFactors: PopularityFactors = {
    viewWeight: 0.1,
    selectionWeight: 0.25,
    completionWeight: 0.3,
    customizationWeight: 0.15,
    timeSpentWeight: 0.1,
    recencyWeight: 0.05,
    industryRelevanceWeight: 0.05,
  };

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics(): void {
    // Initialize with sample data for existing templates
    const sampleTemplates = [
      'tech-modern-1', 'tech-minimal-1', 'design-portfolio-1', 
      'management-executive-1', 'academic-research-1', 'marketing-creative-1'
    ];

    sampleTemplates.forEach(templateId => {
      this.analytics.set(templateId, {
        templateId,
        views: Math.floor(Math.random() * 1000) + 100,
        selections: Math.floor(Math.random() * 200) + 20,
        completions: Math.floor(Math.random() * 100) + 10,
        customizations: Math.floor(Math.random() * 50) + 5,
        averageTimeSpent: Math.floor(Math.random() * 30) + 10,
        conversionRate: 0,
        completionRate: 0,
        popularityScore: 0,
        lastUpdated: new Date(),
      });
    });

    this.updateCalculatedMetrics();
  }

  // Track template usage events
  async trackTemplateView(templateId: string, userProfile?: UserProfile): Promise<void> {
    const analytics = this.getOrCreateAnalytics(templateId);
    analytics.views++;
    analytics.lastUpdated = new Date();
    
    this.updatePopularityScore(templateId);
    await this.persistAnalytics(templateId, analytics);
  }

  async trackTemplateSelection(templateId: string, userProfile?: UserProfile): Promise<void> {
    const analytics = this.getOrCreateAnalytics(templateId);
    analytics.selections++;
    analytics.lastUpdated = new Date();
    
    this.updateCalculatedMetrics(templateId);
    this.updatePopularityScore(templateId);
    await this.persistAnalytics(templateId, analytics);
  }

  async trackTemplateCompletion(templateId: string, timeSpent: number, userProfile?: UserProfile): Promise<void> {
    const analytics = this.getOrCreateAnalytics(templateId);
    analytics.completions++;
    
    // Update average time spent using weighted average
    const totalTime = analytics.averageTimeSpent * (analytics.completions - 1) + timeSpent;
    analytics.averageTimeSpent = totalTime / analytics.completions;
    analytics.lastUpdated = new Date();
    
    this.updateCalculatedMetrics(templateId);
    this.updatePopularityScore(templateId);
    await this.persistAnalytics(templateId, analytics);
  }

  async trackTemplateCustomization(templateId: string, userProfile?: UserProfile): Promise<void> {
    const analytics = this.getOrCreateAnalytics(templateId);
    analytics.customizations++;
    analytics.lastUpdated = new Date();
    
    this.updatePopularityScore(templateId);
    await this.persistAnalytics(templateId, analytics);
  }

  // Performance monitoring
  async trackTemplatePerformance(templateId: string, loadingTime: number, error?: string): Promise<void> {
    const metrics = this.getOrCreatePerformanceMetrics(templateId);
    
    // Update loading time with moving average (only if we have previous data)
    if (metrics.loadingTime === 0) {
      metrics.loadingTime = loadingTime;
    } else {
      metrics.loadingTime = (metrics.loadingTime * 0.8) + (loadingTime * 0.2);
    }
    
    if (error) {
      metrics.renderingErrors.push(error);
      metrics.errorRate = Math.min(metrics.errorRate + 0.01, 1.0);
    } else {
      metrics.errorRate = Math.max(metrics.errorRate - 0.001, 0);
    }
    
    await this.persistPerformanceMetrics(templateId, metrics);
  }

  // Popularity scoring system
  calculatePopularityScore(templateId: string, userProfile?: UserProfile): number {
    const analytics = this.analytics.get(templateId);
    if (!analytics) return 0;

    const factors = this.popularityFactors;
    let score = 0;

    // Base metrics scoring
    score += analytics.views * factors.viewWeight;
    score += analytics.selections * factors.selectionWeight;
    score += analytics.completions * factors.completionWeight;
    score += analytics.customizations * factors.customizationWeight;
    score += (analytics.averageTimeSpent / 60) * factors.timeSpentWeight; // Convert to hours

    // Recency factor (boost recent activity)
    const daysSinceUpdate = (Date.now() - analytics.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 1 - (daysSinceUpdate / 30)); // Decay over 30 days
    score += recencyBoost * factors.recencyWeight * 100;

    // Industry relevance (if user profile provided)
    if (userProfile?.industry) {
      // This would be enhanced with actual template-industry matching logic
      score += factors.industryRelevanceWeight * 50;
    }

    // Normalize score (0-100 scale)
    return Math.min(Math.max(score, 0), 100);
  }

  updatePopularityScore(templateId: string): void {
    const analytics = this.getOrCreateAnalytics(templateId);
    analytics.popularityScore = this.calculatePopularityScore(templateId);
  }

  // A/B Testing Framework
  async createABTest(test: Omit<ABTest, 'id'>): Promise<string> {
    const testId = `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const abTest: ABTest = {
      id: testId,
      ...test,
    };

    // Validate traffic allocation
    const totalAllocation = abTest.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Traffic allocation must sum to 100%');
    }

    this.abTests.set(testId, abTest);
    await this.persistABTest(testId, abTest);
    
    return testId;
  }

  async getActiveABTests(): Promise<ABTest[]> {
    return Array.from(this.abTests.values()).filter(test => test.status === 'active');
  }

  async getABTestForTemplate(templateId: string): Promise<ABTest | null> {
    const activeTests = await this.getActiveABTests();
    return activeTests.find(test => 
      test.variants.some(variant => variant.templateId === templateId)
    ) || null;
  }

  async assignUserToVariant(testId: string, userId: string, userProfile?: UserProfile): Promise<ABTestVariant | null> {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'active') return null;

    // Check if user matches target audience
    if (!this.matchesTargetAudience(userProfile, test.targetAudience)) {
      return null;
    }

    // Deterministic assignment based on user ID
    const hash = this.hashString(userId + testId);
    const bucket = hash % 100;
    
    let cumulativeAllocation = 0;
    for (const variant of test.variants) {
      cumulativeAllocation += variant.trafficAllocation;
      if (bucket < cumulativeAllocation) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  async analyzeABTestResults(testId: string): Promise<ABTestResults> {
    const test = this.abTests.get(testId);
    if (!test) throw new Error('Test not found');

    const results: ABTestResults = {
      testId,
      confidenceLevel: 0,
      statisticalSignificance: false,
      metrics: {},
      recommendations: [],
      generatedAt: new Date(),
    };

    // Calculate metrics for each variant
    for (const variant of test.variants) {
      const analytics = this.analytics.get(variant.templateId);
      if (analytics) {
        results.metrics[variant.id] = {
          conversionRate: analytics.conversionRate,
          completionRate: analytics.completionRate,
          userSatisfaction: this.calculateUserSatisfaction(variant.templateId),
          performanceScore: this.calculatePerformanceScore(variant.templateId),
        };
      }
    }

    // Determine winning variant (simplified statistical analysis)
    const variantMetrics = Object.entries(results.metrics);
    if (variantMetrics.length >= 2) {
      const sortedByConversion = variantMetrics.sort((a, b) => b[1].conversionRate - a[1].conversionRate);
      results.winningVariant = sortedByConversion[0][0];
      
      // Simple confidence calculation (would be more sophisticated in production)
      const winner = sortedByConversion[0][1];
      const runnerUp = sortedByConversion[1][1];
      const improvement = (winner.conversionRate - runnerUp.conversionRate) / runnerUp.conversionRate;
      
      results.confidenceLevel = Math.min(improvement * 100, 95);
      results.statisticalSignificance = results.confidenceLevel > 80;
    }

    // Generate recommendations
    results.recommendations = this.generateABTestRecommendations(results);

    return results;
  }

  // Analytics retrieval methods
  async getTemplateAnalytics(templateId: string): Promise<TemplateAnalytics | null> {
    return this.analytics.get(templateId) || null;
  }

  async getAllTemplateAnalytics(): Promise<TemplateAnalytics[]> {
    return Array.from(this.analytics.values());
  }

  async getTopPerformingTemplates(limit: number = 10): Promise<TemplateAnalytics[]> {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }

  async getTemplatePerformanceMetrics(templateId: string): Promise<TemplatePerformanceMetrics | null> {
    return this.performanceMetrics.get(templateId) || null;
  }

  // Helper methods
  private getOrCreateAnalytics(templateId: string): TemplateAnalytics {
    if (!this.analytics.has(templateId)) {
      this.analytics.set(templateId, {
        templateId,
        views: 0,
        selections: 0,
        completions: 0,
        customizations: 0,
        averageTimeSpent: 0,
        conversionRate: 0,
        completionRate: 0,
        popularityScore: 0,
        lastUpdated: new Date(),
      });
    }
    return this.analytics.get(templateId)!;
  }

  private getOrCreatePerformanceMetrics(templateId: string): TemplatePerformanceMetrics {
    if (!this.performanceMetrics.has(templateId)) {
      this.performanceMetrics.set(templateId, {
        templateId,
        loadingTime: 0,
        errorRate: 0,
        renderingErrors: [],
        userEngagement: {
          bounceRate: 0,
          timeOnTemplate: 0,
          customizationRate: 0,
        },
      });
    }
    return this.performanceMetrics.get(templateId)!;
  }

  private updateCalculatedMetrics(templateId?: string): void {
    const analyticsToUpdate = templateId 
      ? [this.analytics.get(templateId)].filter(Boolean) as TemplateAnalytics[]
      : Array.from(this.analytics.values());

    analyticsToUpdate.forEach(analytics => {
      analytics.conversionRate = analytics.views > 0 ? analytics.selections / analytics.views : 0;
      analytics.completionRate = analytics.selections > 0 ? analytics.completions / analytics.selections : 0;
    });
  }

  private calculateUserSatisfaction(templateId: string): number {
    const analytics = this.analytics.get(templateId);
    if (!analytics) return 0;

    // Simplified satisfaction calculation based on completion rate and customization rate
    const completionFactor = analytics.completionRate * 0.6;
    const customizationFactor = (analytics.customizations / Math.max(analytics.selections, 1)) * 0.4;
    
    return Math.min((completionFactor + customizationFactor) * 100, 100);
  }

  private calculatePerformanceScore(templateId: string): number {
    const metrics = this.performanceMetrics.get(templateId);
    if (!metrics) return 0;

    // Performance score based on loading time and error rate
    const loadingScore = Math.max(0, 100 - (metrics.loadingTime / 100)); // Penalize slow loading
    const errorScore = Math.max(0, 100 - (metrics.errorRate * 100)); // Penalize errors
    
    return (loadingScore + errorScore) / 2;
  }

  private matchesTargetAudience(userProfile: UserProfile | undefined, targetAudience: ABTest['targetAudience']): boolean {
    if (!userProfile) return true; // Include users without profiles

    if (targetAudience.industries && userProfile.industry) {
      if (!targetAudience.industries.includes(userProfile.industry)) return false;
    }

    if (targetAudience.experienceLevels && userProfile.experienceLevel) {
      if (!targetAudience.experienceLevels.includes(userProfile.experienceLevel)) return false;
    }

    return true;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateABTestRecommendations(results: ABTestResults): string[] {
    const recommendations: string[] = [];

    if (results.winningVariant && results.statisticalSignificance) {
      recommendations.push(`Deploy winning variant ${results.winningVariant} to all users`);
      recommendations.push(`Archive underperforming variants to reduce maintenance overhead`);
    } else {
      recommendations.push('Continue test - insufficient data for statistical significance');
      recommendations.push('Consider increasing traffic allocation or extending test duration');
    }

    // Performance-based recommendations
    const performanceIssues = Object.entries(results.metrics).filter(
      ([_, metrics]) => metrics.performanceScore < 70
    );

    if (performanceIssues.length > 0) {
      recommendations.push('Address performance issues in low-scoring variants');
    }

    return recommendations;
  }

  // Persistence methods (would integrate with actual backend in production)
  private async persistAnalytics(templateId: string, analytics: TemplateAnalytics): Promise<void> {
    // In production, this would save to database
    console.log(`Persisting analytics for template ${templateId}:`, analytics);
  }

  private async persistPerformanceMetrics(templateId: string, metrics: TemplatePerformanceMetrics): Promise<void> {
    // In production, this would save to database
    console.log(`Persisting performance metrics for template ${templateId}:`, metrics);
  }

  private async persistABTest(testId: string, test: ABTest): Promise<void> {
    // In production, this would save to database
    console.log(`Persisting A/B test ${testId}:`, test);
  }
}

// Export singleton instance
export const templateAnalyticsService = new TemplateAnalyticsService();