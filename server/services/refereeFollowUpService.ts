/**
 * Referee Follow-up Service
 * Handles automated follow-up sequences and referee onboarding
 */

import { getDatabase } from '../database/connection.js';
import { ReferralStatus } from '../../shared/referrals.js';
import { notificationService } from './notificationService.js';

export interface FollowUpSequence {
  id: number;
  referralId: number;
  sequenceType: 'non_responder' | 'onboarding' | 'job_matching';
  currentStep: number;
  totalSteps: number;
  nextFollowUpAt: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefereeProfile {
  id: number;
  userId: number;
  referralId: number;
  profileCompletionScore: number;
  skills: string[];
  experience: string;
  preferences: {
    jobTypes: string[];
    locations: string[];
    salaryRange?: { min: number; max: number };
    remoteWork: boolean;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobMatch {
  id: number;
  refereeUserId: number;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  matchReasons: string[];
  jobDescription: string;
  requirements: string[];
  salaryRange?: { min: number; max: number };
  location: string;
  remoteAllowed: boolean;
  createdAt: string;
}

export interface FeedbackCollection {
  id: number;
  referralId: number;
  feedbackType: 'declined_referral' | 'interview_feedback' | 'general';
  feedback: string;
  rating?: number;
  suggestions?: string;
  createdAt: string;
}

export class RefereeFollowUpService {
  private db = getDatabase();

  /**
   * Initialize follow-up sequence for a referral
   */
  async initializeFollowUpSequence(referralId: number, sequenceType: 'non_responder' | 'onboarding' | 'job_matching'): Promise<FollowUpSequence> {
    // Check if sequence already exists
    const existingSequence = this.db.prepare(`
      SELECT * FROM follow_up_sequences 
      WHERE referral_id = ? AND sequence_type = ? AND completed = 0
    `).get(referralId, sequenceType) as any;

    if (existingSequence) {
      return this.mapDatabaseToFollowUpSequence(existingSequence);
    }

    // Define sequence steps based on type
    const sequenceSteps = {
      non_responder: 3, // Day 3, Day 7, Day 14
      onboarding: 4,    // Welcome, Profile setup, Skills, Preferences
      job_matching: 2   // Initial matches, Weekly updates
    };

    const totalSteps = sequenceSteps[sequenceType];
    const nextFollowUpAt = this.calculateNextFollowUpTime(sequenceType, 1);

    const insertStmt = this.db.prepare(`
      INSERT INTO follow_up_sequences (
        referral_id, sequence_type, current_step, total_steps, next_follow_up_at
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      referralId,
      sequenceType,
      1,
      totalSteps,
      nextFollowUpAt.toISOString()
    );

    return this.getFollowUpSequenceById(result.lastInsertRowid as number);
  }

  /**
   * Process due follow-up sequences
   */
  async processDueFollowUps(): Promise<number> {
    const now = new Date().toISOString();
    
    const dueSequences = this.db.prepare(`
      SELECT * FROM follow_up_sequences 
      WHERE next_follow_up_at <= ? AND completed = 0
    `).all(now) as any[];

    let processedCount = 0;

    for (const sequence of dueSequences) {
      try {
        await this.processFollowUpStep(sequence);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process follow-up sequence ${sequence.id}:`, error);
      }
    }

    return processedCount;
  }

  /**
   * Process individual follow-up step
   */
  private async processFollowUpStep(sequence: any): Promise<void> {
    const referral = this.getReferralById(sequence.referral_id);
    if (!referral) {
      throw new Error('Referral not found');
    }

    switch (sequence.sequence_type) {
      case 'non_responder':
        await this.processNonResponderFollowUp(sequence, referral);
        break;
      case 'onboarding':
        await this.processOnboardingFollowUp(sequence, referral);
        break;
      case 'job_matching':
        await this.processJobMatchingFollowUp(sequence, referral);
        break;
    }

    // Update sequence to next step or complete
    await this.advanceFollowUpSequence(sequence);
  }

  /**
   * Process non-responder follow-up emails
   */
  private async processNonResponderFollowUp(sequence: any, referral: any): Promise<void> {
    // Check if referral is still pending (hasn't responded)
    if (referral.status !== ReferralStatus.PENDING) {
      // Mark sequence as completed since they responded
      await this.completeFollowUpSequence(sequence.id);
      return;
    }

    const followUpMessages = {
      1: {
        subject: `Reminder: ${referral.position_title} opportunity at ${referral.company_name}`,
        message: `Hi ${referral.referee_name},\n\nJust wanted to follow up on the ${referral.position_title} opportunity at ${referral.company_name} that ${referral.referrer_name} shared with you.\n\nIf you're interested or have any questions, please let us know by clicking the link in the original email.\n\nBest regards,\nThe CVZen Team`
      },
      2: {
        subject: `Last chance: ${referral.position_title} at ${referral.company_name}`,
        message: `Hi ${referral.referee_name},\n\nThis is a final reminder about the ${referral.position_title} opportunity at ${referral.company_name}.\n\nThe referral will expire soon, so if you're interested, please respond as soon as possible.\n\nIf you're not interested, you can also let us know by declining the referral.\n\nBest regards,\nThe CVZen Team`
      },
      3: {
        subject: `Referral expired: ${referral.position_title} at ${referral.company_name}`,
        message: `Hi ${referral.referee_name},\n\nThe referral for the ${referral.position_title} position at ${referral.company_name} has expired due to no response.\n\nIf you're still interested in opportunities like this, feel free to create a CVZen account to stay updated on relevant positions.\n\nBest regards,\nThe CVZen Team`
      }
    };

    const followUpData = followUpMessages[sequence.current_step as keyof typeof followUpMessages];
    if (followUpData) {
      // Send follow-up email (simplified - would use proper email template)
      console.log(`Sending follow-up ${sequence.current_step} to ${referral.referee_email}`);
      // In production, this would send actual email via notification service
    }
  }

  /**
   * Process onboarding follow-up for new referee accounts
   */
  private async processOnboardingFollowUp(sequence: any, referral: any): Promise<void> {
    if (!referral.referee_user_id) {
      // No account created yet, skip onboarding
      await this.completeFollowUpSequence(sequence.id);
      return;
    }

    const onboardingSteps = {
      1: () => this.sendWelcomeEmail(referral),
      2: () => this.sendProfileSetupReminder(referral),
      3: () => this.sendSkillsAssessmentInvite(referral),
      4: () => this.sendPreferencesSetupReminder(referral)
    };

    const stepFunction = onboardingSteps[sequence.current_step as keyof typeof onboardingSteps];
    if (stepFunction) {
      await stepFunction();
    }
  }

  /**
   * Process job matching follow-up
   */
  private async processJobMatchingFollowUp(sequence: any, referral: any): Promise<void> {
    if (!referral.referee_user_id) {
      await this.completeFollowUpSequence(sequence.id);
      return;
    }

    if (sequence.current_step === 1) {
      // Send initial job matches
      await this.sendInitialJobMatches(referral.referee_user_id);
    } else {
      // Send weekly job match updates
      await this.sendWeeklyJobMatches(referral.referee_user_id);
    }
  }

  /**
   * Create referee profile during onboarding
   */
  async createRefereeProfile(userId: number, referralId: number, profileData: {
    skills: string[];
    experience: string;
    preferences: {
      jobTypes: string[];
      locations: string[];
      salaryRange?: { min: number; max: number };
      remoteWork: boolean;
    };
  }): Promise<RefereeProfile> {
    const profileCompletionScore = this.calculateProfileCompletionScore(profileData);

    const insertStmt = this.db.prepare(`
      INSERT INTO referee_profiles (
        user_id, referral_id, profile_completion_score, skills, experience, preferences
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      userId,
      referralId,
      profileCompletionScore,
      JSON.stringify(profileData.skills),
      profileData.experience,
      JSON.stringify(profileData.preferences)
    );

    return this.getRefereeProfileById(result.lastInsertRowid as number);
  }

  /**
   * Find job matches for referee
   */
  async findJobMatches(refereeUserId: number): Promise<JobMatch[]> {
    const profile = this.getRefereeProfileByUserId(refereeUserId);
    if (!profile) {
      return [];
    }

    // Simplified job matching logic
    // In production, this would integrate with a proper job matching service
    const mockJobs = [
      {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        jobDescription: 'Looking for experienced software engineer...',
        requirements: ['JavaScript', 'React', 'Node.js'],
        salaryRange: { min: 80000, max: 120000 },
        location: 'San Francisco, CA',
        remoteAllowed: true
      },
      {
        jobTitle: 'Product Manager',
        companyName: 'Startup Inc',
        jobDescription: 'Seeking product manager with technical background...',
        requirements: ['Product Management', 'Agile', 'Analytics'],
        salaryRange: { min: 90000, max: 130000 },
        location: 'New York, NY',
        remoteAllowed: false
      }
    ];

    const matches: JobMatch[] = [];
    
    for (const job of mockJobs) {
      const matchScore = this.calculateJobMatchScore(profile, job);
      if (matchScore > 0.3) { // 30% minimum match threshold
        const matchReasons = this.generateMatchReasons(profile, job);
        
        matches.push({
          id: Date.now() + Math.random(), // Mock ID
          refereeUserId,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          matchScore: Math.round(matchScore * 100),
          matchReasons,
          jobDescription: job.jobDescription,
          requirements: job.requirements,
          salaryRange: job.salaryRange,
          location: job.location,
          remoteAllowed: job.remoteAllowed,
          createdAt: new Date().toISOString()
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Collect feedback from declined referrals
   */
  async collectFeedback(referralId: number, feedbackData: {
    feedbackType: 'declined_referral' | 'interview_feedback' | 'general';
    feedback: string;
    rating?: number;
    suggestions?: string;
  }): Promise<FeedbackCollection> {
    const insertStmt = this.db.prepare(`
      INSERT INTO feedback_collections (
        referral_id, feedback_type, feedback, rating, suggestions
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      referralId,
      feedbackData.feedbackType,
      feedbackData.feedback,
      feedbackData.rating || null,
      feedbackData.suggestions || null
    );

    return this.getFeedbackById(result.lastInsertRowid as number);
  }

  /**
   * Get referee conversion metrics
   */
  getRefereeConversionMetrics(): {
    totalReferrals: number;
    responseRate: number;
    interestRate: number;
    accountCreationRate: number;
    profileCompletionRate: number;
    jobMatchEngagementRate: number;
  } {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status != 'pending' THEN 1 END) as responded,
        COUNT(CASE WHEN status IN ('contacted', 'interviewed', 'hired') THEN 1 END) as interested,
        COUNT(CASE WHEN referee_user_id IS NOT NULL THEN 1 END) as accounts_created
      FROM referrals
    `).get() as any;

    const profileStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN onboarding_completed = 1 THEN 1 END) as completed_profiles
      FROM referee_profiles
    `).get() as any;

    return {
      totalReferrals: stats.total_referrals,
      responseRate: stats.total_referrals > 0 ? (stats.responded / stats.total_referrals) * 100 : 0,
      interestRate: stats.total_referrals > 0 ? (stats.interested / stats.total_referrals) * 100 : 0,
      accountCreationRate: stats.total_referrals > 0 ? (stats.accounts_created / stats.total_referrals) * 100 : 0,
      profileCompletionRate: profileStats.total_profiles > 0 ? (profileStats.completed_profiles / profileStats.total_profiles) * 100 : 0,
      jobMatchEngagementRate: 0 // Would need additional tracking
    };
  }

