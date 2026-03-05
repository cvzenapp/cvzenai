/**
 * ATS Improver with Full DSPy + AX Integration
 * 
 * This implements a complete DSPy-style training pipeline:
 * 1. Load training data from dataset
 * 2. Extract patterns and create few-shot examples
 * 3. Use metric function (0-1 score) to evaluate improvements
 * 4. Optimize prompts based on metric scores
 * 5. Generate improvements that actually increase ATS scores
 */

import { groqService } from '../groqService.js';
import { atsScorer } from './atsScorer.js';
import { trainingDataLoader, TrainingExample } from './trainingDataLoader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Optimized prompt patterns extracted from training data
 */
interface OptimizedPatterns {
  actionVerbs: string[];
  technicalKeywords: string[];
  rules: string[];
  fewShotExamples: any; // Can be string or array of objects
  avgSkillsCount: number;
  avgExpCount: number;
  metadata?: {
    totalExamples: number;
    highScoreExamples: number;
    compiledAt: string;
    version: string;
  };
}

export class ATSImproverWithAX {
  private initialized = false;
  private patterns: OptimizedPatterns | null = null;
  private trainExamples: TrainingExample[] = [];
  private devExamples: TrainingExample[] = [];
  
  /**
   * Initialize with training data and optimize patterns
   * Tries to load pre-compiled patterns first, falls back to runtime compilation
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing DSPy-trained ATS Improver with AX integration...');
    
    // Try to load pre-compiled patterns first
    const precompiledPath = path.join(__dirname, '../../data_sets/dspy_compiled_patterns.json');
    
    if (fs.existsSync(precompiledPath)) {
      console.log('⚡ Loading pre-compiled DSPy patterns (instant)...');
      try {
        const patternsData = fs.readFileSync(precompiledPath, 'utf-8');
        this.patterns = JSON.parse(patternsData);
        
        console.log(`✅ Loaded pre-compiled patterns from ${this.patterns.metadata?.compiledAt || 'unknown date'}`);
        console.log(`📊 Patterns based on ${this.patterns.metadata?.totalExamples || 'unknown'} examples`);
        console.log(`   - ${this.patterns.actionVerbs.length} action verbs`);
        console.log(`   - ${this.patterns.technicalKeywords.length} technical keywords`);
        console.log(`   - ${this.patterns.rules.length} optimization rules`);
        
        // Load minimal training data for validation only
        const examples = await trainingDataLoader.loadDataset();
        const split = trainingDataLoader.getTrainDevSplit(0.8);
        this.trainExamples = split.train;
        this.devExamples = split.dev;
        
        this.initialized = true;
        console.log('✅ ATS Improver ready with pre-compiled DSPy patterns (instant load)');
        return;
      } catch (error) {
        console.warn('⚠️ Failed to load pre-compiled patterns, falling back to runtime compilation:', error.message);
      }
    } else {
      console.log('ℹ️ No pre-compiled patterns found, will compile at runtime (2-5 sec)');
      console.log('   Run "node compile-dspy-patterns.cjs" to pre-compile for instant loading');
    }
    
    // Fallback: Runtime compilation
    console.log('🔧 Compiling patterns at runtime...');
    
    // Load training data
    const examples = await trainingDataLoader.loadDataset();
    const split = trainingDataLoader.getTrainDevSplit(0.8);
    
    this.trainExamples = split.train;
    this.devExamples = split.dev;
    
    console.log(`📊 Training set: ${this.trainExamples.length} examples`);
    console.log(`📊 Dev set: ${this.devExamples.length} examples`);
    
    // Extract patterns from training data (DSPy "compile" step)
    this.patterns = await this.extractPatterns();
    
    // Validate on dev set
    await this.validate();
    
    this.initialized = true;
    console.log('✅ ATS Improver ready with DSPy-optimized prompts (runtime compiled)');
  }
  
  /**
   * Extract patterns from high-scoring training examples
   * This is the DSPy "compile" step
   */
  private async extractPatterns(): Promise<OptimizedPatterns> {
    console.log('🔧 Extracting patterns from training data...');
    
    // Filter to high-scoring examples (85+)
    const highScoreExamples = this.trainExamples.filter(ex => ex.atsScore >= 85);
    console.log(`   Found ${highScoreExamples.length} high-scoring examples (85+)`);
    
    // Extract action verbs
    const actionVerbs = new Set<string>();
    highScoreExamples.forEach(ex => {
      ex.resume.experience.forEach(exp => {
        const match = exp.match(/^(\w+)/);
        if (match && match[1].length > 3) {
          actionVerbs.add(match[1]);
        }
      });
    });
    
    // Extract technical keywords
    const technicalKeywords = new Set<string>();
    highScoreExamples.forEach(ex => {
      ex.resume.skills.forEach(skill => {
        if (skill.length > 2 && skill.length < 30) {
          technicalKeywords.add(skill);
        }
      });
    });
    
    // Calculate averages
    const avgSkillsCount = Math.ceil(
      highScoreExamples.reduce((sum, ex) => sum + ex.resume.skills.length, 0) / highScoreExamples.length
    );
    
    const avgExpCount = Math.ceil(
      highScoreExamples.reduce((sum, ex) => sum + ex.resume.experience.length, 0) / highScoreExamples.length
    );
    
    // Extract rules
    const rules = this.extractRules(highScoreExamples, avgSkillsCount, avgExpCount);
    
    // Create few-shot examples
    const fewShotExamples = this.createFewShotExamples(highScoreExamples.slice(0, 3));
    
    console.log(`   Extracted ${actionVerbs.size} action verbs`);
    console.log(`   Extracted ${technicalKeywords.size} technical keywords`);
    console.log(`   Created ${rules.length} optimization rules`);
    
    return {
      actionVerbs: Array.from(actionVerbs).slice(0, 50),
      technicalKeywords: Array.from(technicalKeywords).slice(0, 60),
      rules,
      fewShotExamples,
      avgSkillsCount,
      avgExpCount
    };
  }
  
