/**
 * Job Matching Integration Service
 * Handles integration between referral system and job matching/placement tracking
 */

import { getDatabase } from '../database/connection.js';
import { ReferralService } from './referralService.js';
import { ReferralStatus } from '../../shared/referrals.js';

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
  postedDate: string;
  expiryDate?: string;
  status: 'active' | 'filled' | 'expired' | 'paused';
}

export interface JobMatch {
  jobId: string;
  candidateId: number;
  matchScore: number;
  matchReasons: string[];
  referralId?: number;
  matchedAt: string;
  status: 'potential' | 'applied' | 'interviewed' | 'hired' | 'rejected';
}

export interface PlacementRecord {
  id: string;
  candidateId: number;
  jobId: string;
  referralId?: number;
  hiredDate: string;
  startDate?: string;
  salary?: number;
  currency?: string;
  status: 'confirmed' | 'started' | 'ended' | 'cancelled';
  endDate?: string;
  endReason?: string;
}

export interface ReferralAttribution {
  referralId: number;
  jobMatchId: string;
  placementId?: string;
  attributionScore: number;
  attributionReasons: string[];
  createdAt: string;
}

export class JobMatchingIntegrationService {
  private db = getDatabase();
  private referralService = new ReferralService();

  /**
   * Connect referrals with job opportunities in the system
   */
  async connectReferralToJobOpportunity(referralId: number, jobId: string): Promise<void> {
    // Get referral details
    const referral = this.referralService.getReferralById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    // Get job opportunity (mock implementation - would integrate with actual job system)
    const jobOpportunity = await this.getJobOpportunity(jobId);
    if (!jobOpportunity) {
      throw new Error('Job opportunity not found');
    }

    // Check if referral matches the job
    const isMatch = this.checkReferralJobMatch(referral, jobOpportunity);
    if (!isMatch) {
      throw new Error('Referral does not match job requirements');
    }

    // Store the connection
    this.db.prepare(`
      INSERT OR REPLACE INTO referral_job_connections (referral_id, job_id, connected_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(referralId, jobId);

    // Update referral metadata with job information
    const currentMetadata = referral.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      connectedJob: {
        jobId,
        title: jobOpportunity.title,
        company: jobOpportunity.company,
        connectedAt: new Date().toISOString()
      }
    };

    this.db.prepare(`
      UPDATE referrals 
      SET metadata = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(JSON.stringify(updatedMetadata), referralId);
  }

  /**
   * Implement automatic hire detection from job placement data
   */
  async detectHireFromPlacement(placementRecord: PlacementRecord): Promise<void> {
    // Find referrals that might be related to this placement
    const potentialReferrals = this.db.prepare(`
      SELECT r.*, rjc.job_id
      FROM referrals r
      LEFT JOIN referral_job_connections rjc ON r.id = rjc.referral_id
      WHERE (r.referee_user_id = ? OR r.referee_email = (
        SELECT email FROM users WHERE id = ?
      ))
      AND r.status IN ('pending', 'signed_up', 'trial_user')
      AND (rjc.job_id = ? OR rjc.job_id IS NULL)
    `).all(placementRecord.candidateId, placementRecord.candidateId, placementRecord.jobId) as any[];

    for (const referral of potentialReferrals) {
      // Calculate attribution score
      const attributionScore = this.calculateAttributionScore(referral, placementRecord);
      
      if (attributionScore > 0.7) { // 70% confidence threshold
        // Create placement attribution
        await this.createReferralAttribution(referral.id, placementRecord);
        
        // Update referral status to paid user
        await this.referralService.updateReferralStatus(
          referral.id, 
          ReferralStatus.PAID_USER, 
          undefined, 
          `Automatically detected subscription from placement record ${placementRecord.id}`
        );

        // Log the automatic detection
        this.logPlacementDetection(referral.id, placementRecord.id, attributionScore);
      }
    }
  }

  /**
   * Add referral attribution to successful job matches
   */
  async createReferralAttribution(referralId: number, placementRecord: PlacementRecord): Promise<ReferralAttribution> {
    const referral = this.referralService.getReferralById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    // Calculate attribution score and reasons
    const attributionScore = this.calculateAttributionScore(referral, placementRecord);
    const attributionReasons = this.generateAttributionReasons(referral, placementRecord);

    // Store attribution record
    const insertStmt = this.db.prepare(`
      INSERT INTO referral_attributions (
        referral_id, job_match_id, placement_id, attribution_score, 
        attribution_reasons, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = insertStmt.run(
      referralId,
      `job-${placementRecord.jobId}`,
      placementRecord.id,
      attributionScore,
      JSON.stringify(attributionReasons)
    );

    return {
      referralId,
      jobMatchId: `job-${placementRecord.jobId}`,
      placementId: placementRecord.id,
      attributionScore,
      attributionReasons,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Create placement confirmation workflow for reward processing
   */
  async createPlacementConfirmationWorkflow(placementRecord: PlacementRecord): Promise<void> {
    // Find related referral attributions
    const attributions = this.db.prepare(`
      SELECT ra.*, r.referrer_id, r.reward_amount
      FROM referral_attributions ra
      JOIN referrals r ON ra.referral_id = r.id
      WHERE ra.placement_id = ?
    `).all(placementRecord.id) as any[];

    for (const attribution of attributions) {
      // Create confirmation workflow entry
      this.db.prepare(`
        INSERT INTO placement_confirmations (
          referral_id, placement_id, attribution_score, status, 
          requires_manual_review, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        attribution.referral_id,
        placementRecord.id,
        attribution.attribution_score,
        attribution.attribution_score > 0.9 ? 'auto_approved' : 'pending_review',
        attribution.attribution_score <= 0.9 ? 1 : 0
      );

      // If high confidence, automatically process reward
      if (attribution.attribution_score > 0.9) {
        await this.processAutomaticReward(attribution.referral_id, placementRecord);
      } else {
        // Queue for manual review
        await this.queueForManualReview(attribution.referral_id, placementRecord, attribution.attribution_score);
      }
    }
  }

  /**
   * Get job opportunities that match referral criteria
   */
  async getMatchingJobsForReferral(referralId: number): Promise<JobOpportunity[]> {
    const referral = this.referralService.getReferralById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    // Mock implementation - in real system, this would query job database
    const mockJobs: JobOpportunity[] = [
      {
        id: 'job-1',
        title: referral.positionTitle,
        company: referral.companyName,
        description: `${referral.positionTitle} position at ${referral.companyName}`,
        requirements: ['Experience', 'Skills'],
        salaryRange: { min: 50000, max: 80000, currency: 'USD' },
        location: 'Remote',
        remote: true,
        type: 'full-time',
        postedDate: new Date().toISOString(),
        status: 'active'
      }
    ];

    // Filter jobs based on referral criteria
    return mockJobs.filter(job => 
      job.title.toLowerCase().includes(referral.positionTitle.toLowerCase()) ||
      job.company.toLowerCase().includes(referral.companyName.toLowerCase())
    );
  }

  /**
   * Track job application from referred candidate
   */
  async trackJobApplication(candidateId: number, jobId: string, referralId?: number): Promise<void> {
    // Create job match record
    const matchScore = referralId ? 0.8 : 0.5; // Higher score if from referral
    const matchReasons = referralId ? ['Referred by network contact'] : ['Profile match'];

    this.db.prepare(`
      INSERT INTO job_matches (
        job_id, candidate_id, referral_id, match_score, match_reasons, 
        status, matched_at
      ) VALUES (?, ?, ?, ?, ?, 'applied', CURRENT_TIMESTAMP)
    `).run(jobId, candidateId, referralId || null, matchScore, JSON.stringify(matchReasons));

    // If from referral, update referral status
    if (referralId) {
      await this.referralService.updateReferralStatus(
        referralId, 
        ReferralStatus.SIGNED_UP,
        undefined,
        `Candidate applied for job ${jobId}`
      );
    }
  }

  /**
   * Get referral attribution analytics
   */
  getReferralAttributionAnalytics(userId?: number): any {
    let query = `
      SELECT 
        COUNT(*) as total_attributions,
        AVG(attribution_score) as avg_attribution_score,
        COUNT(CASE WHEN attribution_score > 0.9 THEN 1 END) as high_confidence,
        COUNT(CASE WHEN attribution_score BETWEEN 0.7 AND 0.9 THEN 1 END) as medium_confidence,
        COUNT(CASE WHEN attribution_score < 0.7 THEN 1 END) as low_confidence
      FROM referral_attributions ra
      JOIN referrals r ON ra.referral_id = r.id
    `;

    const params: any[] = [];
    if (userId) {
      query += ' WHERE r.referrer_id = ?';
      params.push(userId);
    }

    const stats = this.db.prepare(query).get(...params) as any;

    return {
      totalAttributions: stats.total_attributions || 0,
      averageAttributionScore: stats.avg_attribution_score || 0,
      highConfidenceAttributions: stats.high_confidence || 0,
      mediumConfidenceAttributions: stats.medium_confidence || 0,
      lowConfidenceAttributions: stats.low_confidence || 0
    };
  }

  // Private helper methods

  private async getJobOpportunity(jobId: string): Promise<JobOpportunity | null> {
    // Mock implementation - would integrate with actual job system
    return {
      id: jobId,
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'Software engineering position',
      requirements: ['JavaScript', 'React', 'Node.js'],
      salaryRange: { min: 60000, max: 90000, currency: 'USD' },
      location: 'San Francisco',
      remote: true,
      type: 'full-time',
      postedDate: new Date().toISOString(),
      status: 'active'
    };
  }

  private checkReferralJobMatch(referral: any, job: JobOpportunity): boolean {
    // Simple matching logic - in real system, this would be more sophisticated
    return (
      referral.positionTitle.toLowerCase().includes(job.title.toLowerCase()) ||
      job.title.toLowerCase().includes(referral.positionTitle.toLowerCase()) ||
      referral.companyName.toLowerCase() === job.company.toLowerCase()
    );
  }

  private calculateAttributionScore(referral: any, placement: PlacementRecord): number {
    let score = 0;

    // Email match
    if (referral.referee_user_id === placement.candidateId) {
      score += 0.4;
    }

    // Job match
    if (referral.metadata?.connectedJob?.jobId === placement.jobId) {
      score += 0.3;
    }

    // Timing (referral created before placement)
    const referralDate = new Date(referral.created_at);
    const placementDate = new Date(placement.hiredDate);
    if (referralDate < placementDate) {
      score += 0.2;
    }

    // Company match
    if (referral.companyName.toLowerCase() === this.getCompanyFromJobId(placement.jobId)?.toLowerCase()) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private generateAttributionReasons(referral: any, placement: PlacementRecord): string[] {
    const reasons: string[] = [];

    if (referral.referee_user_id === placement.candidateId) {
      reasons.push('Candidate ID matches referral');
    }

    if (referral.metadata?.connectedJob?.jobId === placement.jobId) {
      reasons.push('Job ID matches connected job');
    }

    const referralDate = new Date(referral.created_at);
    const placementDate = new Date(placement.hiredDate);
    if (referralDate < placementDate) {
      reasons.push('Referral created before placement');
    }

    return reasons;
  }

  private getCompanyFromJobId(jobId: string): string | null {
    // Mock implementation - would query job database
    return 'Tech Corp';
  }

  private async processAutomaticReward(referralId: number, placement: PlacementRecord): Promise<void> {
    // Update referral status and process reward
    await this.referralService.updateReferralStatus(
      referralId,
      ReferralStatus.PAID_USER,
      undefined,
      `Automatic reward processing for placement ${placement.id}`
    );

    this.logAutomaticRewardProcessing(referralId, placement.id);
  }

  private async queueForManualReview(referralId: number, placement: PlacementRecord, score: number): Promise<void> {
    // Add to manual review queue
    this.db.prepare(`
      INSERT INTO manual_review_queue (
        referral_id, placement_id, attribution_score, status, created_at
      ) VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).run(referralId, placement.id, score);

    this.logManualReviewQueued(referralId, placement.id, score);
  }

  private logPlacementDetection(referralId: number, placementId: string, score: number): void {
    this.db.prepare(`
      INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description)
      SELECT referrer_id, 'placement_detected', 'referral', ?, ?
      FROM referrals WHERE id = ?
    `).run(referralId, `Placement detected with ${(score * 100).toFixed(1)}% confidence`, referralId);
  }

  private logAutomaticRewardProcessing(referralId: number, placementId: string): void {
    this.db.prepare(`
      INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description)
      SELECT referrer_id, 'reward_processed', 'referral', ?, ?
      FROM referrals WHERE id = ?
    `).run(referralId, `Reward automatically processed for placement ${placementId}`, referralId);
  }

  private logManualReviewQueued(referralId: number, placementId: string, score: number): void {
    this.db.prepare(`
      INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description)
      SELECT referrer_id, 'manual_review_queued', 'referral', ?, ?
      FROM referrals WHERE id = ?
    `).run(referralId, `Placement ${placementId} queued for manual review (${(score * 100).toFixed(1)}% confidence)`, referralId);
  }
}