class JobApplicationsApiService {
  private baseUrl = "/api/job-applications";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("authToken");
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "API request failed");
    }

    return data;
  }

  async submitApplication(jobId: number, resumeId: number, coverLetter?: string, resumeFileUrl?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("", {
      method: "POST",
      body: JSON.stringify({ jobId, resumeId, coverLetter, resumeFileUrl }),
    });
  }

  async getMyApplications(): Promise<{ success: boolean; applications: any[] }> {
    const response = await this.request<{ success: boolean; data: any[] }>("/my-applications");
    return {
      success: response.success,
      applications: response.data
    };
  }

  async getApplicationStats(): Promise<{ success: boolean; data: any }> {
    const response = await this.request<{ success: boolean; data: any }>("/my-applications");
    // Calculate stats from applications data
    const applications = response.data || [];
    const stats = {
      total: applications.length,
      pending: applications.filter((app: any) => app.status === 'pending').length,
      reviewed: applications.filter((app: any) => app.status === 'reviewed').length,
      shortlisted: applications.filter((app: any) => app.status === 'shortlisted').length,
      accepted: applications.filter((app: any) => app.status === 'accepted').length,
      rejected: applications.filter((app: any) => app.status === 'rejected').length
    };
    return { success: true, data: stats };
  }
}

export const jobApplicationsApi = new JobApplicationsApiService();
