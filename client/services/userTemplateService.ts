/**
 * User Template Service
 * Manages user-specific template customizations and saved templates
 */

import { TemplateConfig } from './templateService';
import { 
  CustomizationData, 
  CustomTemplateConfig, 
  templateCustomizationEngine 
} from './templateCustomizationEngine';

export interface SavedTemplate {
  id: string;
  name: string;
  baseTemplateId: string;
  customizationId: string;
  userId: string;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
  tags: string[];
  isPublic: boolean;
}

export interface TemplateUsageRecord {
  templateId: string;
  customizationId?: string;
  usedAt: Date;
  context: 'builder' | 'preview' | 'export';
}

export interface UserTemplatePreferences {
  userId: string;
  favoriteTemplates: string[];
  recentTemplates: string[];
  defaultCustomizations: Record<string, Partial<CustomizationData>>;
  preferredCategories: string[];
  lastUsedTemplate?: string;
  customizationSettings: {
    autoSave: boolean;
    previewMode: 'realtime' | 'manual';
    defaultColorScheme?: string;
    defaultFontCombination?: string;
  };
}

/**
 * User Template Service
 * Handles user-specific template operations, preferences, and customizations
 */
export class UserTemplateService {
  private static instance: UserTemplateService;
  private savedTemplates: Map<string, SavedTemplate> = new Map();
  private userPreferences: Map<string, UserTemplatePreferences> = new Map();
  private usageHistory: Map<string, TemplateUsageRecord[]> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): UserTemplateService {
    if (!UserTemplateService.instance) {
      UserTemplateService.instance = new UserTemplateService();
    }
    return UserTemplateService.instance;
  }

  /**
   * Save a customized template for a user
   */
  async saveCustomTemplate(
    userId: string,
    name: string,
    baseTemplate: TemplateConfig,
    customization: CustomizationData,
    tags: string[] = [],
    isPublic: boolean = false
  ): Promise<string> {
    const customizationId = templateCustomizationEngine.saveCustomization(
      userId,
      baseTemplate.id,
      customization
    );

    const savedTemplate: SavedTemplate = {
      id: `${userId}-${Date.now()}`,
      name,
      baseTemplateId: baseTemplate.id,
      customizationId,
      userId,
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      tags,
      isPublic
    };

    this.savedTemplates.set(savedTemplate.id, savedTemplate);
    this.saveToStorage();

    return savedTemplate.id;
  }

  /**
   * Get saved templates for a user
   */
  getUserSavedTemplates(userId: string): SavedTemplate[] {
    return Array.from(this.savedTemplates.values())
      .filter(template => template.userId === userId)
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  /**
   * Get a saved template by ID
   */
  getSavedTemplate(templateId: string): SavedTemplate | null {
    return this.savedTemplates.get(templateId) || null;
  }

  /**
   * Delete a saved template
   */
  async deleteSavedTemplate(userId: string, templateId: string): Promise<boolean> {
    const template = this.savedTemplates.get(templateId);
    if (!template || template.userId !== userId) {
      return false;
    }

    // Delete the customization
    templateCustomizationEngine.deleteCustomization(userId, template.customizationId);
    
    // Delete the saved template
    this.savedTemplates.delete(templateId);
    this.saveToStorage();

    return true;
  }

  /**
   * Create a custom template config from saved template
   */
  async createCustomTemplateFromSaved(
    savedTemplateId: string,
    baseTemplate: TemplateConfig
  ): Promise<CustomTemplateConfig | null> {
    const savedTemplate = this.getSavedTemplate(savedTemplateId);
    if (!savedTemplate) return null;

    const customization = templateCustomizationEngine.loadCustomization(savedTemplate.customizationId);
    if (!customization) return null;

    return templateCustomizationEngine.createCustomTemplate(
      baseTemplate,
      customization,
      savedTemplate.customizationId
    );
  }

  /**
   * Get user template preferences
   */
  getUserPreferences(userId: string): UserTemplatePreferences {
    const existing = this.userPreferences.get(userId);
    if (existing) return existing;

    const defaultPreferences: UserTemplatePreferences = {
      userId,
      favoriteTemplates: [],
      recentTemplates: [],
      defaultCustomizations: {},
      preferredCategories: [],
      customizationSettings: {
        autoSave: true,
        previewMode: 'realtime'
      }
    };

    this.userPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  /**
   * Update user template preferences
   */
  updateUserPreferences(userId: string, updates: Partial<UserTemplatePreferences>): void {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...updates };
    this.userPreferences.set(userId, updated);
    this.saveToStorage();
  }

  /**
   * Add template to favorites
   */
  addToFavorites(userId: string, templateId: string): void {
    const preferences = this.getUserPreferences(userId);
    if (!preferences.favoriteTemplates.includes(templateId)) {
      preferences.favoriteTemplates.push(templateId);
      this.updateUserPreferences(userId, preferences);
    }
  }

  /**
   * Remove template from favorites
   */
  removeFromFavorites(userId: string, templateId: string): void {
    const preferences = this.getUserPreferences(userId);
    preferences.favoriteTemplates = preferences.favoriteTemplates.filter(id => id !== templateId);
    this.updateUserPreferences(userId, preferences);
  }

  /**
   * Record template usage
   */
  recordTemplateUsage(
    userId: string,
    templateId: string,
    context: 'builder' | 'preview' | 'export',
    customizationId?: string
  ): void {
    const usage: TemplateUsageRecord = {
      templateId,
      customizationId,
      usedAt: new Date(),
      context
    };

    const userHistory = this.usageHistory.get(userId) || [];
    userHistory.unshift(usage);
    
    // Keep only last 100 usage records
    if (userHistory.length > 100) {
      userHistory.splice(100);
    }
    
    this.usageHistory.set(userId, userHistory);

    // Update recent templates
    const preferences = this.getUserPreferences(userId);
    preferences.recentTemplates = preferences.recentTemplates.filter(id => id !== templateId);
    preferences.recentTemplates.unshift(templateId);
    
    // Keep only last 10 recent templates
    if (preferences.recentTemplates.length > 10) {
      preferences.recentTemplates.splice(10);
    }

    preferences.lastUsedTemplate = templateId;
    this.updateUserPreferences(userId, preferences);

    // Update saved template usage count
    const savedTemplate = Array.from(this.savedTemplates.values())
      .find(t => t.baseTemplateId === templateId && t.userId === userId);
    if (savedTemplate) {
      savedTemplate.usageCount++;
      savedTemplate.lastUsed = new Date();
    }

    this.saveToStorage();
  }

  /**
   * Get template usage statistics for a user
   */
  getTemplateUsageStats(userId: string): {
    totalUsage: number;
    mostUsedTemplates: { templateId: string; count: number }[];
    recentActivity: TemplateUsageRecord[];
    favoriteCount: number;
    savedTemplateCount: number;
  } {
    const userHistory = this.usageHistory.get(userId) || [];
    const preferences = this.getUserPreferences(userId);
    const savedTemplates = this.getUserSavedTemplates(userId);

    // Count template usage
    const usageCounts = new Map<string, number>();
    userHistory.forEach(record => {
      const count = usageCounts.get(record.templateId) || 0;
      usageCounts.set(record.templateId, count + 1);
    });

    const mostUsedTemplates = Array.from(usageCounts.entries())
      .map(([templateId, count]) => ({ templateId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalUsage: userHistory.length,
      mostUsedTemplates,
      recentActivity: userHistory.slice(0, 20),
      favoriteCount: preferences.favoriteTemplates.length,
      savedTemplateCount: savedTemplates.length
    };
  }

  /**
   * Get template recommendations for a user
   */
  getTemplateRecommendations(
    userId: string,
    availableTemplates: TemplateConfig[]
  ): TemplateConfig[] {
    const preferences = this.getUserPreferences(userId);
    const usageStats = this.getTemplateUsageStats(userId);

    // Score templates based on user preferences and usage
    const scoredTemplates = availableTemplates.map(template => {
      let score = 0;

      // Boost score for preferred categories
      if (preferences.preferredCategories.includes(template.category)) {
        score += 10;
      }

      // Boost score for similar templates to frequently used ones
      const similarUsage = usageStats.mostUsedTemplates.find(used => 
        availableTemplates.find(t => t.id === used.templateId)?.category === template.category
      );
      if (similarUsage) {
        score += similarUsage.count;
      }

      // Reduce score for recently used templates to promote variety
      if (preferences.recentTemplates.includes(template.id)) {
        score -= 5;
      }

      // Boost score for favorited templates
      if (preferences.favoriteTemplates.includes(template.id)) {
        score += 15;
      }

      return { template, score };
    });

    // Sort by score and return top recommendations
    return scoredTemplates
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.template);
  }

  /**
   * Export user template data
   */
  exportUserData(userId: string): {
    savedTemplates: SavedTemplate[];
    preferences: UserTemplatePreferences;
    usageHistory: TemplateUsageRecord[];
    customizations: Record<string, CustomizationData>;
  } {
    const savedTemplates = this.getUserSavedTemplates(userId);
    const preferences = this.getUserPreferences(userId);
    const usageHistory = this.usageHistory.get(userId) || [];
    
    // Get all customizations for this user
    const userCustomizations = templateCustomizationEngine.getUserCustomizations(userId);

    return {
      savedTemplates,
      preferences,
      usageHistory,
      customizations: userCustomizations
    };
  }

  /**
   * Import user template data
   */
  async importUserData(
    userId: string,
    data: {
      savedTemplates?: SavedTemplate[];
      preferences?: UserTemplatePreferences;
      usageHistory?: TemplateUsageRecord[];
      customizations?: Record<string, CustomizationData>;
    }
  ): Promise<boolean> {
    try {
      // Import saved templates
      if (data.savedTemplates) {
        data.savedTemplates.forEach(template => {
          if (template.userId === userId) {
            this.savedTemplates.set(template.id, template);
          }
        });
      }

      // Import preferences
      if (data.preferences && data.preferences.userId === userId) {
        this.userPreferences.set(userId, data.preferences);
      }

      // Import usage history
      if (data.usageHistory) {
        this.usageHistory.set(userId, data.usageHistory);
      }

      // Import customizations
      if (data.customizations) {
        Object.entries(data.customizations).forEach(([id, customization]) => {
          templateCustomizationEngine.saveCustomization(userId, customization.templateId, customization);
        });
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load saved templates
      const savedTemplatesData = localStorage.getItem('user-saved-templates');
      if (savedTemplatesData) {
        const templates = JSON.parse(savedTemplatesData);
        Object.entries(templates).forEach(([id, template]: [string, any]) => {
          this.savedTemplates.set(id, {
            ...template,
            createdAt: new Date(template.createdAt),
            lastUsed: new Date(template.lastUsed)
          });
        });
      }

      // Load user preferences
      const preferencesData = localStorage.getItem('user-template-preferences');
      if (preferencesData) {
        const preferences = JSON.parse(preferencesData);
        Object.entries(preferences).forEach(([userId, prefs]: [string, any]) => {
          this.userPreferences.set(userId, prefs);
        });
      }

      // Load usage history
      const usageData = localStorage.getItem('template-usage-history');
      if (usageData) {
        const usage = JSON.parse(usageData);
        Object.entries(usage).forEach(([userId, history]: [string, any]) => {
          this.usageHistory.set(userId, history.map((record: any) => ({
            ...record,
            usedAt: new Date(record.usedAt)
          })));
        });
      }
    } catch (error) {
      console.warn('Failed to load user template data from storage:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    try {
      // Save saved templates
      const savedTemplatesObj = Object.fromEntries(this.savedTemplates);
      localStorage.setItem('user-saved-templates', JSON.stringify(savedTemplatesObj));

      // Save user preferences
      const preferencesObj = Object.fromEntries(this.userPreferences);
      localStorage.setItem('user-template-preferences', JSON.stringify(preferencesObj));

      // Save usage history
      const usageObj = Object.fromEntries(this.usageHistory);
      localStorage.setItem('template-usage-history', JSON.stringify(usageObj));
    } catch (error) {
      console.warn('Failed to save user template data to storage:', error);
    }
  }
}

// Export singleton instance
export const userTemplateService = UserTemplateService.getInstance();