#!/usr/bin/env node

import { TemplateSpecificContent } from '../types/templateContent';
import { templateContentManager } from '../services/templateContentManager';
import { templateContentRegistry } from '../services/templateContentRegistry';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Command Line Interface for Template Content Management
 * Provides tools for creating, updating, and managing template content
 */
export class ContentManagementCLI {
  private readonly CONTENT_DIR = path.join(process.cwd(), 'content-templates');

  constructor() {
    // Ensure content directory exists
    if (!fs.existsSync(this.CONTENT_DIR)) {
      fs.mkdirSync(this.CONTENT_DIR, { recursive: true });
    }
  }

  /**
   * Create a new template content file from template
   */
  async createTemplate(templateId: string, role: string, experienceLevel: string): Promise<void> {
    const templateContent = this.generateTemplateStructure(templateId, role, experienceLevel);
    const filePath = path.join(this.CONTENT_DIR, `${templateId}.json`);

    try {
      fs.writeFileSync(filePath, JSON.stringify(templateContent, null, 2));
      console.log(`✅ Created template file: ${filePath}`);
      console.log(`📝 Edit the file and then run: npm run content:validate ${templateId}`);
    } catch (error) {
      console.error(`❌ Failed to create template file: ${error}`);
    }
  }

  /**
   * Validate a template content file
   */
  async validateTemplate(templateId: string): Promise<boolean> {
    const filePath = path.join(this.CONTENT_DIR, `${templateId}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Template file not found: ${filePath}`);
      return false;
    }

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TemplateSpecificContent;
      const validation = templateContentRegistry.validateTemplateContent(content);

