import type { CustomizationSettings } from '../../shared/types/customization';

const STORAGE_KEY = 'resume_customization_settings';

class CustomizationService {
  getDefaultSettings(): CustomizationSettings {
    return {
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
        accent: '#3b82f6',
        text: '#1f2937',
        background: '#ffffff'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        lineHeight: 1.6,
        letterSpacing: 0
      },
      layout: {
        spacing: 'normal',
        borderRadius: 8,
        sectionPadding: 16
      }
    };
  }

  applySettings(settings: CustomizationSettings): void {
    const root = document.documentElement;

    // Apply colors
    root.style.setProperty('--color-primary', settings.colors.primary);
    root.style.setProperty('--color-secondary', settings.colors.secondary);
    root.style.setProperty('--color-accent', settings.colors.accent);
    root.style.setProperty('--color-text', settings.colors.text);
    root.style.setProperty('--color-background', settings.colors.background);

    // Apply typography
    root.style.setProperty('--font-family', settings.typography.fontFamily);
    root.style.setProperty('--font-size-base', `${settings.typography.fontSize}px`);
    root.style.setProperty('--line-height', settings.typography.lineHeight.toString());
    root.style.setProperty('--letter-spacing', `${settings.typography.letterSpacing}px`);

    // Apply layout
    const spacingMap = { compact: '0.5rem', normal: '1rem', spacious: '1.5rem' };
    root.style.setProperty('--spacing-unit', spacingMap[settings.layout.spacing]);
    root.style.setProperty('--border-radius', `${settings.layout.borderRadius}px`);
    root.style.setProperty('--section-padding', `${settings.layout.sectionPadding}px`);
  }

  async saveSettings(settings: CustomizationSettings, resumeId?: number, userId?: string | number): Promise<void> {
    console.log('💾 Attempting to save customization settings:', { 
      resumeId, 
      userId, 
      userIdType: typeof userId,
      hasSettings: !!settings 
    });
    
    // Save to localStorage as cache
    if (resumeId) {
      localStorage.setItem(`${STORAGE_KEY}_${resumeId}`, JSON.stringify(settings));
      console.log('✅ Saved to localStorage');
    }

    // Save to database if resumeId and userId provided
    if (resumeId && userId) {
      try {
        const payload = { resumeId, userId, settings };
        // console.log('📡 Sending POST request to /api/customization/save...');
        // console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch('/api/customization/save', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });

        console.log('📡 Response status:', response.status);
        const responseData = await response.json();
        console.log('📡 Response data:', responseData);

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to save to database');
        }
        
        console.log('✅ Successfully saved to database');
      } catch (error) {
        console.error('❌ Database save failed:', error);
        throw error;
      }
    } else {
      console.warn('⚠️ Missing resumeId or userId, skipping database save', { resumeId, userId });
    }
  }

  async loadSettings(resumeId?: number): Promise<CustomizationSettings> {
    // Try to load from database first
    if (resumeId) {
      try {
        const response = await fetch(`/api/customization/load/${resumeId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            console.log('Loaded settings from database:', data.settings);
            return data.settings;
          }
        }
      } catch (error) {
        console.error('Database load failed:', error);
      }
      
      // Try localStorage cache for this resume
      const cached = localStorage.getItem(`${STORAGE_KEY}_${resumeId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (error) {
          console.error('Failed to parse cached settings:', error);
        }
      }
    }

    // Fall back to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Loaded settings from localStorage:', parsed);
        // Validate that settings have proper values
        if (parsed.colors && parsed.colors.text && parsed.colors.text !== '#ffffff') {
          return parsed;
        } else {
          console.warn('Invalid settings in localStorage, using defaults');
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Return defaults
    console.log('Using default settings');
    return this.getDefaultSettings();
  }

  exportSettings(settings: CustomizationSettings): void {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume-customization.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  importSettings(file: File): Promise<CustomizationSettings> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          resolve(settings);
        } catch (error) {
          reject(new Error('Invalid settings file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const customizationService = new CustomizationService();
