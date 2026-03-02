import { getDatabase, closeDatabase } from "../database/connection.js";
import crypto from "crypto";

export interface ChatSession {
  id: number;
  userId: string; // Changed from number to string for UUID
  userType: string;
  sessionName?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  userId: string; // Changed from number to string for UUID
  messageType: 'user' | 'assistant';
  content: string;
  aiType?: string;
  usePremium: boolean;
  processingTimeMs?: number;
  contextData?: any;
  memoryReferences?: number[];
  createdAt: string;
}

export interface ResumeMemory {
  id: number;
  userId: string; // Changed from number to string for UUID
  resumeId?: number;
  resumeContent: string;
  resumeHash: string;
  analysisSummary?: string;
  strengths?: string[];
  improvements?: string[];
  skillsExtracted?: string[];
  experienceSummary?: string;
  careerLevel?: string;
  overallScore?: number;
  atsScore?: number;
  completenessScore?: number;
  industryFocus?: string[];
  roleTargets?: string[];
  salaryRange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMemory {
  id: number;
  userId: string; // Changed from number to string for UUID
  careerStage?: string;
  primarySkills?: string[];
  industries?: string[];
  jobTitles?: string[];
  locations?: string[];
  careerGoals?: string;
  jobSearchStatus?: string;
  salaryExpectations?: string;
  workPreferences?: any;
  commonQuestions?: string[];
  preferredAiStyle?: string;
  interactionCount: number;
  lastResumeAnalysis?: string;
  lastJobSearch?: string;
  lastCareerAdvice?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationContext {
  id: number;
  userId: string; // Changed from number to string for UUID
  sessionId?: number;
  contextType: string;
  contextKey: string;
  contextValue: any;
  importanceScore: number;
  usageCount: number;
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class AIMemoryService {
  
  // Helper method to handle database connections consistently
  private async withDatabase<T>(operation: (db: any) => Promise<T>): Promise<T> {
    let db = null;
    try {
      db = await getDatabase();
      return await operation(db);
    } catch (error) {
      // If it's a connection error, try to reconnect once
      if (error.message?.includes('Client was closed') || error.message?.includes('Connection terminated')) {
        console.warn('⚠️ Database connection lost, attempting to reconnect...');
        try {
          if (db) {
            await closeDatabase(db);
          }
          db = await getDatabase();
          return await operation(db);
        } catch (retryError) {
          console.error('❌ Database reconnection failed:', retryError.message);
          throw retryError;
        }
      }
      throw error;
    } finally {
      // Only close in serverless environments
      if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        if (db) {
          await closeDatabase(db);
        }
      }
    }
  }
  
  // ===== CHAT SESSION MANAGEMENT =====
  
  async createChatSession(userId: string, userType: string = 'user', sessionName?: string): Promise<ChatSession> {
    return this.withDatabase(async (db) => {
      const result = await db.query(
        `INSERT INTO ai_chat_sessions (user_id, user_type, session_name) 
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, userType, sessionName]
      );
      
      return this.formatChatSession(result.rows[0]);
    });
  }
  
  async getAllUserSessions(userId: string, userType: string = 'user'): Promise<ChatSession[]> {
    return this.withDatabase(async (db) => {
      const result = await db.query(
        `SELECT * FROM ai_chat_sessions 
         WHERE user_id = $1 AND user_type = $2 
         ORDER BY updated_at DESC`,
        [userId, userType]
      );
      
      return result.rows.map(this.formatChatSession);
    });
  }
  
  async createNewSession(userId: string, userType: string = 'user', sessionName?: string): Promise<ChatSession> {
    return this.withDatabase(async (db) => {
      // Deactivate all existing sessions for this user
      await db.query(
        `UPDATE ai_chat_sessions SET is_active = false 
         WHERE user_id = $1 AND user_type = $2`,
        [userId, userType]
      );
      
      const result = await db.query(
        `INSERT INTO ai_chat_sessions (user_id, user_type, session_name, is_active) 
         VALUES ($1, $2, $3, true) RETURNING *`,
        [userId, userType, sessionName || 'New Chat']
      );
      
      return this.formatChatSession(result.rows[0]);
    });
  }
  
  async switchToSession(userId: string, userType: 'user' | 'recruiter', sessionId: number): Promise<ChatSession> {
    return this.withDatabase(async (db) => {
      // Deactivate all sessions for this user
      await db.query(
        `UPDATE ai_chat_sessions SET is_active = false 
         WHERE user_id = $1 AND user_type = $2`,
        [userId, userType]
      );
      
      // Activate the selected session
      const result = await db.query(
        `UPDATE ai_chat_sessions SET is_active = true, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2 AND user_type = $3 RETURNING *`,
        [sessionId, userId, userType]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }
      
      return this.formatChatSession(result.rows[0]);
    });
  }
  
  async updateSessionName(userId: string, userType: 'user' | 'recruiter', sessionId: number, sessionName: string): Promise<void> {
    return this.withDatabase(async (db) => {
      await db.query(
        `UPDATE ai_chat_sessions SET session_name = $1 WHERE id = $2 AND user_id = $3 AND user_type = $4`,
        [sessionName, sessionId, userId, userType]
      );
    });
  }
  
  async deleteSession(userId: string, userType: 'user' | 'recruiter', sessionId: number): Promise<void> {
    return this.withDatabase(async (db) => {
      await db.query(
        `DELETE FROM ai_chat_sessions WHERE id = $1 AND user_id = $2 AND user_type = $3`, 
        [sessionId, userId, userType]
      );
    });
  }
  
  async getOrCreateActiveSession(userId: string, userType: string = 'user'): Promise<ChatSession> {
    return this.withDatabase(async (db) => {
      // Try to find an active session
      let result = await db.query(
        `SELECT * FROM ai_chat_sessions 
         WHERE user_id = $1 AND user_type = $2 AND is_active = true 
         ORDER BY updated_at DESC LIMIT 1`,
        [userId, userType]
      );
      
      if (result.rows.length === 0) {
        // Create a new session
        result = await db.query(
          `INSERT INTO ai_chat_sessions (user_id, user_type, session_name) 
           VALUES ($1, $2, $3) RETURNING *`,
          [userId, userType, 'New Chat Session']
        );
      }
      
      return this.formatChatSession(result.rows[0]);
    });
  }
  
  async getChatHistory(sessionId: number, limit: number = 50): Promise<ChatMessage[]> {
    return this.withDatabase(async (db) => {
      const result = await db.query(
        `SELECT * FROM ai_chat_messages 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [sessionId, limit]
      );
      
      return result.rows.map(this.formatChatMessage).reverse();
    });
  }
  
  async saveChatMessage(
    sessionId: number,
    userId: string,
    messageType: 'user' | 'assistant',
    content: string,
    options: {
      aiType?: string;
      usePremium?: boolean;
      processingTimeMs?: number;
      contextData?: any;
      memoryReferences?: number[];
    } = {}
  ): Promise<ChatMessage> {
    return this.withDatabase(async (db) => {
      const result = await db.query(
        `INSERT INTO ai_chat_messages 
         (session_id, user_id, message_type, content, ai_type, use_premium, processing_time_ms, context_data, memory_references)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          sessionId,
          userId,
          messageType,
          content,
          options.aiType,
          options.usePremium || false,
          options.processingTimeMs,
          options.contextData ? JSON.stringify(options.contextData) : null,
          options.memoryReferences ? JSON.stringify(options.memoryReferences) : null
        ]
      );
      
      // Update session timestamp
      await db.query(
        `UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [sessionId]
      );
      
      return this.formatChatMessage(result.rows[0]);
    });
  }
  
  // Alias for backward compatibility
  async saveMessage(...args: Parameters<typeof this.saveChatMessage>): ReturnType<typeof this.saveChatMessage> {
    return this.saveChatMessage(...args);
  }
  
  // ===== RESUME MEMORY MANAGEMENT =====
  
  async saveResumeAnalysis(
    userId: string,
    resumeContent: string,
    analysis: {
      resumeId?: number;
      analysisSummary?: string;
      strengths?: string[];
      improvements?: string[];
      skillsExtracted?: string[];
      experienceSummary?: string;
      careerLevel?: string;
      overallScore?: number;
      atsScore?: number;
      completenessScore?: number;
      industryFocus?: string[];
      roleTargets?: string[];
      salaryRange?: string;
    }
  ): Promise<ResumeMemory> {
    const resumeHash = crypto.createHash('sha256').update(resumeContent).digest('hex');
    const db = await getDatabase();
    
    try {
      // Check if we already have this resume analyzed
      const existing = await db.query(
        `SELECT * FROM ai_resume_memory WHERE user_id = $1 AND resume_hash = $2`,
        [userId, resumeHash]
      );
      
      if (existing.rows.length > 0) {
        // Update existing analysis
        const result = await db.query(
          `UPDATE ai_resume_memory SET
           analysis_summary = $1, strengths = $2, improvements = $3, skills_extracted = $4,
           experience_summary = $5, career_level = $6, overall_score = $7, ats_score = $8,
           completeness_score = $9, industry_focus = $10, role_targets = $11, salary_range = $12,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $13 RETURNING *`,
          [
            analysis.analysisSummary,
            JSON.stringify(analysis.strengths || []),
            JSON.stringify(analysis.improvements || []),
            JSON.stringify(analysis.skillsExtracted || []),
            analysis.experienceSummary,
            analysis.careerLevel,
            analysis.overallScore,
            analysis.atsScore,
            analysis.completenessScore,
            JSON.stringify(analysis.industryFocus || []),
            JSON.stringify(analysis.roleTargets || []),
            analysis.salaryRange,
            existing.rows[0].id
          ]
        );
        
        return this.formatResumeMemory(result.rows[0]);
      } else {
        // Create new analysis
        const result = await db.query(
          `INSERT INTO ai_resume_memory 
           (user_id, resume_id, resume_content, resume_hash, analysis_summary, strengths, improvements,
            skills_extracted, experience_summary, career_level, overall_score, ats_score, completeness_score,
            industry_focus, role_targets, salary_range)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
          [
            userId,
            analysis.resumeId,
            resumeContent,
            resumeHash,
            analysis.analysisSummary,
            JSON.stringify(analysis.strengths || []),
            JSON.stringify(analysis.improvements || []),
            JSON.stringify(analysis.skillsExtracted || []),
            analysis.experienceSummary,
            analysis.careerLevel,
            analysis.overallScore,
            analysis.atsScore,
            analysis.completenessScore,
            JSON.stringify(analysis.industryFocus || []),
            JSON.stringify(analysis.roleTargets || []),
            analysis.salaryRange
          ]
        );
        
        return this.formatResumeMemory(result.rows[0]);
      }
    } finally {
      await closeDatabase(db);
    }
  }
  
  async getResumeMemory(id: number): Promise<ResumeMemory> {
    const db = await getDatabase();
    try {
      const result = await db.query(
        `SELECT * FROM ai_resume_memory WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Resume memory not found');
      }
      
      return this.formatResumeMemory(result.rows[0]);
    } finally {
      await closeDatabase(db);
    }
  }
  
  async getUserResumeMemories(userId: string): Promise<ResumeMemory[]> {
    const db = await getDatabase();
    try {
      const result = await db.query(
        `SELECT * FROM ai_resume_memory WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
      );
      
      return result.rows.map(this.formatResumeMemory);
    } finally {
      await closeDatabase(db);
    }
  }
  
  // ===== USER MEMORY MANAGEMENT =====
  
  async updateUserMemory(userId: string, updates: Partial<UserMemory>): Promise<UserMemory> {
    const db = await getDatabase();
    try {
      // Get or create user memory
      let result = await db.query(
        `SELECT * FROM ai_user_memory WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        // Create new user memory
        await db.query(
          `INSERT INTO ai_user_memory (user_id, interaction_count) VALUES ($1, 0)`,
          [userId]
        );
        result = await db.query(
          `SELECT * FROM ai_user_memory WHERE user_id = $1`,
          [userId]
        );
      }
      
      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (updates.careerStage) {
        updateFields.push(`career_stage = $${paramIndex++}`);
        updateValues.push(updates.careerStage);
      }
      if (updates.primarySkills) {
        updateFields.push(`primary_skills = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.primarySkills));
      }
      if (updates.industries) {
        updateFields.push(`industries = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.industries));
      }
      if (updates.jobTitles) {
        updateFields.push(`job_titles = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.jobTitles));
      }
      if (updates.locations) {
        updateFields.push(`locations = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.locations));
      }
      if (updates.careerGoals) {
        updateFields.push(`career_goals = $${paramIndex++}`);
        updateValues.push(updates.careerGoals);
      }
      if (updates.jobSearchStatus) {
        updateFields.push(`job_search_status = $${paramIndex++}`);
        updateValues.push(updates.jobSearchStatus);
      }
      if (updates.salaryExpectations) {
        updateFields.push(`salary_expectations = $${paramIndex++}`);
        updateValues.push(updates.salaryExpectations);
      }
      if (updates.workPreferences) {
        updateFields.push(`work_preferences = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.workPreferences));
      }
      if (updates.commonQuestions) {
        updateFields.push(`common_questions = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.commonQuestions));
      }
      if (updates.preferredAiStyle) {
        updateFields.push(`preferred_ai_style = $${paramIndex++}`);
        updateValues.push(updates.preferredAiStyle);
      }
      
      // Always increment interaction count and update timestamp
      updateFields.push(`interaction_count = interaction_count + 1`);
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      if (updateFields.length > 0) {
        updateValues.push(userId);
        const updateResult = await db.query(
          `UPDATE ai_user_memory SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
          updateValues
        );
        return this.formatUserMemory(updateResult.rows[0]);
      }
      
      return this.formatUserMemory(result.rows[0]);
    } finally {
      await closeDatabase(db);
    }
  }
  
  async getUserMemory(userId: string): Promise<UserMemory | null> {
    return this.withDatabase(async (db) => {
      const result = await db.query(
        `SELECT * FROM ai_user_memory WHERE user_id = $1`,
        [userId]
      );
      
      return result.rows.length > 0 ? this.formatUserMemory(result.rows[0]) : null;
    });
  }
  
  // ===== CONVERSATION CONTEXT MANAGEMENT =====
  
  async saveContext(
    userId: string,
    contextType: string,
    contextKey: string,
    contextValue: any,
    options: {
      sessionId?: number;
      importanceScore?: number;
      expiresAt?: Date;
    } = {}
  ): Promise<ConversationContext> {
    const db = await getDatabase();
    try {
      // Check if context already exists
      const existing = await db.query(
        `SELECT * FROM ai_conversation_context 
         WHERE user_id = $1 AND context_type = $2 AND context_key = $3`,
        [userId, contextType, contextKey]
      );
      
      if (existing.rows.length > 0) {
        // Update existing context
        const result = await db.query(
          `UPDATE ai_conversation_context SET
           context_value = $1, importance_score = $2, usage_count = usage_count + 1,
           last_used = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3 RETURNING *`,
          [JSON.stringify(contextValue), options.importanceScore || existing.rows[0].importance_score, existing.rows[0].id]
        );
        
        return this.formatConversationContext(result.rows[0]);
      } else {
        // Create new context
        const result = await db.query(
          `INSERT INTO ai_conversation_context
           (user_id, session_id, context_type, context_key, context_value, importance_score, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            userId,
            options.sessionId,
            contextType,
            contextKey,
            JSON.stringify(contextValue),
            options.importanceScore || 50,
            options.expiresAt ? options.expiresAt.toISOString() : null
          ]
        );
        
        return this.formatConversationContext(result.rows[0]);
      }
    } finally {
      await closeDatabase(db);
    }
  }
  