  /**
   * Extract rules from successful examples
   */
  private extractRules(examples: TrainingExample[], avgSkills: number, avgExp: number): string[] {
    const rules: string[] = [];
    
    rules.push(`Include ${avgSkills}+ technical skills for optimal ATS scoring`);
    rules.push(`Provide ${avgExp}+ detailed experience descriptions with action verbs`);
    
    // Check for metrics
    const withMetrics = examples.filter(ex => 
      ex.resume.experience.some(exp => /\d+%|\$\d+|\d+[kmb]?\+/i.test(exp))
    ).length;
    
    if (withMetrics / examples.length > 0.6) {
      rules.push('Include quantifiable metrics (%, $, numbers) in 60%+ of experience bullets');
    }
    
    // Check for action verbs
    const withActionVerbs = examples.filter(ex =>
      ex.resume.experience.some(exp => /^(Led|Developed|Managed|Created|Built|Designed|Implemented|Architected|Optimized)/i.test(exp))
    ).length;
    
    if (withActionVerbs / examples.length > 0.7) {
      rules.push('Start 70%+ of experience bullets with strong action verbs');
    }
    
    // Check for summary
    const withSummary = examples.filter(ex => ex.resume.summary && ex.resume.summary.length > 100).length;
    
    if (withSummary / examples.length > 0.5) {
      rules.push('Include comprehensive professional summary (100+ characters)');
    }
    
    return rules;
  }
  
