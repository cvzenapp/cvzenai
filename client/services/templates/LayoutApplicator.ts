/**
 * Modular Layout Applicator
 * Handles layout customizations independently from colors and typography
 * Maintains separation of concerns while providing flexible layout control
 */

import { TemplateCustomization } from '../templateCustomizationService';

export interface LayoutConfig {
  style: 'modern-sidebar' | 'classic-two-column' | 'stacked' | 'wide-sidebar' | 'minimal';
  spacing: 'compact' | 'normal' | 'relaxed';
  showBorders: boolean;
  sectionOrder?: string[];
  hiddenSections?: string[];
}

/**
 * Layout Applicator - Modular system for layout customizations
 * Works alongside CSSApplicator without interfering with colors/fonts
 */
export class LayoutApplicator {
  private static readonly LAYOUT_STYLE_ID = 'template-layout-styles';
  
  /**
   * Apply layout configuration to the template
   */
  static apply(customization: TemplateCustomization | null): void {
    console.log('🎯 [LayoutApplicator] Applying layout customization:', customization?.layout);
    console.log('🎯 [LayoutApplicator] Full customization received:', customization);
    
    // Remove existing layout styles
    this.removeExistingStyles();
    
    // If no layout customization, apply a default modern layout to test
    if (!customization?.layout) {
      console.log('⚠️ [LayoutApplicator] No layout customization provided, applying default modern layout');
      
      const defaultLayout = {
        style: 'modern',
        spacing: 'normal',
        showBorders: false
      };
      
      const layoutCSS = this.generateLayoutCSS(defaultLayout);
      this.injectLayoutStyles(layoutCSS);
      
      console.log('✅ [LayoutApplicator] Applied default layout');
      return;
    }
    
    // Generate and apply layout-specific CSS
    const layoutCSS = this.generateLayoutCSS(customization.layout);
    this.injectLayoutStyles(layoutCSS);
    
    // Apply section visibility and ordering
    this.applySectionConfiguration(customization);
    
    console.log('✅ [LayoutApplicator] Layout customization applied successfully');
  }
  
  /**
   * Generate CSS for layout customizations
   */
  private static generateLayoutCSS(layout: any): string {
    const spacing = this.getSpacingValues(layout.spacing || 'normal');
    const showBorders = layout.showBorders ?? true;
    const style = layout.style || 'modern';
    
    console.log('🎨 [LayoutApplicator] Generating CSS with:', {
      style,
      spacing,
      showBorders,
      layout
    });
    
    return `
      /* ==============================================
         MODULAR LAYOUT SYSTEM
         Independent of colors and typography
         ============================================== */
      
      /* Base layout variables */
      :root {
        --layout-main-spacing: ${spacing.main}px;
        --layout-section-spacing: ${spacing.section}px;
        --layout-card-padding: ${spacing.card}px;
        --layout-content-gap: ${spacing.gap}px;
        --layout-show-borders: ${showBorders ? '1' : '0'};
      }
      
      /* Layout Style: ${style} */
      ${this.getLayoutStyleCSS(style, showBorders)}
      
      /* Responsive spacing system */
      .enhanced-tech-template {
        --responsive-padding: var(--layout-main-spacing);
        --responsive-gap: var(--layout-content-gap);
      }
      
      /* Section spacing that respects customization */
      .enhanced-tech-template .hfi-tier-2,
      .enhanced-tech-template .hfi-tier-3 {
        padding-left: var(--layout-main-spacing) !important;
        padding-right: var(--layout-main-spacing) !important;
      }
      
      /* Card spacing system */
      .enhanced-tech-template .card,
      .enhanced-tech-template [class*="card"] {
        padding: var(--layout-card-padding) !important;
        margin-bottom: var(--layout-section-spacing) !important;
      }
      
      /* Border system */
      .enhanced-tech-template .card,
      .enhanced-tech-template [class*="border"] {
        border-width: calc(var(--layout-show-borders) * 1px) !important;
        border-style: solid !important;
      }
      
      /* Grid gap system */
      .enhanced-tech-template .grid {
        gap: var(--layout-content-gap) !important;
      }
      
      /* ==============================================
         RESPONSIVE LAYOUT ADAPTATIONS
         ============================================== */
      
      @media (max-width: 1023px) {
        :root {
          --layout-main-spacing: ${Math.max(spacing.main * 0.75, 16)};
          --layout-section-spacing: ${Math.max(spacing.section * 0.8, 12)};
          --layout-card-padding: ${Math.max(spacing.card * 0.8, 12)};
        }
      }
      
      @media (max-width: 767px) {
        :root {
          --layout-main-spacing: ${Math.max(spacing.main * 0.6, 12)};
          --layout-section-spacing: ${Math.max(spacing.section * 0.7, 8)};
          --layout-card-padding: ${Math.max(spacing.card * 0.7, 8)};
        }
      }
    `;
  }
  
