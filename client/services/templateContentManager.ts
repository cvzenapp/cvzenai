import { 
  TemplateSpecificContent, 
  ValidationResult,
  ContentQualityMetrics 
} from '../types/templateContent';
import { templateContentRegistry } from './templateContentRegistry';
import { templateContentValidationService } from './templateContentValidationService';

export interface ContentVersion {
  version: string;
  content: TemplateSpecificContent;
  createdAt: Date;
  createdBy: string;
  changeLog: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ContentReviewRequest {
  templateId: string;
  content: TemplateSpecificContent;
  requestedBy: string;
  requestedAt: Date;
  reviewNotes?: string;
  priority: 'low' | 'medium' | 'high';
  changeType: 'create' | 'update' | 'delete';
}

export interface ContentReviewResult {
  approved: boolean;
  reviewedBy: string;
  reviewedAt: Date;
  feedback: string;
  requiredChanges?: string[];
  qualityScore: number;
}

/**
 * Template Content Management Service
 * Handles creation, validation, versioning, and review of template content
 */
export class TemplateContentManager {
  private contentVersions: Map<string, ContentVersion[]> = new Map();
  private pendingReviews: Map<string, ContentReviewRequest> = new Map();
  private reviewHistory: Map<string, ContentReviewResult[]> = new Map();