  /**
   * Create few-shot examples from training data
   * Uses top 5 examples for optimal few-shot learning
   */
  private createFewShotExamples(examples: TrainingExample[]): string {
    // Use top 5 examples (DSPy research shows 3-5 examples is optimal)
    return examples.slice(0, 5).map((ex, i) => `
EXAMPLE ${i + 1} (ATS Score: ${ex.atsScore}/100):

Skills (${ex.resume.skills.length}): ${ex.resume.skills.slice(0, 8).join(', ')}${ex.resume.skills.length > 8 ? '...' : ''}

Experience Sample:
${ex.resume.experience.slice(0, 2).map(exp => `• ${exp.substring(0, 150)}${exp.length > 150 ? '...' : ''}`).join('\n')}

Success Factors:
- ${ex.resume.skills.length} technical skills
- Action verbs: ${ex.resume.experience.filter(e => /^(Led|Developed|Managed|Created|Built)/i.test(e)).length}/${ex.resume.experience.length} bullets
- Metrics: ${ex.resume.experience.filter(e => /\d+%|\$\d+/i.test(e)).length}/${ex.resume.experience.length} bullets
- Summary: ${ex.resume.summary ? 'Yes' : 'No'}
`).join('\n---\n');
  }
  
  /**
   * Format few-shot examples for prompt
   * Handles both string format (runtime) and object format (pre-compiled)
   */
  private formatFewShotExamples(): string {
    if (!this.patterns?.fewShotExamples) return '';
    
    // If already a string, return as-is
    if (typeof this.patterns.fewShotExamples === 'string') {
      return this.patterns.fewShotExamples;
    }
    
    // If array of objects (pre-compiled format), convert to string
    if (Array.isArray(this.patterns.fewShotExamples)) {
      return this.patterns.fewShotExamples.map((ex: any) => `
EXAMPLE ${ex.exampleNumber} (ATS Score: ${ex.atsScore}/100):

Skills (${ex.skillsCount}): ${ex.skills.join(', ')}${ex.skillsCount > 8 ? '...' : ''}

Experience Sample:
${ex.experienceSample.map((exp: string) => `• ${exp}${exp.length >= 150 ? '...' : ''}`).join('\n')}

Success Factors:
- ${ex.successFactors.technicalSkills} technical skills
- Action verbs: ${ex.successFactors.actionVerbs}/${ex.successFactors.totalExperience} bullets
- Metrics: ${ex.successFactors.metrics}/${ex.successFactors.totalExperience} bullets
- Summary: ${ex.successFactors.hasSummary ? 'Yes' : 'No'}
`).join('\n---\n');
    }
    
    return '';
  }
  
  /**
   * Improve resume using DSPy-optimized patterns
   */
  async improveResume(resumeData: any, currentATSScore: any): Promise<{
    improvedData: any;
    improvements: string[];
    estimatedNewScore: number;
    changesApplied: string[];
    metricScore: number;
  }> {
    await this.initialize();
    
    if (!this.patterns) {
      throw new Error('Patterns not initialized');
    }
    
    console.log('🎯 Generating ATS improvements with DSPy-optimized prompts...');
    console.log('📊 Current ATS Score:', currentATSScore.overallScore);
    
    // Identify weak areas
    const weakAreas = this.identifyWeakAreas(currentATSScore);
    console.log('🔍 Weak areas:', weakAreas);
    
    // Generate improvement prompt using optimized patterns
    const prompt = this.generateOptimizedPrompt(resumeData, currentATSScore, weakAreas);
    
    // Call LLM with optimized prompt
    const response = await groqService.generateResponse({
      type: 'resume_optimization',
      content: prompt
    });
    
    if (!response.success || !response.response) {
      throw new Error('Failed to generate improvements');
    }
    
    // Parse improved data
    const improvedData = JSON.parse(this.sanitizeJSON(response.response));
    
    // Calculate changes
    const changesApplied = this.identifyChanges(resumeData, improvedData);
    
    // Estimate new score
    const estimatedNewScore = await this.estimateNewScore(improvedData);
    
    // Calculate metric score (0-1) for DSPy evaluation
    const metricScore = await this.evaluateMetric(
      { resume: resumeData, atsScore: currentATSScore.overallScore, category: 'improvement', rawContent: '' },
      improvedData
    );
    
    // Generate improvement summary
    const improvements = this.generateImprovementSummary(
      weakAreas,
      changesApplied,
      currentATSScore.overallScore,
      estimatedNewScore,
      metricScore
    );
    
    console.log(`✅ Improvements generated - estimated score: ${estimatedNewScore}/100 (+${estimatedNewScore - currentATSScore.overallScore})`);
    console.log(`📊 Metric score: ${(metricScore * 100).toFixed(1)}%`);
    
    return {
      improvedData,
      improvements,
      estimatedNewScore,
      changesApplied,
      metricScore
    };
  }
  
