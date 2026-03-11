import { BaseApiClient } from './baseApiClient';

interface ATSScoreData {
  overallScore: number;
  scores: {
    completeness: number;
    formatting: number;
    keywords: number;
    experience: number;
    education: number;
    skills: number;
  };
  suggestions: string[];
  strengths: string[];
}

interface ATSCalculateResponse {
  success: boolean;
  atsScore: ATSScoreData;
}

interface ATSImproveResponse {
  success: boolean;
  method?: string;
  improvements: string[];
  changesApplied: string[];
  oldScore: number;
  newScore: number;
  scoreIncrease?: number;
  noChangeReason?: string;
  message?: string;
  newATSScore: ATSScoreData;
}

interface SectionImproveResponse {
  success: boolean;
  improved: any;
  changes: string[];
}

class ATSApiClient extends BaseApiClient {
  /**
   * Reset the circuit breaker for ATS operations
   */
  resetCircuitBreaker() {
    super.resetCircuitBreaker();
    console.log('🔄 ATS API circuit breaker reset');
  }

  /**
   * Check if circuit breaker is preventing requests
   */
  isCircuitBreakerActive() {
    return super.isCircuitBreakerActive();
  }

  /**
   * Get detailed circuit breaker status
   */
  getCircuitBreakerStatus() {
    return super.getCircuitBreakerStatus();
  }

  /**
   * Calculate ATS score for a resume
   */
  async calculateScore(resumeId: number) {
    try {
      console.log(`🎯 ATS API: Starting calculation for resume ${resumeId}`);
      
      // Check circuit breaker status before attempting
      if (this.isCircuitBreakerActive()) {
        console.log('🚨 Circuit breaker is active, attempting reset...');
        this.resetCircuitBreaker();
        // Wait a moment after reset
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const result = await this.post<ATSCalculateResponse>(`/ats/calculate/${resumeId}`, {});
      console.log(`✅ ATS API: Calculation completed for resume ${resumeId}`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ ATS API: Error calculating score for resume ${resumeId}:`, error);
      
      // If circuit breaker is active, reset it and try once more
      if (error.message?.includes('Circuit breaker') || error.message?.includes('Service temporarily unavailable')) {
        console.log('🔄 Circuit breaker detected, resetting and retrying ATS calculation...');
        this.resetCircuitBreaker();
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResult = await this.post<ATSCalculateResponse>(`/ats/calculate/${resumeId}`, {});
          console.log(`✅ ATS API: Retry successful for resume ${resumeId}`, retryResult);
          return retryResult;
        } catch (retryError) {
          console.error(`❌ ATS API: Retry failed for resume ${resumeId}:`, retryError);
          throw retryError;
        }
      }
      throw error;
    }
  }

  /**
   * Improve resume based on ATS analysis
   * @param resumeId - Resume ID to improve
   * @param method - Improvement method: 'llm' (default), 'rule-based', or 'hybrid'
   */
  async improveResume(resumeId: number, method: 'rule-based' | 'llm' | 'hybrid' = 'llm') {
    try {
      return await this.post<ATSImproveResponse>(`/ats/improve/${resumeId}?method=${method}`, {});
    } catch (error) {
      // If circuit breaker is active, reset it and try once more
      if (error.message?.includes('Circuit breaker')) {
        console.log('🔄 Circuit breaker detected, resetting and retrying ATS improvement...');
        this.resetCircuitBreaker();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.post<ATSImproveResponse>(`/ats/improve/${resumeId}?method=${method}`, {});
      }
      throw error;
    }
  }

  /**
   * Improve a specific section of the resume
   */
  async improveSection(
    resumeId: number,
    sectionType: 'summary' | 'objective' | 'experience' | 'education' | 'project' | 'skills',
    sectionData: any,
    sectionIndex?: number
  ) {
    try {
      return await this.post<SectionImproveResponse>(`/ats/improve-section/${resumeId}`, {
        sectionType,
        sectionData,
        sectionIndex
      });
    } catch (error) {
      // If circuit breaker is active, reset it and try once more
      if (error.message?.includes('Circuit breaker')) {
        console.log('🔄 Circuit breaker detected, resetting and retrying section improvement...');
        this.resetCircuitBreaker();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.post<SectionImproveResponse>(`/ats/improve-section/${resumeId}`, {
          sectionType,
          sectionData,
          sectionIndex
        });
      }
      throw error;
    }
  }
}

export const atsApi = new ATSApiClient();

// Global circuit breaker utilities for debugging in production
if (typeof window !== 'undefined') {
  (window as any).atsApiDebug = {
    resetCircuitBreaker: () => {
      atsApi.resetCircuitBreaker();
      console.log('✅ ATS API circuit breaker reset from console');
    },
    getStatus: () => {
      const status = atsApi.getCircuitBreakerStatus();
      console.log('🔍 ATS API Circuit Breaker Status:', status);
      return status;
    },
    isActive: () => {
      const active = atsApi.isCircuitBreakerActive();
      console.log('🔍 ATS API Circuit Breaker Active:', active);
      return active;
    }
  };
}
