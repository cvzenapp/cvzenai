/**
 * AX LLM Integration with DSPy Training System
 * 
 * This module integrates the @ax-llm/ax library with our DSPy-style training approach.
 * AX provides type-safe signatures, few-shot learning, and prompt optimization.
 * 
 * Key Concepts:
 * - Signatures: Type-safe input/output definitions using f() builder
 * - Few-shot learning: setExamples() to provide training examples
 * - Generators: ax() creates optimized LLM modules
 * - Metric functions: Evaluate predictions (0-1 score)
 * 
 * Integration with DSPy:
 * 1. Load training data from trainingDataLoader
 * 2. Create AX signature for resume improvement
 * 3. Set few-shot examples from training data
 * 4. Use metric function to evaluate improvements
 * 5. Optimize prompts based on metric scores
 */

import { trainingDataLoader, TrainingExample } from './trainingDataLoader.js';
import { atsScorer } from './atsScorer.js';

/**
 * AX-powered Resume Improver
 * Uses AX LLM library for type-safe, optimized resume improvements
 * 
 * Note: This is a conceptual integration showing how AX would work.
 * Actual implementation requires @ax-llm/ax package installation.
 * 
 * Example usage with AX:
 * 
 * ```typescript
 * import { ax, ai, f } from '@ax-llm/ax';
 * 
 * // Create AI provider
 * const llm = ai({ 
 *   name: 'groq', 
 *   apiKey: process.env.GROQ_API_KEY 
 * });
 * 
 * // Define signature
 * const improver = ax(
 *   f()
 *     .input('resumeData', f.json('Current resume data'))
 *     .input('weakAreas', f.string().array('Areas to improve'))
 *     .input('currentScore', f.number('Current ATS score'))
 *     .output('improvedData', f.json('Improved resume data'))
 *     .output('improvements', f.string().array('List of improvements made'))
 *     .build()
 * );
 * 
 * // Set few-shot examples from training data
 * improver.setExamples([
 *   {
 *     resumeData: { skills: ['Python'], experience: ['Worked on projects'] },
 *     weakAreas: ['keywords', 'experience'],
 *     currentScore: 65,
 *     improvedData: { skills: ['Python', 'Django', 'React'], experience: ['Developed...'] },
 *     improvements: ['Added 2 skills', 'Enhanced experience with action verbs']
 *   }
 * ]);
 * 
 * // Use the generator
 * const result = await improver.forward(llm, {
 *   resumeData: currentResume,
 *   weakAreas: ['keywords'],
 *   currentScore: 70
 * });
 * ```
 */

export interface AXResumeImproverConfig {
  trainExamples: TrainingExample[];
  devExamples: TrainingExample[];
}

export class AXResumeImprover {
  private config: AXResumeImproverConfig | null = null;
  
  /**
   * Initialize with training data
   */
  async initialize() {
    console.log('🎯 Initializing AX LLM integration...');
    
    // Load training data
    const examples = await trainingDataLoader.loadDataset();
    const split = trainingDataLoader.getTrainDevSplit(0.8);
    
    this.config = {
      trainExamples: split.train,
      devExamples: split.dev
    };
    
    console.log(`✅ AX integration ready with ${split.train.length} training examples`);
  }
  
  /**
   * Convert training examples to AX few-shot format
   * 
   * AX expects examples with both input and output fields matching the signature
   */
  convertToAXExamples(examples: TrainingExample[]): any[] {
    return examples.slice(0, 5).map(ex => ({
      // Inputs
      resumeData: ex.resume,
      weakAreas: this.identifyWeakAreas(ex.atsScore),
      currentScore: Math.max(60, ex.atsScore - 15), // Simulate "before" score
      
      // Outputs (what we want the LLM to produce)
      improvedData: ex.resume, // The high-quality resume is our target
      improvements: [
        `Achieved ${ex.atsScore}/100 ATS score`,
        `Included ${ex.resume.skills.length} technical skills`,
        `Used action verbs in ${ex.resume.experience.length} experience entries`
      ]
    }));
  }
  
  /**
   * Identify weak areas from score (helper for examples)
   */
  private identifyWeakAreas(score: number): string[] {
    const areas: string[] = [];
    if (score < 85) areas.push('keywords');
    if (score < 80) areas.push('experience');
    if (score < 75) areas.push('skills');
    return areas;
  }
  
