/**
 * Job Discovery Service
 * Handles job search, recommendations, applications, and analytics for users
 * 
 * @deprecated This service is designed for SQLite and is not compatible with PostgreSQL.
 * The working job endpoints in server/index.ts and server/routes/jobs.ts query the database directly.
 * This file is kept for reference but should not be used in production.
 * 
 * Working endpoints:
 * - /api/jobs/recommendations (server/index.ts) - Uses PostgreSQL + job_postings table
 * - /api/jobs/search (server/routes/jobs.ts) - Uses PostgreSQL + job_postings table
 * - /api/jobs/analytics (server/index.ts) - Uses PostgreSQL + job_postings table
 */

import { getDatabase } from '../database/connection.js';

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  postedDate: string;
  expiryDate?: string;
  status: 'active' | 'filled' | 'expired';
  matchScore?: number;
  matchReasons?: string[];
  applicationCount?: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: number;
  resumeVersion?: string;
  coverLetter?: string;
  customizations?: Array<{ field: string; value: string }>;
  status: 'submitted' | 'reviewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt: string;
  lastUpdated: string;
  timeline: ApplicationEvent[];
}

export interface ApplicationEvent {
  id: string;
  type: 'submitted' | 'reviewed' | 'interview_scheduled' | 'interview_completed' | 'offer_made' | 'rejected' | 'withdrawn';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface JobAlert {
  id: string;
  userId: number;
  name: string;
  filters: JobSearchFilters;
  frequency: 'immediate' | 'daily' | 'weekly';
  isActive: boolean;
  lastTriggered?: string;
  matchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: Array<'full-time' | 'part-time' | 'contract' | 'internship'>;
  experienceLevel?: Array<'entry' | 'mid' | 'senior' | 'executive'>;
  industry?: string[];
  companySize?: Array<'startup' | 'small' | 'medium' | 'large' | 'enterprise'>;
  postedWithin?: number;
}

export interface JobSearchResult {
  jobs: JobOpportunity[];
  total: number;
  hasMore: boolean;
  filters: JobSearchFilters;
  analytics: {
    averageMatchScore: number;
    topSkills: string[];
    industryDistribution: Record<string, number>;
    salaryInsights: {
      averageSalary: number;
      salaryRange: { min: number; max: number };
    };
  };
}

export interface JobMatchData {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  skillsMatch: {
    matched: string[];
    missing: string[];
    additional: string[];
  };
  optimizationSuggestions: string[];
}

export class JobDiscoveryService {
  private db = getDatabase();