      if (validation.isValid) {
        console.log(`✅ Template ${templateId} is valid`);
        
        if (validation.warnings.length > 0) {
          console.log('⚠️  Warnings:');
          validation.warnings.forEach(warning => console.log(`   - ${warning}`));
        }

        if (validation.suggestions.length > 0) {
          console.log('💡 Suggestions:');
          validation.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
        }

        return true;
      } else {
        console.log(`❌ Template ${templateId} has validation errors:`);
        validation.errors.forEach(error => console.log(`   - ${error}`));
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to validate template: ${error}`);
      return false;
    }
  }

  /**
   * Submit template for review
   */
  async submitForReview(templateId: string, createdBy: string, changeLog?: string): Promise<void> {
    const filePath = path.join(this.CONTENT_DIR, `${templateId}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Template file not found: ${filePath}`);
      return;
    }

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TemplateSpecificContent;
      
      // First validate
      const isValid = await this.validateTemplate(templateId);
      if (!isValid) {
        console.error('❌ Template validation failed. Please fix errors before submitting.');
        return;
      }

      // Submit for review
      const result = await templateContentManager.createTemplateContent(
        templateId,
        content,
        createdBy,
        changeLog || 'New template submission'
      );

      if (result.success) {
        console.log(`✅ Template submitted for review. Review ID: ${result.reviewId}`);
        console.log('📋 Use this ID to check review status or make updates.');
      } else {
        console.error('❌ Failed to submit template:');
        result.errors?.forEach(error => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error(`❌ Failed to submit template: ${error}`);
    }
  }

  /**
   * Review a pending template
   */
  async reviewTemplate(
    reviewId: string,
    approved: boolean,
    reviewedBy: string,
    feedback: string,
    requiredChanges?: string[]
  ): Promise<void> {
    try {
      const result = await templateContentManager.reviewContent(
        reviewId,
        approved,
        reviewedBy,
        feedback,
        requiredChanges
      );

      if (result.success) {
        console.log(`✅ Review completed for ${reviewId}`);
        console.log(`Status: ${approved ? 'APPROVED' : 'REJECTED'}`);
        console.log(`Feedback: ${feedback}`);
        
        if (requiredChanges && requiredChanges.length > 0) {
          console.log('Required changes:');
          requiredChanges.forEach(change => console.log(`   - ${change}`));
        }
      } else {
        console.error('❌ Failed to complete review:');
        result.errors?.forEach(error => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error(`❌ Failed to review template: ${error}`);
    }
  }

  /**
   * List all pending reviews
   */
  async listPendingReviews(): Promise<void> {
    const pendingReviews = templateContentManager.getPendingReviews();

    if (pendingReviews.length === 0) {
      console.log('📋 No pending reviews');
      return;
    }

    console.log(`📋 Pending Reviews (${pendingReviews.length}):`);
    console.log('─'.repeat(80));

    pendingReviews.forEach(review => {
      console.log(`Template ID: ${review.templateId}`);
      console.log(`Change Type: ${review.changeType.toUpperCase()}`);
      console.log(`Requested By: ${review.requestedBy}`);
      console.log(`Requested At: ${review.requestedAt.toISOString()}`);
      console.log(`Priority: ${review.priority.toUpperCase()}`);
      if (review.reviewNotes) {
        console.log(`Notes: ${review.reviewNotes}`);
      }
      console.log('─'.repeat(40));
    });
  }

  /**
   * Show version history for a template
   */
  async showVersionHistory(templateId: string): Promise<void> {
    const versions = templateContentManager.getContentVersionHistory(templateId);

    if (versions.length === 0) {
      console.log(`📋 No version history found for ${templateId}`);
      return;
    }

    console.log(`📋 Version History for ${templateId}:`);
    console.log('─'.repeat(80));

    versions.reverse().forEach(version => {
      console.log(`Version: ${version.version}`);
      console.log(`Created By: ${version.createdBy}`);
      console.log(`Created At: ${version.createdAt.toISOString()}`);
      console.log(`Change Log: ${version.changeLog}`);
      console.log(`Approved: ${version.approved ? 'YES' : 'NO'}`);
      if (version.approvedBy) {
        console.log(`Approved By: ${version.approvedBy}`);
        console.log(`Approved At: ${version.approvedAt?.toISOString()}`);
      }
      console.log('─'.repeat(40));
    });
  }

  /**
   * Rollback to a previous version
   */
  async rollbackVersion(templateId: string, version: string, rolledBackBy: string): Promise<void> {
    try {
      const result = await templateContentManager.rollbackToVersion(templateId, version, rolledBackBy);

      if (result.success) {
        console.log(`✅ Successfully rolled back ${templateId} to version ${version}`);
      } else {
        console.error('❌ Failed to rollback:');
        result.errors?.forEach(error => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error(`❌ Failed to rollback: ${error}`);
    }
  }

  /**
   * Export all content for backup
   */
  async exportContent(outputPath?: string): Promise<void> {
    try {
      const exportData = templateContentManager.exportAllContent();
      const filePath = outputPath || path.join(this.CONTENT_DIR, `backup-${Date.now()}.json`);

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      console.log(`✅ Content exported to: ${filePath}`);
      
      const stats = {
        templates: Object.keys(exportData.content).length,
        versions: Object.values(exportData.versions).reduce((sum, versions) => sum + versions.length, 0),
        reviews: Object.values(exportData.reviews).reduce((sum, reviews) => sum + reviews.length, 0)
      };

      console.log(`📊 Export Statistics:`);
      console.log(`   - Templates: ${stats.templates}`);
      console.log(`   - Versions: ${stats.versions}`);
      console.log(`   - Reviews: ${stats.reviews}`);
    } catch (error) {
      console.error(`❌ Failed to export content: ${error}`);
    }
  }

  /**
   * Import content from backup
   */
  async importContent(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Import file not found: ${filePath}`);
      return;
    }

    try {
      const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const result = templateContentManager.importContent(importData);

      if (result.success) {
        console.log(`✅ Content imported successfully from: ${filePath}`);
      } else {
        console.error('❌ Failed to import content:');
        result.errors?.forEach(error => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error(`❌ Failed to import content: ${error}`);
    }
  }

  /**
   * Generate template structure for a new template
   */
  private generateTemplateStructure(
    templateId: string,
    role: string,
    experienceLevel: string
  ): TemplateSpecificContent {
    return {
      templateId,
      personalInfo: {
        name: '[Your Name]',
        title: `[Your ${role} Title]`,
        email: '[your.email@example.com]',
        phone: '[Your Phone]',
        location: '[Your City, State]',
        website: '[Your Website]',
        linkedin: '[LinkedIn Profile]',
        github: '[GitHub Profile]'
      },
      professionalSummary: `[Write a compelling professional summary for a ${experienceLevel} ${role}. Highlight key achievements, skills, and career objectives. This should be 2-3 sentences that capture your professional essence.]`,
      objective: `[Write a clear career objective for a ${experienceLevel} ${role}. What are you looking to achieve in your next role?]`,
      skills: [
        {
          name: '[Core Skill 1]',
          proficiency: 90,
          category: '[Skill Category]',
          yearsOfExperience: 5,
          isCore: true,
          relevanceScore: 10
        },
        {
          name: '[Core Skill 2]',
          proficiency: 85,
          category: '[Skill Category]',
          yearsOfExperience: 4,
          isCore: true,
          relevanceScore: 9
        }
      ],
      experiences: [
        {
          company: '[Company Name]',
          position: `[${experienceLevel} ${role}]`,
          startDate: '2022-01',
          endDate: null,
          description: `[Describe your role and responsibilities as a ${experienceLevel} ${role}]`,
          achievements: [
            '[Key achievement 1 with metrics]',
            '[Key achievement 2 with impact]'
          ],
          technologies: ['[Technology 1]', '[Technology 2]'],
          location: '[City, State]',
          industryContext: '[Industry]',
          roleLevel: experienceLevel as 'entry' | 'mid' | 'senior' | 'executive'
        }
      ],
      education: [
        {
          institution: '[University Name]',
          degree: '[Degree Type]',
          field: '[Field of Study]',
          startDate: '2018-09',
          endDate: '2022-05',
          location: '[City, State]'
        }
      ],
      projects: [
        {
          title: '[Project Name]',
          description: '[Project description with technical details and business impact]',
          technologies: ['[Technology 1]', '[Technology 2]'],
          startDate: '2023-01-01',
          endDate: '2023-06-01',
          impact: '[Quantifiable impact or results]',
          roleSpecific: true
        }
      ],
      achievements: [
        '[Professional achievement 1]',
        '[Professional achievement 2]'
      ]
    };
  }

  /**
   * Show help information
   */
  showHelp(): void {
    console.log(`
📋 Template Content Management CLI

Usage: npm run content:[command] [options]

Commands:
  create <templateId> <role> <level>     Create new template file
  validate <templateId>                  Validate template content
  submit <templateId> <createdBy>        Submit template for review
  review <reviewId> <approved> <by>      Review pending template
  list-reviews                           List all pending reviews
  history <templateId>                   Show version history
  rollback <templateId> <version> <by>   Rollback to previous version
  export [outputPath]                    Export all content
  import <filePath>                      Import content from backup
  help                                   Show this help

Examples:
  npm run content:create devops-senior "DevOps Engineer" senior
  npm run content:validate devops-senior
  npm run content:submit devops-senior "john.doe"
  npm run content:review review_123 true "jane.smith"
  npm run content:history devops-senior
  npm run content:export ./backup.json

Experience Levels: entry, mid, senior, executive
    `);
  }
}

