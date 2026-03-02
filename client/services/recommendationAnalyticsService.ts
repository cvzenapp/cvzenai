/**
 * Recommendation Analytics Service
 * Tracks recommendation accuracy and provides insights for improvement
 */

import { UserProfile } from './userProfileAnalysisService';
import { TemplateRecommendation } from './templateService';

export interface RecommendationInteraction {
  id: string;
  userId: string;
  templateId: string;
  recommendationScore: number;
  userProfile: UserProfile;
  action: 'viewed' | 'selected' | 'dismissed' | 'customized' | 'completed';
  timestamp: Date;
  sessionId: string;
  context: {
    position: number; // Position in recommendation list
    category: 'perfect-match' | 'good-fit' | 'alternative';
    reasons: string[];
  };
}

export interface RecommendationMetrics {
  totalRecommendations: number;
  clickThroughRate: number;
  conversionRate: number;
  averageScore: number;
  topPerformingCategories: string[];
  improvementSuggestions: string[];
}

export interface AccuracyReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: RecommendationMetrics;
  industryBreakdown: Record<string, RecommendationMetrics>;
  experienceLevelBreakdown: Record<string, RecommendationMetrics>;
}

export class RecommendationAnalyticsService {
  private static interactions: RecommendationInteraction[] = [];
  private static sessionId = this.generateSessionId();

  /**
   * Tracks a user interaction with a recommendation
   */
  static trackInteraction(
    userId: string,
    templateId: string,
    recommendationScore: number,
    userProfile: UserProfile,
    action: RecommendationInteraction['action'],
    context: RecommendationInteraction['context']
  ): void {
    const interaction: RecommendationInteraction = {
      id: this.generateId(),
      userId,
      templateId,
      recommendationScore,
      userProfile,
      action,
      timestamp: new Date(),
      sessionId: this.sessionId,
      context
    };

    this.interactions.push(interaction);
    
    // In production, this would be sent to analytics backend
    this.sendToAnalytics(interaction);
    
    // Update recommendation model based on feedback
    this.updateRecommendationModel(interaction);
  }

  /**
   * Calculates recommendation accuracy metrics
   */
  static calculateAccuracyMetrics(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): RecommendationMetrics {
    let filteredInteractions = this.interactions;

    // Filter by user if specified
    if (userId) {
      filteredInteractions = filteredInteractions.filter(i => i.userId === userId);
    }

    // Filter by time range if specified
    if (timeRange) {
      filteredInteractions = filteredInteractions.filter(
        i => i.timestamp >= timeRange.start && i.timestamp <= timeRange.end
      );
    }

    const totalRecommendations = filteredInteractions.length;
    const viewedRecommendations = filteredInteractions.filter(i => 
      ['viewed', 'selected', 'customized', 'completed'].includes(i.action)
    ).length;
    const selectedRecommendations = filteredInteractions.filter(i => 
      ['selected', 'customized', 'completed'].includes(i.action)
    ).length;
    const completedRecommendations = filteredInteractions.filter(i => 
      i.action === 'completed'
    ).length;

    const clickThroughRate = totalRecommendations > 0 ? 
      (viewedRecommendations / totalRecommendations) * 100 : 0;
    const conversionRate = viewedRecommendations > 0 ? 
      (selectedRecommendations / viewedRecommendations) * 100 : 0;
    const averageScore = totalRecommendations > 0 ?
      filteredInteractions.reduce((sum, i) => sum + i.recommendationScore, 0) / totalRecommendations : 0;

    // Analyze top performing categories
    const categoryPerformance = this.analyzeCategoryPerformance(filteredInteractions);
    const topPerformingCategories = Object.entries(categoryPerformance)
      .sort(([,a], [,b]) => b.conversionRate - a.conversionRate)
      .slice(0, 3)
      .map(([category]) => category);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      filteredInteractions,
      { clickThroughRate, conversionRate, averageScore }
    );

