import { initializeDatabase } from '../database/connection.js';

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
}

export interface JobPreferencesCreateRequest {
  workType: string[];
  employmentType: string[];
  preferredCountries: string[];
  preferredStates: string[];
  preferredCities: string[];
  willingToRelocate: boolean;
  noticePeriodDays: number;
  lastWorkingDay?: string;
  immediateAvailability: boolean;
  interviewAvailability: {
    days: string[];
    timeSlots: string[];
    timezone: string;
  };
  preferredInterviewMode: string[];
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency: string;
  salaryNegotiable: boolean;
  industryPreferences: string[];
  companySizePreference: string[];
  roleLevel?: string;
}

class JobPreferencesService {
  /**
   * Get job preferences for a user
   */
  async getJobPreferences(userId: string): Promise<JobPreferences | null> {
    console.log('📋 [JOB PREFERENCES] Getting preferences for user:', userId);
    
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        `SELECT 
          id,
          user_id as "userId",
          work_type as "workType",
          employment_type as "employmentType",
          preferred_countries as "preferredCountries",
          preferred_states as "preferredStates",
          preferred_cities as "preferredCities",
          willing_to_relocate as "willingToRelocate",
          notice_period_days as "noticePeriodDays",
          last_working_day as "lastWorkingDay",
          immediate_availability as "immediateAvailability",
          interview_availability as "interviewAvailability",
          preferred_interview_mode as "preferredInterviewMode",
          expected_salary_min as "expectedSalaryMin",
          expected_salary_max as "expectedSalaryMax",
          salary_currency as "salaryCurrency",
          salary_negotiable as "salaryNegotiable",
          industry_preferences as "industryPreferences",
          company_size_preference as "companySizePreference",
          role_level as "roleLevel",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM job_preferences 
        WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        console.log('📋 [JOB PREFERENCES] No preferences found for user:', userId);
        return null;
      }
      
      const preferences = result.rows[0];
      console.log('✅ [JOB PREFERENCES] Retrieved preferences for user:', userId);
      
      return preferences;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES] Error getting preferences:', error);
      throw new Error(`Failed to get job preferences: ${error.message}`);
    }
  }

  /**
   * Create or update job preferences for a user
   */
  async upsertJobPreferences(userId: string, preferences: JobPreferencesCreateRequest): Promise<JobPreferences> {
    console.log('💾 [JOB PREFERENCES] Upserting preferences for user:', userId);
    
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        `INSERT INTO job_preferences (
          user_id,
          work_type,
          employment_type,
          preferred_countries,
          preferred_states,
          preferred_cities,
          willing_to_relocate,
          notice_period_days,
          last_working_day,
          immediate_availability,
          interview_availability,
          preferred_interview_mode,
          expected_salary_min,
          expected_salary_max,
          salary_currency,
          salary_negotiable,
          industry_preferences,
          company_size_preference,
          role_level
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
          work_type = EXCLUDED.work_type,
          employment_type = EXCLUDED.employment_type,
          preferred_countries = EXCLUDED.preferred_countries,
          preferred_states = EXCLUDED.preferred_states,
          preferred_cities = EXCLUDED.preferred_cities,
          willing_to_relocate = EXCLUDED.willing_to_relocate,
          notice_period_days = EXCLUDED.notice_period_days,
          last_working_day = EXCLUDED.last_working_day,
          immediate_availability = EXCLUDED.immediate_availability,
          interview_availability = EXCLUDED.interview_availability,
          preferred_interview_mode = EXCLUDED.preferred_interview_mode,
          expected_salary_min = EXCLUDED.expected_salary_min,
          expected_salary_max = EXCLUDED.expected_salary_max,
          salary_currency = EXCLUDED.salary_currency,
          salary_negotiable = EXCLUDED.salary_negotiable,
          industry_preferences = EXCLUDED.industry_preferences,
          company_size_preference = EXCLUDED.company_size_preference,
          role_level = EXCLUDED.role_level,
          updated_at = CURRENT_TIMESTAMP
        RETURNING 
          id,
          user_id as "userId",
          work_type as "workType",
          employment_type as "employmentType",
          preferred_countries as "preferredCountries",
          preferred_states as "preferredStates",
          preferred_cities as "preferredCities",
          willing_to_relocate as "willingToRelocate",
          notice_period_days as "noticePeriodDays",
          last_working_day as "lastWorkingDay",
          immediate_availability as "immediateAvailability",
          interview_availability as "interviewAvailability",
          preferred_interview_mode as "preferredInterviewMode",
          expected_salary_min as "expectedSalaryMin",
          expected_salary_max as "expectedSalaryMax",
          salary_currency as "salaryCurrency",
          salary_negotiable as "salaryNegotiable",
          industry_preferences as "industryPreferences",
          company_size_preference as "companySizePreference",
          role_level as "roleLevel",
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        [
          userId,
          preferences.workType,
          preferences.employmentType,
          preferences.preferredCountries,
          preferences.preferredStates,
          preferences.preferredCities,
          preferences.willingToRelocate,
          preferences.noticePeriodDays,
          preferences.lastWorkingDay || null,
          preferences.immediateAvailability,
          JSON.stringify(preferences.interviewAvailability),
          preferences.preferredInterviewMode,
          preferences.expectedSalaryMin || null,
          preferences.expectedSalaryMax || null,
          preferences.salaryCurrency,
          preferences.salaryNegotiable,
          preferences.industryPreferences,
          preferences.companySizePreference,
          preferences.roleLevel || null
        ]
      );
      
      console.log('✅ [JOB PREFERENCES] Successfully upserted preferences for user:', userId);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [JOB PREFERENCES] Error upserting preferences:', error);
      throw new Error(`Failed to save job preferences: ${error.message}`);
    }
  }

  /**
   * Delete job preferences for a user
   */
  async deleteJobPreferences(userId: string): Promise<boolean> {
    console.log('🗑️ [JOB PREFERENCES] Deleting preferences for user:', userId);
    
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        'DELETE FROM job_preferences WHERE user_id = $1',
        [userId]
      );
      
      const deleted = result.rowCount > 0;
      console.log(`${deleted ? '✅' : '⚠️'} [JOB PREFERENCES] Delete result for user ${userId}:`, deleted);
      
      return deleted;
    } catch (error) {
      console.error('❌ [JOB PREFERENCES] Error deleting preferences:', error);
      throw new Error(`Failed to delete job preferences: ${error.message}`);
    }
  }

  /**
   * Get default job preferences structure
   */
  getDefaultPreferences(): Partial<JobPreferencesCreateRequest> {
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

  /**
   * Validate job preferences data
   */
  validatePreferences(preferences: JobPreferencesCreateRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate notice period
    if (preferences.noticePeriodDays < 0 || preferences.noticePeriodDays > 365) {
      errors.push('Notice period must be between 0 and 365 days');
    }
    
    // Validate salary range
    if (preferences.expectedSalaryMin && preferences.expectedSalaryMax) {
      if (preferences.expectedSalaryMin > preferences.expectedSalaryMax) {
        errors.push('Minimum salary cannot be greater than maximum salary');
      }
    }
    
    // Validate salary values
    if (preferences.expectedSalaryMin && preferences.expectedSalaryMin < 0) {
      errors.push('Minimum salary cannot be negative');
    }
    
    if (preferences.expectedSalaryMax && preferences.expectedSalaryMax < 0) {
      errors.push('Maximum salary cannot be negative');
    }
    
    // Validate last working day
    if (preferences.lastWorkingDay) {
      const lastWorkingDate = new Date(preferences.lastWorkingDay);
      const today = new Date();
      if (lastWorkingDate < today) {
        errors.push('Last working day cannot be in the past');
      }
    }
    
    // Validate timezone
    if (preferences.interviewAvailability?.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: preferences.interviewAvailability.timezone });
      } catch (error) {
        errors.push('Invalid timezone specified');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const jobPreferencesService = new JobPreferencesService();