import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentManagementCLI } from './contentManagementCLI';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs');
vi.mock('path');

describe('ContentManagementCLI', () => {
  let cli: ContentManagementCLI;
  let mockConsoleLog: any;
  let mockConsoleError: any;

  beforeEach(() => {
    cli = new ContentManagementCLI();
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fs methods
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockImplementation(() => '');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a new template file', async () => {
      await cli.createTemplate('test-template', 'Software Engineer', 'senior');

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Created template file:')
      );
    });

    it('should handle file creation errors', async () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });

      await cli.createTemplate('test-template', 'Software Engineer', 'senior');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create template file:')
      );
    });

    it('should generate appropriate template structure', async () => {
      let writtenContent: string = '';
      vi.mocked(fs.writeFileSync).mockImplementation((path, content) => {
        writtenContent = content as string;
      });

      await cli.createTemplate('devops-engineer', 'DevOps Engineer', 'senior');

      const parsedContent = JSON.parse(writtenContent);
      expect(parsedContent.templateId).toBe('devops-engineer');
      expect(parsedContent.personalInfo.title).toContain('DevOps Engineer');
      expect(parsedContent.professionalSummary).toContain('senior');
    });
  });

  describe('validateTemplate', () => {
    it('should validate existing template file', async () => {
      const mockTemplateContent = {
        templateId: 'test-template',
        personalInfo: {
          name: 'Alex Morgan',
          title: 'Software Engineer',
          email: 'john@example.com',
          location: 'San Francisco, CA'
        },
        professionalSummary: 'Experienced software engineer',
        objective: 'Seeking new opportunities',
        skills: [],
        experiences: [],
        education: [],
        projects: [],
        achievements: []
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplateContent));

      const result = await cli.validateTemplate('test-template');

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Template test-template is valid')
      );
    });

    it('should handle missing template file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await cli.validateTemplate('non-existent');

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Template file not found:')
      );
    });

    it('should handle invalid JSON', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const result = await cli.validateTemplate('test-template');

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to validate template:')
      );
    });
  });

  describe('submitForReview', () => {
    it('should submit valid template for review', async () => {
      const mockTemplateContent = {
        templateId: 'test-template',
        personalInfo: {
          name: 'Alex Morgan',
          title: 'Software Engineer',
          email: 'john@example.com',
          location: 'San Francisco, CA'
        },
        professionalSummary: 'Experienced software engineer with 5+ years of experience',
        objective: 'Seeking new opportunities',
        skills: [
          {
            name: 'JavaScript',
            proficiency: 90,
            category: 'Programming',
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
            description: 'Developed web applications',
            achievements: ['Improved performance by 30%'],
            technologies: ['JavaScript', 'React'],
            location: 'San Francisco, CA',
            industryContext: 'Technology',
            roleLevel: 'mid'
          }
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS',
            field: 'Computer Science',
            startDate: '2016-09',
            endDate: '2020-05',
            location: 'San Francisco, CA'
          }
        ],
        projects: [
          {
            title: 'Web App',
            description: 'Built a web application',
            technologies: ['React', 'Node.js'],
            startDate: '2021-01-01',
            endDate: '2021-06-01',
            impact: 'Increased efficiency by 25%',
            roleSpecific: true
          }
        ],
        achievements: ['Employee of the month']
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplateContent));

      await cli.submitForReview('test-template', 'john.doe', 'Initial submission');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Template submitted for review')
      );
    });

    it('should not submit invalid template', async () => {
      const invalidContent = {
        templateId: '',
        personalInfo: { name: '', title: '', email: '', location: '' },
        professionalSummary: '',
        objective: '',
        skills: [],
        experiences: [],
        education: [],
        projects: [],
        achievements: []
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(invalidContent));

      await cli.submitForReview('test-template', 'john.doe');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Template validation failed')
      );
    });
  });

  describe('reviewTemplate', () => {
    it('should complete review successfully', async () => {
      await cli.reviewTemplate(
        'review_123',
        true,
        'jane.smith',
        'Looks good!',
        []
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Review completed')
      );
    });

    it('should handle review with required changes', async () => {
      await cli.reviewTemplate(
        'review_123',
        false,
        'jane.smith',
        'Needs improvement',
        ['Add more skills', 'Improve summary']
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Status: REJECTED')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Required changes:')
      );
    });
  });

  describe('listPendingReviews', () => {
    it('should display pending reviews', async () => {
      await cli.listPendingReviews();

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle no pending reviews', async () => {
      await cli.listPendingReviews();

      expect(mockConsoleLog).toHaveBeenCalledWith('📋 No pending reviews');
    });
  });

  describe('showVersionHistory', () => {
    it('should display version history', async () => {
      await cli.showVersionHistory('test-template');

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle no version history', async () => {
      await cli.showVersionHistory('test-template');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📋 No version history found')
      );
    });
  });

  describe('rollbackVersion', () => {
    it('should rollback successfully', async () => {
      await cli.rollbackVersion('test-template', 'v1.0.0', 'admin');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Successfully rolled back')
      );
    });
  });

  describe('exportContent', () => {
    it('should export content successfully', async () => {
      await cli.exportContent('./test-export.json');

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Content exported to:')
      );
    });

    it('should handle export errors', async () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Export failed');
      });

      await cli.exportContent('./test-export.json');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to export content:')
      );
    });
  });

  describe('importContent', () => {
    it('should import content successfully', async () => {
      const mockImportData = {
        content: {},
        versions: {},
        reviews: {}
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockImportData));

      await cli.importContent('./test-import.json');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Content imported successfully')
      );
    });

    it('should handle missing import file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await cli.importContent('./non-existent.json');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Import file not found:')
      );
    });

    it('should handle invalid import data', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      await cli.importContent('./test-import.json');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to import content:')
      );
    });
  });

  describe('showHelp', () => {
    it('should display help information', () => {
      cli.showHelp();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📋 Template Content Management CLI')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Commands:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Examples:')
      );
    });
  });

  describe('template structure generation', () => {
    it('should generate appropriate structure for different roles', async () => {
      let writtenContent: string = '';
      vi.mocked(fs.writeFileSync).mockImplementation((path, content) => {
        writtenContent = content as string;
      });

      await cli.createTemplate('data-scientist', 'Data Scientist', 'senior');

      const parsedContent = JSON.parse(writtenContent);
      expect(parsedContent.personalInfo.title).toContain('Data Scientist');
      expect(parsedContent.professionalSummary).toContain('senior');
      expect(parsedContent.professionalSummary).toContain('Data Scientist');
    });

    it('should generate appropriate structure for different experience levels', async () => {
      let writtenContent: string = '';
      vi.mocked(fs.writeFileSync).mockImplementation((path, content) => {
        writtenContent = content as string;
      });

      await cli.createTemplate('junior-dev', 'Software Engineer', 'entry');

      const parsedContent = JSON.parse(writtenContent);
      expect(parsedContent.experiences[0].roleLevel).toBe('entry');
      expect(parsedContent.professionalSummary).toContain('entry');
    });
  });
});