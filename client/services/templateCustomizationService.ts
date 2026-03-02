/**
 * Template Customization Service
 * Handles template customization options with database persistence via APIs
 */

export interface TemplateCustomization {
  id: number;
  templateId: string;
  userId?: number;
  name: string;

  // Color customization
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    muted: string;
  };

  // Typography
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    // Extended typography settings
    fontSizeScale?: number;
    letterSpacing?: number;
    headingWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
    bodyWeight?: 'light' | 'normal' | 'medium';
  };

  // Layout
  layout: {
    style: 'single-column' | 'two-column' | 'sidebar';
    spacing: number;
    borderRadius: number;
    showBorders: boolean;
    // Extended layout settings
    density?: 'compact' | 'standard' | 'spacious';
    maxWidth?: 'narrow' | 'standard' | 'wide';
    sectionSpacing?: number;
    cardPadding?: number;
  };

  // Section visibility and order
  sections: {
    showProfileImage: boolean;
    showSkillBars: boolean;
    showRatings: boolean;
    order: string[];
  };
  sectionOrder: string[];
  visibleSections: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomizationRequest {
  templateId: string;
  name: string;
  colors: TemplateCustomization['colors'];
  typography: TemplateCustomization['typography'];
  layout: TemplateCustomization['layout'];
  sections: TemplateCustomization['sections'];
  isDefault?: boolean;
}

export interface UpdateCustomizationRequest {
  name?: string;
  colors?: TemplateCustomization['colors'];
  typography?: TemplateCustomization['typography'];
  layout?: TemplateCustomization['layout'];
  sections?: TemplateCustomization['sections'];
  isDefault?: boolean;
}

export interface ShareCustomizationResponse {
  shareToken: string;
  shareUrl: string;
  isPublic: boolean;
  expiresAt?: string;
}

export const defaultCustomization: Omit<TemplateCustomization, 'id' | 'templateId' | 'createdAt' | 'updatedAt'> = {
  userId: undefined,
  name: '🎯 Executive Blue (Default)',
  colors: {
    primary: '#1E40AF',    // Deep professional blue - perfect for headers and key elements
    secondary: '#475569',   // Sophisticated slate gray - ideal for supporting text
    accent: '#06B6D4',     // Vibrant cyan - great for highlights and progress bars
    text: '#1E293B',       // Rich dark gray - ensures excellent readability
    background: '#FFFFFF', // Pure white - provides clean, professional backdrop
    muted: '#94a3b8'       // Subtle gray for secondary elements and dividers
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 16,          // Optimal reading size for professional documents
    lineHeight: 1.6,       // Perfect balance for readability and compactness
    fontWeight: 'normal',
    fontSizeScale: 1.0,
    letterSpacing: -0.01,  // Slight tightening for professional look
    headingWeight: 'semibold',  // Strong but not overwhelming
    bodyWeight: 'normal'
  },
  layout: {
    style: 'two-column',   // Classic professional layout
    spacing: 18,           // Generous spacing for clean appearance
    borderRadius: 12,      // Modern rounded corners
    showBorders: false,    // Clean borderless design
    density: 'standard',   // Perfect balance of information and white space
    maxWidth: 'standard',  // Optimal width for scanning
    sectionSpacing: 2.5,   // Well-spaced sections for easy navigation
    cardPadding: 1.8       // Comfortable padding for content cards
  },
  sections: {
    showProfileImage: true,
    showSkillBars: true,    // Visual skill representation
    showRatings: true,      // Professional skill ratings
    order: ['header', 'summary', 'skills', 'projects', 'experience', 'education']  // Optimized order for recruiter scanning
  },
  sectionOrder: ['header', 'summary', 'skills', 'projects', 'experience', 'education'],
  visibleSections: ['header', 'summary', 'skills', 'projects', 'experience', 'education']
};

/**
 * Template Customization Service - API-based with database persistence
 */