  /**
   * DSPy-style metric function (0-1 score)
   * 
   * This is the key function DSPy uses to optimize prompts:
   * - example: Ground truth from training data
   * - prediction: What the LLM generated
   * - return: 0-1 score (1.0 = perfect, 0.0 = failure)
   * 
   * DSPy will adjust prompts to maximize this score
   */
  async evaluateMetric(example: TrainingExample, prediction: any): Promise<number> {
    try {
      // Calculate ATS score for the prediction
      const predictedScore = await atsScorer.calculateScore(prediction.improvedData || prediction);
      
      // Ground truth: example.atsScore (target from dataset)
      const targetScore = example.atsScore;
      const achievedScore = predictedScore.overallScore;
      
      // Calculate normalized metric (0-1)
      // Perfect match = 1.0, 20+ point diff = 0.0
      const scoreDiff = Math.abs(achievedScore - targetScore);
      const scoreMetric = Math.max(0, Math.min(1, 1 - (scoreDiff / 20)));
      
      // Additional quality checks
      const skillsPreserved = this.checkSkillsPreserved(example.resume, prediction.improvedData || prediction);
      const hasActionVerbs = this.checkActionVerbs(prediction.improvedData || prediction);
      const hasMetrics = this.checkMetrics(prediction.improvedData || prediction);
      
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
    
    const originalSkills = new Set(original.skills.map((s: string) => s.toLowerCase()));
    const improvedSkills = new Set(improved.skills.map((s: string) => s.toLowerCase()));
    
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
    
    const actionVerbPattern = /^(Led|Developed|Managed|Created|Built|Designed|Implemented|Architected|Optimized|Engineered|Delivered|Achieved|Improved|Enhanced|Streamlined|Coordinated|Directed|Established|Executed|Facilitated|Generated|Increased|Launched|Maintained|Operated|Performed|Produced|Reduced|Resolved|Spearheaded|Supervised|Transformed|Upgraded)/i;
    
    let withActionVerbs = 0;
    for (const exp of resume.experience) {
      if (typeof exp === 'string' && actionVerbPattern.test(exp)) {
        withActionVerbs++;
      }
    }
    
    return resume.experience.length > 0 ? withActionVerbs / resume.experience.length : 0;
  }
  
  /**
   * Check if experience includes quantifiable metrics
   */
  private checkMetrics(resume: any): number {
    if (!resume.experience || resume.experience.length === 0) return 0;
    
    const metricsPattern = /\d+%|\$\d+|\d+[kmb]?\+?\s*(users|customers|projects|revenue|savings|improvement|increase|decrease|reduction)/i;
    
    let withMetrics = 0;
    for (const exp of resume.experience) {
      if (typeof exp === 'string' && metricsPattern.test(exp)) {
        withMetrics++;
      }
    }
    
    return resume.experience.length > 0 ? withMetrics / resume.experience.length : 0;
  }
  
  /**
   * Get training examples for AX
   */
  getTrainingExamples(): any[] {
    if (!this.config) {
      throw new Error('Not initialized. Call initialize() first.');
    }
    return this.convertToAXExamples(this.config.trainExamples);
  }
  
  /**
   * Get dev examples for validation
   */
  getDevExamples(): TrainingExample[] {
    if (!this.config) {
      throw new Error('Not initialized. Call initialize() first.');
    }
    return this.config.devExamples;
  }
}

export const axResumeImprover = new AXResumeImprover();

/**
 * INTEGRATION GUIDE:
 * 
 * To fully integrate AX LLM with this system:
 * 
 * 1. Install AX: npm install @ax-llm/ax
 * 
 * 2. Create AX signature in atsImprover.ts:
 *    ```typescript
 *    import { ax, ai, f } from '@ax-llm/ax';
 *    
 *    const llm = ai({ name: 'groq', apiKey: process.env.GROQ_API_KEY });
 *    
 *    const improver = ax(
 *      f()
 *        .input('resumeData', f.json())
 *        .input('weakAreas', f.string().array())
 *        .output('improvedData', f.json())
 *        .build()
 *    );
 *    ```
 * 
 * 3. Set few-shot examples:
 *    ```typescript
 *    const examples = await axResumeImprover.getTrainingExamples();
 *    improver.setExamples(examples);
 *    ```
 * 
 * 4. Use in improvement flow:
 *    ```typescript
 *    const result = await improver.forward(llm, {
 *      resumeData: currentResume,
 *      weakAreas: ['keywords', 'experience']
 *    });
 *    ```
 * 
 * 5. Evaluate with metric:
 *    ```typescript
 *    const metric = await axResumeImprover.evaluateMetric(
 *      trainingExample,
 *      result.improvedData
 *    );
 *    console.log(`Quality score: ${(metric * 100).toFixed(1)}%`);
 *    ```
 * 
 * This creates a complete DSPy-style training loop with AX's type safety!
 */
