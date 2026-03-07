import { datasetLoader } from './dspy/datasetLoader.js';
import { groqService } from './groqService.js';
import { jsonrepair } from 'jsonrepair';

/**
 * AI Resume Screening Service
 * Uses screening criteria from dataset to filter candidates with Groq AI
 */
export class AIResumeScreeningService {
  private screeningCriteria: any[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load screening criteria from CSV
      this.screeningCriteria = await datasetLoader.loadDataset('ai_resume_screening.csv');
      
      console.log(`✅ AI Screening initialized with ${this.screeningCriteria.length} training examples`);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize AI screening:', error);
    }
  }

  /**
   * Analyze screening patterns from dataset
   */
  private analyzeScreeningPatterns(): string {
    if (this.screeningCriteria.length === 0) {
      return '';
    }

    // Sample 50 examples for compact analysis
    const sample = this.screeningCriteria.slice(0, 50);
    const shortlisted = sample.filter((row: any) => row.shortlisted === 'Yes');
    
    if (shortlisted.length === 0) {
      return '';
    }

    const avgExp = (shortlisted.reduce((s: number, r: any) => 
      s + parseFloat(r.years_experience || 0), 0) / shortlisted.length).toFixed(1);
    
    const avgSkills = (shortlisted.reduce((s: number, r: any) => 
      s + parseFloat(r.skills_match_score || 0), 0) / shortlisted.length).toFixed(0);

    return `PATTERNS: Avg ${avgExp}yr exp, ${avgSkills}% skills match preferred.`;
  }

  /**
   * Screen a batch of candidates (max 5 at a time)
   */
  private async screenBatch(
    candidates: any[], 
    jobRequirements: string,
    patterns: string
  ): Promise<any[]> {
    // Create ultra-compact candidate summaries (NO PII - names redacted)
    const compactCandidates = candidates.map((c, idx) => ({
      id: c.id,
      ref: `Candidate_${idx + 1}`, // Use reference instead of name for privacy
      title: c.title,
      exp: c.experience_years,
      skills: (c.skills || '').split(', ').slice(0, 8).join(', '), // Max 8 skills
      edu: c.education,
      proj: c.projects_count
    }));

    const prompt = `Screen ${compactCandidates.length} candidates. Score 0-100.

JOB: ${jobRequirements || 'Software Engineer'}
${patterns}

CANDIDATES:
${JSON.stringify(compactCandidates)}

SCORING CRITERIA:
- Skills match (40pts): Relevance to job requirements
- Experience (30pts): Years and quality of experience
- Projects (20pts): Portfolio and practical work
- Education (10pts): Relevant degrees and certifications

RECOMMENDATION GUIDELINES (STRICT):
- 80-100: "Highly Recommended" - Strong match, ready to interview
- 60-79: "Recommended" - Good match, worth considering
- 40-59: "Maybe" - Partial match, needs review
- 0-39: "Not Recommended" - Weak match, not suitable

Return ONLY a JSON array (no markdown):
[{"id":"x","ref":"Candidate_1","score":85,"recommendation":"Highly Recommended","strengths":["s1","s2"],"concerns":["c1"],"reasoning":"brief"}]

IMPORTANT: 
1. Match recommendation to score exactly per guidelines above
2. Use the ref field (Candidate_1, Candidate_2, etc.) for identification`;

    const response = await groqService.generateResponse(
      'You are an expert technical recruiter. Screen candidates objectively based on skills, experience, and qualifications.',
      prompt,
      {
        temperature: 0.3,
        maxTokens: 2000,
        auditContext: {
          serviceName: 'aiResumeScreeningService',
          operationType: 'candidate_screening',
          userContext: {
            candidateCount: candidates.length,
            jobRequirements: jobRequirements || 'Not specified'
          }
        }
      }
    );

    if (!response.success || !response.response) {
      throw new Error('Groq AI failed to screen batch');
    }

    // Parse JSON response with robust error handling
    let jsonText = response.response.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Remove text before first [ and after last ]
    const firstBracket = jsonText.indexOf('[');
    const lastBracket = jsonText.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      jsonText = jsonText.substring(firstBracket, lastBracket + 1);
    }

    // Sanitize text to prevent JSON parsing errors
    jsonText = jsonText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ');

    let screeningResults;
    try {
      screeningResults = JSON.parse(jsonText);
    } catch (parseError) {
      console.warn('⚠️ Standard JSON parse failed, attempting repair...');
      try {
        const repairedJson = jsonrepair(jsonText);
        screeningResults = JSON.parse(repairedJson);
        console.log('✅ JSON successfully repaired and parsed');
      } catch (repairError) {
        console.error('❌ JSON repair failed:', repairError.message);
        throw new Error(`Failed to parse Groq response: ${repairError.message}`);
      }
    }

    // Enforce scoring guidelines (in case AI doesn't follow them)
    screeningResults = screeningResults.map((result: any) => {
      const score = result.score || 0;
      let correctRecommendation: string;
      
      if (score >= 80) {
        correctRecommendation = 'Highly Recommended';
      } else if (score >= 60) {
        correctRecommendation = 'Recommended';
      } else if (score >= 40) {
        correctRecommendation = 'Maybe';
      } else {
        correctRecommendation = 'Not Recommended';
      }

      // Override if AI gave wrong recommendation
      if (result.recommendation !== correctRecommendation) {
        console.log(`⚠️ Correcting recommendation for candidate ${result.id}: ${result.recommendation} -> ${correctRecommendation} (score: ${score})`);
      }

      return {
        ...result,
        recommendation: correctRecommendation
      };
    });

    return screeningResults;
  }

  /**
   * Safely parse JSON with fallback to empty array
   */
  private safeParseArray(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }
    
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('Failed to parse JSON data:', error);
        return [];
      }
    }
    
    return [];
  }

  /**
   * Prepare candidate data for screening (removes PII)
   */
  private prepareCandidateData(candidate: any, index: number) {
    const resume = candidate.resume || {};
    
    // Parse JSONB fields safely with error handling
    const skills = this.safeParseArray(resume.skills);
    const experience = this.safeParseArray(resume.experience);
    const education = this.safeParseArray(resume.education);
    const projects = this.safeParseArray(resume.projects);

    // Fallback to candidate profile data if resume is missing
    let candidateSkills = skills.length > 0 ? skills : this.safeParseArray(candidate.skills);
    
    // Extract name from candidate object (firstName + lastName or from personal_info)
    let candidateName = 'Unknown Candidate';
    
    // Try candidate.name first (already formatted, but reject empty/generic values)
    if (candidate.name && 
        candidate.name.trim() !== '' && 
        candidate.name !== 'Unknown Candidate' && 
        candidate.name !== 'Candidate') {
      candidateName = candidate.name.trim();
    }
    // Try firstName + lastName (but reject empty strings)
    else if (candidate.firstName && candidate.firstName.trim() !== '' && candidate.firstName !== 'Candidate') {
      candidateName = `${candidate.firstName.trim()} ${(candidate.lastName || '').trim()}`.trim();
    }
    // Try personal_info from resume
    else if (resume.personal_info) {
      const personalInfo = typeof resume.personal_info === 'string' 
        ? JSON.parse(resume.personal_info) 
        : resume.personal_info;
      
      // Try firstName + lastName from personal_info (but reject empty strings)
      if (personalInfo.firstName && personalInfo.firstName.trim() !== '' && personalInfo.firstName !== 'Candidate') {
        candidateName = `${personalInfo.firstName.trim()} ${(personalInfo.lastName || '').trim()}`.trim();
      }
      // Try name field (but reject empty strings)
      else if (personalInfo.name && personalInfo.name.trim() !== '' && personalInfo.name !== 'Candidate') {
        candidateName = personalInfo.name.trim();
      }
      // Try fullName field (but reject empty strings)
      else if (personalInfo.fullName && personalInfo.fullName.trim() !== '' && personalInfo.fullName !== 'Candidate') {
        candidateName = personalInfo.fullName.trim();
      }
    }
    
    // If still "Candidate" or empty, use email username as fallback
    if (!candidateName || 
        candidateName === 'Candidate' || 
        candidateName === 'Unknown Candidate' || 
        candidateName === 'Unknown' ||
        candidateName.trim() === '') {
      if (candidate.email && typeof candidate.email === 'string') {
        const emailUsername = candidate.email.split('@')[0];
        candidateName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).replace(/[._-]/g, ' ');
      } else {
        candidateName = `Candidate ${(candidate.id || index).toString().slice(0, 8)}`;
      }
    }
    
    // PRIVACY: Only send anonymized professional data, NO personal info
    return {
      id: candidate.id || candidate.userId || index,
      originalName: candidateName, // Store for mapping back later
      title: candidate.title || '',
      experience_years: experience.length,
      skills_count: candidateSkills.length,
      skills: candidateSkills.slice(0, 15).map((s: any) => 
        typeof s === 'string' ? s : (s.name || s.skill || '')
      ).filter(Boolean).join(', '),
      education: education[0]?.degree || education[0]?.institution || candidate.education || 'Not specified',
      projects_count: projects.length,
      summary: resume.summary || candidate.title || ''
    };
  }

  /**
   * Screen candidates using AI with batch processing and streaming
   * Yields results as they complete for streaming to frontend
   */
  async *screenCandidatesStreaming(
    candidates: any[], 
    jobRequirements?: string
  ): AsyncGenerator<{ type: string; data: any }> {
    await this.initialize();

    console.log(`🤖 Screening ${candidates.length} candidates with AI (batch processing)...`);

    try {
      const patterns = this.analyzeScreeningPatterns();
      
      // Prepare candidate summaries WITHOUT personal information
      const candidateSummaries = candidates.map((candidate, index) => 
        this.prepareCandidateData(candidate, index)
      );

      // Filter out candidates with insufficient data
      const validCandidates = candidateSummaries.filter(c => 
        c.skills_count > 0 || c.experience_years > 0 || c.summary
      );

      if (validCandidates.length === 0) {
        yield {
          type: 'error',
          data: { error: 'No candidates with sufficient resume data found' }
        };
        return;
      }

      console.log(`✅ ${validCandidates.length}/${candidateSummaries.length} candidates have sufficient data`);

      // Create name mapping for adding back after AI processing
      const nameMap = new Map(
        validCandidates.map(c => [c.id, c.originalName])
      );

      // Process in batches of 5 to stay under token limits
      const BATCH_SIZE = 5;
      const batches = [];
      for (let i = 0; i < validCandidates.length; i += BATCH_SIZE) {
        batches.push(validCandidates.slice(i, i + BATCH_SIZE));
      }

      yield {
        type: 'progress',
        data: {
          totalCandidates: validCandidates.length,
          totalBatches: batches.length,
          currentBatch: 0
        }
      };

      let allResults: any[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} candidates)`);

        try {
          const batchResults = await this.screenBatch(
            batch,
            jobRequirements || 'Software Engineer',
            patterns
          );

          // Add names back AFTER AI processing (names were never sent to AI)
          const resultsWithNames = batchResults.map(result => ({
            ...result,
            name: nameMap.get(result.id) || 'Unknown', // Add name from local map
            strengths: result.strengths || [],
            concerns: result.concerns || []
          }));

          allResults = [...allResults, ...resultsWithNames];

          // Yield batch results
          yield {
            type: 'batch',
            data: {
              batchNumber: i + 1,
              totalBatches: batches.length,
              results: resultsWithNames,
              progress: Math.round(((i + 1) / batches.length) * 100)
            }
          };

          // Rate limiting: wait 1 second between batches (except last batch)
          if (i < batches.length - 1) {
            console.log('⏳ Waiting 1 second before next batch (rate limiting)...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (batchError) {
          console.error(`❌ Batch ${i + 1} failed:`, batchError);
          yield {
            type: 'batch_error',
            data: {
              batchNumber: i + 1,
              error: batchError.message
            }
          };
        }
      }

      // Final summary
      yield {
        type: 'complete',
        data: {
          success: true,
          totalCandidates: candidates.length,
          screenedCandidates: allResults.length,
          results: allResults,
          patterns: patterns
        }
      };

    } catch (error) {
      console.error('❌ AI screening failed:', error);
      yield {
        type: 'error',
        data: { error: error.message }
      };
    }
  }

  /**
   * Screen candidates using AI with dataset-trained criteria (non-streaming)
   */
  async screenCandidates(candidates: any[], jobRequirements?: string): Promise<any> {
    const results: any[] = [];
    let finalResult: any = null;

    for await (const event of this.screenCandidatesStreaming(candidates, jobRequirements)) {
      if (event.type === 'complete') {
        finalResult = event.data;
      } else if (event.type === 'error') {
        return {
          success: false,
          error: event.data.error,
          results: []
        };
      }
    }

    return finalResult || {
      success: false,
      error: 'Screening failed',
      results: []
    };
  }

  /**
   * Get screening statistics
   */
  getScreeningStats() {
    if (this.screeningCriteria.length === 0) {
      return null;
    }

    const shortlisted = this.screeningCriteria.filter((row: any) => row.shortlisted === 'Yes');
    const notShortlisted = this.screeningCriteria.filter((row: any) => row.shortlisted === 'No');

    return {
      totalExamples: this.screeningCriteria.length,
      shortlistedCount: shortlisted.length,
      notShortlistedCount: notShortlisted.length,
      shortlistRate: ((shortlisted.length / this.screeningCriteria.length) * 100).toFixed(1) + '%'
    };
  }
}

export const aiResumeScreeningService = new AIResumeScreeningService();
