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
   * Calculate ATS score for a resume
   */
  async calculateScore(resumeId: number) {
    try {
      return await this.post<ATSCalculateResponse>(`/ats/calculate/${resumeId}`, {});
    } catch (error) {
      // If circuit breaker is active, reset it and try once more
      if (error.message?.includes('Circuit breaker')) {
        console.log('🔄 Circuit breaker detected, resetting and retrying ATS calculation...');
        this.resetCircuitBreaker();
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.post<ATSCalculateResponse>(`/ats/calculate/${resumeId}`, {});
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