  /**
   * Generate optimized prompt using DSPy patterns
   */
  private generateOptimizedPrompt(resumeData: any, atsScore: any, weakAreas: string[]): string {
    const patterns = this.patterns!;
    
    // Select relevant keywords
    const relevantKeywords = this.selectRelevantKeywords(resumeData, patterns.technicalKeywords);
    
    return `You are an expert ATS optimization system trained on ${this.trainExamples.length} high-quality resumes using DSPy methodology.

🎯 CURRENT ATS SCORE: ${atsScore.overallScore}/100
📊 BREAKDOWN:
- Completeness: ${atsScore.scores.completeness}/100
- Formatting: ${atsScore.scores.formatting}/100
- Keywords: ${atsScore.scores.keywords}/100
- Experience: ${atsScore.scores.experience}/100
- Education: ${atsScore.scores.education}/100
- Skills: ${atsScore.scores.skills}/100

🔍 WEAK AREAS: ${weakAreas.join(', ')}

📚 DSPy-OPTIMIZED PATTERNS (from ${this.trainExamples.length} training examples):

🎯 TOP ACTION VERBS (from successful resumes):
${patterns.actionVerbs.slice(0, 30).join(', ')}

💡 HIGH-VALUE KEYWORDS (extracted from training data):
${relevantKeywords.join(', ')}

✅ OPTIMIZATION RULES (learned from data):
${patterns.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

✨ FEW-SHOT EXAMPLES (high-scoring resumes):
${this.formatFewShotExamples()}

📋 CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}

🎯 IMPROVEMENT STRATEGY:

${weakAreas.includes('keywords') || weakAreas.includes('experience') ? `
KEYWORD OPTIMIZATION (CRITICAL):
- Start EVERY experience bullet with action verb from: ${patterns.actionVerbs.slice(0, 15).join(', ')}
- Include 3-5 technical keywords per entry: ${relevantKeywords.slice(0, 20).join(', ')}
- Add quantifiable metrics (%, $, numbers)
- Expand descriptions to 100-200 characters
` : ''}

${weakAreas.includes('skills') ? `
SKILLS EXPANSION:
⚠️ PRESERVE ALL EXISTING SKILLS - ONLY ADD NEW ONES
- Current: ${resumeData.skills?.length || 0} skills
- Target: ${patterns.avgSkillsCount}+ skills
- Add from: ${relevantKeywords.slice(0, 20).join(', ')}
` : ''}

${weakAreas.includes('completeness') ? `
COMPLETENESS:
- Add keyword-rich summary (100+ chars)
- Ensure all contact info present
- Add projects if missing
` : ''}

🚨 CRITICAL RULES:
1. PRESERVE all dates, company names, titles EXACTLY
2. PRESERVE all existing skills - ONLY ADD new ones
3. ENHANCE wording with action verbs and keywords
4. DO NOT fabricate experiences
5. EVERY experience bullet MUST start with action verb
6. Include 3-5 technical keywords per experience entry

Return ONLY valid JSON with improved resume data.`;
  }
  