    return {
      totalRecommendations,
      clickThroughRate,
      conversionRate,
      averageScore,
      topPerformingCategories,
      improvementSuggestions
    };
  }

  /**
   * Generates accuracy report for a specific period
   */
  static generateAccuracyReport(
    period: 'daily' | 'weekly' | 'monthly',
    date: Date = new Date()
  ): AccuracyReport {
    const { startDate, endDate } = this.getDateRange(period, date);
    
    const timeRange = { start: startDate, end: endDate };
    const metrics = this.calculateAccuracyMetrics(undefined, timeRange);

    // Industry breakdown
    const industryBreakdown: Record<string, RecommendationMetrics> = {};
    const industries = [...new Set(this.interactions.map(i => i.userProfile.industry).filter(Boolean))];
    
    industries.forEach(industry => {
      const industryInteractions = this.interactions.filter(
        i => i.userProfile.industry === industry &&
        i.timestamp >= startDate && i.timestamp <= endDate
      );
      
      if (industryInteractions.length > 0) {
        industryBreakdown[industry!] = this.calculateMetricsForInteractions(industryInteractions);
      }
    });

    // Experience level breakdown
    const experienceLevelBreakdown: Record<string, RecommendationMetrics> = {};
    const experienceLevels = [...new Set(this.interactions.map(i => i.userProfile.experienceLevel).filter(Boolean))];
    
    experienceLevels.forEach(level => {
      const levelInteractions = this.interactions.filter(
        i => i.userProfile.experienceLevel === level &&
        i.timestamp >= startDate && i.timestamp <= endDate
      );
      
      if (levelInteractions.length > 0) {
        experienceLevelBreakdown[level!] = this.calculateMetricsForInteractions(levelInteractions);
      }
    });

    return {
      period,
      startDate,
      endDate,
      metrics,
      industryBreakdown,
      experienceLevelBreakdown
    };
  }

  /**
   * Gets recommendations that need improvement based on low performance
   */
  static getUnderperformingRecommendations(): {
    templateId: string;
    score: number;
    issues: string[];
    suggestions: string[];
  }[] {
    const templatePerformance = new Map<string, {
      interactions: RecommendationInteraction[];
      avgScore: number;
      conversionRate: number;
    }>();

    // Group interactions by template
    this.interactions.forEach(interaction => {
      if (!templatePerformance.has(interaction.templateId)) {
        templatePerformance.set(interaction.templateId, {
          interactions: [],
          avgScore: 0,
          conversionRate: 0
        });
      }
      templatePerformance.get(interaction.templateId)!.interactions.push(interaction);
    });

    // Calculate performance metrics for each template
    const underperforming: any[] = [];
    
    templatePerformance.forEach((data, templateId) => {
      const { interactions } = data;
      const avgScore = interactions.reduce((sum, i) => sum + i.recommendationScore, 0) / interactions.length;
      const selectedCount = interactions.filter(i => ['selected', 'customized', 'completed'].includes(i.action)).length;
      const conversionRate = interactions.length > 0 ? (selectedCount / interactions.length) * 100 : 0;

      // Consider underperforming if score < 70 or conversion rate < 20%
      if (avgScore < 70 || conversionRate < 20) {
        const issues: string[] = [];
        const suggestions: string[] = [];

        if (avgScore < 70) {
          issues.push('Low recommendation score');
          suggestions.push('Review matching algorithm weights');
        }

        if (conversionRate < 20) {
          issues.push('Low conversion rate');
          suggestions.push('Improve template preview or description');
        }

        // Analyze dismissal reasons
        const dismissedInteractions = interactions.filter(i => i.action === 'dismissed');
        if (dismissedInteractions.length > interactions.length * 0.3) {
          issues.push('High dismissal rate');
          suggestions.push('Review template positioning and targeting');
        }

        underperforming.push({
          templateId,
          score: avgScore,
          issues,
          suggestions
        });
      }
    });

    return underperforming.sort((a, b) => a.score - b.score);
  }

  /**
   * Provides insights for improving recommendation algorithm
   */
  static getAlgorithmInsights(): {
    weightAdjustments: Record<string, number>;
    newFactors: string[];
    industrySpecificTuning: Record<string, any>;
  } {
    const insights = {
      weightAdjustments: {} as Record<string, number>,
      newFactors: [] as string[],
      industrySpecificTuning: {} as Record<string, any>
    };

    // Analyze which factors correlate with successful recommendations
    const successfulInteractions = this.interactions.filter(i => 
      ['selected', 'customized', 'completed'].includes(i.action)
    );

    // Industry weight analysis
    const industrySuccess = this.analyzeFactorSuccess(successfulInteractions, 'industry');
    if (industrySuccess.correlation > 0.7) {
      insights.weightAdjustments.industry = Math.min(0.4, insights.weightAdjustments.industry + 0.05);
    }

    // Experience level weight analysis
    const experienceSuccess = this.analyzeFactorSuccess(successfulInteractions, 'experienceLevel');
    if (experienceSuccess.correlation > 0.6) {
      insights.weightAdjustments.experienceLevel = Math.min(0.3, insights.weightAdjustments.experienceLevel + 0.03);
    }

    // Identify new factors to consider
    const timeOfDayPattern = this.analyzeTimeOfDayPattern();
    if (timeOfDayPattern.significance > 0.5) {
      insights.newFactors.push('timeOfDay');
    }

    const deviceTypePattern = this.analyzeDeviceTypePattern();
    if (deviceTypePattern.significance > 0.4) {
      insights.newFactors.push('deviceType');
    }

    // Industry-specific tuning
    const industries = [...new Set(this.interactions.map(i => i.userProfile.industry).filter(Boolean))];
    industries.forEach(industry => {
      const industryInteractions = this.interactions.filter(i => i.userProfile.industry === industry);
      const industryInsights = this.analyzeIndustrySpecificPatterns(industryInteractions);
      
      if (industryInsights.hasSignificantPatterns) {
        insights.industrySpecificTuning[industry!] = industryInsights;
      }
    });

    return insights;
  }

  // Private helper methods

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static sendToAnalytics(interaction: RecommendationInteraction): void {
    // In production, send to analytics service
    console.log('Analytics:', interaction);
  }

  private static updateRecommendationModel(interaction: RecommendationInteraction): void {
    // In production, update ML model based on user feedback
    console.log('Model update:', interaction.action, interaction.recommendationScore);
  }

  private static analyzeCategoryPerformance(interactions: RecommendationInteraction[]): Record<string, { conversionRate: number; avgScore: number }> {
    const categoryStats: Record<string, { total: number; converted: number; totalScore: number }> = {};

    interactions.forEach(interaction => {
      const category = interaction.context.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, converted: 0, totalScore: 0 };
      }
      
      categoryStats[category].total++;
      categoryStats[category].totalScore += interaction.recommendationScore;
      
      if (['selected', 'customized', 'completed'].includes(interaction.action)) {
        categoryStats[category].converted++;
      }
    });

    const result: Record<string, { conversionRate: number; avgScore: number }> = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      result[category] = {
        conversionRate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
        avgScore: stats.total > 0 ? stats.totalScore / stats.total : 0
      };
    });

    return result;
  }

  private static generateImprovementSuggestions(
    interactions: RecommendationInteraction[],
    metrics: { clickThroughRate: number; conversionRate: number; averageScore: number }
  ): string[] {
    const suggestions: string[] = [];

    if (metrics.clickThroughRate < 30) {
      suggestions.push('Improve recommendation visibility and positioning');
    }

    if (metrics.conversionRate < 25) {
      suggestions.push('Enhance template previews and descriptions');
    }

    if (metrics.averageScore < 75) {
      suggestions.push('Refine matching algorithm weights');
    }

    // Analyze dismissal patterns
    const dismissedCount = interactions.filter(i => i.action === 'dismissed').length;
    if (dismissedCount > interactions.length * 0.4) {
      suggestions.push('Review template targeting criteria');
    }

    // Analyze position bias
    const positionPerformance = this.analyzePositionBias(interactions);
    if (positionPerformance.hasBias) {
      suggestions.push('Implement position rotation to reduce bias');
    }

    return suggestions;
  }

  private static getDateRange(period: 'daily' | 'weekly' | 'monthly', date: Date): { startDate: Date; endDate: Date } {
    const endDate = new Date(date);
    const startDate = new Date(date);

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        startDate.setDate(date.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(date.getMonth() - 1);
        break;
    }

    return { startDate, endDate };
  }

  private static calculateMetricsForInteractions(interactions: RecommendationInteraction[]): RecommendationMetrics {
    const totalRecommendations = interactions.length;
    const viewedCount = interactions.filter(i => ['viewed', 'selected', 'customized', 'completed'].includes(i.action)).length;
    const selectedCount = interactions.filter(i => ['selected', 'customized', 'completed'].includes(i.action)).length;

    const clickThroughRate = totalRecommendations > 0 ? (viewedCount / totalRecommendations) * 100 : 0;
    const conversionRate = viewedCount > 0 ? (selectedCount / viewedCount) * 100 : 0;
    const averageScore = totalRecommendations > 0 ?
      interactions.reduce((sum, i) => sum + i.recommendationScore, 0) / totalRecommendations : 0;

    return {
      totalRecommendations,
      clickThroughRate,
      conversionRate,
      averageScore,
      topPerformingCategories: [],
      improvementSuggestions: []
    };
  }

  private static analyzeFactorSuccess(interactions: RecommendationInteraction[], factor: keyof UserProfile): { correlation: number } {
    // Simplified correlation analysis
    // In production, this would use proper statistical methods
    return { correlation: Math.random() * 0.8 + 0.2 }; // Mock correlation
  }

  private static analyzeTimeOfDayPattern(): { significance: number } {
    // Analyze if time of day affects recommendation success
    return { significance: Math.random() * 0.6 }; // Mock significance
  }

  private static analyzeDeviceTypePattern(): { significance: number } {
    // Analyze if device type affects recommendation success
    return { significance: Math.random() * 0.5 }; // Mock significance
  }

  private static analyzeIndustrySpecificPatterns(interactions: RecommendationInteraction[]): { hasSignificantPatterns: boolean; patterns: any } {
    // Analyze industry-specific recommendation patterns
    return { 
      hasSignificantPatterns: interactions.length > 10 && Math.random() > 0.5,
      patterns: {}
    };
  }

  private static analyzePositionBias(interactions: RecommendationInteraction[]): { hasBias: boolean } {
    // Check if recommendations in higher positions perform disproportionately better
    const positionStats = new Map<number, { total: number; selected: number }>();
    
    interactions.forEach(interaction => {
      const position = interaction.context.position;
      if (!positionStats.has(position)) {
        positionStats.set(position, { total: 0, selected: 0 });
      }
      
      const stats = positionStats.get(position)!;
      stats.total++;
      
      if (['selected', 'customized', 'completed'].includes(interaction.action)) {
        stats.selected++;
      }
    });

    // Simple bias detection: if position 1 has >50% higher conversion than position 3+
    const pos1Stats = positionStats.get(1);
    const pos3PlusStats = Array.from(positionStats.entries())
      .filter(([pos]) => pos >= 3)
      .reduce((acc, [, stats]) => ({ total: acc.total + stats.total, selected: acc.selected + stats.selected }), { total: 0, selected: 0 });

    if (pos1Stats && pos3PlusStats.total > 0) {
      const pos1Rate = pos1Stats.selected / pos1Stats.total;
      const pos3PlusRate = pos3PlusStats.selected / pos3PlusStats.total;
      
      return { hasBias: pos1Rate > pos3PlusRate * 1.5 };
    }

    return { hasBias: false };
  }
}