export class TemplateCustomizationService {
  private static baseUrl = '/api/template-customizations';
  private static cache: Map<string, TemplateCustomization[]> = new Map();

  /**
   * Get authentication token from localStorage
   */
  private static getAuthToken(): string | null {
    // Check multiple possible token storage keys
    let token = localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt');

    console.log('🔐 TemplateCustomizationService - Getting auth token:', {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      availableKeys: Object.keys(localStorage).filter(key =>
        key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')
      )
    });
    return token;
  }

  /**
   * Make authenticated API request
   */
  private static async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const token = this.getAuthToken();
    const fullUrl = `${this.baseUrl}${endpoint}`;

    console.log('🌍 TemplateCustomizationService - API Request:', {
      url: fullUrl,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      console.log('🔍 Response status:', response.status, response.statusText);

      // Check if response has content
      const contentType = response.headers.get('content-type');
      console.log('🔍 Content-Type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Server did not return JSON. Content-Type:', contentType);
        const text = await response.text();
        console.error('❌ Response text:', text);
        throw new Error(`Server returned ${contentType} instead of JSON`);
      }

      const text = await response.text();
      console.log('🔍 Response text length:', text.length);

      if (!text) {
        throw new Error('Empty response from server');
      }

      let result: any;
      try {
        result = JSON.parse(text);
        console.log('✅ Parsed JSON result:', result);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Response text:', text.substring(0, 1000));
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, result);
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error('❌ API request failed:', {
        url: fullUrl,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Create a new customization
   */
  static async createCustomization(
    templateId: string,
    customization: Partial<CreateCustomizationRequest>
  ): Promise<TemplateCustomization> {
    console.log('📝 TemplateCustomizationService - Creating customization:', {
      templateId,
      customization,
      hasAuthToken: !!this.getAuthToken()
    });

    const requestData: CreateCustomizationRequest = {
      templateId,
      name: customization.name || 'My Customization',
      colors: customization.colors || defaultCustomization.colors,
      typography: customization.typography || defaultCustomization.typography,
      layout: customization.layout || defaultCustomization.layout,
      sections: customization.sections || defaultCustomization.sections,
      isDefault: customization.isDefault || false,
    };

    console.log('📝 Request data:', requestData);
    console.log('📝 Request URL:', `${this.baseUrl}`);

    try {
      const result = await this.apiRequest<TemplateCustomization>('', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('✅ API response:', result);

      if (!result.success || !result.data) {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error || 'Failed to create customization');
      }

      // Clear cache for this template
      this.cache.delete(templateId);

      console.log('✨ Successfully created customization:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error in createCustomization:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        templateId,
        requestData
      });
      throw error;
    }
  }

  /**
   * Update an existing customization
   */
  static async updateCustomization(
    id: number,
    updates: UpdateCustomizationRequest
  ): Promise<TemplateCustomization> {
    const result = await this.apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to update customization');
    }

    // Clear cache
    this.cache.clear();

    // Return updated customization by fetching it
    return this.getCustomization(id);
  }

  /**
   * Get customization by ID
   */
  static async getCustomization(id: number): Promise<TemplateCustomization> {
    const result = await this.apiRequest<TemplateCustomization>(`/${id}`);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Customization not found');
    }

    return result.data;
  }

  /**
   * Get all customizations for a template
   */
  static async getCustomizationsForTemplate(templateId: string): Promise<TemplateCustomization[]> {
    // Check cache first
    if (this.cache.has(templateId)) {
      return this.cache.get(templateId)!;
    }

    const result = await this.apiRequest<TemplateCustomization[]>(`?templateId=${templateId}`);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch customizations');
    }

    // Cache the results
    this.cache.set(templateId, result.data);

