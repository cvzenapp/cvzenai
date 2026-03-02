/**
 * Referral Analytics Service
 * Provides analytics and reporting functionality for the referrals system
 */

import { getDatabase } from '../database/connection.js';
import { ReferralStatus, RewardStatus } from '../../shared/referrals.js';

export interface ReferralAnalytics {
  totalReferrals: number;
  conversionRate: number;
  totalRewards: number;
  averageRewardAmount: number;
  referralsByStatus: Record<ReferralStatus, number>;
  rewardsByStatus: Record<RewardStatus, number>;
  monthlyTrends: MonthlyTrend[];
  topPerformingCompanies: CompanyPerformance[];
  averageTimeToHire: number;
}

export interface ConversionFunnel {
  pending: { count: number; percentage: number };
  contacted: { count: number; percentage: number; dropOffFromPrevious: number };
  interviewed: { count: number; percentage: number; dropOffFromPrevious: number };
  hired: { count: number; percentage: number; dropOffFromPrevious: number };
  rejected: { count: number; percentage: number };
  expired: { count: number; percentage: number };
  declined: { count: number; percentage: number };
}

export interface TopReferrer {
  userId: number;
  userName: string;
  userEmail: string;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  totalEarnings: number;
  pendingRewards: number;
  paidRewards: number;
  averageRewardAmount: number;
  lastReferralDate: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  totalRewards: number;
}

export interface CompanyPerformance {
  companyName: string;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  averageTimeToHire: number;
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  companyName?: string;
  status?: ReferralStatus[];
  userId?: number;
}

export interface ExportData {
  referrals: any[];
  summary: ReferralAnalytics;
  exportedAt: string;
  filters: AnalyticsFilters;
}

export class ReferralAnalyticsService {
  private db = getDatabase();

  /**
   * Get comprehensive referral analytics
   */
  getReferralAnalytics(filters?: AnalyticsFilters): ReferralAnalytics {
    const { whereClause, params } = this.buildWhereClause(filters);

    // Get basic metrics
    const basicMetrics = this.db.prepare(`
      SELECT 
        COUNT(*) as totalReferrals,
        COUNT(CASE WHEN status = 'hired' THEN 1 END) as successfulReferrals,
        COALESCE(AVG(CASE WHEN status = 'hired' THEN reward_amount END), 0) as averageRewardAmount
      FROM referrals r
      ${whereClause}
    `).get(...params) as any;

    const conversionRate = basicMetrics && basicMetrics.totalReferrals > 0 
      ? (basicMetrics.successfulReferrals / basicMetrics.totalReferrals) * 100 
      : 0;

    // Get referrals by status
    const statusCounts = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM referrals r
      ${whereClause}
      GROUP BY status
    `).all(...params) as any[];

    const referralsByStatus = Object.values(ReferralStatus).reduce((acc, status) => {
      acc[status] = statusCounts.find(s => s.status === status)?.count || 0;
      return acc;
    }, {} as Record<ReferralStatus, number>);

    // Get rewards by status
    const rewardCounts = this.db.prepare(`
      SELECT rw.status, COUNT(*) as count, COALESCE(SUM(rw.amount), 0) as totalAmount
      FROM rewards rw
      JOIN referrals r ON rw.referral_id = r.id
      ${whereClause.replace('WHERE', 'WHERE')}
      GROUP BY rw.status
    `).all(...params) as any[];

    const rewardsByStatus = Object.values(RewardStatus).reduce((acc, status) => {
      acc[status] = rewardCounts.find(r => r.status === status)?.count || 0;
      return acc;
    }, {} as Record<RewardStatus, number>);

    const totalRewards = rewardCounts.reduce((sum, r) => sum + r.totalAmount, 0);

    // Get monthly trends
    const monthlyTrends = this.getMonthlyTrends(filters);

    // Get top performing companies
    const topPerformingCompanies = this.getTopPerformingCompanies(filters);

    // Calculate average time to hire
    const averageTimeToHire = this.calculateAverageTimeToHire(filters);

    return {
      totalReferrals: basicMetrics?.totalReferrals || 0,
      conversionRate,
      totalRewards,
      averageRewardAmount: basicMetrics?.averageRewardAmount || 0,
      referralsByStatus,
      rewardsByStatus,
      monthlyTrends,
      topPerformingCompanies,
      averageTimeToHire
    };
  }

  /**
   * Get conversion funnel analysis
   */
  getConversionFunnel(filters?: AnalyticsFilters): ConversionFunnel {
    const { whereClause, params } = this.buildWhereClause(filters);

    const statusCounts = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM referrals r
      ${whereClause}
      GROUP BY status
    `).all(...params) as any[];

