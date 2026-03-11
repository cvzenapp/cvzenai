import { Router } from 'express';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import { getDatabase } from '../database/connection.js';
import { atsScorer } from '../services/dspy/atsScorer.js';

const router = Router();

/**
 * POST /api/ats/calculate/:resumeId
 * Calculate and store ATS score for a resume
 */
router.post('/calculate/:resumeId', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  const { resumeId } = req.params;
  const userId = req.user?.id;

  console.log(`🎯 ATS calculation requested for resume ${resumeId} by user ${userId}`);

  const db = await getDatabase();

  try {
    // Get resume data
    const result = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2::uuid',
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const resume = result.rows[0];

    // Prepare resume data for scoring
    const resumeData = {
      personalInfo: resume.personal_info,
      summary: resume.summary || '',
      objective: resume.objective || '',
      skills: resume.skills || [],
      experience: resume.experience || [],
      education: resume.education || [],
      projects: resume.projects || [],
      certifications: resume.certifications || [],
      languages: resume.languages || []
    };

    // Validate resume has minimum required content
    const missingFields: string[] = [];
    
    // Debug: Log what we're checking
    console.log('🔍 Validating resume data:', {
      hasName: !!resumeData.personalInfo?.name,
      hasFirstName: !!resumeData.personalInfo?.firstName,
      hasEmail: !!resumeData.personalInfo?.email,
      hasSummary: !!resumeData.summary,
      hasObjective: !!resumeData.objective,
      skillsCount: resumeData.skills?.length || 0,
      experienceCount: resumeData.experience?.length || 0,
      educationCount: resumeData.education?.length || 0,
      personalInfoKeys: resumeData.personalInfo ? Object.keys(resumeData.personalInfo) : []
    });
    
    // Check name (more flexible - check multiple possible fields)
    const hasName = resumeData.personalInfo?.name || 
                    resumeData.personalInfo?.firstName || 
                    resumeData.personalInfo?.fullName;
    if (!hasName) {
      missingFields.push('Name');
    }
    
    if (!resumeData.personalInfo?.email) {
      missingFields.push('Email');
    }
    if (!resumeData.summary && !resumeData.objective) {
      missingFields.push('Professional Summary or Career Objective');
    }
    if (!resumeData.skills || resumeData.skills.length === 0) {
      missingFields.push('Skills');
    }
    if (!resumeData.experience || resumeData.experience.length === 0) {
      missingFields.push('Work Experience');
    }
    if (!resumeData.education || resumeData.education.length === 0) {
      missingFields.push('Education');
    }

    if (missingFields.length > 0) {
      console.log(`⚠️ Resume incomplete. Missing: ${missingFields.join(', ')}`);
      
      // Calculate a partial score anyway (will be low)
      const atsScore = await atsScorer.calculateScore(resumeData);
      
      // Add missing fields as suggestions at the top
      const enhancedSuggestions = [
        `Complete these sections to improve your ATS score: ${missingFields.join(', ')}`,
        ...atsScore.suggestions
      ];
      
      return res.json({
        success: true,
        atsScore: {
          ...atsScore,
          suggestions: enhancedSuggestions
        },
        incomplete: true,
        missingFields,
        message: `Your resume is missing key sections. Complete them to get a better ATS score.`
      });
    }

    console.log('📊 Calculating ATS score...');
    const atsScore = await atsScorer.calculateScore(resumeData);
    console.log(`✅ ATS Score: ${atsScore.overallScore}/100`);

    // Update resume with ATS score
    await db.query(
      `UPDATE resumes SET
        ats_score = $1,
        ats_score_completeness = $2,
        ats_score_formatting = $3,
        ats_score_keywords = $4,
        ats_score_experience = $5,
        ats_score_education = $6,
        ats_score_skills = $7,
        ats_suggestions = $8,
        ats_strengths = $9,
        ats_scored_at = NOW()
      WHERE id = $10`,
      [
        atsScore.overallScore,
        atsScore.scores.completeness,
        atsScore.scores.formatting,
        atsScore.scores.keywords,
        atsScore.scores.experience,
        atsScore.scores.education,
        atsScore.scores.skills,
        JSON.stringify(atsScore.suggestions),
        JSON.stringify(atsScore.strengths),
        resumeId
      ]
    );

    console.log(`✅ ATS score stored for resume ${resumeId}`);

    return res.json({
      success: true,
      atsScore
    });

  } catch (error) {
    console.error('❌ ATS calculation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate ATS score'
    });
  }
});

