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
   * Calculate ATS score for a resume
   */
  async calculateScore(resumeId: number) {
    return this.post<ATSCalculateResponse>(`/ats/calculate/${resumeId}`, {});
  }

  /**
   * Improve resume based on ATS analysis
   * @param resumeId - Resume ID to improve
   * @param method - Improvement method: 'llm' (default), 'rule-based', or 'hybrid'
   */
  async improveResume(resumeId: number, method: 'rule-based' | 'llm' | 'hybrid' = 'llm') {
    return this.post<ATSImproveResponse>(`/ats/improve/${resumeId}?method=${method}`, {});
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
    return this.post<SectionImproveResponse>(`/ats/improve-section/${resumeId}`, {
      sectionType,
      sectionData,
      sectionIndex
    });
  }
}

export const atsApi = new ATSApiClient();
