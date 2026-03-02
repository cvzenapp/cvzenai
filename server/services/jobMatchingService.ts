/**
 * Job Matching Service
 * Integrates with referee system to provide job recommendations
 */

import { getDatabase } from '../database/connection.js';
import { RefereeProfile, JobMatch } from './refereeFollowUpService.js';

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  salaryRange?: { min: number; max: number };
  location: string;
  remoteAllowed: boolean;
  jobType: string;
  industry: string;
  postedDate: Date;
  expiryDate: Date;
  active: boolean;
}

export interface MatchCriteria {
  skillsWeight: number;
  experienceWeight: number;
  locationWeight: number;
  salaryWeight: number;
  jobTypeWeight: number;
  minimumMatchScore: number;
}

export interface JobMatchResult {
  job: JobOpportunity;
  matchScore: number;
  matchReasons: string[];
  skillMatches: string[];
  missingSkills: string[];
  salaryFit: 'perfect' | 'good' | 'acceptable' | 'poor';
  locationFit: 'perfect' | 'good' | 'poor';
}

export class JobMatchingService {
  private db = getDatabase();
  private defaultMatchCriteria: MatchCriteria = {
    skillsWeight: 0.4,
    experienceWeight: 0.2,
    locationWeight: 0.2,
    salaryWeight: 0.15,
    jobTypeWeight: 0.05,
    minimumMatchScore: 0.3
  };