  async getContext(id: number): Promise<ConversationContext> {
    const db = await getDatabase();
    try {
      const result = await db.query(
        `SELECT * FROM ai_conversation_context WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Context not found');
      }
      
      return this.formatConversationContext(result.rows[0]);
    } finally {
      await closeDatabase(db);
    }
  }
  
  async getUserContexts(userId: string, contextType?: string): Promise<ConversationContext[]> {
    const db = await getDatabase();
    try {
      let query = `SELECT * FROM ai_conversation_context WHERE user_id = $1 AND is_active = true`;
      const params = [userId];
      
      if (contextType) {
        query += ` AND context_type = $2`;
        params.push(contextType);
      }
      
      query += ` ORDER BY importance_score DESC, last_used DESC`;
      
      const result = await db.query(query, params);
      return result.rows.map(this.formatConversationContext);
    } finally {
      await closeDatabase(db);
    }
  }
  
  async getRelevantContext(userId: string, query: string, limit: number = 10): Promise<ConversationContext[]> {
    const db = await getDatabase();
    try {
      // Simple keyword matching for now - could be enhanced with vector similarity
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
      const keywordPattern = keywords.map((_, i) => `LOWER(context_value::text) LIKE $${i + 2}`).join(' OR ');
      const keywordParams = keywords.map(keyword => `%${keyword}%`);
      
      const result = await db.query(
        `SELECT * FROM ai_conversation_context 
         WHERE user_id = $1 AND is_active = true 
         AND (${keywordPattern})
         ORDER BY importance_score DESC, usage_count DESC, last_used DESC
         LIMIT $${keywords.length + 2}`,
        [userId, ...keywordParams, limit]
      );
      
      return result.rows.map(this.formatConversationContext);
    } finally {
      await closeDatabase(db);
    }
  }
  
  // ===== MEMORY RETRIEVAL FOR AI CONTEXT =====
  
  async buildContextForAI(userId: string, currentMessage: string): Promise<{
    userMemory: UserMemory | null;
    recentResumeAnalysis: ResumeMemory | null;
    relevantContexts: ConversationContext[];
    chatHistory: ChatMessage[];
  }> {
    const [userMemory, resumeMemories, relevantContexts, session] = await Promise.all([
      this.getUserMemory(userId),
      this.getUserResumeMemories(userId),
      this.getRelevantContext(userId, currentMessage, 5),
      this.getOrCreateActiveSession(userId)
    ]);
    
    const chatHistory = await this.getChatHistory(session.id, 10);
    const recentResumeAnalysis = resumeMemories.length > 0 ? resumeMemories[0] : null;
    
    return {
      userMemory,
      recentResumeAnalysis,
      relevantContexts,
      chatHistory
    };
  }
  
  // ===== FORMATTING HELPERS =====
  
  private formatChatSession(row: any): ChatSession {
    return {
      id: row.id,
      userId: row.user_id,
      userType: row.user_type,
      sessionName: row.session_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: Boolean(row.is_active)
    };
  }
  
  private formatChatMessage(row: any): ChatMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      messageType: row.message_type,
      content: row.content,
      aiType: row.ai_type,
      usePremium: Boolean(row.use_premium),
      processingTimeMs: row.processing_time_ms,
      contextData: row.context_data || null,
      memoryReferences: row.memory_references || null,
      createdAt: row.created_at
    };
  }
  
  private formatResumeMemory(row: any): ResumeMemory {
    return {
      id: row.id,
      userId: row.user_id,
      resumeId: row.resume_id,
      resumeContent: row.resume_content,
      resumeHash: row.resume_hash,
      analysisSummary: row.analysis_summary,
      strengths: row.strengths || [],
      improvements: row.improvements || [],
      skillsExtracted: row.skills_extracted || [],
      experienceSummary: row.experience_summary,
      careerLevel: row.career_level,
      overallScore: row.overall_score,
      atsScore: row.ats_score,
      completenessScore: row.completeness_score,
      industryFocus: row.industry_focus || [],
      roleTargets: row.role_targets || [],
      salaryRange: row.salary_range,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  
  private formatUserMemory(row: any): UserMemory {
    return {
      id: row.id,
      userId: row.user_id,
      careerStage: row.career_stage,
      primarySkills: row.primary_skills || [],
      industries: row.industries || [],
      jobTitles: row.job_titles || [],
      locations: row.locations || [],
      careerGoals: row.career_goals,
      jobSearchStatus: row.job_search_status,
      salaryExpectations: row.salary_expectations,
      workPreferences: row.work_preferences || null,
      commonQuestions: row.common_questions || [],
      preferredAiStyle: row.preferred_ai_style,
      interactionCount: row.interaction_count,
      lastResumeAnalysis: row.last_resume_analysis,
      lastJobSearch: row.last_job_search,
      lastCareerAdvice: row.last_career_advice,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  
  private formatConversationContext(row: any): ConversationContext {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      contextType: row.context_type,
      contextKey: row.context_key,
      contextValue: row.context_value,
      importanceScore: row.importance_score,
      usageCount: row.usage_count,
      lastUsed: row.last_used,
      expiresAt: row.expires_at,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const aiMemoryService = new AIMemoryService();