/**
 * Shared skill categories used across the application
 * These categories are used for:
 * - AI-powered skill categorization during resume parsing
 * - Resume builder dropdown options
 * - Skill filtering and grouping in templates
 */

export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Databases',
  'Cloud Platforms',
  'DevOps',
  'Mobile Development',
  'Data Science & AI',
  'Testing & QA',
  'Design & UI/UX',
  'Development Tools',
  'Web Technologies',
  'Soft Skills',
  'Technical',
  'Other'
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

/**
 * Legacy category mappings for backward compatibility
 * Maps old category names to new standardized names
 */
export const LEGACY_CATEGORY_MAPPING: Record<string, SkillCategory> = {
  'Programming': 'Programming Languages',
  'Frameworks': 'Frontend',
  'Tools': 'Development Tools',
  'Cloud': 'Cloud Platforms',
  'Cloud & DevOps': 'DevOps',
  'General': 'Other',
  'Core Skills': 'Technical'
};

/**
 * Get standardized category name, handling legacy mappings
 */
export function normalizeCategory(category: string): SkillCategory {
  // Check if it's already a valid category
  if (SKILL_CATEGORIES.includes(category as SkillCategory)) {
    return category as SkillCategory;
  }
  
  // Check legacy mappings
  if (category in LEGACY_CATEGORY_MAPPING) {
    return LEGACY_CATEGORY_MAPPING[category];
  }
  
  // Default to 'Other'
  return 'Other';
}