  /**
   * Get layout-specific CSS based on style
   */
  private static getLayoutStyleCSS(style: string, showBorders: boolean): string {
    const borderStyles = showBorders ? 'border: 1px solid rgba(148, 163, 184, 0.2);' : '';
    
    switch (style) {
      case 'modern':
        return `
          /* Modern Layout - Clean sidebar with subtle backgrounds */
          .enhanced-tech-template .hfi-tier-3 > div.grid {
            display: grid !important;
            grid-template-columns: 1fr 350px !important;
            gap: var(--layout-content-gap) !important;
          }
          
          .enhanced-tech-template .hfi-tier-3 > div.grid > div:last-child {
            background: rgba(248, 250, 252, 0.8) !important;
            border-radius: 16px !important;
            padding: var(--layout-card-padding) !important;
            ${borderStyles}
          }
        `;
        
      case 'classic':
        return `
          /* Classic Layout - Traditional two-column with borders */
          .enhanced-tech-template .hfi-tier-3 > div.grid {
            display: grid !important;
            grid-template-columns: 2fr 1fr !important;
            gap: var(--layout-content-gap) !important;
          }
          
          .enhanced-tech-template .hfi-tier-3 > div.grid > div {
            ${borderStyles}
            border-radius: 8px !important;
            padding: var(--layout-card-padding) !important;
            background: white !important;
          }
          
          .enhanced-tech-template .hfi-tier-3 > div.grid > div:first-child {
            border-right-width: 2px !important;
          }
        `;
        
      case 'stacked':
        return `
          /* Stacked Layout - Single column, full width */
          .enhanced-tech-template .hfi-tier-3 > div.grid {
            display: block !important;
            grid-template-columns: none !important;
          }
          
          .enhanced-tech-template .hfi-tier-3 > div.grid > div {
            width: 100% !important;
            margin-bottom: var(--layout-section-spacing) !important;
            ${borderStyles}
            border-radius: 12px !important;
            padding: var(--layout-card-padding) !important;
          }
        `;
        
      case 'wide-sidebar':
        return `
          /* Wide Sidebar Layout - Emphasis on sidebar content */
          .enhanced-tech-template .hfi-tier-3 > div.grid {
            display: grid !important;
            grid-template-columns: 1fr 400px !important;
            gap: var(--layout-content-gap) !important;
          }
          
          .enhanced-tech-template .hfi-tier-3 > div.grid > div:last-child {
            background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.7)) !important;
            border-radius: 20px !important;
            padding: calc(var(--layout-card-padding) * 1.25) !important;
            ${borderStyles}
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
          }
        `;
        
      case 'minimal':
        return `
          /* Minimal Layout - Clean, no borders, generous spacing */
          .enhanced-tech-template .hfi-tier-3 > div.grid {
            display: grid !important;
            grid-template-columns: 1fr 320px !important;
            gap: calc(var(--layout-content-gap) * 1.5) !important;
          }
          
          .enhanced-tech-template .hfi-tier-3 > div.grid > div {
            padding: var(--layout-card-padding) !important;
            border-radius: 0 !important;
            background: transparent !important;
            border: none !important;
          }
        `;
        
      default:
        return '';
    }
  }
  
  /**
   * Get spacing values based on spacing preference
   */
  private static getSpacingValues(spacing: string): {
    main: number;
    section: number;
    card: number;
    gap: number;
  } {
    const spacingMap = {
      compact: { main: 24, section: 16, card: 16, gap: 16 },
      normal: { main: 32, section: 24, card: 24, gap: 24 },
      relaxed: { main: 48, section: 36, card: 32, gap: 32 }
    };
    
    return spacingMap[spacing as keyof typeof spacingMap] || spacingMap.normal;
  }
  