/**
 * POST /api/ats/improve/:resumeId
 * Improve resume based on ATS score analysis
 * 
 * Query params:
 * - method: 'llm' (default) | 'rule-based' | 'hybrid'
 */
router.post('/improve/:resumeId', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  const { resumeId } = req.params;
  const userId = req.user?.id;
  const method = (req.query.method as string) || 'llm'; // Default to AI-powered improvements

  console.log(`🚀 ATS improvement requested for resume ${resumeId} by user ${userId}`);
  console.log(`   📋 Query params:`, req.query);
  console.log(`   🎯 Method selected: ${method}`);

  const db = await getDatabase();

  try {
    // Get resume data with current ATS score
    const result = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2::uuid',
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const resume = result.rows[0];

    // Check if ATS score exists
    if (!resume.ats_score) {
      return res.status(400).json({
        success: false,
        error: 'Please calculate ATS score first before improving'
      });
    }

    // Prepare current resume data
    const currentData = {
      personalInfo: resume.personal_info,
      summary: resume.summary || '',
      objective: resume.objective || '',
      skills: resume.skills || [],
      experience: resume.experience || [],
      education: resume.education || [],
      projects: resume.projects || [],
      certifications: resume.certifications || [],
      languages: resume.languages || []
    };

    // Prepare current ATS score (parse JSON fields) - BEFORE validation
    const currentATSScore = {
      overallScore: resume.ats_score,
      scores: {
        completeness: resume.ats_score_completeness,
        formatting: resume.ats_score_formatting,
        keywords: resume.ats_score_keywords,
        experience: resume.ats_score_experience,
        education: resume.ats_score_education,
        skills: resume.ats_score_skills
      },
      suggestions: Array.isArray(resume.ats_suggestions) 
        ? resume.ats_suggestions 
        : (typeof resume.ats_suggestions === 'string' 
          ? JSON.parse(resume.ats_suggestions) 
          : []),
      strengths: Array.isArray(resume.ats_strengths) 
        ? resume.ats_strengths 
        : (typeof resume.ats_strengths === 'string' 
          ? JSON.parse(resume.ats_strengths) 
          : [])
    };

    // Validate resume has minimum required content
    const missingFields: string[] = [];
    
    // Debug: Log what we're checking
    console.log('🔍 Validating resume data:', {
      hasName: !!currentData.personalInfo?.name,
      hasFirstName: !!currentData.personalInfo?.firstName,
      hasEmail: !!currentData.personalInfo?.email,
      hasSummary: !!currentData.summary,
      hasObjective: !!currentData.objective,
      skillsCount: currentData.skills?.length || 0,
      experienceCount: currentData.experience?.length || 0,
      educationCount: currentData.education?.length || 0,
      personalInfoKeys: currentData.personalInfo ? Object.keys(currentData.personalInfo) : []
    });
    
    // Check name (more flexible - check multiple possible fields)
    const hasName = currentData.personalInfo?.name || 
                    currentData.personalInfo?.firstName || 
                    currentData.personalInfo?.fullName;
    if (!hasName) {
      missingFields.push('Name');
    }
    
    if (!currentData.personalInfo?.email) {
      missingFields.push('Email');
    }
    if (!currentData.summary && !currentData.objective) {
      missingFields.push('Professional Summary or Career Objective');
    }
    if (!currentData.skills || currentData.skills.length === 0) {
      missingFields.push('Skills');
    }
    if (!currentData.experience || currentData.experience.length === 0) {
      missingFields.push('Work Experience');
    }
    if (!currentData.education || currentData.education.length === 0) {
      missingFields.push('Education');
    }

    if (missingFields.length > 0) {
      console.log(`⚠️ Resume incomplete. Missing: ${missingFields.join(', ')}`);
      
      // Return success with guidance instead of error
      return res.json({
        success: true,
        method,
        improvements: [],
        changesApplied: [],
        oldScore: currentATSScore.overallScore,
        newScore: currentATSScore.overallScore,
        scoreIncrease: 0,
        incomplete: true,
        missingFields,
        message: `Complete these sections first: ${missingFields.join(', ')}. Then try improving your resume.`,
        newATSScore: currentATSScore
      });
    }

    let improvement: any;
    let improvedData: any;
    let improvements: string[];
    let changesApplied: string[];

    // Choose improvement method
    if (method === 'rule-based') {
      console.log('🔧 Using rule-based ATS improvements (legacy method)...');
      
      const { ruleBasedATSImprover } = await import('../services/dspy/ruleBasedATSImprover.js');
      const result = ruleBasedATSImprover.improveResume(currentData, currentATSScore);
      
      improvedData = result.improvedData;
      improvements = result.improvements;
      changesApplied = result.changesApplied;
      
    } else if (method === 'llm') {
      console.log('🤖 Using AI-powered ATS improvements (trained model with 12,093+ examples)...');
      
      const { atsImproverWithAX } = await import('../services/dspy/atsImproverWithAX.js');
      improvement = await atsImproverWithAX.improveResume(currentData, currentATSScore);
      
      console.log(`📊 DSPy Metric Score: ${(improvement.metricScore * 100).toFixed(1)}%`);
      
      improvedData = improvement.improvedData;
      improvements = improvement.improvements;
      changesApplied = improvement.changesApplied;
      
    } else if (method === 'hybrid') {
      console.log('🔀 Using hybrid approach (rule-based + LLM enhancements)...');
      
      // First apply rule-based improvements
      const { ruleBasedATSImprover } = await import('../services/dspy/ruleBasedATSImprover.js');
      const ruleResult = ruleBasedATSImprover.improveResume(currentData, currentATSScore);
      
      // Then optionally enhance with LLM (only if rule-based didn't get to 85+)
      const ruleScore = await atsScorer.calculateScore(ruleResult.improvedData);
      
      if (ruleScore.overallScore < 85) {
        console.log('🤖 Applying LLM enhancements on top of rule-based improvements...');
        const { atsImproverWithAX } = await import('../services/dspy/atsImproverWithAX.js');
        improvement = await atsImproverWithAX.improveResume(ruleResult.improvedData, {
          ...currentATSScore,
          overallScore: ruleScore.overallScore
        });
        
        improvedData = improvement.improvedData;
        improvements = [...ruleResult.improvements, ...improvement.improvements];
        changesApplied = [...ruleResult.changesApplied, ...improvement.changesApplied];
      } else {
        improvedData = ruleResult.improvedData;
        improvements = ruleResult.improvements;
        changesApplied = ruleResult.changesApplied;
      }
      
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid method. Use: rule-based, llm, or hybrid'
      });
    }

    // Recalculate and store new ATS score
    const newATSScore = await atsScorer.calculateScore(improvedData);
    
    console.log(`📊 Score comparison - Old: ${currentATSScore.overallScore}, New: ${newATSScore.overallScore}`);
    
    // CRITICAL: Only apply improvements if score actually increases OR stays the same (no harm done)
    if (newATSScore.overallScore < currentATSScore.overallScore) {
      console.log(`⚠️ Improvements DECREASED score (${currentATSScore.overallScore} → ${newATSScore.overallScore}). Keeping original.`);
      return res.json({
        success: true,
        method,
        improvements: [],
        changesApplied: [],
        oldScore: currentATSScore.overallScore,
        newScore: currentATSScore.overallScore, // Keep original score
        scoreIncrease: 0,
        noChangeReason: 'improvements_decreased_score',
        message: currentATSScore.overallScore >= 70 
          ? `Your resume looks good with a score of ${currentATSScore.overallScore}! To improve further, consider adding more relevant skills, projects, or certifications.`
          : `AI suggestions would have decreased your score. Your original score of ${currentATSScore.overallScore} has been kept.`,
        newATSScore: currentATSScore // Return original score
      });
    }
    
    // If score stayed the same, don't save changes - just return suggestions
    if (newATSScore.overallScore === currentATSScore.overallScore) {
      console.log(`ℹ️ Score unchanged (${currentATSScore.overallScore} → ${newATSScore.overallScore}). Returning suggestions instead.`);
      
      return res.json({
        success: true,
        method,
        improvements: [],
        changesApplied: [],
        oldScore: currentATSScore.overallScore,
        newScore: currentATSScore.overallScore,
        scoreIncrease: 0,
        noChangeReason: 'score_unchanged',
        message: currentATSScore.overallScore >= 70
          ? `Your resume looks good with a score of ${currentATSScore.overallScore}! To improve further, consider adding more relevant skills, projects, or certifications.`
          : `Your score remains at ${currentATSScore.overallScore}. Here are suggestions to improve:`,
        newATSScore: {
          ...newATSScore,
          suggestions: currentATSScore.overallScore >= 70 ? [
            'Your resume is performing well! To boost it further:',
            'Add more relevant skills that match specific job requirements',
            'Include additional projects that showcase your expertise',
            'Obtain professional certifications related to your field',
            'Add quantifiable achievements with specific metrics (e.g., "Increased sales by 25%")',
            'Include industry-specific keywords from job postings',
            'Add volunteer work or leadership experiences if relevant'
          ] : [
            'To improve your ATS score further, consider:',
            ...newATSScore.suggestions
          ]
        }
      });
    }
    
    // Score improved - save the changes
    await db.query(
      `UPDATE resumes SET
        personal_info = $1,
        summary = $2,
        objective = $3,
        skills = $4,
        experience = $5,
        education = $6,
        projects = $7,
        certifications = $8,
        languages = $9,
        updated_at = NOW()
      WHERE id = $10`,
      [
        JSON.stringify(improvedData.personalInfo),
        improvedData.summary,
        improvedData.objective,
        JSON.stringify(improvedData.skills),
        JSON.stringify(improvedData.experience),
        JSON.stringify(improvedData.education),
        JSON.stringify(improvedData.projects),
        JSON.stringify(improvedData.certifications || []),
        JSON.stringify(improvedData.languages || []),
        resumeId
      ]
    );
    
    await db.query(
      `UPDATE resumes SET
        ats_score = $1,
        ats_score_completeness = $2,
        ats_score_formatting = $3,
        ats_score_keywords = $4,
        ats_score_experience = $5,
        ats_score_education = $6,
        ats_score_skills = $7,
        ats_suggestions = $8,
        ats_strengths = $9,
        ats_scored_at = NOW()
      WHERE id = $10`,
      [
        newATSScore.overallScore,
        newATSScore.scores.completeness,
        newATSScore.scores.formatting,
        newATSScore.scores.keywords,
        newATSScore.scores.experience,
        newATSScore.scores.education,
        newATSScore.scores.skills,
        JSON.stringify(newATSScore.suggestions),
        JSON.stringify(newATSScore.strengths),
        resumeId
      ]
    );

    console.log(`✅ Resume improved successfully - Score: ${currentATSScore.overallScore} → ${newATSScore.overallScore} (+${newATSScore.overallScore - currentATSScore.overallScore})`);

    // Track usage for subscription
    try {
      const { SubscriptionService } = await import('../services/subscriptionService.js');
      const subscription = await SubscriptionService.getUserSubscription(userId);
      if (subscription) {
        await SubscriptionService.incrementUsage(
          subscription.id,
          'user',
          'ai_improvements_monthly',
          1
        );
      }
    } catch (usageError) {
      console.error('Error tracking AI improvement usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

    return res.json({
      success: true,
      method,
      improvements,
      changesApplied,
      oldScore: currentATSScore.overallScore,
      newScore: newATSScore.overallScore,
      scoreIncrease: newATSScore.overallScore - currentATSScore.overallScore,
      message: `Resume improved! Score increased from ${currentATSScore.overallScore} to ${newATSScore.overallScore} (+${newATSScore.overallScore - currentATSScore.overallScore} points)`,
      newATSScore
    });

  } catch (error) {
    console.error('❌ ATS improvement error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to improve resume'
    });
  }
});