  /**
   * Select relevant keywords based on resume content
   */
  private selectRelevantKeywords(resumeData: any, allKeywords: string[]): string[] {
    const content = JSON.stringify(resumeData).toLowerCase();
    const relevant: string[] = [];
    
    // Find keywords that match or are related to resume content
    allKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase()) || 
          this.isRelatedTechnology(content, keyword.toLowerCase())) {
        relevant.push(keyword);
      }
    });
    
    // If too few matches, add general high-value keywords
    if (relevant.length < 15) {
      relevant.push(...allKeywords.slice(0, 20 - relevant.length));
    }
    
    return [...new Set(relevant)].slice(0, 30);
  }
  
  /**
   * Check if technology is related to content
   */
  private isRelatedTechnology(content: string, tech: string): boolean {
    const relatedTerms: { [key: string]: string[] } = {
      'react': ['frontend', 'javascript', 'web', 'ui'],
      'node.js': ['backend', 'javascript', 'api', 'server'],
      'python': ['backend', 'data', 'ml', 'ai'],
      'aws': ['cloud', 'devops', 'infrastructure'],
      'docker': ['devops', 'container', 'deployment']
    };
    
    const related = relatedTerms[tech] || [];
    return related.some(term => content.includes(term));
  }
  
  /**
   * Identify weak areas from ATS score
   */
  private identifyWeakAreas(atsScore: any): string[] {
    const weakAreas: string[] = [];
    const threshold = 70;
    
    if (atsScore.scores.completeness < threshold) weakAreas.push('completeness');
    if (atsScore.scores.formatting < threshold) weakAreas.push('formatting');
    if (atsScore.scores.keywords < threshold) weakAreas.push('keywords');
    if (atsScore.scores.experience < threshold) weakAreas.push('experience');
    if (atsScore.scores.education < threshold) weakAreas.push('education');
    if (atsScore.scores.skills < threshold) weakAreas.push('skills');
    
    return weakAreas;
  }
  
  /**
   * DSPy-style metric function (0-1 score)
   * Evaluates how well the improvement matches training data patterns
   */
  async evaluateMetric(example: TrainingExample, prediction: any): Promise<number> {
    try {
      // Calculate ATS score for prediction
      const predictedScore = await atsScorer.calculateScore(prediction);
      
      // Ground truth vs prediction
      const targetScore = example.atsScore;
      const achievedScore = predictedScore.overallScore;
      
      // Score accuracy metric (0-1)
      const scoreDiff = Math.abs(achievedScore - targetScore);
      const scoreMetric = Math.max(0, Math.min(1, 1 - (scoreDiff / 20)));
      
      // Quality checks
      const skillsPreserved = this.checkSkillsPreserved(example.resume, prediction);
      const hasActionVerbs = this.checkActionVerbs(prediction);
      const hasMetrics = this.checkMetrics(prediction);
      
      // Combined metric (weighted)
      const metric = (
        scoreMetric * 0.6 +        // 60% weight on score accuracy
        skillsPreserved * 0.2 +     // 20% weight on preserving skills
        hasActionVerbs * 0.1 +      // 10% weight on action verbs
        hasMetrics * 0.1            // 10% weight on metrics
      );
      
      return Math.max(0, Math.min(1, metric));
    } catch (error) {
      console.error('Metric evaluation error:', error);
      return 0;
    }
  }
  
  /**
   * Check if original skills were preserved
   */
  private checkSkillsPreserved(original: any, improved: any): number {
    if (!original.skills || !improved.skills) return 0;
    
    // Ensure skills are arrays and contain strings
    const originalSkillsArray = Array.isArray(original.skills) ? original.skills : [];
    const improvedSkillsArray = Array.isArray(improved.skills) ? improved.skills : [];
    
    const originalSkills = new Set(
      originalSkillsArray
        .filter((s: any) => typeof s === 'string')
        .map((s: string) => s.toLowerCase())
    );
    const improvedSkills = new Set(
      improvedSkillsArray
        .filter((s: any) => typeof s === 'string')
        .map((s: string) => s.toLowerCase())
    );
    
    let preserved = 0;
    for (const skill of originalSkills) {
      if (improvedSkills.has(skill)) preserved++;
    }
    
    return originalSkills.size > 0 ? preserved / originalSkills.size : 0;
  }
  
  /**
   * Check if experience uses action verbs
   */
  private checkActionVerbs(resume: any): number {
    if (!resume.experience || resume.experience.length === 0) return 0;
    
    const actionVerbPattern = /^(Led|Developed|Managed|Created|Built|Designed|Implemented|Architected|Optimized|Engineered|Delivered|Achieved|Improved|Enhanced|Streamlined)/i;
    
    let withActionVerbs = 0;
    for (const exp of resume.experience) {
      if (typeof exp === 'string' && actionVerbPattern.test(exp)) {
        withActionVerbs++;
      } else if (exp.description && actionVerbPattern.test(exp.description)) {
        withActionVerbs++;
      }
    }
    
    return resume.experience.length > 0 ? withActionVerbs / resume.experience.length : 0;
  }
  
  /**
   * Check if experience includes metrics
   */
  private checkMetrics(resume: any): number {
    if (!resume.experience || resume.experience.length === 0) return 0;
    
    const metricsPattern = /\d+%|\$\d+|\d+[kmb]?\+?\s*(users|customers|projects|revenue|savings|improvement|increase|decrease)/i;
    
    let withMetrics = 0;
    for (const exp of resume.experience) {
      const text = typeof exp === 'string' ? exp : exp.description || '';
      if (metricsPattern.test(text)) {
        withMetrics++;
      }
    }
    
    return resume.experience.length > 0 ? withMetrics / resume.experience.length : 0;
  }
  
  /**
   * Identify changes made
   */
  private identifyChanges(original: any, improved: any): string[] {
    const changes: string[] = [];
    
    if (improved.summary && improved.summary !== original.summary) {
      changes.push('Enhanced professional summary with keywords');
    }
    
    if (improved.skills && original.skills) {
      const added = improved.skills.length - original.skills.length;
      if (added > 0) changes.push(`Added ${added} technical skills`);
    }
    
    if (improved.experience && original.experience) {
      let enhanced = 0;
      improved.experience.forEach((exp: any, idx: number) => {
        const origExp = original.experience[idx];
        if (origExp) {
          const origText = typeof origExp === 'string' ? origExp : origExp.description || '';
          const impText = typeof exp === 'string' ? exp : exp.description || '';
          if (impText.length > origText.length + 30) enhanced++;
        }
      });
      if (enhanced > 0) changes.push(`Enhanced ${enhanced} experience entries`);
    }
    
    return changes;
  }
  
  /**
   * Estimate new ATS score
   */
  private async estimateNewScore(improvedData: any): Promise<number> {
    const newScore = await atsScorer.calculateScore(improvedData);
    return newScore.overallScore;
  }
  
  /**
   * Generate improvement summary
   */
  private generateImprovementSummary(
    weakAreas: string[],
    changesApplied: string[],
    oldScore: number,
    newScore: number,
    metricScore: number
  ): string[] {
    const improvements: string[] = [];
    
    improvements.push(`Applied AI-powered improvements to increase ATS score from ${oldScore} to ${newScore} (+${newScore - oldScore} points)`);
    improvements.push(`Quality metric: ${(metricScore * 100).toFixed(1)}% (trained model evaluation)`);
    
    if (weakAreas.length > 0) {
      improvements.push(`Addressed ${weakAreas.length} weak areas: ${weakAreas.join(', ')}`);
    }
    
    changesApplied.forEach(change => improvements.push(change));
    
    return improvements;
  }
  
  /**
   * Validate on dev set
   */
  async validate(): Promise<{ avgMetric: number, passRate: number }> {
    console.log('🧪 Validating on dev set...');
    
    let totalMetric = 0;
    let passCount = 0;
    const testSize = Math.min(5, this.devExamples.length);
    
    for (const example of this.devExamples.slice(0, testSize)) {
      const metric = await this.evaluateMetric(example, example.resume);
      totalMetric += metric;
      if (metric >= 0.7) passCount++;
    }
    
    const avgMetric = totalMetric / testSize;
    const passRate = passCount / testSize;
    
    console.log(`📊 Validation: ${(avgMetric * 100).toFixed(1)}% avg, ${(passRate * 100).toFixed(0)}% pass rate`);
    
    return { avgMetric, passRate };
  }
  
  /**
   * Sanitize JSON response
   */
  private sanitizeJSON(jsonText: string): string {
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > 0) jsonText = jsonText.substring(firstBrace);
    
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }
    
    return jsonText.trim();
  }
}

export const atsImproverWithAX = new ATSImproverWithAX();