  /**
   * Apply section visibility and ordering
   */
  private static applySectionConfiguration(customization: TemplateCustomization): void {
    if (!customization.sections) return;
    
    // Handle section visibility
    if (customization.sections.order) {
      this.applySectionOrdering(customization.sections.order);
    }
    
    // Handle hidden sections
    if (customization.sections.showProfileImage === false) {
      this.hideSection('.profile-avatar');
    }
    
    if (customization.sections.showSkillBars === false) {
      this.hideSection('.skill-progress');
    }
    
    if (customization.sections.showRatings === false) {
      this.hideSection('.skill-rating');
    }
  }
  
  /**
   * Apply section ordering via CSS flexbox ordering
   */
  private static applySectionOrdering(order: string[]): void {
    const sectionSelectors: Record<string, string> = {
      'header': '.hfi-tier-1',
      'summary': '.hfi-tier-2',
      'experience': '[data-section="experience"]',
      'projects': '[data-section="projects"]',
      'skills': '[data-section="skills"]',
      'education': '[data-section="education"]'
    };
    
    let orderCSS = '';
    order.forEach((sectionKey, index) => {
      const selector = sectionSelectors[sectionKey];
      if (selector) {
        orderCSS += `${selector} { order: ${index + 1}; }\n`;
      }
    });
    
    if (orderCSS) {
      this.injectLayoutStyles(`
        /* Section Ordering */
        .enhanced-tech-template {
          display: flex;
          flex-direction: column;
        }
        ${orderCSS}
      `, 'section-ordering');
    }
  }
  
  /**
   * Hide specific sections
   */
  private static hideSection(selector: string): void {
    this.injectLayoutStyles(`${selector} { display: none !important; }`, 'hidden-sections');
  }
  
  /**
   * Inject layout styles into the document
   */
  private static injectLayoutStyles(css: string, id: string = this.LAYOUT_STYLE_ID): void {
    console.log(`💉 [LayoutApplicator] Injecting CSS with ID: ${id}`);
    console.log('CSS content preview:', css.substring(0, 500) + '...');
    
    // Remove existing style element
    const existing = document.getElementById(id);
    if (existing) {
      console.log(`🗑️ [LayoutApplicator] Removing existing style element: ${id}`);
      existing.remove();
    }
    
    // Create and inject new style element
    const styleElement = document.createElement('style');
    styleElement.id = id;
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    console.log(`✅ [LayoutApplicator] Successfully injected styles: ${id}`);
    
    // Verify injection
    setTimeout(() => {
      const injected = document.getElementById(id);
      if (injected) {
        console.log(`🔍 [LayoutApplicator] Verification: Style element ${id} found in DOM`);
        console.log('DOM contains grid elements:', document.querySelectorAll('.enhanced-tech-template .hfi-tier-3 > div.grid').length);
      } else {
        console.error(`❌ [LayoutApplicator] ERROR: Style element ${id} not found in DOM after injection!`);
      }
    }, 100);
  }
  
  /**
   * Remove all layout-specific styles
   */
  private static removeExistingStyles(): void {
    const ids = [this.LAYOUT_STYLE_ID, 'section-ordering', 'hidden-sections'];
    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
  }
  
  /**
   * Get available layout presets
   */
  static getLayoutPresets(): Array<{
    id: string;
    name: string;
    description: string;
    style: string;
    spacing: string;
    showBorders: boolean;
    preview?: string;
  }> {
    return [
      {
        id: 'modern-balanced',
        name: 'Modern Balanced',
        description: 'Clean sidebar layout with subtle backgrounds',
        style: 'modern',
        spacing: 'normal',
        showBorders: false,
        preview: '🏢 Professional with modern aesthetics'
      },
      {
        id: 'classic-structured',
        name: 'Classic Structured',
        description: 'Traditional two-column with clear borders',
        style: 'classic',
        spacing: 'normal',
        showBorders: true,
        preview: '📄 Traditional resume layout'
      },
      {
        id: 'minimal-clean',
        name: 'Minimal Clean',
        description: 'Ultra-clean with generous white space',
        style: 'minimal',
        spacing: 'relaxed',
        showBorders: false,
        preview: '✨ Minimalist and spacious'
      },
      {
        id: 'compact-efficient',
        name: 'Compact Efficient',
        description: 'Maximum information density',
        style: 'modern',
        spacing: 'compact',
        showBorders: true,
        preview: '📊 Information-dense layout'
      },
      {
        id: 'wide-focus',
        name: 'Wide Focus',
        description: 'Emphasizes sidebar content and skills',
        style: 'wide-sidebar',
        spacing: 'normal',
        showBorders: false,
        preview: '🎯 Skills and education focused'
      }
    ];
  }
}