/**
 * POST /api/ats/improve-section/:resumeId
 * Improve a specific section of the resume and save it to the database
 */
router.post('/improve-section/:resumeId', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  const { resumeId } = req.params;
  const { sectionType, sectionData, sectionIndex } = req.body;
  const userId = req.user?.id;

  console.log(`🎯 Section improvement requested: ${sectionType} for resume ${resumeId}`);

  const db = await getDatabase();

  try {
    // Validate section type
    const validSections = ['summary', 'objective', 'experience', 'education', 'project', 'skills'];
    if (!validSections.includes(sectionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid section type. Must be one of: ${validSections.join(', ')}`
      });
    }

    // Get resume data for context
    const result = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2::uuid',
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const resume = result.rows[0];

    // Prepare context for improvement
    const context = {
      personalInfo: resume.personal_info,
      allSkills: resume.skills || [],
      jobTitle: resume.personal_info?.title || resume.personal_info?.name
    };

    console.log(`🚀 Improving ${sectionType} section with AI...`);
    
    // Import sectionImprover
    const { sectionImprover } = await import('../services/dspy/sectionImprover.js');
    
    const improvement = await sectionImprover.improveSection(
      sectionType as any,
      sectionData,
      context
    );

    console.log(`✅ Section improved with ${improvement.changes.length} changes`);

    // Save the improved content to the database
    let updateQuery = '';
    let updateParams: any[] = [];

    if (sectionType === 'summary' || sectionType === 'objective') {
      // Simple string fields
      updateQuery = `UPDATE resumes SET ${sectionType} = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3::uuid RETURNING *`;
      updateParams = [improvement.improved, resumeId, userId];
    } else if (sectionType === 'skills') {
      // Array field
      updateQuery = `UPDATE resumes SET skills = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3::uuid RETURNING *`;
      updateParams = [JSON.stringify(improvement.improved), resumeId, userId];
    } else if (sectionIndex !== undefined) {
      // Array item update (experience, education, projects)
      const columnMap = {
        'experience': 'experience',
        'education': 'education',
        'project': 'projects'
      };
      const columnName = columnMap[sectionType];
      
      // Get current array
      const currentArray = typeof resume[columnName] === 'string' 
        ? JSON.parse(resume[columnName]) 
        : (resume[columnName] || []);
      
      // Update the specific index
      currentArray[sectionIndex] = improvement.improved;
      
      updateQuery = `UPDATE resumes SET ${columnName} = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3::uuid RETURNING *`;
      updateParams = [JSON.stringify(currentArray), resumeId, userId];
    }

    if (updateQuery) {
      const updateResult = await db.query(updateQuery, updateParams);
      console.log(`💾 Saved improved ${sectionType} to database`);
      
      return res.json({
        success: true,
        data: {
          improved: improvement.improved,
          changes: improvement.changes
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          improved: improvement.improved,
          changes: improvement.changes
        }
      });
    }

  } catch (error) {
    console.error(`❌ Section improvement error:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to improve section'
    });
  }
});

export default router;