    return result.data;
  }

  /**
   * Get all customizations for current user
   */
  static async getAllCustomizations(): Promise<TemplateCustomization[]> {
    const result = await this.apiRequest<TemplateCustomization[]>('');

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch customizations');
    }

    return result.data;
  }

  /**
   * Delete a customization
   */
  static async deleteCustomization(id: number): Promise<boolean> {
    const result = await this.apiRequest(`/${id}`, {
      method: 'DELETE',
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete customization');
    }

    // Clear cache
    this.cache.clear();

    return true;
  }

  /**
   * Share a customization
   */
  static async shareCustomization(
    id: number,
    options: { isPublic?: boolean; expiresIn?: number } = {}
  ): Promise<ShareCustomizationResponse> {
    const result = await this.apiRequest<ShareCustomizationResponse>(`/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(options),
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create share link');
    }

    return result.data;
  }

  /**
   * Get shared customization by token
   */
  static async getSharedCustomization(token: string): Promise<TemplateCustomization> {
    const result = await this.apiRequest<TemplateCustomization>(`/shared/${token}`);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Shared customization not found');
    }

    return result.data;
  }

  /**
   * Create a temporary customization for preview (not saved to database)
   */
  static createTemporaryCustomization(
    templateId: string,
    customization: Partial<TemplateCustomization>
  ): TemplateCustomization {
    const now = new Date().toISOString();

    return {
      id: -1, // Temporary ID
      templateId,
      name: customization.name || 'Preview',
      ...defaultCustomization,
      ...customization,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Apply customization to template CSS variables
   */
  static applyCustomization(customization: TemplateCustomization): Record<string, string> {
    // Provide safe defaults for potentially undefined values
    const safeCustomization = {
      colors: {
        primary: customization.colors?.primary || '#3b82f6',
        secondary: customization.colors?.secondary || '#6b7280',
        accent: customization.colors?.accent || '#10b981',
        text: customization.colors?.text || '#1f2937',
        background: customization.colors?.background || '#ffffff'
      },
      typography: {
        fontFamily: customization.typography?.fontFamily || 'Inter, sans-serif',
        fontSize: customization.typography?.fontSize || 14,
        lineHeight: customization.typography?.lineHeight || 1.5,
        fontWeight: customization.typography?.fontWeight || 'normal',
        fontSizeScale: customization.typography?.fontSizeScale || 1.0,
        letterSpacing: customization.typography?.letterSpacing || 0,
        headingWeight: customization.typography?.headingWeight || 'semibold',
        bodyWeight: customization.typography?.bodyWeight || 'normal'
      },
      layout: {
        spacing: customization.layout?.spacing || 16,
        borderRadius: customization.layout?.borderRadius || 8,
        showBorders: customization.layout?.showBorders ?? true,
        density: customization.layout?.density || 'standard',
        maxWidth: customization.layout?.maxWidth || 'standard',
        sectionSpacing: customization.layout?.sectionSpacing || 2,
        cardPadding: customization.layout?.cardPadding || 1.5
      }
    };

    // Calculate density multiplier
    const densityMultipliers = { compact: 0.75, standard: 1.0, spacious: 1.5 };
    const densityMultiplier = densityMultipliers[safeCustomization.layout.density];

    // Calculate max width values
    const maxWidthValues = { narrow: '42rem', standard: '56rem', wide: '72rem' };
    const maxWidth = maxWidthValues[safeCustomization.layout.maxWidth];

    // Calculate font weight values
    const fontWeights = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' };
    const headingWeight = fontWeights[safeCustomization.typography.headingWeight];
    const bodyWeight = fontWeights[safeCustomization.typography.bodyWeight];
    const mainFontWeight = fontWeights[safeCustomization.typography.fontWeight] || fontWeights['normal'];

    return {
      // Color variables
      '--template-primary-color': safeCustomization.colors.primary,
      '--template-secondary-color': safeCustomization.colors.secondary,
      '--template-accent-color': safeCustomization.colors.accent,
      '--text-slate-700': safeCustomization.colors.text,
      '--template-background-color': safeCustomization.colors.background,

      // Typography variables
      '--template-font-family': safeCustomization.typography.fontFamily,
      '--template-font-size': `${safeCustomization.typography.fontSize * safeCustomization.typography.fontSizeScale}px`,
      '--template-line-height': safeCustomization.typography.lineHeight.toString(),
      '--template-font-weight': mainFontWeight,
      '--template-letter-spacing': `${safeCustomization.typography.letterSpacing}em`,
      '--template-heading-weight': headingWeight,
      '--template-body-weight': bodyWeight,

      // Layout variables
      '--template-spacing': `${safeCustomization.layout.spacing}px`,
      '--template-border-radius': `${safeCustomization.layout.borderRadius}px`,
      '--template-show-borders': safeCustomization.layout.showBorders ? '1' : '0',
      '--template-max-width': maxWidth,
      '--template-section-spacing': `${safeCustomization.layout.sectionSpacing * densityMultiplier}rem`,
      '--template-card-padding': `${safeCustomization.layout.cardPadding * densityMultiplier}rem`,
      '--template-density-multiplier': densityMultiplier.toString()
    };
  }

  /**
   * Generate CSS string from customization
   */
  static generateCustomCSS(customization: TemplateCustomization): string {
    const variables = this.applyCustomization(customization);
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    return `:root {\n${cssVars}\n}`;
  }

  /**
   * Clear cache (useful for logout or data refresh)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get default customization
   */
  static getDefaultCustomization(): Omit<TemplateCustomization, 'id' | 'templateId' | 'createdAt' | 'updatedAt'> {
    return defaultCustomization;
  }

  /**
   * Get popular color presets with enhanced aesthetic combinations
   */
  static getColorPresets(): Array<{name: string; colors: TemplateCustomization['colors']; description: string}> {
    return [
      {
        name: '🎯 Executive Blue (Default)',
        description: 'Perfect balance of professionalism and trust - ideal for executives, managers, and corporate roles',
        colors: {
          primary: '#1E40AF',
          secondary: '#475569',
          accent: '#06B6D4',
          text: '#1E293B',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '💎 Platinum Elegance',
        description: 'Sophisticated and timeless - perfect for luxury brands, consulting, and high-end services',
        colors: {
          primary: '#334155',
          secondary: '#64748B',
          accent: '#F59E0B',
          text: '#0F172A',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '🚀 Innovation Purple',
        description: 'Creative and forward-thinking - ideal for tech innovators, designers, and creative professionals',
        colors: {
          primary: '#7C3AED',
          secondary: '#6B7280',
          accent: '#EC4899',
          text: '#1F2937',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '🌱 Growth Green',
        description: 'Fresh and sustainable - perfect for environmental, healthcare, and growth-focused roles',
        colors: {
          primary: '#059669',
          secondary: '#475569',
          accent: '#3B82F6',
          text: '#1F2937',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '🔥 Dynamic Orange',
        description: 'Energetic and confident - ideal for sales, marketing, and leadership positions',
        colors: {
          primary: '#EA580C',
          secondary: '#6B7280',
          accent: '#DC2626',
          text: '#1F2937',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '🏆 Prestige Gold',
        description: 'Luxurious and prestigious - perfect for senior executives, finance, and premium services',
        colors: {
          primary: '#92400E',
          secondary: '#57534E',
          accent: '#DC2626',
          text: '#1C1917',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '🌊 Ocean Teal',
        description: 'Calm and trustworthy - excellent for healthcare, education, and consulting professionals',
        colors: {
          primary: '#0F766E',
          secondary: '#64748B',
          accent: '#3B82F6',
          text: '#1F2937',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      },
      {
        name: '🎨 Creative Coral',
        description: 'Warm and approachable - perfect for creative fields, education, and customer-facing roles',
        colors: {
          primary: '#DC2626',
          secondary: '#6B7280',
          accent: '#F59E0B',
          text: '#1F2937',
          background: '#FFFFFF',
          muted: '#94a3b8'
        }
      }
    ];
  }
}

// Service is ready - no initialization needed for API-based service