  /**
   * Create new template content with validation and review process
   */
  async createTemplateContent(
    templateId: string,
    content: TemplateSpecificContent,
    createdBy: string,
    changeLog: string = 'Initial content creation'
  ): Promise<{ success: boolean; errors?: string[]; reviewId?: string }> {
    try {
      // Validate content structure and quality
      const validation = this.validateContent(content);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Create review request
      const reviewRequest: ContentReviewRequest = {
        templateId,
        content,
        requestedBy: createdBy,
        requestedAt: new Date(),
        priority: 'medium',
        changeType: 'create'
      };

      const reviewId = this.generateReviewId(templateId);
      this.pendingReviews.set(reviewId, reviewRequest);

      return {
        success: true,
        reviewId
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create template content: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Update existing template content
   */
  async updateTemplateContent(
    templateId: string,
    content: TemplateSpecificContent,
    updatedBy: string,
    changeLog: string
  ): Promise<{ success: boolean; errors?: string[]; reviewId?: string }> {
    try {
      // Check if template exists
      if (!templateContentRegistry.hasTemplateContent(templateId)) {
        return {
          success: false,
          errors: [`Template ${templateId} does not exist`]
        };
      }

      // Validate updated content
      const validation = this.validateContent(content);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Create review request for update
      const reviewRequest: ContentReviewRequest = {
        templateId,
        content,
        requestedBy: updatedBy,
        requestedAt: new Date(),
        changeType: 'update',
        priority: 'medium',
        reviewNotes: changeLog
      };

      const reviewId = this.generateReviewId(templateId);
      this.pendingReviews.set(reviewId, reviewRequest);

      return {
        success: true,
        reviewId
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to update template content: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Review and approve/reject content changes
   */
  async reviewContent(
    reviewId: string,
    approved: boolean,
    reviewedBy: string,
    feedback: string,
    requiredChanges?: string[]
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const reviewRequest = this.pendingReviews.get(reviewId);
      if (!reviewRequest) {
        return {
          success: false,
          errors: [`Review request ${reviewId} not found`]
        };
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(reviewRequest.content);

      const reviewResult: ContentReviewResult = {
        approved,
        reviewedBy,
        reviewedAt: new Date(),
        feedback,
        requiredChanges,
        qualityScore
      };

      // Store review result
      const existingReviews = this.reviewHistory.get(reviewRequest.templateId) || [];
      existingReviews.push(reviewResult);
      this.reviewHistory.set(reviewRequest.templateId, existingReviews);

      if (approved) {
        // Apply the changes
        await this.applyApprovedContent(reviewRequest, reviewResult);
      }

      // Remove from pending reviews
      this.pendingReviews.delete(reviewId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to review content: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get content version history for a template
   */
  getContentVersionHistory(templateId: string): ContentVersion[] {
    return this.contentVersions.get(templateId) || [];
  }

  /**
   * Get specific version of content
   */
  getContentVersion(templateId: string, version: string): ContentVersion | null {
    const versions = this.contentVersions.get(templateId) || [];
    return versions.find(v => v.version === version) || null;
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    templateId: string,
    version: string,
    rolledBackBy: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const targetVersion = this.getContentVersion(templateId, version);
      if (!targetVersion) {
        return {
          success: false,
          errors: [`Version ${version} not found for template ${templateId}`]
        };
      }

      // Create new version with rollback content
      const newVersion = this.generateVersionNumber(templateId);
      const rollbackVersion: ContentVersion = {
        version: newVersion,
        content: targetVersion.content,
        createdAt: new Date(),
        createdBy: rolledBackBy,
        changeLog: `Rollback to version ${version}`,
        approved: true,
        approvedBy: rolledBackBy,
        approvedAt: new Date()
      };

      // Store new version
      this.storeContentVersion(templateId, rollbackVersion);

      // Update registry
      templateContentRegistry.registerTemplateContent(templateId, targetVersion.content);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to rollback: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get pending review requests
   */
  getPendingReviews(): ContentReviewRequest[] {
    return Array.from(this.pendingReviews.values());
  }

  /**
   * Get review history for a template
   */
  getReviewHistory(templateId: string): ContentReviewResult[] {
    return this.reviewHistory.get(templateId) || [];
  }

  /**
   * Validate content using comprehensive validation rules
   */
  private validateContent(content: TemplateSpecificContent): ValidationResult {
    // Use existing validation service
    const basicValidation = templateContentValidationService.validateTemplateContent(content);
    
    // Add additional management-specific validations
    const additionalErrors: string[] = [];
    const additionalWarnings: string[] = [];

    // Check for required fields
    if (!content.templateId || content.templateId.trim() === '') {
      additionalErrors.push('Template ID is required');
    }

    if (!content.personalInfo.name || content.personalInfo.name.trim() === '') {
      additionalErrors.push('Personal info name is required');
    }

    if (!content.professionalSummary || content.professionalSummary.trim() === '') {
      additionalErrors.push('Professional summary is required');
    }

    if (content.skills.length === 0) {
      additionalWarnings.push('No skills defined - consider adding relevant skills');
    }

    if (content.experiences.length === 0) {
      additionalWarnings.push('No experiences defined - consider adding work experience');
    }

    // Combine validations
    return {
      isValid: basicValidation.isValid && additionalErrors.length === 0,
      errors: [...basicValidation.errors, ...additionalErrors],
      warnings: [...basicValidation.warnings, ...additionalWarnings],
      suggestions: basicValidation.suggestions
    };
  }

  /**
   * Calculate quality score for content
   */
  private calculateQualityScore(content: TemplateSpecificContent): number {
    let score = 0;
    let maxScore = 0;

    // Professional summary quality (20 points)
    maxScore += 20;
    if (content.professionalSummary && content.professionalSummary.length > 50) {
      score += 20;
    } else if (content.professionalSummary && content.professionalSummary.length > 20) {
      score += 10;
    }

    // Skills completeness (20 points)
    maxScore += 20;
    if (content.skills.length >= 8) {
      score += 20;
    } else if (content.skills.length >= 5) {
      score += 15;
    } else if (content.skills.length >= 3) {
      score += 10;
    }

    // Experience quality (25 points)
    maxScore += 25;
    if (content.experiences.length >= 3) {
      score += 15;
    } else if (content.experiences.length >= 2) {
      score += 10;
    } else if (content.experiences.length >= 1) {
      score += 5;
    }

    // Check for achievements in experiences
    const hasAchievements = content.experiences.some(exp => exp.achievements.length > 0);
    if (hasAchievements) {
      score += 10;
    }

    // Projects quality (15 points)
    maxScore += 15;
    if (content.projects.length >= 3) {
      score += 15;
    } else if (content.projects.length >= 2) {
      score += 10;
    } else if (content.projects.length >= 1) {
      score += 5;
    }

    // Education completeness (10 points)
    maxScore += 10;
    if (content.education.length >= 1) {
      score += 10;
    }

    // Contact information completeness (10 points)
    maxScore += 10;
    let contactScore = 0;
    if (content.personalInfo.email) contactScore += 3;
    if (content.personalInfo.phone) contactScore += 2;
    if (content.personalInfo.linkedin) contactScore += 2;
    if (content.personalInfo.github) contactScore += 2;
    if (content.personalInfo.website) contactScore += 1;
    score += Math.min(contactScore, 10);

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Apply approved content changes
   */
  private async applyApprovedContent(
    reviewRequest: ContentReviewRequest,
    reviewResult: ContentReviewResult
  ): Promise<void> {
    const { templateId, content, requestedBy } = reviewRequest;

    // Generate version number
    const version = this.generateVersionNumber(templateId);

    // Create content version
    const contentVersion: ContentVersion = {
      version,
      content,
      createdAt: new Date(),
      createdBy: requestedBy,
      changeLog: reviewRequest.reviewNotes || 'Content update',
      approved: true,
      approvedBy: reviewResult.reviewedBy,
      approvedAt: reviewResult.reviewedAt
    };

    // Store version
    this.storeContentVersion(templateId, contentVersion);

    // Register with content registry
    templateContentRegistry.registerTemplateContent(templateId, content);
  }

  /**
   * Store content version in version history
   */
  private storeContentVersion(templateId: string, version: ContentVersion): void {
    const existingVersions = this.contentVersions.get(templateId) || [];
    existingVersions.push(version);
    
    // Keep only last 10 versions to prevent memory issues
    if (existingVersions.length > 10) {
      existingVersions.splice(0, existingVersions.length - 10);
    }
    
    this.contentVersions.set(templateId, existingVersions);
  }

  /**
   * Generate version number
   */
  private generateVersionNumber(templateId: string): string {
    const existingVersions = this.contentVersions.get(templateId) || [];
    const versionNumber = existingVersions.length + 1;
    return `v${versionNumber}.0.0`;
  }

  /**
   * Generate review ID
   */
  private generateReviewId(templateId: string): string {
    const timestamp = Date.now();
    return `review_${templateId}_${timestamp}`;
  }

  /**
   * Export content for backup
   */
  exportAllContent(): {
    content: Record<string, TemplateSpecificContent>;
    versions: Record<string, ContentVersion[]>;
    reviews: Record<string, ContentReviewResult[]>;
  } {
    return {
      content: templateContentRegistry.getAllTemplateContents(),
      versions: Object.fromEntries(this.contentVersions),
      reviews: Object.fromEntries(this.reviewHistory)
    };
  }

  /**
   * Import content from backup
   */
  importContent(data: {
    content: Record<string, TemplateSpecificContent>;
    versions: Record<string, ContentVersion[]>;
    reviews: Record<string, ContentReviewResult[]>;
  }): { success: boolean; errors?: string[] } {
    try {
      // Import content
      Object.entries(data.content).forEach(([templateId, content]) => {
        templateContentRegistry.registerTemplateContent(templateId, content);
      });

      // Import versions
      Object.entries(data.versions).forEach(([templateId, versions]) => {
        this.contentVersions.set(templateId, versions);
      });

      // Import review history
      Object.entries(data.reviews).forEach(([templateId, reviews]) => {
        this.reviewHistory.set(templateId, reviews);
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to import content: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

// Export singleton instance
export const templateContentManager = new TemplateContentManager();