  /**
   * Find job matches for a referee
   */
  async findJobMatches(refereeUserId: number, limit: number = 10): Promise<JobMatchResult[]> {
    const profile = await this.getRefereeProfile(refereeUserId);
    if (!profile) {
      throw new Error('Referee profile not found');
    }

    const activeJobs = await this.getActiveJobOpportunities();
    const matches: JobMatchResult[] = [];

    for (const job of activeJobs) {
      const matchResult = this.calculateJobMatch(profile, job);
      
      if (matchResult.matchScore >= this.defaultMatchCriteria.minimumMatchScore) {
        matches.push(matchResult);
      }
    }

    // Sort by match score and return top matches
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Calculate match score between referee profile and job
   */
  private calculateJobMatch(profile: RefereeProfile, job: JobOpportunity): JobMatchResult {
    const criteria = this.defaultMatchCriteria;
    let totalScore = 0;
    const matchReasons: string[] = [];
    
    // Skills matching
    const skillsScore = this.calculateSkillsMatch(profile.skills, job.skills, job.requirements);
    totalScore += skillsScore.score * criteria.skillsWeight;
    if (skillsScore.matches.length > 0) {
      matchReasons.push(`${skillsScore.matches.length} matching skills: ${skillsScore.matches.slice(0, 3).join(', ')}`);
    }

    // Experience matching
    const experienceScore = this.calculateExperienceMatch(profile.experience, job.experience);
    totalScore += experienceScore * criteria.experienceWeight;
    if (experienceScore > 0.7) {
      matchReasons.push('Experience level matches requirements');
    }

    // Location matching
    const locationScore = this.calculateLocationMatch(profile.preferences, job);
    totalScore += locationScore.score * criteria.locationWeight;
    if (locationScore.fit === 'perfect') {
      matchReasons.push(locationScore.reason);
    }

    // Salary matching
    const salaryScore = this.calculateSalaryMatch(profile.preferences.salaryRange, job.salaryRange);
    totalScore += salaryScore.score * criteria.salaryWeight;
    if (salaryScore.fit !== 'poor') {
      matchReasons.push(`Salary ${salaryScore.fit} match`);
    }

    // Job type matching
    const jobTypeScore = this.calculateJobTypeMatch(profile.preferences.jobTypes, job.jobType, job.title);
    totalScore += jobTypeScore * criteria.jobTypeWeight;
    if (jobTypeScore > 0.5) {
      matchReasons.push('Job type matches preferences');
    }

    return {
      job,
      matchScore: Math.round(totalScore * 100),
      matchReasons,
      skillMatches: skillsScore.matches,
      missingSkills: skillsScore.missing,
      salaryFit: salaryScore.fit,
      locationFit: locationScore.fit
    };
  }

  /**
   * Calculate skills matching score
   */
  private calculateSkillsMatch(profileSkills: string[], jobSkills: string[], jobRequirements: string[]): {
    score: number;
    matches: string[];
    missing: string[];
  } {
    const normalizedProfileSkills = profileSkills.map(s => s.toLowerCase().trim());
    const allJobSkills = [...jobSkills, ...jobRequirements].map(s => s.toLowerCase().trim());
    
    const matches: string[] = [];
    const missing: string[] = [];

    for (const jobSkill of allJobSkills) {
      const match = normalizedProfileSkills.find(profileSkill => 
        profileSkill.includes(jobSkill) || 
        jobSkill.includes(profileSkill) ||
        this.areSkillsSimilar(profileSkill, jobSkill)
      );
      
      if (match) {
        matches.push(jobSkill);
      } else {
        missing.push(jobSkill);
      }
    }

    const score = allJobSkills.length > 0 ? matches.length / allJobSkills.length : 0;
    
    return {
      score: Math.min(score, 1.0),
      matches: matches.slice(0, 10), // Limit for display
      missing: missing.slice(0, 5)   // Limit for display
    };
  }

  /**
   * Calculate experience matching score
   */
  private calculateExperienceMatch(profileExperience: string, jobExperience: string): number {
    // Simplified experience matching - in production would use NLP
    const profileExp = profileExperience.toLowerCase();
    const jobExp = jobExperience.toLowerCase();
    
    // Extract years of experience if mentioned
    const profileYears = this.extractYearsOfExperience(profileExp);
    const jobYears = this.extractYearsOfExperience(jobExp);
    
    if (profileYears !== null && jobYears !== null) {
      if (profileYears >= jobYears) return 1.0;
      if (profileYears >= jobYears * 0.8) return 0.8;
      if (profileYears >= jobYears * 0.6) return 0.6;
      return 0.3;
    }
    
    // Fallback to keyword matching
    const commonKeywords = ['senior', 'junior', 'lead', 'manager', 'director', 'entry', 'mid-level'];
    let matches = 0;
    
    for (const keyword of commonKeywords) {
      if (profileExp.includes(keyword) && jobExp.includes(keyword)) {
        matches++;
      }
    }
    
    return Math.min(matches / 3, 1.0);
  }

  /**
   * Calculate location matching score
   */
  private calculateLocationMatch(preferences: RefereeProfile['preferences'], job: JobOpportunity): {
    score: number;
    fit: 'perfect' | 'good' | 'poor';
    reason: string;
  } {
    // Remote work preference
    if (preferences.remoteWork && job.remoteAllowed) {
      return {
        score: 1.0,
        fit: 'perfect',
        reason: 'Remote work available'
      };
    }
    
    // Location preferences
    const jobLocation = job.location.toLowerCase();
    for (const prefLocation of preferences.locations) {
      const prefLoc = prefLocation.toLowerCase();
      
      if (jobLocation.includes(prefLoc) || prefLoc.includes(jobLocation)) {
        return {
          score: 1.0,
          fit: 'perfect',
          reason: `Located in preferred area: ${prefLocation}`
        };
      }
      
      // Check for same state/region
      if (this.isSameRegion(prefLoc, jobLocation)) {
        return {
          score: 0.7,
          fit: 'good',
          reason: `Same region as preference`
        };
      }
    }
    
    // If remote work is allowed but not preferred
    if (job.remoteAllowed) {
      return {
        score: 0.5,
        fit: 'good',
        reason: 'Remote work option available'
      };
    }
    
    return {
      score: 0.1,
      fit: 'poor',
      reason: 'Location does not match preferences'
    };
  }

  /**
   * Calculate salary matching score
   */
  private calculateSalaryMatch(profileSalaryRange?: { min: number; max: number }, jobSalaryRange?: { min: number; max: number }): {
    score: number;
    fit: 'perfect' | 'good' | 'acceptable' | 'poor';
  } {
    if (!profileSalaryRange || !jobSalaryRange) {
      return { score: 0.5, fit: 'acceptable' }; // Neutral if no salary info
    }
    
    const profileMin = profileSalaryRange.min;
    const profileMax = profileSalaryRange.max;
    const jobMin = jobSalaryRange.min;
    const jobMax = jobSalaryRange.max;
    
    // Perfect overlap
    if (jobMin >= profileMin && jobMax <= profileMax) {
      return { score: 1.0, fit: 'perfect' };
    }
    
    // Good overlap
    if (jobMax >= profileMin && jobMin <= profileMax) {
      const overlapMin = Math.max(profileMin, jobMin);
      const overlapMax = Math.min(profileMax, jobMax);
      const overlapSize = overlapMax - overlapMin;
      const profileRange = profileMax - profileMin;
      const overlapRatio = overlapSize / profileRange;
      
      if (overlapRatio > 0.7) {
        return { score: 0.9, fit: 'good' };
      } else if (overlapRatio > 0.3) {
        return { score: 0.7, fit: 'acceptable' };
      }
    }
    
    // Job pays more than expected
    if (jobMin > profileMax) {
      return { score: 0.8, fit: 'good' };
    }
    
    // Job pays less than expected
    return { score: 0.2, fit: 'poor' };
  }

  /**
   * Calculate job type matching score
   */
  private calculateJobTypeMatch(preferredJobTypes: string[], jobType: string, jobTitle: string): number {
    const normalizedJobType = jobType.toLowerCase();
    const normalizedJobTitle = jobTitle.toLowerCase();
    
    for (const prefType of preferredJobTypes) {
      const normalizedPrefType = prefType.toLowerCase();
      
      if (normalizedJobType.includes(normalizedPrefType) || 
          normalizedPrefType.includes(normalizedJobType) ||
          normalizedJobTitle.includes(normalizedPrefType)) {
        return 1.0;
      }
    }
    
    return 0.0;
  }

  /**
   * Store job match for tracking
   */
  async storeJobMatch(refereeUserId: number, jobMatch: JobMatchResult): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO job_matches (
        referee_user_id, job_title, company_name, match_score, match_reasons,
        job_description, requirements, salary_range, location, remote_allowed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      refereeUserId,
      jobMatch.job.title,
      jobMatch.job.company,
      jobMatch.matchScore,
      JSON.stringify(jobMatch.matchReasons),
      jobMatch.job.description,
      JSON.stringify(jobMatch.job.requirements),
      jobMatch.job.salaryRange ? JSON.stringify(jobMatch.job.salaryRange) : null,
      jobMatch.job.location,
      jobMatch.job.remoteAllowed ? 1 : 0
    );
  }