  /**
   * Search jobs with filters and pagination
   */
  async searchJobs(filters: JobSearchFilters & { page: number; limit: number }, userId: number): Promise<JobSearchResult> {
    // Get user's resume data for match scoring
    const userResume = await this.getUserResumeData(userId);
    
    // Build search query for job_postings table
    let query = `
      SELECT 
        jp.id,
        jp.title,
        jp.department as company,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.location,
        jp.job_type as type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency as currency,
        jp.created_at as posted_date,
        jp.view_count,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
      FROM job_postings jp
      WHERE jp.is_active = 1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.keywords) {
      query += ` AND (jp.title LIKE ? OR jp.description LIKE ? OR jp.department LIKE ?)`;
      const keyword = `%${filters.keywords}%`;
      params.push(keyword, keyword, keyword);
    }

    if (filters.location && !filters.remote) {
      query += ` AND jp.location LIKE ?`;
      params.push(`%${filters.location}%`);
    }

    if (filters.remote) {
      query += ` AND jp.location LIKE '%remote%'`;
    }

    if (filters.salaryMin) {
      query += ` AND jp.salary_max >= ?`;
      params.push(filters.salaryMin);
    }

    if (filters.salaryMax) {
      query += ` AND jp.salary_min <= ?`;
      params.push(filters.salaryMax);
    }

    if (filters.jobType && filters.jobType.length > 0) {
      query += ` AND jp.job_type IN (${filters.jobType.map(() => '?').join(',')})`;
      params.push(...filters.jobType);
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      query += ` AND jp.experience_level IN (${filters.experienceLevel.map(() => '?').join(',')})`;
      params.push(...filters.experienceLevel);
    }

    // Note: industry and companySize filters not available in job_postings table yet
    // Can be added in future migration if needed

    if (filters.postedWithin) {
      query += ` AND jp.created_at >= datetime('now', '-${filters.postedWithin} days')`;
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
    const totalResult = this.db.prepare(countQuery).get(...params) as any;
    const total = totalResult.count;

    // Add pagination
    query += ` ORDER BY jp.created_at DESC LIMIT ? OFFSET ?`;
    params.push(filters.limit, (filters.page - 1) * filters.limit);

    // Execute search
    const jobs = this.db.prepare(query).all(...params) as any[];

    // Transform and add match scores
    const transformedJobs = jobs.map(job => this.transformJobPostingData(job, userResume));

    // Calculate analytics
    const analytics = this.calculateSearchAnalytics(transformedJobs);

    return {
      jobs: transformedJobs,
      total,
      hasMore: total > filters.page * filters.limit,
      filters,
      analytics
    };
  }

  /**
   * Get personalized job recommendations
   */
  async getPersonalizedRecommendations(userId: number, limit: number): Promise<JobOpportunity[]> {
    const userResume = await this.getUserResumeData(userId);
    
    // Get active job postings from job_postings table (real data from recruiters)
    let query = `
      SELECT 
        jp.id,
        jp.title,
        jp.department as company,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.location,
        jp.job_type as type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.created_at as posted_date,
        jp.view_count,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
      FROM job_postings jp
      WHERE jp.is_active = true
      ORDER BY jp.created_at DESC
      LIMIT ?
    `;
    const params: any[] = [limit];

    const jobs = this.db.prepare(query).all(...params) as any[];
    return jobs.map(job => this.transformJobPostingData(job, userResume));
  }

  /**
   * Get job details with match score
   */
  async getJobDetails(jobId: string, userId: number): Promise<JobOpportunity | null> {
    const job = this.db.prepare(`
      SELECT 
        jp.id,
        jp.title,
        jp.department as company,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.location,
        jp.job_type as type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency as currency,
        jp.created_at as posted_date,
        jp.view_count,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
      FROM job_postings jp 
      WHERE jp.id = ? AND jp.is_active = 1
    `).get(jobId) as any;

    if (!job) return null;

    const userResume = await this.getUserResumeData(userId);
    return this.transformJobPostingData(job, userResume);
  }

  /**
   * Get detailed match score for a job
   */
  async getJobMatchScore(jobId: string, userId: number): Promise<JobMatchData | null> {
    const job = this.db.prepare(`
      SELECT 
        jp.id,
        jp.title,
        jp.department as company,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.location,
        jp.job_type as type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency as currency,
        jp.created_at as posted_date
      FROM job_postings jp 
      WHERE jp.id = ? AND jp.is_active = 1
    `).get(jobId) as any;

    if (!job) return null;

    const userResume = await this.getUserResumeData(userId);
    if (!userResume) return null;

    return this.calculateDetailedMatchForJobPosting(job, userResume);
  }

  /**
   * Submit job application
   */
  async submitJobApplication(userId: number, applicationData: {
    jobId: string;
    resumeVersion?: string;
    coverLetter?: string;
    customizations?: Array<{ field: string; value: string }>;
  }): Promise<JobApplication> {
    // Check if job exists and is active
    const job = this.db.prepare(`
      SELECT id FROM job_postings WHERE id = ? AND is_active = 1
    `).get(applicationData.jobId) as any;

    if (!job) {
      throw new Error('Job not found or no longer active');
    }

    // Check if user already applied
    const existingApplication = this.db.prepare(`
      SELECT id FROM job_applications 
      WHERE user_id = ? AND job_id = ? AND status != 'withdrawn'
    `).get(userId, applicationData.jobId);

    if (existingApplication) {
      throw new Error('You have already applied for this job');
    }

    // Create application
    const applicationId = `app_${Date.now()}_${userId}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO job_applications (
        id, job_id, user_id, resume_version, cover_letter, 
        customizations, status, applied_at, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
    `).run(
      applicationId,
      applicationData.jobId,
      userId,
      applicationData.resumeVersion || null,
      applicationData.coverLetter || null,
      JSON.stringify(applicationData.customizations || []),
      now,
      now
    );

    // Create initial timeline event
    this.db.prepare(`
      INSERT INTO application_events (
        id, application_id, type, description, timestamp
      ) VALUES (?, ?, 'submitted', 'Application submitted', ?)
    `).run(`evt_${Date.now()}`, applicationId, now);

    // Note: Application count is calculated dynamically in queries, no need to update

    return this.getApplicationById(applicationId);
  }

  /**
   * Get user's job applications
   */
  async getUserApplications(userId: number, options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{
    applications: JobApplication[];
    total: number;
    hasMore: boolean;
  }> {
    let query = `
      SELECT 
        ja.*,
        jp.title,
        jp.department as company,
        jp.location,
        CASE WHEN jp.location LIKE '%remote%' THEN 1 ELSE 0 END as remote
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      WHERE ja.user_id = ?
    `;
    const params: any[] = [userId];

    if (options.status) {
      query += ` AND ja.status = ?`;
      params.push(options.status);
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
    const totalResult = this.db.prepare(countQuery).get(...params) as any;
    const total = totalResult.count;

    // Add pagination
    query += ` ORDER BY ja.applied_at DESC LIMIT ? OFFSET ?`;
    params.push(options.limit, (options.page - 1) * options.limit);

    const applications = this.db.prepare(query).all(...params) as any[];

    // Get timeline for each application
    const transformedApplications = applications.map(app => ({
      ...app,
      customizations: JSON.parse(app.customizations || '[]'),
      timeline: this.getApplicationTimeline(app.id)
    }));

    return {
      applications: transformedApplications,
      total,
      hasMore: total > options.page * options.limit
    };
  }

  /**
   * Withdraw job application
   */
  async withdrawApplication(applicationId: string, userId: number): Promise<JobApplication> {
    // Verify ownership
    const application = this.db.prepare(`
      SELECT * FROM job_applications WHERE id = ? AND user_id = ?
    `).get(applicationId, userId) as any;

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status === 'withdrawn') {
      throw new Error('Application already withdrawn');
    }

    // Update status
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE job_applications 
      SET status = 'withdrawn', last_updated = ?
      WHERE id = ?
    `).run(now, applicationId);

    // Add timeline event
    this.db.prepare(`
      INSERT INTO application_events (
        id, application_id, type, description, timestamp
      ) VALUES (?, ?, 'withdrawn', 'Application withdrawn by candidate', ?)
    `).run(`evt_${Date.now()}`, applicationId, now);

    return this.getApplicationById(applicationId);
  }

