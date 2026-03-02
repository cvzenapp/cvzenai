import { describe, it, expect } from 'vitest';
import { iOSDeveloperContent, androidDeveloperContent, reactNativeDeveloperContent } from './mobileTemplateContent';
import { TEMPLATE_IDS } from '../templateSpecificContentService';

describe('Mobile Template Content', () => {
  describe('iOS Developer Content', () => {
    it('should have correct template ID', () => {
      expect(iOSDeveloperContent.templateId).toBe(TEMPLATE_IDS.MOBILE_IOS);
    });

    it('should have iOS-specific skills', () => {
      const skillNames = iOSDeveloperContent.skills.map(skill => skill.name.toLowerCase());
      expect(skillNames).toContain('swift');
      expect(skillNames).toContain('swiftui');
      expect(skillNames).toContain('uikit');
      expect(skillNames).toContain('core data');
      expect(skillNames).toContain('xcode');
      expect(skillNames).toContain('ios sdk');
    });

    it('should have iOS-specific projects', () => {
      const projects = iOSDeveloperContent.projects;
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].technologies).toContain('Swift');
      expect(projects[0].roleSpecific).toBe(true);
    });

    it('should have professional summary mentioning iOS', () => {
      expect(iOSDeveloperContent.professionalSummary.toLowerCase()).toContain('ios');
      expect(iOSDeveloperContent.professionalSummary.toLowerCase()).toContain('swift');
    });

    it('should have senior experience level', () => {
      expect(iOSDeveloperContent.metadata.experienceLevel).toBe('senior');
      expect(iOSDeveloperContent.metadata.targetRole).toBe('mobile-developer');
    });
  });

  describe('Android Developer Content', () => {
    it('should have correct template ID', () => {
      expect(androidDeveloperContent.templateId).toBe(TEMPLATE_IDS.MOBILE_ANDROID);
    });

    it('should have Android-specific skills', () => {
      const skillNames = androidDeveloperContent.skills.map(skill => skill.name.toLowerCase());
      expect(skillNames).toContain('kotlin');
      expect(skillNames).toContain('java');
      expect(skillNames).toContain('jetpack compose');
      expect(skillNames).toContain('android sdk');
      expect(skillNames).toContain('room database');
      expect(skillNames).toContain('android studio');
    });

    it('should have Android-specific projects', () => {
      const projects = androidDeveloperContent.projects;
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].technologies).toContain('Kotlin');
      expect(projects[0].roleSpecific).toBe(true);
    });

    it('should have professional summary mentioning Android', () => {
      expect(androidDeveloperContent.professionalSummary.toLowerCase()).toContain('android');
      expect(androidDeveloperContent.professionalSummary.toLowerCase()).toContain('kotlin');
    });

    it('should have mid experience level', () => {
      expect(androidDeveloperContent.metadata.experienceLevel).toBe('mid');
      expect(androidDeveloperContent.metadata.targetRole).toBe('mobile-developer');
    });
  });

  describe('React Native Developer Content', () => {
    it('should have correct template ID', () => {
      expect(reactNativeDeveloperContent.templateId).toBe(TEMPLATE_IDS.MOBILE_REACT_NATIVE);
    });

    it('should have React Native-specific skills', () => {
      const skillNames = reactNativeDeveloperContent.skills.map(skill => skill.name.toLowerCase());
      expect(skillNames).toContain('react native');
      expect(skillNames).toContain('javascript');
      expect(skillNames).toContain('typescript');
      expect(skillNames).toContain('redux');
      expect(skillNames).toContain('firebase');
      expect(skillNames).toContain('react');
    });

    it('should have React Native-specific projects', () => {
      const projects = reactNativeDeveloperContent.projects;
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].technologies).toContain('React Native');
      expect(projects[0].roleSpecific).toBe(true);
    });

    it('should have professional summary mentioning React Native', () => {
      expect(reactNativeDeveloperContent.professionalSummary.toLowerCase()).toContain('react native');
      expect(reactNativeDeveloperContent.professionalSummary.toLowerCase()).toContain('cross-platform');
    });

    it('should have mid experience level', () => {
      expect(reactNativeDeveloperContent.metadata.experienceLevel).toBe('mid');
      expect(reactNativeDeveloperContent.metadata.targetRole).toBe('mobile-developer');
    });

    it('should have cross-platform focus in projects', () => {
      const projects = reactNativeDeveloperContent.projects;
      projects.forEach(project => {
        expect(project.description.toLowerCase()).toMatch(/cross-platform|ios.*android|both platforms/);
      });
    });
  });

  describe('Content Quality Validation', () => {
    const allContents = [iOSDeveloperContent, androidDeveloperContent, reactNativeDeveloperContent];

    allContents.forEach((content, index) => {
      const contentNames = ['iOS', 'Android', 'React Native'];
      
      describe(`${contentNames[index]} Developer Content Quality`, () => {
        it('should have valid personal info', () => {
          expect(content.personalInfo.name).toBeTruthy();
          expect(content.personalInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
          expect(content.personalInfo.title).toBeTruthy();
        });

        it('should have professional summary', () => {
          expect(content.professionalSummary).toBeTruthy();
          expect(content.professionalSummary.length).toBeGreaterThan(50);
        });

        it('should have core skills with high relevance scores', () => {
          const coreSkills = content.skills.filter(skill => skill.isCore);
          expect(coreSkills.length).toBeGreaterThan(0);
          coreSkills.forEach(skill => {
            expect(skill.relevanceScore).toBeGreaterThanOrEqual(7);
          });
        });

        it('should have work experience with achievements', () => {
          expect(content.experiences.length).toBeGreaterThan(0);
          content.experiences.forEach(exp => {
            expect(exp.achievements.length).toBeGreaterThan(0);
            expect(exp.technologies.length).toBeGreaterThan(0);
          });
        });

        it('should have role-specific projects', () => {
          const roleSpecificProjects = content.projects.filter(p => p.roleSpecific);
          expect(roleSpecificProjects.length).toBeGreaterThan(0);
        });

        it('should have proper metadata', () => {
          expect(content.metadata.targetRole).toBe('mobile-developer');
          expect(content.metadata.industry).toBe('technology');
          expect(['entry', 'mid', 'senior', 'executive']).toContain(content.metadata.experienceLevel);
        });
      });
    });
  });

  describe('Content Differentiation', () => {
    it('should have different skills across mobile platforms', () => {
      const iosSkills = iOSDeveloperContent.skills.map(s => s.name);
      const androidSkills = androidDeveloperContent.skills.map(s => s.name);
      const reactNativeSkills = reactNativeDeveloperContent.skills.map(s => s.name);

      // iOS should have Swift, SwiftUI
      expect(iosSkills).toContain('Swift');
      expect(iosSkills).toContain('SwiftUI');
      
      // Android should have Kotlin, Jetpack Compose
      expect(androidSkills).toContain('Kotlin');
      expect(androidSkills).toContain('Jetpack Compose');
      
      // React Native should have React Native, JavaScript
      expect(reactNativeSkills).toContain('React Native');
      expect(reactNativeSkills).toContain('JavaScript');
    });

    it('should have different project technologies', () => {
      const iosProjectTechs = iOSDeveloperContent.projects.flatMap(p => p.technologies);
      const androidProjectTechs = androidDeveloperContent.projects.flatMap(p => p.technologies);
      const reactNativeProjectTechs = reactNativeDeveloperContent.projects.flatMap(p => p.technologies);

      expect(iosProjectTechs).toContain('Swift');
      expect(androidProjectTechs).toContain('Kotlin');
      expect(reactNativeProjectTechs).toContain('React Native');
    });

    it('should have platform-specific achievements', () => {
      expect(iOSDeveloperContent.achievements.some(a => a.toLowerCase().includes('app store'))).toBe(true);
      expect(androidDeveloperContent.achievements.some(a => a.toLowerCase().includes('play store') || a.toLowerCase().includes('android'))).toBe(true);
      expect(reactNativeDeveloperContent.achievements.some(a => a.toLowerCase().includes('cross-platform') || a.toLowerCase().includes('react native'))).toBe(true);
    });
  });
});