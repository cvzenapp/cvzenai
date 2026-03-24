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
   * Add optimized properties to array sections (experience, education, projects)
   */
  private addOptimizedPropertiesToArray(originalData: any[], optimizedData: any[], sectionName: string): any[] {
    return originalData.map((item, index) => {
      const optimizedItem = optimizedData[index] || {};
      const result = { ...item };

      // Add optimization properties based on section type
      if (sectionName === 'experience') {
        result.description_optimized = optimizedItem.description || null;
        result.responsibilities_optimized = optimizedItem.responsibilities || null;
        result.achievements_optimized = optimizedItem.achievements || null;
        result.is_optimized = true;
      } else if (sectionName === 'education') {
        result.description_optimized = optimizedItem.description || null;
        result.is_optimized = true;
      } else if (sectionName === 'projects') {
        result.description_optimized = optimizedItem.description || null;
        result.achievements_optimized = optimizedItem.achievements || null;
        result.is_optimized = true;
      }

      return result;
    });
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
        // Check if this is an individual experience optimization
        if (sectionName.startsWith('experience-')) {
          const experienceIndex = parseInt(sectionName.split('-')[1]);
          const experiences = resumeData.experience || [];
          
          if (experienceIndex >= 0 && experienceIndex < experiences.length) {
            const experience = experiences[experienceIndex];
            console.log(`🎯 Optimizing individual experience: ${experience.title} at ${experience.company}`);
            
            // Create experience optimizer and optimize individual experience
            const experienceOptimizer = new ExperienceOptimizer(abstractedAiService);
            const experienceResult = await experienceOptimizer.improveExperienceItem(experience, currentATSScore, resumeData);
            
            if (experienceResult.improved) {
              improvedData.experience[experienceIndex] = experienceResult.data;
              improvements.push(...experienceResult.improvements);
              changesApplied.push(`Improved experience: ${experience.title} at ${experience.company}`);
              console.log(`✅ Experience ${experienceIndex} improved`);
              
              // Update database with the entire experience array
              if (updateCallback) {
                try {
                  await updateCallback('experience', improvedData.experience);
                  console.log(`💾 Experience section saved to database`);
                } catch (error) {
                  console.error(`❌ Failed to save experience section to database:`, error);
                }
              }
              
              // Send success update for completed experience
              if (progressCallback) {
                progressCallback({
                  type: 'section_completed',
                  stage: 'single_experience_completed',
                  message: `Experience "${experience.title}" optimized and saved`,
                  sectionName: sectionName,
                  improvements: experienceResult.improvements
                });
              }
            } else {
              console.log(`ℹ️ Experience ${experienceIndex} already optimized`);
              
              // Send skip update
              if (progressCallback) {
                progressCallback({
                  type: 'section_skipped',
                  stage: 'single_experience_skipped',
                  message: `Experience "${experience.title}" already optimized`,
                  sectionName: sectionName
                });
              }
            }
          } else {
            throw new Error(`Experience index ${experienceIndex} out of range`);
          }
        } else if (sectionName.startsWith('projects-')) {
          // Handle individual project optimization
          const projectIndex = parseInt(sectionName.split('-')[1]);
          const projects = resumeData.projects || [];
          
          if (projectIndex >= 0 && projectIndex < projects.length) {
            const project = projects[projectIndex];
            console.log(`🎯 Optimizing individual project: ${project.name || project.title}`);
            
            // Create project optimizer and optimize individual project
            const projectOptimizer = new ProjectOptimizer(abstractedAiService);
            const projectResult = await projectOptimizer.improveProjectItem(project, currentATSScore, resumeData);
            
            if (projectResult.improved) {
              improvedData.projects[projectIndex] = projectResult.data;
              improvements.push(...projectResult.improvements);
              changesApplied.push(`Improved project: ${project.name || project.title}`);
              console.log(`✅ Project ${projectIndex} improved`);
              
              // Update database with the entire projects array
              if (updateCallback) {
                try {
                  await updateCallback('projects', improvedData.projects);
                  console.log(`💾 Projects section saved to database`);
                } catch (error) {
                  console.error(`❌ Failed to save projects section to database:`, error);
                }
              }
              
              // Send success update for completed project
              if (progressCallback) {
                progressCallback({
                  type: 'section_completed',
                  stage: 'single_project_completed',
                  message: `Project "${project.name || project.title}" optimized and saved`,
                  sectionName: sectionName,
                  improvements: projectResult.improvements
                });
              }
            } else {
              console.log(`ℹ️ Project ${projectIndex} already optimized`);
              
              // Send skip update
              if (progressCallback) {
                progressCallback({
                  type: 'section_skipped',
                  stage: 'single_project_skipped',
                  message: `Project "${project.name || project.title}" already optimized`,
                  sectionName: sectionName
                });
              }
            }
          } else {
            throw new Error(`Project index ${projectIndex} out of range`);
          }
        } else {
        // Handle regular section optimization
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
    // Handle different section types
    let contentToOptimize = sectionData;
    let hasContent = false;

    // Extract content based on section type
    if (sectionName === 'summary' || sectionName === 'objective') {
      // JSONB format: {content: "text", content_optimized: null, is_optimized: false}
      if (sectionData && sectionData.content) {
        contentToOptimize = sectionData.content;
        hasContent = true;
      }
    } else if (sectionName === 'skills') {
      // Array format with skills_optimized property
      hasContent = Array.isArray(sectionData) && sectionData.length > 0;
    } else {
      // Array sections (experience, education, projects)
      hasContent = Array.isArray(sectionData) && sectionData.length > 0;
    }

    if (!hasContent) {
      return { improved: false, data: sectionData, improvements: [] };
    }

    const sectionPrompt = this.generateSectionPrompt(sectionName, contentToOptimize, currentATSScore, fullResumeData);
    
    try {
      const response = await abstractedAiService.generateResponse({
        systemPrompt: this.getSystemPrompt(),
        userPrompt: sectionPrompt,
        options: {
          temperature: 0.3,
          maxTokens: 2000
        }
      });

      if (!response.success) {
        throw new Error('AI service failed to generate response');
      }

      // Parse the response
      const cleanedResponse = this.sanitizeJSON(response.response);
      const improvedSection = JSON.parse(cleanedResponse);

      // Validate the improved section
      if (this.validateSectionImprovement(contentToOptimize, improvedSection, sectionName)) {
        // Format the response based on section type
        let optimizedData;
        
        if (sectionName === 'summary' || sectionName === 'objective') {
          // Update JSONB format
          optimizedData = {
            content: sectionData.content, // Keep original
            content_optimized: improvedSection.data,
            is_optimized: true
          };
        } else if (sectionName === 'skills') {
          // Add skills_optimized array
          optimizedData = {
            ...sectionData,
            skills_optimized: improvedSection.data,
            is_optimized: true
          };
        } else {
          // For experience, education, projects - add _optimized properties to each item
          optimizedData = this.addOptimizedPropertiesToArray(sectionData, improvedSection.data, sectionName);
        }

        return {
          improved: true,
          data: optimizedData,
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

/**
 * Individual experience optimization methods
 */
class ExperienceOptimizer {
  constructor(private aiService: any) {}

  /**
   * Improve individual experience item with optimization tracking properties
   */
  async improveExperienceItem(
    experience: any,
    currentATSScore: any,
    fullResumeData: any
  ): Promise<{ improved: boolean; data: any; improvements: string[] }> {
    // Check if already optimized
    if (experience.is_optimized) {
      return { improved: false, data: experience, improvements: [] };
    }

    const improvements: string[] = [];
    const improvedExperience = { ...experience };

    try {
      // Optimize description if present
      if (experience.description && !experience.description_optimized) {
        const optimizedDescription = await this.optimizeExperienceDescription(
          experience.description,
          experience.title,
          experience.company,
          fullResumeData
        );
        
        if (optimizedDescription && optimizedDescription !== experience.description) {
          improvedExperience.description_optimized = optimizedDescription;
          improvements.push(`Enhanced job description for ${experience.title} role`);
        }
      }

      // Optimize responsibilities if present
      if (experience.responsibilities && experience.responsibilities.length > 0 && !experience.responsibilities_optimized) {
        const optimizedResponsibilities = await this.optimizeExperienceResponsibilities(
          experience.responsibilities,
          experience.title,
          experience.company,
          fullResumeData
        );
        
        if (optimizedResponsibilities && optimizedResponsibilities.length > 0) {
          improvedExperience.responsibilities_optimized = optimizedResponsibilities;
          improvements.push(`Optimized responsibilities for ${experience.title} role`);
        }
      }

      // Optimize achievements if present
      if (experience.achievements && experience.achievements.length > 0 && !experience.achievements_optimized) {
        const optimizedAchievements = await this.optimizeExperienceAchievements(
          experience.achievements,
          experience.title,
          experience.company,
          fullResumeData
        );
        
        if (optimizedAchievements && optimizedAchievements.length > 0) {
          improvedExperience.achievements_optimized = optimizedAchievements;
          improvements.push(`Enhanced achievements for ${experience.title} role`);
        }
      }

      // Mark as optimized if any improvements were made
      if (improvements.length > 0) {
        improvedExperience.is_optimized = true;
        return { improved: true, data: improvedExperience, improvements };
      }

      return { improved: false, data: experience, improvements: [] };

    } catch (error) {
      console.error('❌ Error optimizing experience item:', error);
      return { improved: false, data: experience, improvements: [] };
    }
  }

  /**
   * Optimize experience description using AI
   */
  private async optimizeExperienceDescription(
    description: string,
    jobTitle: string,
    company: string,
    fullResumeData: any
  ): Promise<string> {
    const prompt = `Optimize this job description for ATS and recruiter appeal:

Current Description: ${description}

Requirements:
1. Use strong action verbs and quantifiable achievements
2. Include relevant keywords for the role
3. Make it concise but impactful
4. Focus on results and impact
5. Keep the same general meaning and facts
6. Return ONLY the optimized description text
7. Do NOT include job title, company name, or any labels
8. Do NOT use markdown formatting, asterisks, or special characters
9. Return plain text only
10. Do NOT repeat the job title or company name in your response
11. Start directly with the optimized description content

Return only the optimized description text, nothing else.`;

    try {
      const response = await this.aiService.generateResponse({
        systemPrompt: 'You are an expert resume optimizer. Return only the requested optimized text without any formatting, labels, or additional information.',
        userPrompt: prompt,
        options: {
          temperature: 0.3,
          maxTokens: 1000
        }
      });
      
      if (!response.success) {
        throw new Error('AI service failed to generate response');
      }
      
      // Clean the response of any markdown or special formatting
      let cleanedResponse = response.response
        .trim()
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/\*/g, '') // Remove italic markdown
        .replace(/^#+\s*/gm, '') // Remove headers
        .replace(/^-\s*/gm, '') // Remove bullet points
        .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
        .replace(/^Job Title:.*$/gm, '') // Remove job title lines
        .replace(/^Company:.*$/gm, '') // Remove company lines
        .replace(/^Description:.*$/gm, '') // Remove description labels
        .replace(/^Optimized Description:.*$/gm, '') // Remove labels
        .replace(/^\*\*Job Title:\*\*.*$/gm, '') // Remove bold job title lines
        .replace(/^\*\*Company:\*\*.*$/gm, '') // Remove bold company lines
        .replace(/^\*\*Description:\*\*.*$/gm, '') // Remove bold description labels
        .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
        .trim();
      
      // Additional cleaning for any remaining metadata patterns
      const lines = cleanedResponse.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmedLine = line.trim();
        // Skip lines that look like metadata
        return !trimmedLine.match(/^(Job Title|Company|Description|Position|Role):/i) &&
               !trimmedLine.match(/^\*\*(Job Title|Company|Description|Position|Role):\*\*/i);
      });
      
      return filteredLines.join('\n').trim();
    } catch (error) {
      console.error('❌ Error optimizing experience description:', error);
      return description;
    }
  }

  /**
   * Optimize experience responsibilities using AI
   */
  private async optimizeExperienceResponsibilities(
    responsibilities: string[],
    jobTitle: string,
    company: string,
    fullResumeData: any
  ): Promise<string[]> {
    const prompt = `Optimize these job responsibilities for ATS and recruiter appeal:

Current Responsibilities:
${responsibilities.map((resp, idx) => `${idx + 1}. ${resp}`).join('\n')}

Requirements:
1. Start each with strong action verbs
2. Include quantifiable metrics where possible
3. Use industry-relevant keywords
4. Make them concise but impactful
5. Focus on achievements and results
6. Keep the same number of responsibilities
7. Return ONLY the optimized responsibility text for each item
8. Do NOT include job title, company name, or any labels
9. Do NOT use markdown formatting, asterisks, or special characters
10. Return as a simple numbered list with plain text only

Return only the optimized responsibilities as a numbered list, nothing else.`;

    try {
      const response = await this.aiService.generateResponse({
        systemPrompt: 'You are an expert resume optimizer. Return only the requested optimized text without any formatting, labels, or additional information.',
        userPrompt: prompt,
        options: {
          temperature: 0.3,
          maxTokens: 1000
        }
      });
      
      if (!response.success) {
        throw new Error('AI service failed to generate response');
      }
      
      // Parse the numbered list response and clean formatting
      const optimizedResponsibilities = response.response
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .map(line => line
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .replace(/^#+\s*/g, '') // Remove headers
          .trim()
        )
        .filter(line => line.length > 0);
      
      return optimizedResponsibilities.length > 0 ? optimizedResponsibilities : responsibilities;
    } catch (error) {
      console.error('❌ Error optimizing experience responsibilities:', error);
      return responsibilities;
    }
  }

  /**
   * Optimize experience achievements using AI
   */
  private async optimizeExperienceAchievements(
    achievements: string[],
    jobTitle: string,
    company: string,
    fullResumeData: any
  ): Promise<string[]> {
    const prompt = `Optimize these job achievements for ATS and recruiter appeal:

Current Achievements:
${achievements.map((ach, idx) => `${idx + 1}. ${ach}`).join('\n')}

Requirements:
1. Quantify results with specific numbers/percentages
2. Use strong action verbs and impact-focused language
3. Include relevant keywords for the role
4. Make them concise but powerful
5. Focus on business impact and results
6. Keep the same number of achievements
7. Return ONLY the optimized achievement text for each item
8. Do NOT include job title, company name, or any labels
9. Do NOT use markdown formatting, asterisks, or special characters
10. Return as a simple numbered list with plain text only

Return only the optimized achievements as a numbered list, nothing else.`;

    try {
      const response = await this.aiService.generateResponse({
        systemPrompt: 'You are an expert resume optimizer. Return only the requested optimized text without any formatting, labels, or additional information.',
        userPrompt: prompt,
        options: {
          temperature: 0.3,
          maxTokens: 1000
        }
      });
      
      if (!response.success) {
        throw new Error('AI service failed to generate response');
      }
      
      // Parse the numbered list response and clean formatting
      const optimizedAchievements = response.response
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .map(line => line
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .replace(/^#+\s*/g, '') // Remove headers
          .trim()
        )
        .filter(line => line.length > 0);
      
      return optimizedAchievements.length > 0 ? optimizedAchievements : achievements;
    } catch (error) {
      console.error('❌ Error optimizing experience achievements:', error);
      return achievements;
    }
  }
}

export const atsImprover = new ATSImprover();

/**
 * Individual project optimization methods
 */
class ProjectOptimizer {
  constructor(private aiService: any) {}

  /**
   * Improve individual project item with optimization tracking properties
   */
  async improveProjectItem(
    project: any,
    currentATSScore: any,
    fullResumeData: any
  ): Promise<{ improved: boolean; data: any; improvements: string[] }> {
    // Check if already optimized
    if (project.is_optimized) {
      return { improved: false, data: project, improvements: [] };
    }

    const improvements: string[] = [];
    const improvedProject = { ...project };

    try {
      // Optimize description if present
      if (project.description && !project.description_optimized) {
        const optimizedDescription = await this.optimizeProjectDescription(
          project.description,
          project.name || project.title,
          project.technologies || [],
          fullResumeData
        );
        
        if (optimizedDescription && optimizedDescription !== project.description) {
          improvedProject.description_optimized = optimizedDescription;
          improvements.push(`Enhanced project description for ${project.name || project.title}`);
        }
      }

      // Optimize achievements if present
      if (project.achievements && project.achievements.length > 0 && !project.achievements_optimized) {
        const optimizedAchievements = await this.optimizeProjectAchievements(
          project.achievements,
          project.name || project.title,
          project.technologies || [],
          fullResumeData
        );
        
        if (optimizedAchievements && optimizedAchievements.length > 0) {
          improvedProject.achievements_optimized = optimizedAchievements;
          improvements.push(`Enhanced achievements for ${project.name || project.title}`);
        }
      }

      // Optimize features if present
      if (project.features && project.features.length > 0 && !project.features_optimized) {
        const optimizedFeatures = await this.optimizeProjectFeatures(
          project.features,
          project.name || project.title,
          project.technologies || [],
          fullResumeData
        );
        
        if (optimizedFeatures && optimizedFeatures.length > 0) {
          improvedProject.features_optimized = optimizedFeatures;
          improvements.push(`Enhanced features for ${project.name || project.title}`);
        }
      }

      // Mark as optimized if any improvements were made
      if (improvements.length > 0) {
        improvedProject.is_optimized = true;
        return { improved: true, data: improvedProject, improvements };
      }

      return { improved: false, data: project, improvements: [] };

    } catch (error) {
      console.error('❌ Error optimizing project item:', error);
      return { improved: false, data: project, improvements: [] };
    }
  }

  /**
   * Optimize project description using AI
   */
  private async optimizeProjectDescription(
    description: string,
    projectName: string,
    technologies: string[],
    fullResumeData: any
  ): Promise<string> {
    const prompt = `Optimize this project description for ATS and recruiter appeal:

Current Description: ${description}

Requirements:
1. Use strong action verbs and quantifiable achievements
2. Include relevant technical keywords
3. Make it concise but impactful
4. Focus on results and impact
5. Highlight technical skills and problem-solving
6. Keep the same general meaning and facts
7. Return ONLY the optimized description text
8. Do NOT include project name, technologies, or any labels
9. Do NOT use markdown formatting, asterisks, or special characters
10. Return plain text only

Return only the optimized description text, nothing else.`;

    try {
      const response = await this.aiService.generateResponse({
        systemPrompt: 'You are an expert technical resume optimizer. Return only the requested optimized text without any formatting, labels, or additional information.',
        userPrompt: prompt,
        options: { temperature: 0.3, maxTokens: 500 }
      });
      
      if (response.success) {
        // Clean the response of any markdown or special formatting
        return response.response
          .trim()
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .replace(/^#+\s*/gm, '') // Remove headers
          .replace(/^-\s*/gm, '') // Remove bullet points
          .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
          .replace(/^Project Name:.*$/gm, '') // Remove project name lines
          .replace(/^Technologies:.*$/gm, '') // Remove technology lines
          .replace(/^Optimized Description:.*$/gm, '') // Remove labels
          .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
          .trim();
      }
      return description;
    } catch (error) {
      console.error('❌ Error optimizing project description:', error);
      return description;
    }
  }

  /**
   * Optimize project achievements using AI
   */
  private async optimizeProjectAchievements(
    achievements: string[],
    projectName: string,
    technologies: string[],
    fullResumeData: any
  ): Promise<string[]> {
    const prompt = `Optimize these project achievements for ATS and recruiter appeal:

Current Achievements:
${achievements.map((ach, idx) => `${idx + 1}. ${ach}`).join('\n')}

Requirements:
1. Quantify results with specific numbers/percentages where possible
2. Use strong action verbs and impact-focused language
3. Include relevant technical keywords
4. Make them concise but powerful
5. Focus on technical impact and results
6. Keep the same number of achievements
7. Return ONLY the optimized achievement text for each item
8. Do NOT include project name, technologies, or any labels
9. Do NOT use markdown formatting, asterisks, or special characters
10. Return as a simple numbered list with plain text only

Return only the optimized achievements as a numbered list, nothing else.`;

    try {
      const response = await this.aiService.generateResponse({
        systemPrompt: 'You are an expert technical resume optimizer. Return only the requested optimized text without any formatting, labels, or additional information.',
        userPrompt: prompt,
        options: { temperature: 0.3, maxTokens: 800 }
      });
      
      if (response.success) {
        // Parse the numbered list response and clean formatting
        const optimizedAchievements = response.response
          .split('\n')
          .filter(line => line.trim().match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .map(line => line
            .replace(/\*\*/g, '') // Remove bold markdown
            .replace(/\*/g, '') // Remove italic markdown
            .replace(/^#+\s*/g, '') // Remove headers
            .trim()
          )
          .filter(line => line.length > 0);
        
        return optimizedAchievements.length > 0 ? optimizedAchievements : achievements;
      }
      return achievements;
    } catch (error) {
      console.error('❌ Error optimizing project achievements:', error);
      return achievements;
    }
  }

  /**
   * Optimize project features using AI
   */
  private async optimizeProjectFeatures(
    features: string[],
    projectName: string,
    technologies: string[],
    fullResumeData: any
  ): Promise<string[]> {
    const prompt = `Optimize these project features for ATS and recruiter appeal:

Current Features:
${features.map((feat, idx) => `${idx + 1}. ${feat}`).join('\n')}

Requirements:
1. Use technical language and relevant keywords
2. Make them concise but descriptive
3. Focus on functionality and technical implementation
4. Include relevant technical terms
5. Keep the same number of features
6. Return ONLY the optimized feature text for each item
7. Do NOT include project name, technologies, or any labels
8. Do NOT use markdown formatting, asterisks, or special characters
9. Return as a simple numbered list with plain text only

Return only the optimized features as a numbered list, nothing else.`;

    try {
      const response = await this.aiService.generateResponse({
        systemPrompt: 'You are an expert technical resume optimizer. Return only the requested optimized text without any formatting, labels, or additional information.',
        userPrompt: prompt,
        options: { temperature: 0.3, maxTokens: 600 }
      });
      
      if (response.success) {
        // Parse the numbered list response and clean formatting
        const optimizedFeatures = response.response
          .split('\n')
          .filter(line => line.trim().match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .map(line => line
            .replace(/\*\*/g, '') // Remove bold markdown
            .replace(/\*/g, '') // Remove italic markdown
            .replace(/^#+\s*/g, '') // Remove headers
            .trim()
          )
          .filter(line => line.length > 0);
        
        return optimizedFeatures.length > 0 ? optimizedFeatures : features;
      }
      return features;
    } catch (error) {
      console.error('❌ Error optimizing project features:', error);
      return features;
    }
  }
}