  // Helper methods
  private calculateNextFollowUpTime(sequenceType: string, step: number): Date {
    const now = new Date();
    const delays = {
      non_responder: [3, 7, 14], // Days
      onboarding: [1, 3, 7, 14], // Days
      job_matching: [1, 7] // Days
    };

    const dayDelay = delays[sequenceType as keyof typeof delays][step - 1] || 7;
    return new Date(now.getTime() + dayDelay * 24 * 60 * 60 * 1000);
  }

  private async advanceFollowUpSequence(sequence: any): Promise<void> {
    if (sequence.current_step >= sequence.total_steps) {
      await this.completeFollowUpSequence(sequence.id);
    } else {
      const nextStep = sequence.current_step + 1;
      const nextFollowUpAt = this.calculateNextFollowUpTime(sequence.sequence_type, nextStep);

      this.db.prepare(`
        UPDATE follow_up_sequences 
        SET current_step = ?, next_follow_up_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nextStep, nextFollowUpAt.toISOString(), sequence.id);
    }
  }

  private async completeFollowUpSequence(sequenceId: number): Promise<void> {
    this.db.prepare(`
      UPDATE follow_up_sequences 
      SET completed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(sequenceId);
  }

  private calculateProfileCompletionScore(profileData: any): number {
    let score = 0;
    if (profileData.skills && profileData.skills.length > 0) score += 25;
    if (profileData.experience && profileData.experience.trim()) score += 25;
    if (profileData.preferences.jobTypes && profileData.preferences.jobTypes.length > 0) score += 25;
    if (profileData.preferences.locations && profileData.preferences.locations.length > 0) score += 25;
    return score;
  }

  private calculateJobMatchScore(profile: RefereeProfile, job: any): number {
    let score = 0;
    
    // Skills matching
    const profileSkills = profile.skills.map(s => s.toLowerCase());
    const jobRequirements = job.requirements.map((r: string) => r.toLowerCase());
    const skillMatches = profileSkills.filter(skill => 
      jobRequirements.some(req => req.includes(skill) || skill.includes(req))
    );
    score += (skillMatches.length / Math.max(jobRequirements.length, 1)) * 0.4;

    // Location matching
    if (profile.preferences.remoteWork && job.remoteAllowed) {
      score += 0.2;
    } else if (profile.preferences.locations.some(loc => 
      job.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 0.2;
    }

    // Salary matching
    if (profile.preferences.salaryRange && job.salaryRange) {
      const profileMin = profile.preferences.salaryRange.min;
      const profileMax = profile.preferences.salaryRange.max;
      const jobMin = job.salaryRange.min;
      const jobMax = job.salaryRange.max;
      
      if (jobMax >= profileMin && jobMin <= profileMax) {
        score += 0.2;
      }
    }

    // Job type matching
    const jobTypeMatch = profile.preferences.jobTypes.some(type =>
      job.jobTitle.toLowerCase().includes(type.toLowerCase())
    );
    if (jobTypeMatch) score += 0.2;

    return Math.min(score, 1.0);
  }

  private generateMatchReasons(profile: RefereeProfile, job: any): string[] {
    const reasons: string[] = [];
    
    const profileSkills = profile.skills.map(s => s.toLowerCase());
    const jobRequirements = job.requirements.map((r: string) => r.toLowerCase());
    const skillMatches = profileSkills.filter(skill => 
      jobRequirements.some(req => req.includes(skill) || skill.includes(req))
    );
    
    if (skillMatches.length > 0) {
      reasons.push(`Skills match: ${skillMatches.join(', ')}`);
    }
    
    if (profile.preferences.remoteWork && job.remoteAllowed) {
      reasons.push('Remote work available');
    }
    
    if (profile.preferences.salaryRange && job.salaryRange) {
      reasons.push('Salary range matches your preferences');
    }

    return reasons;
  }

  // Email sending methods (simplified)
  private async sendWelcomeEmail(referral: any): Promise<void> {
    console.log(`Sending welcome email to referee user ${referral.referee_user_id}`);
  }

  private async sendProfileSetupReminder(referral: any): Promise<void> {
    console.log(`Sending profile setup reminder to referee user ${referral.referee_user_id}`);
  }

  private async sendSkillsAssessmentInvite(referral: any): Promise<void> {
    console.log(`Sending skills assessment invite to referee user ${referral.referee_user_id}`);
  }

  private async sendPreferencesSetupReminder(referral: any): Promise<void> {
    console.log(`Sending preferences setup reminder to referee user ${referral.referee_user_id}`);
  }

  private async sendInitialJobMatches(refereeUserId: number): Promise<void> {
    const matches = await this.findJobMatches(refereeUserId);
    console.log(`Sending ${matches.length} initial job matches to user ${refereeUserId}`);
  }

  private async sendWeeklyJobMatches(refereeUserId: number): Promise<void> {
    const matches = await this.findJobMatches(refereeUserId);
    console.log(`Sending ${matches.length} weekly job matches to user ${refereeUserId}`);
  }

  // Database helper methods
  private getReferralById(referralId: number): any {
    return this.db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId);
  }

  private getFollowUpSequenceById(id: number): FollowUpSequence {
    const sequence = this.db.prepare('SELECT * FROM follow_up_sequences WHERE id = ?').get(id) as any;
    return this.mapDatabaseToFollowUpSequence(sequence);
  }

  private getRefereeProfileById(id: number): RefereeProfile {
    const profile = this.db.prepare('SELECT * FROM referee_profiles WHERE id = ?').get(id) as any;
    return this.mapDatabaseToRefereeProfile(profile);
  }

  private getRefereeProfileByUserId(userId: number): RefereeProfile | null {
    const profile = this.db.prepare('SELECT * FROM referee_profiles WHERE user_id = ?').get(userId) as any;
    return profile ? this.mapDatabaseToRefereeProfile(profile) : null;
  }

  private getFeedbackById(id: number): FeedbackCollection {
    const feedback = this.db.prepare('SELECT * FROM feedback_collections WHERE id = ?').get(id) as any;
    return {
      id: feedback.id,
      referralId: feedback.referral_id,
      feedbackType: feedback.feedback_type,
      feedback: feedback.feedback,
      rating: feedback.rating,
      suggestions: feedback.suggestions,
      createdAt: feedback.created_at
    };
  }

  private mapDatabaseToFollowUpSequence(row: any): FollowUpSequence {
    return {
      id: row.id,
      referralId: row.referral_id,
      sequenceType: row.sequence_type,
      currentStep: row.current_step,
      totalSteps: row.total_steps,
      nextFollowUpAt: row.next_follow_up_at,
      completed: row.completed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDatabaseToRefereeProfile(row: any): RefereeProfile {
    return {
      id: row.id,
      userId: row.user_id,
      referralId: row.referral_id,
      profileCompletionScore: row.profile_completion_score,
      skills: JSON.parse(row.skills || '[]'),
      experience: row.experience,
      preferences: JSON.parse(row.preferences || '{}'),
      onboardingCompleted: row.onboarding_completed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const refereeFollowUpService = new RefereeFollowUpService();