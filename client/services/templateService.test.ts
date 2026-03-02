import { describe, it, expect } from 'vitest';
import {
  getTemplateVariations,
  getTemplateVariation,
  getAllTemplateVariations,
  getTemplateVariationsByVisualStyle,
  getAvailableVisualStyles,
  getTemplateVariationMetadata,
  selectBestTemplateVariation,
  compareTemplateVariations,
  searchTemplateVariations,
  filterTemplateVariations,
} from './templateService';
import type { VisualStyle } from './templateService';

describe('Template Variation System', () => {
  describe('getTemplateVariations', () => {
    it('should return all variations for technology category', () => {
      const variations = getTemplateVariations('technology');
      expect(variations).toHaveLength(5);
      expect(variations.map(v => v.name)).toEqual([
        'Minimal Tech',
        'Bold Tech',
        'Creative Tech',
        'Corporate Tech',
        'Modern Tech'
      ]);
    });

    it('should return all variations for design category', () => {
      const variations = getTemplateVariations('design');
      expect(variations).toHaveLength(5);
      expect(variations.map(v => v.name)).toEqual([
        'Minimal Designer',
        'Bold Designer',
        'Creative Designer',
        'Corporate Designer',
        'Modern Designer'
      ]);
    });

    it('should return all variations for management category', () => {
      const variations = getTemplateVariations('management');
      expect(variations).toHaveLength(5);
      expect(variations.map(v => v.name)).toEqual([
        'Minimal Executive',
        'Bold Executive',
        'Creative Executive',
        'Corporate Executive',
        'Modern Executive'
      ]);
    });

    it('should return empty array for non-existent category', () => {
      const variations = getTemplateVariations('nonexistent');
      expect(variations).toHaveLength(0);
    });
  });

  describe('getTemplateVariation', () => {
    it('should return specific variation for technology minimal', () => {
      const variation = getTemplateVariation('technology', 'minimal');
      expect(variation).toBeDefined();
      expect(variation?.name).toBe('Minimal Tech');
      expect(variation?.id).toBe('tech-minimal-1');
    });

    it('should return specific variation for design bold', () => {
      const variation = getTemplateVariation('design', 'bold');
      expect(variation).toBeDefined();
      expect(variation?.name).toBe('Bold Designer');
      expect(variation?.id).toBe('design-bold-1');
    });

    it('should return undefined for non-existent combination', () => {
      const variation = getTemplateVariation('nonexistent', 'minimal');
      expect(variation).toBeUndefined();
    });
  });

  describe('getAllTemplateVariations', () => {
    it('should return all variations from all categories', () => {
      const allVariations = getAllTemplateVariations();
      expect(allVariations).toHaveLength(15); // 3 categories × 5 variations each
      
      // Check that we have variations from all categories
      const categories = [...new Set(allVariations.map(v => v.category))];
      expect(categories).toContain('technology');
      expect(categories).toContain('design');
      expect(categories).toContain('management');
    });
  });

  describe('getTemplateVariationsByVisualStyle', () => {
    it('should return all minimal variations', () => {
      const minimalVariations = getTemplateVariationsByVisualStyle('minimal');
      expect(minimalVariations).toHaveLength(3);
      expect(minimalVariations.map(v => v.name)).toEqual([
        'Minimal Tech',
        'Minimal Designer',
        'Minimal Executive'
      ]);
    });

    it('should return all bold variations', () => {
      const boldVariations = getTemplateVariationsByVisualStyle('bold');
      expect(boldVariations).toHaveLength(3);
      expect(boldVariations.map(v => v.name)).toEqual([
        'Bold Tech',
        'Bold Designer',
        'Bold Executive'
      ]);
    });
  });

  describe('getAvailableVisualStyles', () => {
    it('should return all visual styles for technology', () => {
      const styles = getAvailableVisualStyles('technology');
      expect(styles).toEqual(['minimal', 'bold', 'creative', 'corporate', 'modern']);
    });

    it('should return empty array for non-existent category', () => {
      const styles = getAvailableVisualStyles('nonexistent');
      expect(styles).toEqual([]);
    });
  });

  describe('getTemplateVariationMetadata', () => {
    it('should return metadata for existing template', () => {
      const metadata = getTemplateVariationMetadata('tech-minimal-1');
      expect(metadata).toBeDefined();
      expect(metadata?.category).toBe('technology');
      expect(metadata?.style).toBe('minimal');
      expect(metadata?.variation.name).toBe('Minimal Tech');
    });

    it('should return undefined for non-existent template', () => {
      const metadata = getTemplateVariationMetadata('nonexistent-id');
      expect(metadata).toBeUndefined();
    });
  });

  describe('selectBestTemplateVariation', () => {
    it('should return specific style when requested', () => {
      const template = selectBestTemplateVariation('technology', { visualStyle: 'bold' });
      expect(template?.name).toBe('Bold Tech');
    });

    it('should return appropriate template based on experience level', () => {
      const entryTemplate = selectBestTemplateVariation('technology', { experienceLevel: 'entry' });
      expect(entryTemplate?.name).toBe('Minimal Tech');

      const seniorTemplate = selectBestTemplateVariation('technology', { experienceLevel: 'senior' });
      expect(seniorTemplate?.name).toBe('Corporate Tech');

      const executiveTemplate = selectBestTemplateVariation('technology', { experienceLevel: 'executive' });
      expect(executiveTemplate?.name).toBe('Bold Tech');
    });

    it('should return modern variation as default', () => {
      const template = selectBestTemplateVariation('technology', {});
      expect(template?.name).toBe('Modern Tech');
    });

    it('should return undefined for non-existent category', () => {
      const template = selectBestTemplateVariation('nonexistent', {});
      expect(template).toBeUndefined();
    });
  });

  describe('compareTemplateVariations', () => {
    it('should identify differences between templates', () => {
      const comparison = compareTemplateVariations(['tech-minimal-1', 'tech-bold-1']);
      expect(comparison.templates).toHaveLength(2);
      expect(comparison.differences.colors).toBe(true);
      expect(comparison.differences.typography).toBe(true);
    });

    it('should handle single template', () => {
      const comparison = compareTemplateVariations(['tech-minimal-1']);
      expect(comparison.templates).toHaveLength(1);
      expect(comparison.differences.colors).toBe(false);
    });

    it('should handle non-existent templates', () => {
      const comparison = compareTemplateVariations(['nonexistent-1', 'nonexistent-2']);
      expect(comparison.templates).toHaveLength(0);
    });
  });

  describe('searchTemplateVariations', () => {
    it('should find templates by name', () => {
      const results = searchTemplateVariations('minimal');
      expect(results).toHaveLength(3);
      expect(results.every(t => t.name.toLowerCase().includes('minimal'))).toBe(true);
    });

    it('should find templates by description', () => {
      const results = searchTemplateVariations('clean');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.description.toLowerCase().includes('clean'))).toBe(true);
    });

    it('should find templates by industry', () => {
      const results = searchTemplateVariations('technology');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.industry.toLowerCase().includes('technology'))).toBe(true);
    });
  });

  describe('filterTemplateVariations', () => {
    it('should filter by categories', () => {
      const results = filterTemplateVariations({ categories: ['technology'] });
      expect(results).toHaveLength(5);
      expect(results.every(t => t.category === 'technology')).toBe(true);
    });

    it('should filter by visual styles', () => {
      const results = filterTemplateVariations({ visualStyles: ['minimal'] });
      expect(results).toHaveLength(3);
      expect(results.every(t => t.name.includes('Minimal'))).toBe(true);
    });

    it('should filter by industries', () => {
      const results = filterTemplateVariations({ industries: ['Design'] });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.industry.includes('Design'))).toBe(true);
    });

    it('should filter by features', () => {
      const results = filterTemplateVariations({ features: ['showTechStack'] });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.features.showTechStack)).toBe(true);
    });

    it('should apply multiple filters', () => {
      const results = filterTemplateVariations({
        categories: ['technology'],
        visualStyles: ['minimal', 'bold']
      });
      expect(results).toHaveLength(2);
      expect(results.every(t => t.category === 'technology')).toBe(true);
      expect(results.every(t => t.name.includes('Minimal') || t.name.includes('Bold'))).toBe(true);
    });
  });
});