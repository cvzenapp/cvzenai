export interface MockTestLevel {
  level: string;
  completed: boolean;
  available: boolean;
}

export interface ExistingTest {
  id: number;
  testLevel: string;
  status: string;
  percentageScore?: number;
  createdAt: string;
  completedAt?: string;
}

export interface MockTestSession {
  id: number;
  candidateId: string;
  interviewId: number;
  testLevel: 'basic' | 'moderate' | 'complex';
  totalQuestions: number;
  totalScore: number;
  candidateScore?: number;
  percentageScore?: number;
  status: 'generated' | 'in_progress' | 'completed' | 'expired';
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  createdAt: string;
  durationMinutes: number;
}

export interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'coding';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

export interface MockTestResult {
  sessionId: number;
  testLevel: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentageScore: number;
  timeTaken: number;
  feedback?: string;
  questionResults?: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

export interface MockTestQuestion {
  id: number;
  sessionId: number;
  questionText: string;
  questionType: 'mcq' | 'single_selection' | 'objective' | 'coding';
  questionCategory?: string;
  difficultyLevel: 'basic' | 'moderate' | 'complex';
  options?: Array<{
    id: string;
    text: string;
  }>;
  points: number;
  questionOrder: number;
}

export interface MockTestResponse {
  id: number;
  questionId: number;
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: string;
}

export interface MockTestResults {
  session: MockTestSession;
  questions: Array<MockTestQuestion & {
    correctAnswer: string;
    explanation?: string;
    candidateAnswer?: string;
    selectedOptions?: string[];
    isCorrect?: boolean;
    pointsEarned?: number;
  }>;
}

class MockTestApi {
  private baseUrl = '/api/mock-tests';

  /**
   * Get authentication headers - supports both recruiter and job seeker tokens
   */
  private getAuthHeaders(): Record<string, string> {
    // Check for recruiter token first
    const recruiterToken = localStorage.getItem('recruiter_token');
    if (recruiterToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recruiterToken}`
      };
    }

    // Fall back to job seeker token
    const jobSeekerToken = localStorage.getItem('authToken');
    if (jobSeekerToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jobSeekerToken}`
      };
    }

    console.warn('⚠️ No authentication token found for mock test API');
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make authenticated request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }

  async getTestLevels(interviewId: number): Promise<{
    success: boolean;
    levels: MockTestLevel[];
    existingTests: ExistingTest[];
  }> {
    return this.request(`/interview/${interviewId}/levels`);
  }

  async generateTest(interviewId: number, testLevel: string): Promise<{
    success: boolean;
    session: MockTestSession;
  }> {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify({
        interviewId,
        testLevel,
      }),
    });
  }

  async getSession(sessionId: number): Promise<{
    success: boolean;
    session: MockTestSessionData;
  }> {
    return this.request(`/session/${sessionId}`);
  }

  async getQuestions(sessionId: number): Promise<{
    success: boolean;
    questions: Question[];
  }> {
    return this.request(`/session/${sessionId}/questions`);
  }

  async saveAnswers(sessionId: number, answers: Record<number, string>): Promise<{
    success: boolean;
  }> {
    return this.request(`/session/${sessionId}/save`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async submitTest(sessionId: number, answers: Record<number, string>): Promise<{
    success: boolean;
  }> {
    return this.request(`/session/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  async getResults(sessionId: number): Promise<{
    success: boolean;
    results: MockTestResult;
  }> {
    return this.request(`/session/${sessionId}/results`);
  }

  async getMyCandidateTests(interviewId?: number): Promise<{
    success: boolean;
    tests: MockTestSession[];
  }> {
    const url = interviewId 
      ? `/my-tests?interviewId=${interviewId}`
      : '/my-tests';
      
    return this.request(url);
  }
}

export const mockTestApi = new MockTestApi();