    const getCount = (status: ReferralStatus) => 
      statusCounts.find(s => s.status === status)?.count || 0;

    const totalReferrals = statusCounts.reduce((sum, s) => sum + s.count, 0);

    const pending = getCount(ReferralStatus.PENDING);
    const contacted = getCount(ReferralStatus.CONTACTED);
    const interviewed = getCount(ReferralStatus.INTERVIEWED);
    const hired = getCount(ReferralStatus.HIRED);
    const rejected = getCount(ReferralStatus.REJECTED);
    const expired = getCount(ReferralStatus.EXPIRED);
    const declined = getCount(ReferralStatus.DECLINED);

    // Calculate drop-off rates
    const calculateDropOff = (current: number, previous: number) => 
      previous > 0 ? ((previous - current) / previous) * 100 : 0;

    return {
      pending: {
        count: pending,
        percentage: totalReferrals > 0 ? (pending / totalReferrals) * 100 : 0
      },
      contacted: {
        count: contacted,
        percentage: totalReferrals > 0 ? (contacted / totalReferrals) * 100 : 0,
        dropOffFromPrevious: calculateDropOff(contacted, pending)
      },
      interviewed: {
        count: interviewed,
        percentage: totalReferrals > 0 ? (interviewed / totalReferrals) * 100 : 0,
        dropOffFromPrevious: calculateDropOff(interviewed, contacted)
      },
      hired: {
        count: hired,
        percentage: totalReferrals > 0 ? (hired / totalReferrals) * 100 : 0,
        dropOffFromPrevious: calculateDropOff(hired, interviewed)
      },
      rejected: {
        count: rejected,
        percentage: totalReferrals > 0 ? (rejected / totalReferrals) * 100 : 0
      },
      expired: {
        count: expired,
        percentage: totalReferrals > 0 ? (expired / totalReferrals) * 100 : 0
      },
      declined: {
        count: declined,
        percentage: totalReferrals > 0 ? (declined / totalReferrals) * 100 : 0
      }
    };
  }

  /**
   * Get top referrers leaderboard
   */
  getTopReferrers(limit: number = 10, filters?: AnalyticsFilters): TopReferrer[] {
    const { whereClause, params } = this.buildWhereClause(filters);

    const topReferrers = this.db.prepare(`
      SELECT 
        u.id as userId,
        u.first_name || ' ' || u.last_name as userName,
        u.email as userEmail,
        COUNT(r.id) as totalReferrals,
        COUNT(CASE WHEN r.status = 'hired' THEN 1 END) as successfulReferrals,
        COALESCE(SUM(CASE WHEN r.status = 'hired' THEN r.reward_amount ELSE 0 END), 0) as totalEarnings,
        COALESCE(SUM(CASE WHEN rw.status IN ('pending', 'earned') THEN rw.amount ELSE 0 END), 0) as pendingRewards,
        COALESCE(SUM(CASE WHEN rw.status = 'paid' THEN rw.amount ELSE 0 END), 0) as paidRewards,
        COALESCE(AVG(CASE WHEN r.status = 'hired' THEN r.reward_amount END), 0) as averageRewardAmount,
        MAX(r.created_at) as lastReferralDate
      FROM users u
      JOIN referrals r ON u.id = r.referrer_id
      LEFT JOIN rewards rw ON r.id = rw.referral_id
      ${whereClause.replace('WHERE', 'WHERE')}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY totalEarnings DESC, successfulReferrals DESC
      LIMIT ?
    `).all(...params, limit) as any[];

    return topReferrers.map(referrer => ({
      ...referrer,
      conversionRate: referrer.totalReferrals > 0 
        ? (referrer.successfulReferrals / referrer.totalReferrals) * 100 
        : 0
    }));
  }

  /**
   * Get monthly trends
   */
  private getMonthlyTrends(filters?: AnalyticsFilters): MonthlyTrend[] {
    const { whereClause, params } = this.buildWhereClause(filters);

    return this.db.prepare(`
      SELECT 
        strftime('%m', r.created_at) as month,
        strftime('%Y', r.created_at) as year,
        COUNT(*) as totalReferrals,
        COUNT(CASE WHEN r.status = 'hired' THEN 1 END) as successfulReferrals,
        COALESCE(SUM(CASE WHEN r.status = 'hired' THEN r.reward_amount ELSE 0 END), 0) as totalRewards
      FROM referrals r
      ${whereClause}
      GROUP BY strftime('%Y-%m', r.created_at)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `).all(...params).map((row: any) => ({
      month: row.month,
      year: parseInt(row.year),
      totalReferrals: row.totalReferrals,
      successfulReferrals: row.successfulReferrals,
      conversionRate: row.totalReferrals > 0 ? (row.successfulReferrals / row.totalReferrals) * 100 : 0,
      totalRewards: row.totalRewards
    }));
  }

  /**
   * Get top performing companies
   */
  private getTopPerformingCompanies(filters?: AnalyticsFilters): CompanyPerformance[] {
    const { whereClause, params } = this.buildWhereClause(filters);

    return this.db.prepare(`
      SELECT 
        r.company_name as companyName,
        COUNT(*) as totalReferrals,
        COUNT(CASE WHEN r.status = 'hired' THEN 1 END) as successfulReferrals,
        COALESCE(AVG(
          CASE WHEN r.status = 'hired' 
          THEN julianday(r.updated_at) - julianday(r.created_at)
          END
        ), 0) as averageTimeToHire
      FROM referrals r
      ${whereClause}
      GROUP BY r.company_name
      HAVING totalReferrals >= 2
      ORDER BY successfulReferrals DESC, totalReferrals DESC
      LIMIT 10
    `).all(...params).map((row: any) => ({
      ...row,
      conversionRate: row.totalReferrals > 0 ? (row.successfulReferrals / row.totalReferrals) * 100 : 0
    }));
  }

  /**
   * Calculate average time to hire
   */
  private calculateAverageTimeToHire(filters?: AnalyticsFilters): number {
    const { whereClause, params } = this.buildWhereClause(filters);

    const result = this.db.prepare(`
      SELECT AVG(julianday(r.updated_at) - julianday(r.created_at)) as averageDays
      FROM referrals r
      ${whereClause} AND r.status = 'hired'
    `).get(...params) as any;

    return result?.averageDays || 0;
  }

  /**
   * Export referral data for reporting
   */
  exportReferralData(format: 'csv' | 'json', filters?: AnalyticsFilters): ExportData {
    const { whereClause, params } = this.buildWhereClause(filters);

    const referrals = this.db.prepare(`
      SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as referrer_name,
        u.email as referrer_email,
        rw.amount as reward_amount_earned,
        rw.status as reward_status,
        rw.paid_at as reward_paid_at
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      LEFT JOIN rewards rw ON r.id = rw.referral_id
      ${whereClause}
      ORDER BY r.created_at DESC
    `).all(...params);

    const summary = this.getReferralAnalytics(filters);

    return {
      referrals,
      summary,
      exportedAt: new Date().toISOString(),
      filters: filters || {}
    };
  }

  /**
   * Get real-time analytics summary for dashboard
   */
  getRealTimeAnalytics(): {
    totalReferralsToday: number;
    totalReferralsThisWeek: number;
    totalReferralsThisMonth: number;
    pendingReferrals: number;
    recentActivity: any[];
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const totalReferralsToday = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals WHERE created_at >= ?
    `).get(today.toISOString()) as any;

    const totalReferralsThisWeek = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals WHERE created_at >= ?
    `).get(thisWeek.toISOString()) as any;

    const totalReferralsThisMonth = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals WHERE created_at >= ?
    `).get(thisMonth.toISOString()) as any;

    const pendingReferrals = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals WHERE status = 'pending'
    `).get() as any;

    const recentActivity = this.db.prepare(`
      SELECT 
        r.id,
        r.referee_name,
        r.position_title,
        r.company_name,
        r.status,
        r.created_at,
        r.updated_at,
        u.first_name || ' ' || u.last_name as referrer_name
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      ORDER BY r.updated_at DESC
      LIMIT 10
    `).all();

    return {
      totalReferralsToday: totalReferralsToday.count,
      totalReferralsThisWeek: totalReferralsThisWeek.count,
      totalReferralsThisMonth: totalReferralsThisMonth.count,
      pendingReferrals: pendingReferrals.count,
      recentActivity
    };
  }

  /**
   * Build WHERE clause for filtering
   */
  private buildWhereClause(filters?: AnalyticsFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.dateFrom) {
      conditions.push('r.created_at >= ?');
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push('r.created_at <= ?');
      params.push(filters.dateTo);
    }

    if (filters?.companyName) {
      conditions.push('r.company_name LIKE ?');
      params.push(`%${filters.companyName}%`);
    }

    if (filters?.status && filters.status.length > 0) {
      const statusPlaceholders = filters.status.map(() => '?').join(',');
      conditions.push(`r.status IN (${statusPlaceholders})`);
      params.push(...filters.status);
    }

    if (filters?.userId) {
      conditions.push('r.referrer_id = ?');
      params.push(filters.userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { whereClause, params };
  }
}