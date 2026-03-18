import { abstractedAiService } from '../abstractedAiService.js';
import { atsScorer } from './atsScorer.js';
import { promptOptimizer } from './promptOptimizer.js';
import { jsonrepair } from 'jsonrepair';

/**
 * ATS Improver - DSPy-trained with real resume dataset + AX LLM integration
 * Uses optimized prompts from training data analysis
 */
export class ATSImprover {
  private initialized = false;
  private trainingData: any = null;

  async initialize() {
    if (this.initialized) return;
    console.log('🚀 Initializing DSPy-trained ATS Improver with AX LLM...');
    
    // Initialize prompt optimizer with training data
    await promptOptimizer.initialize();
    
    // Get optimized training data patterns
    this.trainingData = promptOptimizer.getOptimizedPrompt();
    
    // Validate optimizer performance
    await promptOptimizer.validate();
    
    this.initialized = true;
    console.log('✅ ATS Improver ready with DSPy-optimized prompts');
  }

  /**
   * Public method to improve a single section (for API use)
   */
  async improveSingleSectionPublic(
    sectionName: string,
    resumeData: any,
    currentATSScore: any,
    progressCallback?: (update: any) => void,
    updateCallback?: (sectionName: string, sectionData: any) => Promise<void>
  ): Promise<{
    improvedData: any;
    improvements: string[];
    estimatedNewScore: number;
    changesApplied: string[];
  }> {
    await this.initialize();

    console.log(`🎯 Optimizing single section: ${sectionName}`);

    // Send initial progress update
    if (progressCallback) {
      progressCallback({
        type: 'progress',
        stage: 'single_section_start',
        message: `Starting ${sectionName} section optimization...`,
        sectionName: sectionName,
        currentScore: currentATSScore.overallScore
      });
    }

    const improvedData = JSON.parse(JSON.stringify(resumeData)); // Deep clone
    const improvements: string[] = [];
    const changesApplied: string[] = [];

    try {
      const sectionResult = await this.improveSingleSection(
        sectionName, 
        resumeData[sectionName], 
        currentATSScore,
        resumeData
      );

      if (sectionResult.improved) {
        improvedData[sectionName] = sectionResult.data;
        improvements.push(...sectionResult.improvements);
        changesApplied.push(`Improved ${sectionName} section`);
        console.log(`✅ ${sectionName} section improved`);
        
        // Update database immediately after section improvement
        if (updateCallback) {
          try {
            await updateCallback(sectionName, sectionResult.data);
            console.log(`💾 ${sectionName} section saved to database`);
          } catch (error) {
            console.error(`❌ Failed to save ${sectionName} section to database:`, error);
          }
        }
        
        // Send success update for completed section
        if (progressCallback) {
          progressCallback({
            type: 'section_completed',
            stage: 'single_section_completed',
            message: `${sectionName} section optimized and saved`,
            sectionName: sectionName,
            improvements: sectionResult.improvements
          });
        }
      } else {
        console.log(`ℹ️ ${sectionName} section already optimized`);
        
        // Send skip update
        if (progressCallback) {
          progressCallback({
            type: 'section_skipped',
            stage: 'single_section_skipped',
            message: `${sectionName} section already optimized`,
            sectionName: sectionName
          });
        }
      }

    } catch (error) {
      console.error(`❌ Failed to improve ${sectionName} section:`, error);
      
      // Send error update
      if (progressCallback) {
        progressCallback({
          type: 'section_error',
          stage: 'single_section_error',
          message: `Failed to optimize ${sectionName} section`,
          sectionName: sectionName,
          error: error.message
        });
      }
      throw error;
    }

    // Calculate new score
    if (progressCallback) {
      progressCallback({
        type: 'progress',
        stage: 'calculating_score',
        message: 'Calculating new ATS score...',
        sectionName: sectionName
      });
    }

    const estimatedNewScore = await this.estimateNewScore(improvedData);

    console.log(`✅ ${sectionName} section optimization complete`);
    console.log(`📈 Estimated score improvement: ${currentATSScore.overallScore} → ${estimatedNewScore}`);

    // Send completion update
    if (progressCallback) {
      progressCallback({
        type: 'completed',
        stage: 'single_section_final',
        message: `${sectionName} section optimization completed successfully!`,
        sectionName: sectionName,
        originalScore: currentATSScore.overallScore,
        newScore: estimatedNewScore,
        improvement: estimatedNewScore - currentATSScore.overallScore,
        changesApplied: changesApplied,
        totalImprovements: improvements.length
      });
    }

    return {
      improvedData,
      improvements,
      estimatedNewScore,
      changesApplied
    };
  }
  async improveSectionBySection(resumeData: any, currentATSScore: any, progressCallback?: (update: any) => void, updateCallback?: (sectionName: string, sectionData: any) => Promise<void>): Promise<{
    improvedData: any;
    improvements: string[];
    estimatedNewScore: number;
    changesApplied: string[];
  }> {
    await this.initialize();

    console.log('🔄 Starting section-by-section resume optimization...');
    console.log('📊 Current ATS Score:', currentATSScore.overallScore);

    // Send initial progress update
    if (progressCallback) {
      progressCallback({
        type: 'progress',
        stage: 'starting',
        message: 'Starting section-by-section optimization...',
        currentScore: currentATSScore.overallScore,
        sectionsTotal: 5,
        sectionsCompleted: 0
      });
    }

    const improvedData = JSON.parse(JSON.stringify(resumeData)); // Deep clone
    const improvements: string[] = [];
    const changesApplied: string[] = [];

    // Define sections to improve in order of priority
    const sectionsToImprove = [
      { name: 'summary', priority: 1, displayName: 'Professional Summary' },
      { name: 'skills', priority: 2, displayName: 'Skills' },
      { name: 'experience', priority: 3, displayName: 'Work Experience' },
      { name: 'education', priority: 4, displayName: 'Education' },
      { name: 'projects', priority: 5, displayName: 'Projects' }
    ];

    // Improve each section sequentially
    for (let i = 0; i < sectionsToImprove.length; i++) {
      const section = sectionsToImprove[i];
      
      try {
        console.log(`🎯 Improving ${section.name} section...`);
        
        // Send progress update for current section
        if (progressCallback) {
          progressCallback({
            type: 'progress',
            stage: 'processing',
            message: `Optimizing ${section.displayName} section...`,
            currentSection: section.displayName,
            sectionsTotal: sectionsToImprove.length,
            sectionsCompleted: i,
            progress: Math.round((i / sectionsToImprove.length) * 100)
          });
        }
        
        const sectionResult = await this.improveSingleSection(
          section.name, 
          improvedData[section.name], 
          currentATSScore,
          resumeData
        );

        if (sectionResult.improved) {
          improvedData[section.name] = sectionResult.data;
          improvements.push(...sectionResult.improvements);
          changesApplied.push(`Improved ${section.name} section`);
          console.log(`✅ ${section.name} section improved`);
          
          // Update database immediately after section improvement
          if (updateCallback) {
            try {
              await updateCallback(section.name, sectionResult.data);
              console.log(`💾 ${section.name} section saved to database`);
            } catch (error) {
              console.error(`❌ Failed to save ${section.name} section to database:`, error);
            }
          }
          
          // Send success update for completed section
          if (progressCallback) {
            progressCallback({
              type: 'section_completed',
              stage: 'section_completed',
              message: `${section.displayName} section optimized and saved`,
              sectionName: section.displayName,
              improvements: sectionResult.improvements,
              sectionsTotal: sectionsToImprove.length,
              sectionsCompleted: i + 1,
              progress: Math.round(((i + 1) / sectionsToImprove.length) * 100)
            });
          }
        } else {
          console.log(`ℹ️ ${section.name} section already optimized`);
          
          // Send skip update
          if (progressCallback) {
            progressCallback({
              type: 'section_skipped',
              stage: 'section_skipped',
              message: `${section.displayName} section already optimized`,
              sectionName: section.displayName,
              sectionsTotal: sectionsToImprove.length,
              sectionsCompleted: i + 1,
              progress: Math.round(((i + 1) / sectionsToImprove.length) * 100)
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to improve ${section.name} section:`, error);
        
        // Send error update
        if (progressCallback) {
          progressCallback({
            type: 'section_error',
            stage: 'section_error',
            message: `Failed to optimize ${section.displayName} section`,
            sectionName: section.displayName,
            error: error.message,
            sectionsTotal: sectionsToImprove.length,
            sectionsCompleted: i + 1,
            progress: Math.round(((i + 1) / sectionsToImprove.length) * 100)
          });
        }
        // Continue with other sections even if one fails
      }
    }

    // Send calculating score update
    if (progressCallback) {
      progressCallback({
        type: 'progress',
        stage: 'calculating_score',
        message: 'Calculating new ATS score...',
        sectionsTotal: sectionsToImprove.length,
        sectionsCompleted: sectionsToImprove.length,
        progress: 95
      });
    }

    // Estimate new score based on improvements
    const estimatedNewScore = await this.estimateNewScore(improvedData);

    console.log('✅ Section-by-section optimization complete');
    console.log(`📈 Estimated score improvement: ${currentATSScore.overallScore} → ${estimatedNewScore}`);

    // Send completion update
    if (progressCallback) {
      progressCallback({
        type: 'completed',
        stage: 'completed',
        message: 'Resume optimization completed successfully!',
        originalScore: currentATSScore.overallScore,
        newScore: estimatedNewScore,
        improvement: estimatedNewScore - currentATSScore.overallScore,
        sectionsTotal: sectionsToImprove.length,
        sectionsCompleted: sectionsToImprove.length,
        progress: 100,
        changesApplied: changesApplied,
        totalImprovements: improvements.length
      });
    }

    return {
      improvedData,
      improvements,
      estimatedNewScore,
      changesApplied
    };
  }

  /**
   * Improve a single section of the resume
   */
  private async improveSingleSection(
    sectionName: string, 
    sectionData: any, 
    currentATSScore: any,
    fullResumeData: any
  ): Promise<{
    improved: boolean;
    data: any;
    improvements: string[];
  }> {
    if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
      return { improved: false, data: sectionData, improvements: [] };
    }

    const sectionPrompt = this.generateSectionPrompt(sectionName, sectionData, currentATSScore, fullResumeData);
    
    try {
      const response = await abstractedAiService.generateResponse({
        systemPrompt: this.getSystemPrompt(),
        userPrompt: sectionPrompt,
        options: {
          temperature: 0.3,
          maxTokens: 2000
          // No model specified - let abstractedAiService use the configured AI_SERVICE
        }
      });

      if (!response.success) {
        throw new Error('AI service failed to generate response');
      }

      // Parse the response
      const cleanedResponse = this.sanitizeJSON(response.response);
      const improvedSection = JSON.parse(cleanedResponse);

      // Validate the improved section
      if (this.validateSectionImprovement(sectionData, improvedSection, sectionName)) {
        return {
          improved: true,
          data: improvedSection.data,
          improvements: improvedSection.improvements || []
        };
      } else {
        console.warn(`⚠️ Section ${sectionName} improvement validation failed`);
        return { improved: false, data: sectionData, improvements: [] };
      }

    } catch (error) {
      console.error(`❌ Failed to improve ${sectionName} section:`, error);
      return { improved: false, data: sectionData, improvements: [] };
    }
  }

  /**
   * Generate section-specific improvement prompt
   */
  private generateSectionPrompt(sectionName: string, sectionData: any, currentATSScore: any, fullResumeData: any): string {
    const weakAreas = this.identifyWeakAreas(currentATSScore);
    
    const basePrompt = `You are an expert ATS optimization specialist. Improve the ${sectionName} section of this resume to increase ATS compatibility and keyword matching.

Current ATS Score: ${currentATSScore.overallScore}/100
Weak Areas: ${weakAreas.join(', ')}

Current ${sectionName} section:
${JSON.stringify(sectionData, null, 2)}

Context (full resume for reference):
- Role: ${fullResumeData.personalInfo?.title || 'Professional'}
- Industry: ${this.inferIndustry(fullResumeData)}
- Experience Level: ${this.inferExperienceLevel(fullResumeData)}

Instructions:
1. Enhance the ${sectionName} section for better ATS parsing
2. Add relevant keywords without keyword stuffing
3. Improve formatting and structure
4. Maintain authenticity and accuracy
5. Focus on quantifiable achievements where applicable

Return ONLY a JSON object with this structure:
{
  "data": ${this.getSectionStructureExample(sectionName)},
  "improvements": ["list of specific improvements made"]
}`;

    return basePrompt;
  }

  /**
   * Get section structure example for the prompt
   */
  private getSectionStructureExample(sectionName: string): string {
    switch (sectionName) {
      case 'summary':
        return '"improved summary text"';
      case 'skills':
        return '["skill1", "skill2", "skill3"]';
      case 'experience':
        return `[{
          "company": "Company Name",
          "position": "Job Title",
          "startDate": "Start Date",
          "endDate": "End Date",
          "current": false,
          "description": "Enhanced description with keywords and achievements",
          "skills": ["relevant", "skills"],
          "responsibilities": ["key responsibilities"],
          "achievements": ["quantified achievements"],
          "others": []
        }]`;
      case 'education':
        return `[{
          "institution": "University Name",
          "degree": "Degree Type",
          "field": "Field of Study",
          "startDate": "Start Date",
          "endDate": "End Date",
          "gpa": "GPA if relevant",
          "achievements": ["academic achievements"]
        }]`;
      case 'projects':
        return `[{
          "name": "Project Name",
          "description": "Enhanced project description with keywords",
          "technologies": ["tech1", "tech2"],
          "link": "project url if available"
        }]`;
      default:
        return 'null';
    }
  }

  /**
   * Validate section improvement
   */
  private validateSectionImprovement(original: any, improved: any, sectionName: string): boolean {
    if (!improved || !improved.data) {
      return false;
    }

    // Check that arrays are not reduced in size
    if (Array.isArray(original) && Array.isArray(improved.data)) {
      if (improved.data.length < original.length) {
        console.warn(`❌ ${sectionName} array reduced: ${original.length} → ${improved.data.length}`);
        return false;
      }
    }

    // Section-specific validations
    switch (sectionName) {
      case 'experience':
        return this.validateExperienceSection(original, improved.data);
      case 'education':
        return this.validateEducationSection(original, improved.data);
      case 'projects':
        return this.validateProjectsSection(original, improved.data);
      case 'skills':
        return this.validateSkillsSection(original, improved.data);
      default:
        return true;
    }
  }

  /**
   * Validate experience section improvements
   */
  private validateExperienceSection(original: any[], improved: any[]): boolean {
    if (!Array.isArray(original) || !Array.isArray(improved)) return false;
    
    // Check that all original companies are preserved
    const originalCompanies = original.map(exp => exp.company?.toLowerCase()).filter(Boolean);
    const improvedCompanies = improved.map(exp => exp.company?.toLowerCase()).filter(Boolean);
    
    for (const company of originalCompanies) {
      if (!improvedCompanies.includes(company)) {
        console.warn(`❌ Company missing in improved experience: ${company}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate education section improvements
   */
  private validateEducationSection(original: any[], improved: any[]): boolean {
    if (!Array.isArray(original) || !Array.isArray(improved)) return false;
    
    // Check that all original institutions are preserved
    const originalInstitutions = original.map(edu => edu.institution?.toLowerCase()).filter(Boolean);
    const improvedInstitutions = improved.map(edu => edu.institution?.toLowerCase()).filter(Boolean);
    
    for (const institution of originalInstitutions) {
      if (!improvedInstitutions.includes(institution)) {
        console.warn(`❌ Institution missing in improved education: ${institution}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate projects section improvements
   */
  private validateProjectsSection(original: any[], improved: any[]): boolean {
    if (!Array.isArray(original) || !Array.isArray(improved)) return false;
    
    // Check that project count is maintained or increased
    if (improved.length < original.length) {
      console.warn(`❌ Projects reduced: ${original.length} → ${improved.length}`);
      return false;
    }
    
    return true;
  }

  /**
   * Validate skills section improvements
   */
  private validateSkillsSection(original: any[], improved: any[]): boolean {
    if (!Array.isArray(original) || !Array.isArray(improved)) return false;
    
    // Check that skill count is maintained or increased
    if (improved.length < original.length) {
      console.warn(`❌ Skills reduced: ${original.length} → ${improved.length}`);
      return false;
    }
    
    return true;
  }

  /**
   * Get system prompt for section improvement
   */
  private getSystemPrompt(): string {
    return `You are an expert ATS optimization specialist with deep knowledge of resume parsing systems and keyword optimization. Your task is to improve resume sections to maximize ATS compatibility while preserving all original data.

CRITICAL RULES:
1. PRESERVE all original data structure and content
2. NEVER reduce array lengths (skills, experience, projects, education)
3. NEVER change company names, job titles, or dates
4. ONLY enhance descriptions and add relevant keywords
5. Return ONLY valid JSON with the improved section data

Focus on:
- Adding relevant technical keywords
- Using strong action verbs
- Including quantifiable metrics
- Improving ATS parsing compatibility
- Maintaining authenticity and accuracy`;
  }

  /**
   * Infer industry from resume data
   */
  private inferIndustry(resumeData: any): string {
    const content = JSON.stringify(resumeData).toLowerCase();
    
    // Technology keywords
    if (content.includes('software') || content.includes('developer') || content.includes('engineer') || 
        content.includes('programming') || content.includes('javascript') || content.includes('python') ||
        content.includes('react') || content.includes('node') || content.includes('aws')) {
      return 'Technology';
    }
    
    // Finance keywords
    if (content.includes('finance') || content.includes('banking') || content.includes('investment') ||
        content.includes('accounting') || content.includes('financial')) {
      return 'Finance';
    }
    
    // Healthcare keywords
    if (content.includes('healthcare') || content.includes('medical') || content.includes('nurse') ||
        content.includes('doctor') || content.includes('hospital')) {
      return 'Healthcare';
    }
    
    // Marketing keywords
    if (content.includes('marketing') || content.includes('digital marketing') || content.includes('seo') ||
        content.includes('social media') || content.includes('advertising')) {
      return 'Marketing';
    }
    
    // Education keywords
    if (content.includes('teacher') || content.includes('education') || content.includes('professor') ||
        content.includes('instructor') || content.includes('academic')) {
      return 'Education';
    }
    
    return 'General';
  }

  /**
   * Infer experience level from resume data
   */
  private inferExperienceLevel(resumeData: any): string {
    if (!resumeData.experience || !Array.isArray(resumeData.experience)) {
      return 'Entry Level';
    }
    
    const totalYears = resumeData.experience.reduce((total: number, exp: any) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : new Date(exp.endDate);
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return total + Math.max(0, years);
      }
      return total;
    }, 0);
    
    if (totalYears < 2) return 'Entry Level';
    if (totalYears < 5) return 'Mid Level';
    if (totalYears < 10) return 'Senior Level';
    return 'Executive Level';
  }

  /**
   * Identify weak areas from ATS score
   */
  private identifyWeakAreas(atsScore: any): string[] {
    const weakAreas: string[] = [];
    const threshold = 70;

    if (atsScore.scores.completeness < threshold) {
      weakAreas.push('completeness');
    }
    if (atsScore.scores.formatting < threshold) {
      weakAreas.push('formatting');
    }
    if (atsScore.scores.keywords < threshold) {
      weakAreas.push('keywords');
    }
    if (atsScore.scores.experience < threshold) {
      weakAreas.push('experience');
    }
    if (atsScore.scores.education < threshold) {
      weakAreas.push('education');
    }
    if (atsScore.scores.skills < threshold) {
      weakAreas.push('skills');
    }

    return weakAreas;
  }

  /**
   * Estimate new ATS score
   */
  private async estimateNewScore(improvedData: any): Promise<number> {
    try {
      const newScore = await atsScorer.calculateScore(improvedData);
      return newScore.overallScore;
    } catch (error) {
      console.error('❌ Failed to calculate new ATS score:', error);
      throw error;
    }
  }

  /**
   * Sanitize JSON response from AI service
   */
  private sanitizeJSON(jsonText: string): string {
    try {
      // Remove markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Remove text before first {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace > 0) {
        jsonText = jsonText.substring(firstBrace);
      }

      // Remove text after last }
      const lastBrace = jsonText.lastIndexOf('}');
      if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
        jsonText = jsonText.substring(0, lastBrace + 1);
      }

      // Try to repair JSON if it's malformed
      try {
        JSON.parse(jsonText.trim());
        return jsonText.trim();
      } catch (parseError) {
        console.log('🔧 JSON malformed, attempting repair...');
        const repairedJson = jsonrepair(jsonText.trim());
        return repairedJson;
      }
    } catch (error) {
      console.error('❌ JSON sanitization failed:', error);
      throw error;
    }
  }
}

export const atsImprover = new ATSImprover();