/**
 * AI Audit Service
 * Tracks all interactions with external AI services for compliance, debugging, and privacy monitoring
 */

import { initializeDatabase } from '../database/connection.js';
import crypto from 'crypto';

export interface AuditLogEntry {
  // Service identification
  serviceName: 'groq' | 'openai' | 'tavily' | 'other';
  operationType: 
    | 'resume_parsing'
    | 'ats_scoring'
    | 'ats_improvement'
    | 'section_improvement'
    | 'resume_optimization'
    | 'job_description'
    | 'job_search'
    | 'ai_chat'
    | 'ai_screening'
    | 'candidate_search'
    | 'query_to_sql'
    | 'other';
  
  // User context
  userId?: string;
  userType?: 'job_seeker' | 'recruiter' | 'guest';
  
  // Request details
  requestType: string;
  promptLength: number;
  promptHash: string;
  containsPii: boolean;
  piiRedacted: boolean;
  
  // Response details
  responseLength?: number;
  responseStatus: 'success' | 'error' | 'timeout' | 'rate_limited';
  errorMessage?: string;
  
  // Performance metrics
  latencyMs: number;
  tokensUsed?: number;
  costEstimate?: number;
  
  // Privacy and compliance
  dataCategories: string[];
  redactedFields: string[];
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Related entities
  resumeId?: string;
  jobPostingId?: string;
  applicationId?: string;
}

class AiAuditService {
  /**
   * Log an AI service interaction
   */
  async logInteraction(entry: AuditLogEntry): Promise<void> {
    try {
      const db = await initializeDatabase();
      
      await db.query(`
        INSERT INTO ai_audit_logs (
          service_name,
          operation_type,
          user_id,
          user_type,
          request_type,
          prompt_length,
          prompt_hash,
          contains_pii,
          pii_redacted,
          response_length,
          response_status,
          error_message,
          latency_ms,
          tokens_used,
          cost_estimate,
          data_categories,
          redacted_fields,
          ip_address,
          user_agent,
          session_id,
          resume_id,
          job_posting_id,
          application_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `, [
        entry.serviceName,
        entry.operationType,
        entry.userId || null,
        entry.userType || null,
        entry.requestType,
        entry.promptLength,
        entry.promptHash,
        entry.containsPii,
        entry.piiRedacted,
        entry.responseLength || null,
        entry.responseStatus,
        entry.errorMessage || null,
        entry.latencyMs,
        entry.tokensUsed || null,
        entry.costEstimate || null,
        entry.dataCategories, // PostgreSQL will handle array directly
        entry.redactedFields, // PostgreSQL will handle array directly
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.sessionId || null,
        entry.resumeId || null,
        entry.jobPostingId || null,
        entry.applicationId || null
      ]);
      
      console.log('📊 AI interaction logged:', {
        service: entry.serviceName,
        operation: entry.operationType,
        status: entry.responseStatus,
        latency: entry.latencyMs + 'ms',
        piiRedacted: entry.piiRedacted
      });
      
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('❌ Failed to log AI interaction:', error);
    }
  }

  /**
   * Create a hash of the prompt for deduplication detection
   */
  hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Detect if prompt contains PII patterns
   */
  detectPii(text: string): boolean {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // Phone
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/ // Credit card
    ];
    
    return piiPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract data categories from prompt
   */
  extractDataCategories(prompt: string): string[] {
    const categories: string[] = [];
    const lowerPrompt = prompt.toLowerCase();
    
    const categoryKeywords = {
      skills: ['skill', 'technology', 'programming', 'language', 'framework'],
      experience: ['experience', 'work', 'job', 'position', 'company', 'employment'],
      education: ['education', 'degree', 'university', 'college', 'school'],
      projects: ['project', 'portfolio', 'github', 'repository'],
      certifications: ['certification', 'certificate', 'certified'],
      languages: ['language proficiency', 'fluent', 'native speaker'],
      summary: ['summary', 'objective', 'profile'],
      achievements: ['achievement', 'award', 'accomplishment']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        categories.push(category);
      }
    }
    
    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Get audit statistics for a user
   */
  async getUserAuditStats(userId: string): Promise<any> {
    try {
      const db = await initializeDatabase();
      
      const stats = await db.query(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN response_status = 'success' THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN response_status = 'error' THEN 1 ELSE 0 END) as failed_requests,
          AVG(latency_ms) as avg_latency_ms,
          SUM(tokens_used) as total_tokens_used,
          SUM(cost_estimate) as total_cost_estimate,
          SUM(CASE WHEN pii_redacted = true THEN 1 ELSE 0 END) as pii_redacted_count
        FROM ai_audit_logs
        WHERE user_id = $1
      `, [userId]);
      
      return stats.rows[0];
    } catch (error) {
      console.error('❌ Failed to get user audit stats:', error);
      return null;
    }
  }

  /**
   * Get audit statistics by operation type
   */
  async getOperationStats(operationType: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const db = await initializeDatabase();
      
      let query = `
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN response_status = 'success' THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN response_status = 'error' THEN 1 ELSE 0 END) as failed_requests,
          AVG(latency_ms) as avg_latency_ms,
          AVG(prompt_length) as avg_prompt_length,
          AVG(response_length) as avg_response_length,
          SUM(tokens_used) as total_tokens_used,
          SUM(cost_estimate) as total_cost_estimate
        FROM ai_audit_logs
        WHERE operation_type = $1
      `;
      
      const params: any[] = [operationType];
      
      if (startDate) {
        query += ' AND created_at >= $' + (params.length + 1);
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        query += ' AND created_at <= $' + (params.length + 1);
        params.push(endDate.toISOString());
      }
      
      const stats = await db.query(query, params);
      
      return stats.rows[0];
    } catch (error) {
      console.error('❌ Failed to get operation stats:', error);
      return null;
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit: number = 100, operationType?: string): Promise<any[]> {
    try {
      const db = await initializeDatabase();
      
      let query = `
        SELECT 
          id,
          service_name,
          operation_type,
          user_type,
          response_status,
          latency_ms,
          prompt_length,
          response_length,
          pii_redacted,
          created_at
        FROM ai_audit_logs
      `;
      
      const params: any[] = [];
      
      if (operationType) {
        query += ' WHERE operation_type = $1';
        params.push(operationType);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const logs = await db.query(query, params);
      
      return logs.rows;
    } catch (error) {
      console.error('❌ Failed to get recent logs:', error);
      return [];
    }
  }

  /**
   * Get privacy compliance report
   */
  async getPrivacyReport(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const db = await initializeDatabase();
      
      let query = `
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN contains_pii = true THEN 1 ELSE 0 END) as requests_with_pii,
          SUM(CASE WHEN pii_redacted = true THEN 1 ELSE 0 END) as pii_redacted_count,
          SUM(CASE WHEN contains_pii = true AND pii_redacted = false THEN 1 ELSE 0 END) as pii_not_redacted_count
        FROM ai_audit_logs
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (startDate) {
        query += ' AND created_at >= $' + (params.length + 1);
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        query += ' AND created_at <= $' + (params.length + 1);
        params.push(endDate.toISOString());
      }
      
      const report = await db.query(query, params);
      
      return report.rows[0];
    } catch (error) {
      console.error('❌ Failed to get privacy report:', error);
      return null;
    }
  }
}

export const aiAuditService = new AiAuditService();
