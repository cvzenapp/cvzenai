import { describe, it, expect, beforeEach } from 'vitest';
import { initializeTemplateContent, getContentIdForTemplateId, hasTemplateContent } from './templateContentInitializer';
import { templateContentRegistry } from './templateContentRegistry';
import { TEMPLATE_IDS } from './templateSpecificContentService';

describe('Template Content Initializer', () => {
  beforeEach(() => {
    // Clear registry before each test
    templateContentRegistry.clearAllContent();
  });

  describe('initializeTemplateContent', () => {
    it('should initialize all mobile developer templates', () => {
      initializeTemplateContent();

      // Check that all mobile developer templates are registered
      expect(templateContentRegistry.hasTemplateContent(TEMPLATE_IDS.MOBILE_IOS)).toBe(true);
      expect(templateContentRegistry.hasTemplateContent(TEMPLATE_IDS.MOBILE_ANDROID)).toBe(true);
      expect(templateContentRegistry.hasTemplateContent(TEMPLATE_IDS.MOBILE_REACT_NATIVE)).toBe(true);
    });

    it('should register DevOps templates', () => {
      initializeTemplateContent();

      expect(templateContentRegistry.hasTemplateContent(TEMPLATE_IDS.DEVOPS_SENIOR)).toBe(true);
      expect(templateContentRegistry.hasTemplateContent(TEMPLATE_IDS.DEVOPS_JUNIOR)).toBe(true);
    });

    it('should provide content statistics', () => {
      initializeTemplateContent();
      
      const stats = templateContentRegistry.getContentStatistics();
      expect(stats.totalTemplates).toBeGreaterThanOrEqual(5); // At least 5 templates (2 DevOps + 3 Mobile)
      expect(stats.byRole['mobile-developer']).toBe(3); // 3 mobile developer templates
      expect(stats.byIndustry['technology']).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getContentIdForTemplateId', () => {
    it('should map mobile template IDs correctly', () => {
      expect(getContentIdForTemplateId('mobile-developer-ios')).toBe('mobile-developer-ios');
      expect(getContentIdForTemplateId('mobile-developer-android')).toBe('mobile-developer-android');
      expect(getContentIdForTemplateId('mobile-developer-react-native')).toBe('mobile-developer-react-native');
    });

    it('should map DevOps template IDs correctly', () => {
      expect(getContentIdForTemplateId('devops-engineer-senior')).toBe('devops-engineer-senior');
      expect(getContentIdForTemplateId('devops-engineer-junior')).toBe('devops-engineer-junior');
    });

    it('should return null for unknown template IDs', () => {
      expect(getContentIdForTemplateId('unknown-template')).toBe(null);
    });
  });

  describe('hasTemplateContent', () => {
    it('should return false before initialization', () => {
      expect(hasTemplateContent(TEMPLATE_IDS.MOBILE_IOS)).toBe(false);
    });

    it('should return true after initialization', () => {
      initializeTemplateContent();
      expect(hasTemplateContent(TEMPLATE_IDS.MOBILE_IOS)).toBe(true);
      expect(hasTemplateContent(TEMPLATE_IDS.MOBILE_ANDROID)).toBe(true);
      expect(hasTemplateContent(TEMPLATE_IDS.MOBILE_REACT_NATIVE)).toBe(true);
    });
  });

  describe('Mobile Developer Content Integration', () => {
    beforeEach(() => {
      initializeTemplateContent();
    });

    it('should retrieve iOS developer content', () => {
      const content = templateContentRegistry.getTemplateContent(TEMPLATE_IDS.MOBILE_IOS);
      expect(content).toBeTruthy();
      expect(content?.personalInfo.name).toBe('Sarah Kim');
      expect(content?.personalInfo.title).toBe('Senior iOS Developer');
    });

    it('should retrieve Android developer content', () => {
      const content = templateContentRegistry.getTemplateContent(TEMPLATE_IDS.MOBILE_ANDROID);
      expect(content).toBeTruthy();
      expect(content?.personalInfo.name).toBe('David Patel');
      expect(content?.personalInfo.title).toBe('Android Developer');
    });

    it('should retrieve React Native developer content', () => {
      const content = templateContentRegistry.getTemplateContent(TEMPLATE_IDS.MOBILE_REACT_NATIVE);
      expect(content).toBeTruthy();
      expect(content?.personalInfo.name).toBe('Alex Chen');
      expect(content?.personalInfo.title).toBe('React Native Developer');
    });

    it('should have different skills for each mobile platform', () => {
      const iosContent = templateContentRegistry.getTemplateContent(TEMPLATE_IDS.MOBILE_IOS);
      const androidContent = templateContentRegistry.getTemplateContent(TEMPLATE_IDS.MOBILE_ANDROID);
      const reactNativeContent = templateContentRegistry.getTemplateContent(TEMPLATE_IDS.MOBILE_REACT_NATIVE);

      const iosSkills = iosContent?.skills.map(s => s.name) || [];
      const androidSkills = androidContent?.skills.map(s => s.name) || [];
      const reactNativeSkills = reactNativeContent?.skills.map(s => s.name) || [];

      expect(iosSkills).toContain('Swift');
      expect(androidSkills).toContain('Kotlin');
      expect(reactNativeSkills).toContain('React Native');
    });
  });
});