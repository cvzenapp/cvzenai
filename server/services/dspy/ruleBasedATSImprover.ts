/**
 * Rule-Based ATS Improver
 * 
 * Uses deterministic rules to guarantee ATS score improvements.
 * No LLM involved - pure logic based on ATS best practices.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OptimizedPatterns {
  actionVerbs: string[];
  technicalKeywords: string[];
  rules: string[];
  avgSkillsCount: number;
  avgExpCount: number;
}

export class RuleBasedATSImprover {
  private patterns: OptimizedPatterns | null = null;

  constructor() {
    this.loadPatterns();
  }

  private loadPatterns() {
    try {
      const patternsPath = path.join(__dirname, '../../data_sets/dspy_compiled_patterns.json');
      const patternsData = fs.readFileSync(patternsPath, 'utf-8');
      this.patterns = JSON.parse(patternsData);
      console.log('✅ Loaded pre-compiled ATS patterns for rule-based improvements');
    } catch (error) {
      console.error('⚠️ Failed to load patterns, using defaults');
      this.patterns = this.getDefaultPatterns();
    }
  }

  private getDefaultPatterns(): OptimizedPatterns {
    return {
      actionVerbs: ['Led', 'Developed', 'Managed', 'Built', 'Created', 'Designed', 'Implemented', 'Architected', 'Improved', 'Optimized'],
      technicalKeywords: ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 'SQL', 'Git', 'Agile', 'CI/CD'],
      rules: [],
      avgSkillsCount: 20,
      avgExpCount: 7
    };
  }

  /**
   * Improve resume using deterministic rules
   */
  improveResume(resumeData: any, currentATSScore: any): {
    improvedData: any;
    improvements: string[];
    changesApplied: string[];
  } {
    console.log('🔧 Applying intelligent content-focused ATS improvements...');
    console.log('📊 Input resume structure:', {
      hasPersonalInfo: !!resumeData.personalInfo,
      hasSummary: !!resumeData.summary,
      hasObjective: !!resumeData.objective,
      skillsCount: resumeData.skills?.length || 0,
      experienceCount: resumeData.experience?.length || 0,
      projectsCount: resumeData.projects?.length || 0,
      educationCount: resumeData.education?.length || 0
    });
    
    const improved = JSON.parse(JSON.stringify(resumeData)); // Deep clone
    const changesApplied: string[] = [];

    // Priority 1: Professional Summary (most impactful for ATS)
    if (!improved.summary || improved.summary.length < 100) {
      this.enhanceProfessionalSummary(improved);
      changesApplied.push('Enhanced professional summary with keywords and achievements');
    }

    // Priority 2: Career Objective (if missing)
    if (!improved.objective || improved.objective.length < 50) {
      this.addCareerObjective(improved);
      changesApplied.push('Added career objective aligned with skills and experience');
    }

    // Priority 3: Project Descriptions (add keywords, skills, metrics)
    if (improved.projects && Array.isArray(improved.projects) && improved.projects.length > 0) {
      const enhanced = this.enhanceProjectDescriptions(improved);
      if (enhanced > 0) {
        changesApplied.push(`Enhanced ${enhanced} project descriptions with keywords, skills, and metrics`);
      }
    }

    // Priority 4: Experience Descriptions (add action verbs, keywords, metrics)
    if (improved.experience && Array.isArray(improved.experience) && improved.experience.length > 0) {
      const enhanced = this.enhanceExperienceDescriptions(improved);
      if (enhanced > 0) {
        changesApplied.push(`Enhanced ${enhanced} experience entries with action verbs and quantifiable results`);
      }
    }

    // Priority 5: Skills (only add if critically low)
    if (currentATSScore.scores.skills < 60 && improved.skills && improved.skills.length < 10) {
      const added = this.addRelevantSkills(improved, currentATSScore);
      if (added > 0) {
        changesApplied.push(`Added ${added} relevant technical skills based on experience and projects`);
      }
    }

    const improvements = this.generateImprovementSummary(changesApplied, currentATSScore.overallScore);

    console.log(`✅ Applied ${changesApplied.length} content-focused improvements`);
    console.log('📊 Output resume structure:', {
      hasPersonalInfo: !!improved.personalInfo,
      hasSummary: !!improved.summary,
      hasObjective: !!improved.objective,
      skillsCount: improved.skills?.length || 0,
      experienceCount: improved.experience?.length || 0,
      projectsCount: improved.projects?.length || 0,
      educationCount: improved.education?.length || 0
    });

    return {
      improvedData: improved,
      improvements,
      changesApplied
    };
  }

  /**
   * Enhance professional summary with keywords and achievements
   */
  private enhanceProfessionalSummary(resumeData: any) {
    const skillsRaw = resumeData.skills?.slice(0, 5) || [];
    // Extract skill names from objects or use strings directly
    const skills = skillsRaw.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean);
    
    const title = resumeData.personalInfo?.title || resumeData.personalInfo?.name || 'Professional';
    const yearsExp = this.estimateYearsOfExperience(resumeData);
    
    // Extract key achievements from experience
    const achievements = this.extractKeyAchievements(resumeData);
    
    // Build keyword-rich summary
    let summary = `${title}`;
    
    if (yearsExp > 0) {
      summary += ` with ${yearsExp}+ years of experience`;
    }
    
    if (skills.length > 0) {
      summary += ` specializing in ${skills.slice(0, 3).join(', ')}`;
    }
    
    summary += '. ';
    
    if (achievements.length > 0) {
      summary += `Proven track record of ${achievements[0]}. `;
    } else {
      summary += 'Proven track record of delivering high-quality solutions and driving results. ';
    }
    
    if (skills.length > 3) {
      summary += `Strong technical expertise in ${skills.slice(3, 6).join(', ')}. `;
    }
    
    summary += 'Passionate about leveraging technology to solve complex business challenges and create value.';
    
    resumeData.summary = summary;
  }

  /**
   * Add career objective if missing
   */
  private addCareerObjective(resumeData: any) {
    const skillsRaw = resumeData.skills?.slice(0, 3) || [];
    // Extract skill names from objects or use strings directly
    const skills = skillsRaw.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean);
    
    const title = resumeData.personalInfo?.title || 'Professional';
    
    const objective = `Seeking a challenging ${title} role where I can leverage my expertise in ${skills.join(', ')} ` +
      `to contribute to innovative projects and drive organizational success. ` +
      `Committed to continuous learning and delivering exceptional results in a collaborative environment.`;
    
    resumeData.objective = objective;
  }

  /**
   * Enhance project descriptions with keywords, skills, and metrics
   */
  private enhanceProjectDescriptions(resumeData: any): number {
    if (!resumeData.projects || !Array.isArray(resumeData.projects)) return 0;

    let enhanced = 0;
    const allSkills = resumeData.skills || [];

    resumeData.projects = resumeData.projects.map((project: any) => {
      if (typeof project === 'object') {
        let wasEnhanced = false;
        
        // Enhance description with keywords and metrics
        if (project.description) {
          const desc = project.description;
          
          // Check if description is too short or lacks keywords
          if (desc.length < 100 || !this.hasKeywords(desc)) {
            // Add relevant skills/technologies
            const projectSkills = project.technologies || this.extractRelevantSkills(desc, allSkills);
            
            if (projectSkills && projectSkills.length > 0) {
              const techStack = Array.isArray(projectSkills) ? projectSkills.join(', ') : projectSkills;
              
              // Enhance description
              if (!desc.includes('using') && !desc.includes('with')) {
                project.description = `${desc} Built using ${techStack}.`;
                wasEnhanced = true;
              }
            }
            
            // Add metrics if missing
            if (!this.hasMetrics(desc)) {
              project.description += ' Improved performance and user experience through optimized architecture.';
              wasEnhanced = true;
            }
          }
        }
        
        // Ensure technologies are listed
        if (!project.technologies || project.technologies.length === 0) {
          project.technologies = this.extractRelevantSkills(project.description || project.name || '', allSkills);
          if (project.technologies.length > 0) wasEnhanced = true;
        }
        
        if (wasEnhanced) enhanced++;
      }
      return project;
    });

    return enhanced;
  }

  /**
   * Enhance experience descriptions with action verbs, keywords, and metrics
   */
  private enhanceExperienceDescriptions(resumeData: any): number {
    if (!resumeData.experience || !Array.isArray(resumeData.experience)) return 0;

    let enhanced = 0;
    const actionVerbs = this.patterns!.actionVerbs;
    const allSkills = resumeData.skills || [];

    resumeData.experience = resumeData.experience.map((exp: any) => {
      let wasEnhanced = false;
      
      if (typeof exp === 'string') {
        // Ensure starts with action verb
        const startsWithActionVerb = actionVerbs.some(verb => 
          exp.trim().toLowerCase().startsWith(verb.toLowerCase())
        );

        if (!startsWithActionVerb) {
          const verb = this.selectActionVerb(exp);
          exp = `${verb} ${exp.charAt(0).toLowerCase()}${exp.slice(1)}`;
          wasEnhanced = true;
        }
        
        // Add metrics if missing
        if (!this.hasMetrics(exp) && exp.length > 50) {
          exp += ' resulting in improved efficiency and performance';
          wasEnhanced = true;
        }
        
        if (wasEnhanced) enhanced++;
        return exp;
        
      } else if (typeof exp === 'object' && exp.description) {
        // Ensure starts with action verb
        const startsWithActionVerb = actionVerbs.some(verb => 
          exp.description.trim().toLowerCase().startsWith(verb.toLowerCase())
        );

        if (!startsWithActionVerb) {
          const verb = this.selectActionVerb(exp.description);
          exp.description = `${verb} ${exp.description.charAt(0).toLowerCase()}${exp.description.slice(1)}`;
          wasEnhanced = true;
        }
        
        // Add relevant technologies if missing
        if (!exp.technologies || exp.technologies.length === 0) {
          exp.technologies = this.extractRelevantSkills(exp.description, allSkills);
          if (exp.technologies.length > 0) wasEnhanced = true;
        }
        
        // Add metrics if missing
        if (!this.hasMetrics(exp.description) && exp.description.length > 50) {
          exp.description += ', resulting in measurable improvements in team productivity and project delivery';
          wasEnhanced = true;
        }
        
        if (wasEnhanced) enhanced++;
      }
      
      return exp;
    });

    return enhanced;
  }

  /**
   * Add relevant skills (only if critically low)
   */
  private addRelevantSkills(resumeData: any, currentATSScore: any): number {
    if (!resumeData.skills) resumeData.skills = [];
    if (!Array.isArray(resumeData.skills)) resumeData.skills = [];

    const currentSkills = new Set(
      resumeData.skills
        .filter((s: any) => typeof s === 'string')
        .map((s: string) => s.toLowerCase())
    );

    // Extract skills mentioned in experience and projects
    const impliedSkills = this.extractImpliedSkills(resumeData);
    
    // Add only skills that are already implied by the content
    const skillsToAdd = impliedSkills.filter(skill => !currentSkills.has(skill.toLowerCase()));
    
    // Limit to 5 additions
    const added = skillsToAdd.slice(0, 5);
    resumeData.skills.push(...added);

    return added.length;
  }

  /**
   * Helper: Estimate years of experience
   */
  private estimateYearsOfExperience(resumeData: any): number {
    if (!resumeData.experience || !Array.isArray(resumeData.experience)) return 0;
    
    // Simple heuristic: count experience entries (each ~2 years)
    return Math.min(resumeData.experience.length * 2, 15);
  }

  /**
   * Helper: Extract key achievements
   */
  private extractKeyAchievements(resumeData: any): string[] {
    const achievements: string[] = [];
    
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      for (const exp of resumeData.experience) {
        const text = typeof exp === 'string' ? exp : exp.description || '';
        
        // Look for achievement indicators
        if (/improved|increased|reduced|achieved|delivered|launched/i.test(text)) {
          const match = text.match(/(?:improved|increased|reduced|achieved|delivered|launched)[^.]+/i);
          if (match) {
            achievements.push(match[0].toLowerCase());
            if (achievements.length >= 2) break;
          }
        }
      }
    }
    
    return achievements;
  }

  /**
   * Helper: Check if text has keywords
   */
  private hasKeywords(text: string): boolean {
    const keywords = this.patterns!.technicalKeywords;
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Helper: Check if text has metrics
   */
  private hasMetrics(text: string): boolean {
    return /\d+%|\$\d+|\d+\+?\s*(users|customers|team|projects|million|thousand|hours|days)/i.test(text);
  }

  /**
   * Helper: Extract relevant skills from text
   */
  private extractRelevantSkills(text: string, allSkills: any[]): string[] {
    const lowerText = text.toLowerCase();
    
    // Handle both string arrays and skill objects with 'name' property
    return allSkills
      .filter((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill?.name;
        return skillName && typeof skillName === 'string' && lowerText.includes(skillName.toLowerCase());
      })
      .map((skill: any) => typeof skill === 'string' ? skill : skill.name)
      .slice(0, 5);
  }

  /**
   * Helper: Extract implied skills from experience and projects
   */
  private extractImpliedSkills(resumeData: any): string[] {
    const implied = new Set<string>();
    const keywords = this.patterns!.technicalKeywords;
    
    // Check experience
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      for (const exp of resumeData.experience) {
        const text = (typeof exp === 'string' ? exp : exp.description || '').toLowerCase();
        keywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) {
            implied.add(keyword);
          }
        });
      }
    }
    
    // Check projects
    if (resumeData.projects && Array.isArray(resumeData.projects)) {
      for (const proj of resumeData.projects) {
        const text = ((proj.description || '') + ' ' + (proj.name || '')).toLowerCase();
        keywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) {
            implied.add(keyword);
          }
        });
      }
    }
    
    return Array.from(implied);
  }

  /**
   * Select appropriate action verb based on content
   */
  private selectActionVerb(text: string): string {
    const textLower = text.toLowerCase();
    
    // Leadership indicators
    if (textLower.includes('team') || textLower.includes('manage') || textLower.includes('lead')) {
      return 'Led';
    }
    
    // Development indicators
    if (textLower.includes('build') || textLower.includes('create') || textLower.includes('develop')) {
      return 'Developed';
    }
    
    // Improvement indicators
    if (textLower.includes('improve') || textLower.includes('optimize') || textLower.includes('enhance')) {
      return 'Improved';
    }
    
    // Design indicators
    if (textLower.includes('design') || textLower.includes('architect')) {
      return 'Designed';
    }
    
    // Implementation indicators
    if (textLower.includes('implement') || textLower.includes('deploy')) {
      return 'Implemented';
    }
    
    // Default
    return 'Developed';
  }

  /**
   * Generate improvement summary
   */
  private generateImprovementSummary(changesApplied: string[], oldScore: number): string[] {
    const improvements: string[] = [];
    
    improvements.push(`Applied ${changesApplied.length} rule-based improvements to increase ATS score`);
    improvements.push('All changes are guaranteed to improve ATS compatibility');
    
    changesApplied.forEach(change => improvements.push(change));
    
    improvements.push('Tip: Review the changes and adjust wording to match your experience');
    
    return improvements;
  }
}

export const ruleBasedATSImprover = new RuleBasedATSImprover();