  /**
   * Track job match engagement
   */
  async trackJobMatchEngagement(refereeUserId: number, jobMatchId: number, engagementType: 'viewed' | 'applied'): Promise<void> {
    // Update job match record
    const updateStmt = this.db.prepare(`
      UPDATE job_matches 
      SET ${engagementType} = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND referee_user_id = ?
    `);
    
    updateStmt.run(jobMatchId, refereeUserId);

    // Track engagement
    const insertEngagement = this.db.prepare(`
      INSERT INTO referee_engagement (referee_user_id, engagement_type, engagement_data)
      VALUES (?, ?, ?)
    `);

    insertEngagement.run(
      refereeUserId,
      `job_${engagementType}`,
      JSON.stringify({ jobMatchId, timestamp: new Date().toISOString() })
    );
  }

  /**
   * Get job match analytics for referee
   */
  getJobMatchAnalytics(refereeUserId: number): {
    totalMatches: number;
    averageMatchScore: number;
    viewedMatches: number;
    appliedMatches: number;
    topSkillMatches: string[];
    engagementRate: number;
  } {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_matches,
        AVG(match_score) as avg_match_score,
        COUNT(CASE WHEN viewed = 1 THEN 1 END) as viewed_matches,
        COUNT(CASE WHEN applied = 1 THEN 1 END) as applied_matches
      FROM job_matches 
      WHERE referee_user_id = ?
    `).get(refereeUserId) as any;

    // Get top skill matches
    const skillMatches = this.db.prepare(`
      SELECT match_reasons FROM job_matches 
      WHERE referee_user_id = ? AND match_score > 50
      ORDER BY match_score DESC
      LIMIT 10
    `).all(refereeUserId) as any[];

    const allSkills: string[] = [];
    skillMatches.forEach(match => {
      try {
        const reasons = JSON.parse(match.match_reasons);
        reasons.forEach((reason: string) => {
          if (reason.includes('matching skills:')) {
            const skills = reason.split(':')[1]?.split(',').map((s: string) => s.trim());
            if (skills) allSkills.push(...skills);
          }
        });
      } catch (e) {
        // Ignore parsing errors
      }
    });

    const skillCounts = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSkillMatches = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    const engagementRate = stats.total_matches > 0 
      ? (stats.viewed_matches / stats.total_matches) * 100 
      : 0;

    return {
      totalMatches: stats.total_matches || 0,
      averageMatchScore: Math.round(stats.avg_match_score || 0),
      viewedMatches: stats.viewed_matches || 0,
      appliedMatches: stats.applied_matches || 0,
      topSkillMatches,
      engagementRate: Math.round(engagementRate)
    };
  }

  // Helper methods
  private async getRefereeProfile(userId: number): Promise<RefereeProfile | null> {
    const profile = this.db.prepare(`
      SELECT * FROM referee_profiles WHERE user_id = ?
    `).get(userId) as any;

    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.user_id,
      referralId: profile.referral_id,
      profileCompletionScore: profile.profile_completion_score,
      skills: JSON.parse(profile.skills || '[]'),
      experience: profile.experience,
      preferences: JSON.parse(profile.preferences || '{}'),
      onboardingCompleted: profile.onboarding_completed === 1,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }

  private async getActiveJobOpportunities(): Promise<JobOpportunity[]> {
    // Mock job opportunities - in production this would come from a job board API
    return [
      {
        id: 'job_1',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        description: 'We are looking for a senior software engineer with experience in React and Node.js...',
        requirements: ['React', 'Node.js', 'TypeScript', '5+ years experience'],
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
        experience: '5+ years of software development experience',
        salaryRange: { min: 90000, max: 130000 },
        location: 'San Francisco, CA',
        remoteAllowed: true,
        jobType: 'Full-time',
        industry: 'Technology',
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true
      },
      {
        id: 'job_2',
        title: 'Product Manager',
        company: 'Startup Inc',
        description: 'Seeking an experienced product manager to lead our product development...',
        requirements: ['Product Management', 'Agile', 'Analytics', '3+ years experience'],
        skills: ['Product Strategy', 'User Research', 'Data Analysis', 'Roadmapping'],
        experience: '3+ years in product management',
        salaryRange: { min: 85000, max: 120000 },
        location: 'New York, NY',
        remoteAllowed: false,
        jobType: 'Full-time',
        industry: 'Technology',
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true
      },
      {
        id: 'job_3',
        title: 'Frontend Developer',
        company: 'Design Studio',
        description: 'Looking for a creative frontend developer with strong design skills...',
        requirements: ['React', 'CSS', 'JavaScript', '2+ years experience'],
        skills: ['React', 'CSS', 'JavaScript', 'Figma', 'UI/UX'],
        experience: '2+ years frontend development',
        salaryRange: { min: 65000, max: 85000 },
        location: 'Austin, TX',
        remoteAllowed: true,
        jobType: 'Full-time',
        industry: 'Design',
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true
      }
    ];
  }

  private areSkillsSimilar(skill1: string, skill2: string): boolean {
    // Simple similarity check - in production would use more sophisticated matching
    const synonyms = {
      'javascript': ['js', 'ecmascript'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'node': ['nodejs', 'node.js'],
      'python': ['py'],
      'java': ['jvm'],
      'css': ['stylesheets', 'styling'],
      'html': ['markup'],
      'sql': ['database', 'db']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if ((skill1.includes(key) && values.some(v => skill2.includes(v))) ||
          (skill2.includes(key) && values.some(v => skill1.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  private extractYearsOfExperience(text: string): number | null {
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /(\d+)\+?\s*years?\s*in/i,
      /(\d+)\+?\s*yrs/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  private isSameRegion(location1: string, location2: string): boolean {
    // Simple region matching - in production would use proper geographic data
    const regions = {
      'california': ['ca', 'california', 'san francisco', 'los angeles', 'san diego'],
      'new york': ['ny', 'new york', 'nyc', 'manhattan'],
      'texas': ['tx', 'texas', 'austin', 'dallas', 'houston'],
      'washington': ['wa', 'washington', 'seattle'],
      'florida': ['fl', 'florida', 'miami', 'orlando']
    };

    for (const [region, locations] of Object.entries(regions)) {
      const inRegion1 = locations.some(loc => location1.includes(loc));
      const inRegion2 = locations.some(loc => location2.includes(loc));
      if (inRegion1 && inRegion2) return true;
    }

    return false;
  }
}

export const jobMatchingService = new JobMatchingService();