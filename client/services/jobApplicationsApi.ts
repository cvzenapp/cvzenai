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
    return this.request<{ success: boolean; applications: any[] }>("");
  }
}

export const jobApplicationsApi = new JobApplicationsApiService();