// CLI execution
if (require.main === module) {
  const cli = new ContentManagementCLI();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      if (args.length < 4) {
        console.error('Usage: create <templateId> <role> <level>');
        process.exit(1);
      }
      cli.createTemplate(args[1], args[2], args[3]);
      break;

    case 'validate':
      if (args.length < 2) {
        console.error('Usage: validate <templateId>');
        process.exit(1);
      }
      cli.validateTemplate(args[1]);
      break;

    case 'submit':
      if (args.length < 3) {
        console.error('Usage: submit <templateId> <createdBy> [changeLog]');
        process.exit(1);
      }
      cli.submitForReview(args[1], args[2], args[3]);
      break;

    case 'review':
      if (args.length < 4) {
        console.error('Usage: review <reviewId> <approved> <reviewedBy> [feedback]');
        process.exit(1);
      }
      cli.reviewTemplate(args[1], args[2] === 'true', args[3], args[4] || 'Review completed');
      break;

    case 'list-reviews':
      cli.listPendingReviews();
      break;

    case 'history':
      if (args.length < 2) {
        console.error('Usage: history <templateId>');
        process.exit(1);
      }
      cli.showVersionHistory(args[1]);
      break;

    case 'rollback':
      if (args.length < 4) {
        console.error('Usage: rollback <templateId> <version> <rolledBackBy>');
        process.exit(1);
      }
      cli.rollbackVersion(args[1], args[2], args[3]);
      break;

    case 'export':
      cli.exportContent(args[1]);
      break;

    case 'import':
      if (args.length < 2) {
        console.error('Usage: import <filePath>');
        process.exit(1);
      }
      cli.importContent(args[1]);
      break;

    case 'help':
    default:
      cli.showHelp();
      break;
  }
}

export { ContentManagementCLI };