import { unifiedAuthService } from './unifiedAuthService';

export interface JobPreferences {
  id?: string; // UUID
  userId: string; // UUID
  
  // Work Type Preferences
  workType: string[];
  employmentType: string[];
  
  // Location Preferences
  preferredCountries: string[];
  preferredStates: string[];
  preferredCities: string[];
  willingToRelocate: boolean;
  
  // Availability
  noticePeriodDays: number;
  lastWorkingDay?: string;
  immediateAvailability: boolean;
  
  // Interview Preferences
  interviewAvailability: {
    days: string[];
    timeSlots: string[];
    timezone: string;
  };
  preferredInterviewMode: string[];
  
  // Compensation
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency: string;
  salaryNegotiable: boolean;
  
  // Additional Preferences
  industryPreferences: string[];
  companySizePreference: string[];
  roleLevel?: string;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  exists?: boolean;
}

export interface JobPreferencesOptions {
  workTypes: { value: string; label: string }[];
  employmentTypes: { value: string; label: string }[];
  interviewModes: { value: string; label: string }[];
  companySizes: { value: string; label: string }[];
  roleLevels: { value: string; label: string }[];
  currencies: { value: string; label: string }[];
  daysOfWeek: { value: string; label: string }[];
  timeSlots: { value: string; label: string }[];
  industries: { value: string; label: string }[];
}

class JobPreferencesApi {
  private baseUrl = '/api/job-preferences';

  /**
   * Get job preferences for the authenticated user
   */
  async getJobPreferences(): Promise<{ success: boolean; data?: JobPreferences; error?: string }> {
    try {
      console.log('📋 [JOB PREFERENCES API] Getting preferences...');
      
      const headers = unifiedAuthService.getAuthHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ [JOB PREFERENCES API] Error response:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('✅ [JOB PREFERENCES API] Preferences retrieved:', result.data);
      return result;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES API] Network error:', error);
      return {
        success: false,
        error: 'Failed to get job preferences. Please check your connection.'
      };
    }
  }

  /**
   * Create or update job preferences
   */
  async saveJobPreferences(preferences: Partial<JobPreferences>): Promise<{ success: boolean; data?: JobPreferences; error?: string }> {
    try {
      console.log('💾 [JOB PREFERENCES API] Saving preferences:', preferences);
      
      const headers = unifiedAuthService.getAuthHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(preferences)
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ [JOB PREFERENCES API] Error response:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('✅ [JOB PREFERENCES API] Preferences saved:', result.data);
      return result;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES API] Network error:', error);
      return {
        success: false,
        error: 'Failed to save job preferences. Please check your connection.'
      };
    }
  }

  /**
   * Update job preferences
   */
  async updateJobPreferences(preferences: Partial<JobPreferences>): Promise<{ success: boolean; data?: JobPreferences; error?: string }> {
    try {
      console.log('🔄 [JOB PREFERENCES API] Updating preferences:', preferences);
      
      const headers = unifiedAuthService.getAuthHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(preferences)
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ [JOB PREFERENCES API] Error response:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('✅ [JOB PREFERENCES API] Preferences updated:', result.data);
      return result;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES API] Network error:', error);
      return {
        success: false,
        error: 'Failed to update job preferences. Please check your connection.'
      };
    }
  }

  /**
   * Delete job preferences
   */
  async deleteJobPreferences(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ [JOB PREFERENCES API] Deleting preferences...');
      
      const headers = unifiedAuthService.getAuthHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ [JOB PREFERENCES API] Error response:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('✅ [JOB PREFERENCES API] Preferences deleted');
      return result;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES API] Network error:', error);
      return {
        success: false,
        error: 'Failed to delete job preferences. Please check your connection.'
      };
    }
  }

  /**
   * Get available options for dropdowns
   */
  async getJobPreferencesOptions(): Promise<{ success: boolean; data?: JobPreferencesOptions; error?: string }> {
    try {
      console.log('📋 [JOB PREFERENCES API] Getting options...');
      
      const response = await fetch(`${this.baseUrl}/options`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ [JOB PREFERENCES API] Error response:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('✅ [JOB PREFERENCES API] Options retrieved:', result.data);
      return result;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES API] Network error:', error);
      return {
        success: false,
        error: 'Failed to get job preferences options. Please check your connection.'
      };
    }
  }

  /**
   * Get default preferences structure
   */
  getDefaultPreferences(): Partial<JobPreferences> {
    return {
      workType: [],
      employmentType: ['full-time'],
      preferredCountries: [],
      preferredStates: [],
      preferredCities: [],
      willingToRelocate: false,
      noticePeriodDays: 30,
      immediateAvailability: false,
      interviewAvailability: {
        days: [],
        timeSlots: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      preferredInterviewMode: ['video'],
      salaryCurrency: 'USD',
      salaryNegotiable: true,
      industryPreferences: [],
      companySizePreference: []
    };
  }
}

export const jobPreferencesApi = new JobPreferencesApi();