  /**
   * Create job alert
   */
  async createJobAlert(userId: number, alertData: {
    name: string;
    filters: JobSearchFilters;
    frequency: 'immediate' | 'daily' | 'weekly';
    isActive: boolean;
  }): Promise<JobAlert> {
    const alertId = `alert_${Date.now()}_${userId}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO job_alerts (
        id, user_id, name, filters, frequency, is_active, 
        match_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      alertId,
      userId,
      alertData.name,
      JSON.stringify(alertData.filters),
      alertData.frequency,
      alertData.isActive ? 1 : 0,
      now,
      now
    );

    return this.getJobAlertById(alertId);
  }

  /**
   * Get user's job alerts
   */
  async getUserJobAlerts(userId: number): Promise<JobAlert[]> {
    const alerts = this.db.prepare(`
      SELECT * FROM job_alerts WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    return alerts.map(alert => ({
      ...alert,
      filters: JSON.parse(alert.filters),
      isActive: Boolean(alert.is_active)
    }));
  }

  /**
   * Update job alert
   */
  async updateJobAlert(alertId: string, userId: number, updates: Partial<JobAlert>): Promise<JobAlert> {
    // Verify ownership
    const alert = this.db.prepare(`
      SELECT * FROM job_alerts WHERE id = ? AND user_id = ?
    `).get(alertId, userId);

    if (!alert) {
      throw new Error('Job alert not found');
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.name) {
      updateFields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.filters) {
      updateFields.push('filters = ?');
      params.push(JSON.stringify(updates.filters));
    }

    if (updates.frequency) {
      updateFields.push('frequency = ?');
      params.push(updates.frequency);
    }

    if (typeof updates.isActive === 'boolean') {
      updateFields.push('is_active = ?');
      params.push(updates.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return this.getJobAlertById(alertId);
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(alertId);

    this.db.prepare(`
      UPDATE job_alerts SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...params);

    return this.getJobAlertById(alertId);
  }

  /**
   * Delete job alert
   */
  async deleteJobAlert(alertId: string, userId: number): Promise<void> {
    const result = this.db.prepare(`
      DELETE FROM job_alerts WHERE id = ? AND user_id = ?
    `).run(alertId, userId);

    if (result.changes === 0) {
      throw new Error('Job alert not found');
    }
  }

  /**
   * Get user job analytics
   */
  async getUserJobAnalytics(userId: number): Promise<any> {
    const applications = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM job_applications 
      WHERE user_id = ? 
      GROUP BY status
    `).all(userId) as any[];

    const searches = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM user_job_searches 
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
    `).get(userId) as any;

    const alerts = this.db.prepare(`
      SELECT COUNT(*) as active_alerts, SUM(match_count) as total_matches
      FROM job_alerts 
      WHERE user_id = ? AND is_active = 1
    `).get(userId) as any;

    return {
      applications: {
        total: applications.reduce((sum, app) => sum + app.count, 0),
        byStatus: applications.reduce((acc, app) => {
          acc[app.status] = app.count;
          return acc;
        }, {})
      },
      searches: {
        last30Days: searches.count || 0
      },
      alerts: {
        active: alerts.active_alerts || 0,
        totalMatches: alerts.total_matches || 0
      }
    };
  }

  // Private helper methods

  private async getUserResumeData(userId: number): Promise<any> {
    // This would integrate with the resume system
    // For now, return mock data based on user
    return {
      skills: ['JavaScript', 'React', 'Node.js'],
      industry: 'Technology',
      experienceLevel: 'mid',
      title: 'Software Engineer'
    };
  }

  private getPopularJobs(limit: number): JobOpportunity[] {
    const jobs = this.db.prepare(`
      SELECT 
        jp.id,
        jp.title,
        jp.department as company,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.location,
        jp.job_type as type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency as currency,
        jp.created_at as posted_date,
        jp.view_count,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
      FROM job_postings jp
      WHERE jp.is_active = 1
      ORDER BY application_count DESC, jp.created_at DESC 
      LIMIT ?
    `).all(limit) as any[];

    return jobs.map(job => this.transformJobPostingData(job));
  }

  private transformJobData(job: any, userResume?: any): JobOpportunity {
    const matchData = userResume ? this.calculateMatch(job, userResume) : null;

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: JSON.parse(job.requirements || '[]'),
      salaryRange: {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.currency || 'USD'
      },
      location: job.location,
      remote: Boolean(job.remote),
      type: job.type,
      experienceLevel: job.experience_level,
      industry: job.industry,
      companySize: job.company_size,
      postedDate: job.posted_date,
      expiryDate: job.expiry_date,
      status: job.status,
      applicationCount: job.application_count || 0,
      matchScore: matchData?.score,
      matchReasons: matchData?.reasons
    };
  }

  private transformJobPostingData(job: any, userResume?: any): JobOpportunity {
    const matchData = userResume ? this.calculateMatch(job, userResume) : null;

    return {
      id: job.id,
      title: job.title,
      company: job.company || 'Company',
      description: job.description,
      requirements: JSON.parse(job.requirements || '[]'),
      salaryRange: {
        min: job.salary_min || 0,
        max: job.salary_max || 0,
        currency: job.salary_currency || 'USD'
      },
      location: job.location || 'Remote',
      remote: job.type === 'remote' || job.type === 'hybrid',
      type: job.type || 'full-time',
      experienceLevel: job.experience_level || 'mid',
      industry: 'Technology', // Default since job_postings doesn't have industry
      companySize: 'medium', // Default since job_postings doesn't have company_size
      postedDate: job.posted_date,
      expiryDate: null,
      status: 'active',
      applicationCount: job.application_count || 0,
      matchScore: matchData?.score,
      matchReasons: matchData?.reasons
    };
  }

  private transformJobPostingData(job: any, userResume?: any): JobOpportunity {
    // Transform job_postings table data to JobOpportunity format
    const requirements = job.requirements ? 
      (typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements) : 
      [];
    
    const matchData = userResume ? this.calculateMatchForJobPosting(job, userResume, requirements) : null;

    return {
      id: job.id.toString(),
      title: job.title,
      company: job.company || 'Company',
      description: job.description,
      requirements,
      salaryRange: {
        min: job.salary_min || 0,
        max: job.salary_max || 0,
        currency: job.salary_currency || 'USD'
      },
      location: job.location || 'Remote',
      remote: job.type === 'remote' || job.location?.toLowerCase().includes('remote'),
      type: this.mapJobType(job.type),
      experienceLevel: this.mapExperienceLevel(job.experience_level),
      industry: 'Technology', // Default for now
      companySize: 'medium', // Default for now
      postedDate: job.posted_date,
      expiryDate: undefined,
      status: 'active',
      applicationCount: job.application_count || 0,
      matchScore: matchData?.score,
      matchReasons: matchData?.reasons
    };
  }

  private mapJobType(type: string): 'full-time' | 'part-time' | 'contract' | 'internship' {
    const typeMap: Record<string, 'full-time' | 'part-time' | 'contract' | 'internship'> = {
      'full-time': 'full-time',
      'full_time': 'full-time',
      'part-time': 'part-time',
      'part_time': 'part-time',
      'contract': 'contract',
      'internship': 'internship'
    };
    return typeMap[type?.toLowerCase()] || 'full-time';
  }

  private mapExperienceLevel(level: string): 'entry' | 'mid' | 'senior' | 'executive' {
    const levelMap: Record<string, 'entry' | 'mid' | 'senior' | 'executive'> = {
      'entry': 'entry',
      'junior': 'entry',
      'mid': 'mid',
      'intermediate': 'mid',
      'senior': 'senior',
      'lead': 'senior',
      'executive': 'executive',
      'principal': 'executive'
    };
    return levelMap[level?.toLowerCase()] || 'mid';
  }

  private calculateMatchForJobPosting(job: any, userResume: any, requirements: string[]): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Skills match
    const userSkills = userResume.skills || [];
    const matchingSkills = requirements.filter((req: string) => 
      userSkills.some((skill: string) => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (matchingSkills.length > 0 && requirements.length > 0) {
      score += 0.4 * (matchingSkills.length / requirements.length);
      reasons.push(`${matchingSkills.length} matching skills`);
    }

    // Experience level match
    const mappedLevel = this.mapExperienceLevel(job.experience_level);
    if (mappedLevel === userResume.experienceLevel) {
      score += 0.3;
      reasons.push('Experience level match');
    }

    // Title similarity
    if (job.title?.toLowerCase().includes(userResume.title?.toLowerCase() || '')) {
      score += 0.3;
      reasons.push('Similar job title');
    }

    // Add base score for active jobs
    if (score === 0) {
      score = 0.5;
      reasons.push('New opportunity');
    }

    return { score: Math.min(score, 1), reasons };
  }

  private calculateDetailedMatchForJobPosting(job: any, userResume: any): JobMatchData {
    const requirements = job.requirements ? 
      (typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements) : 
      [];
    const userSkills = userResume.skills || [];

    const matched = requirements.filter((req: string) => 
      userSkills.some((skill: string) => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const missing = requirements.filter((req: string) => !matched.includes(req));
    const additional = userSkills.filter((skill: string) => 
      !requirements.some((req: string) => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const matchData = this.calculateMatchForJobPosting(job, userResume, requirements);

    const optimizationSuggestions = [];
    if (missing.length > 0) {
      optimizationSuggestions.push(`Add experience with: ${missing.slice(0, 3).join(', ')}`);
    }
    if (matchData.score < 0.7) {
      optimizationSuggestions.push('Consider highlighting relevant experience in your resume');
    }

    return {
      jobId: job.id.toString(),
      matchScore: matchData.score,
      matchReasons: matchData.reasons,
      skillsMatch: {
        matched,
        missing,
        additional
      },
      optimizationSuggestions
    };
  }

  private calculateMatch(job: any, userResume: any): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Skills match
    const jobRequirements = JSON.parse(job.requirements || '[]');
    const userSkills = userResume.skills || [];
    const matchingSkills = jobRequirements.filter((req: string) => 
      userSkills.some((skill: string) => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (matchingSkills.length > 0) {
      score += 0.4 * (matchingSkills.length / jobRequirements.length);
      reasons.push(`${matchingSkills.length} matching skills`);
    }

    // Industry match
    if (job.industry === userResume.industry) {
      score += 0.2;
      reasons.push('Industry match');
    }

    // Experience level match
    if (job.experience_level === userResume.experienceLevel) {
      score += 0.2;
      reasons.push('Experience level match');
    }

    // Title similarity
    if (job.title.toLowerCase().includes(userResume.title?.toLowerCase() || '')) {
      score += 0.2;
      reasons.push('Similar job title');
    }

    return { score: Math.min(score, 1), reasons };
  }

  private calculateDetailedMatch(job: any, userResume: any): JobMatchData {
    const jobRequirements = JSON.parse(job.requirements || '[]');
    const userSkills = userResume.skills || [];

    const matched = jobRequirements.filter((req: string) => 
      userSkills.some((skill: string) => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const missing = jobRequirements.filter((req: string) => !matched.includes(req));
    const additional = userSkills.filter((skill: string) => 
      !jobRequirements.some((req: string) => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const matchData = this.calculateMatch(job, userResume);

    const optimizationSuggestions = [];
    if (missing.length > 0) {
      optimizationSuggestions.push(`Add experience with: ${missing.slice(0, 3).join(', ')}`);
    }
    if (matchData.score < 0.7) {
      optimizationSuggestions.push('Consider highlighting relevant experience in your resume');
    }

    return {
      jobId: job.id,
      matchScore: matchData.score,
      matchReasons: matchData.reasons,
      skillsMatch: {
        matched,
        missing,
        additional
      },
      optimizationSuggestions
    };
  }

  private calculateSearchAnalytics(jobs: JobOpportunity[]): any {
    const totalJobs = jobs.length;
    const averageMatchScore = jobs.reduce((sum, job) => sum + (job.matchScore || 0), 0) / totalJobs;

    const topSkills = jobs.flatMap(job => job.requirements)
      .reduce((acc: Record<string, number>, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {});

    const industryDistribution = jobs.reduce((acc: Record<string, number>, job) => {
      acc[job.industry] = (acc[job.industry] || 0) + 1;
      return acc;
    }, {});

    const salaries = jobs.map(job => (job.salaryRange.min + job.salaryRange.max) / 2);
    const averageSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;

    return {
      averageMatchScore,
      topSkills: Object.entries(topSkills)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([skill]) => skill),
      industryDistribution,
      salaryInsights: {
        averageSalary,
        salaryRange: {
          min: Math.min(...salaries),
          max: Math.max(...salaries)
        }
      }
    };
  }

  private getApplicationById(applicationId: string): JobApplication {
    const application = this.db.prepare(`
      SELECT 
        ja.*,
        jp.title,
        jp.department as company
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      WHERE ja.id = ?
    `).get(applicationId) as any;

    return {
      ...application,
      customizations: JSON.parse(application.customizations || '[]'),
      timeline: this.getApplicationTimeline(applicationId)
    };
  }

  private getApplicationTimeline(applicationId: string): ApplicationEvent[] {
    return this.db.prepare(`
      SELECT * FROM application_events 
      WHERE application_id = ? 
      ORDER BY timestamp ASC
    `).all(applicationId) as any[];
  }

  private getJobAlertById(alertId: string): JobAlert {
    const alert = this.db.prepare(`
      SELECT * FROM job_alerts WHERE id = ?
    `).get(alertId) as any;

    return {
      ...alert,
      filters: JSON.parse(alert.filters),
      isActive: Boolean(alert.is_active)
    };
  }
}