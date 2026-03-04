import { unifiedAuthService } from './unifiedAuthService';

export interface ResumeUpdateData {
  summary?: string;
  objective?: string;
  personalInfo?: any;
  skills?: any[];
  experiences?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
}

class ResumeUpdateApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async updateResumeSection(resumeId: string | number, updates: ResumeUpdateData) {
    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating resume section:', error);
      throw error;
    }
  }

  async updateProfessionalSummary(resumeId: string | number, summary: string) {
    return this.updateResumeSection(resumeId, { summary });
  }

  async updateObjective(resumeId: string | number, objective: string) {
    return this.updateResumeSection(resumeId, { objective });
  }

  async updatePersonalInfo(resumeId: string | number, personalInfo: any) {
    return this.updateResumeSection(resumeId, { personalInfo });
  }

  async updateSkills(resumeId: string | number, skills: any[]) {
    return this.updateResumeSection(resumeId, { skills });
  }

  async updateExperiences(resumeId: string | number, experiences: any[]) {
    return this.updateResumeSection(resumeId, { experiences });
  }

  async updateEducation(resumeId: string | number, education: any[]) {
    return this.updateResumeSection(resumeId, { education });
  }

  async updateProjects(resumeId: string | number, projects: any[]) {
    return this.updateResumeSection(resumeId, { projects });
  }
}

export const resumeUpdateApi = new ResumeUpdateApi();