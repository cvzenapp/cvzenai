# Template Content Management Tools

This directory contains tools for managing template-specific content in the CVZen platform. These tools provide a comprehensive system for creating, validating, reviewing, and versioning template content.

## Overview

The content management system consists of several components:

1. **Template Content Manager** - Core service for content lifecycle management
2. **Content Review Service** - Automated quality assessment and validation
3. **Content Management CLI** - Command-line interface for content operations
4. **Content Management Dashboard** - Web-based interface for content management

## Features

### Content Creation and Validation
- Create new template content with structured validation
- Validate content against role-specific criteria
- Ensure content quality and completeness
- Automated skill relevance scoring

### Review and Approval Process
- Submit content for review by authorized users
- Comprehensive quality assessment with scoring
- Approval/rejection workflow with feedback
- Track review history and decisions

### Version Management
- Automatic versioning of all content changes
- Version history tracking with change logs
- Rollback capability to previous versions
- Content comparison between versions

### Quality Assessment
- Multi-criteria evaluation system:
  - Skill relevance (25% weight)
  - Experience consistency (25% weight)
  - Project relevance (20% weight)
  - Content quality (20% weight)
  - Completeness (10% weight)
- Configurable scoring thresholds
- Detailed feedback and improvement suggestions

## CLI Usage

### Installation
The CLI tools are available through npm scripts. No additional installation required.

### Commands

#### Create New Template
```bash
npm run content:create <templateId> <role> <experienceLevel>
```
Example:
```bash
npm run content:create devops-senior "DevOps Engineer" senior
```

#### Validate Template
```bash
npm run content:validate <templateId>
```
Example:
```bash
npm run content:validate devops-senior
```

#### Submit for Review
```bash
npm run content:submit <templateId> <createdBy> [changeLog]
```
Example:
```bash
npm run content:submit devops-senior "john.doe" "Initial DevOps template"
```

#### Review Template
```bash
npm run content:review <reviewId> <approved> <reviewedBy> [feedback]
```
Example:
```bash
npm run content:review review_123 true "jane.smith" "Content looks excellent"
```

#### List Pending Reviews
```bash
npm run content:list-reviews
```

#### View Version History
```bash
npm run content:history <templateId>
```
Example:
```bash
npm run content:history devops-senior
```

#### Rollback Version
```bash
npm run content:rollback <templateId> <version> <rolledBackBy>
```
Example:
```bash
npm run content:rollback devops-senior v1.0.0 "admin.user"
```

#### Export Content
```bash
npm run content:export [outputPath]
```
Example:
```bash
npm run content:export ./backup-2024-01-15.json
```

#### Import Content
```bash
npm run content:import <filePath>
```
Example:
```bash
npm run content:import ./backup-2024-01-15.json
```

#### Show Help
```bash
npm run content:help
```

## Web Dashboard

The Content Management Dashboard provides a user-friendly web interface for managing template content. Access it through the main application with appropriate permissions.

### Features
- **Pending Reviews Tab**: View and process content review requests
- **Create Template Tab**: Create new template structures
- **Version History Tab**: Browse version history and rollback changes
- **Management Tab**: Export/import content and view statistics

### User Roles
- **Admin**: Full access to all features
- **Editor**: Can create and submit content for review
- **Reviewer**: Can review and approve/reject content

## Content Structure

### Template Content Format
```typescript
interface TemplateSpecificContent {
  templateId: string;
  personalInfo: PersonalInfoContent;
  professionalSummary: string;
  objective: string;
  skills: SkillContent[];
  experiences: ExperienceContent[];
  education: EducationContent[];
  projects: ProjectContent[];
  achievements: string[];
  certifications?: CertificationContent[];
  languages?: LanguageContent[];
}
```

### Quality Criteria
Templates are evaluated on:

1. **Skill Relevance** (70+ required)
   - Skills match target role
   - Appropriate proficiency levels
   - Core skills identified

2. **Experience Consistency** (75+ required)
   - Experience aligns with role level
   - Achievements included
   - Technology alignment with skills

3. **Project Relevance** (70+ required)
   - Projects demonstrate role-specific skills
   - Quantifiable impact metrics
   - Technology alignment

4. **Content Quality** (80+ required)
   - Professional language
   - No placeholder text
   - Valid contact information
   - Complete required fields

5. **Completeness** (85+ required)
   - All sections populated
   - Sufficient detail in each section
   - Professional profiles included

## File Structure

```
client/tools/
├── contentManagementCLI.ts          # Command-line interface
├── contentManagementCLI.test.ts     # CLI tests
└── README.md                        # This documentation

client/services/
├── templateContentManager.ts        # Core management service
├── templateContentManager.test.ts   # Manager tests
├── contentReviewService.ts          # Quality review service
└── contentReviewService.test.ts     # Review service tests

client/components/
└── ContentManagementDashboard.tsx   # Web dashboard component
```

## Development

### Running Tests
```bash
# Test content manager
npm test -- --run client/services/templateContentManager.test.ts

# Test review service
npm test -- --run client/services/contentReviewService.test.ts

# Test CLI
npm test -- --run client/tools/contentManagementCLI.test.ts
```

### Adding New Template Types
1. Create template content using CLI or dashboard
2. Validate content meets quality criteria
3. Submit for review
4. Once approved, content is available for use

### Customizing Review Criteria
Review criteria can be customized by modifying the `ReviewCriteria` interface in `contentReviewService.ts`:

```typescript
const customCriteria: ReviewCriteria = {
  skillRelevance: { weight: 0.3, minScore: 80, description: "Custom skill criteria" },
  // ... other criteria
};
```

## Best Practices

### Content Creation
- Use realistic, professional sample data
- Ensure skills match the target role and industry
- Include quantifiable achievements and metrics
- Maintain consistency in experience levels
- Use proper professional language

### Review Process
- Review content thoroughly against all criteria
- Provide constructive feedback for improvements
- Use the scoring system to maintain quality standards
- Document review decisions clearly

### Version Management
- Use descriptive change logs for all updates
- Test content thoroughly before approval
- Keep backup exports for disaster recovery
- Monitor content performance and user feedback

## Troubleshooting

### Common Issues

**Template validation fails**
- Check for placeholder text (text in brackets)
- Ensure all required fields are filled
- Verify email format is valid
- Check skill relevance scores

**Review submission fails**
- Ensure content passes basic validation first
- Check user permissions
- Verify template ID is unique

**Import/export issues**
- Ensure JSON format is valid
- Check file permissions
- Verify backup file structure

### Getting Help
- Use `npm run content:help` for CLI assistance
- Check test files for usage examples
- Review error messages for specific guidance
- Consult the validation service for quality requirements

## Security Considerations

- Content is validated and sanitized before storage
- User permissions are enforced for all operations
- Review process prevents unauthorized content changes
- Export/import operations are logged for audit trails
- No sensitive information should be included in sample content

## Performance

- Content is cached for frequently accessed templates
- Lazy loading for large content sets
- Efficient validation algorithms
- Optimized database queries for version history
- Background processing for quality assessments