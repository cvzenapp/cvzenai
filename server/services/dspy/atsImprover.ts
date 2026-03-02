import { groqService } from '../groqService.js';
import { atsScorer } from './atsScorer.js';
import { promptOptimizer } from './promptOptimizer.js';

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
   * Improve resume based on ATS score analysis
   */
  async improveResume(resumeData: any, currentATSScore: any): Promise<{
    improvedData: any;
    improvements: string[];
    estimatedNewScore: number;
    changesApplied: string[];
  }> {
    await this.initialize();

    console.log('🎯 Analyzing ATS weaknesses and generating improvements...');
    console.log('📊 Current ATS Score:', currentATSScore.overallScore);

    // Identify weak areas
    const weakAreas = this.identifyWeakAreas(currentATSScore);
    console.log('🔍 Weak areas identified:', weakAreas);

    // Generate targeted improvements using DSPy approach
    const prompt = this.generateImprovementPrompt(resumeData, currentATSScore, weakAreas);
    
    const response = await groqService.generateResponse({
      type: 'resume_optimization',
      content: prompt
    });

    if (!response.success || !response.response) {
      throw new Error('Failed to generate ATS improvements');
    }

    // Parse improved data
    const improvedData = JSON.parse(this.sanitizeJSON(response.response));
    
    // Calculate what changed
    const changesApplied = this.identifyChanges(resumeData, improvedData);
    
    // Estimate new score
    const estimatedNewScore = await this.estimateNewScore(improvedData);
    
    // Generate improvement summary
    const improvements = this.generateImprovementSummary(weakAreas, changesApplied, currentATSScore.overallScore, estimatedNewScore);

    console.log(`✅ Resume improved - estimated new score: ${estimatedNewScore}/100 (+${estimatedNewScore - currentATSScore.overallScore})`);

    return {
      improvedData,
      improvements,
      estimatedNewScore,
      changesApplied
    };
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
   * Generate improvement prompt using DSPy-optimized patterns from training data
   */
  private generateImprovementPrompt(resumeData: any, atsScore: any, weakAreas: string[]): string {
    if (!this.trainingData) {
      throw new Error('Training data not loaded. Call initialize() first.');
    }
    
    const patterns = this.trainingData;
    
    // Select relevant keywords based on resume content
    const relevantKeywords = this.selectRelevantKeywords(resumeData, patterns);
    
    // Create few-shot examples from training data
    const fewShotExamples = patterns.fewShotExamples || '';
    
    return `You are an expert ATS optimization system trained on real resume dataset. Your task is to SIGNIFICANTLY IMPROVE this resume's ATS score using proven patterns.

🎯 CURRENT ATS SCORE: ${atsScore.overallScore}/100
📊 BREAKDOWN:
- Completeness: ${atsScore.scores.completeness}/100
- Formatting: ${atsScore.scores.formatting}/100  
- Keywords: ${atsScore.scores.keywords}/100
- Experience: ${atsScore.scores.experience}/100
- Education: ${atsScore.scores.education}/100
- Skills: ${atsScore.scores.skills}/100

🔍 WEAK AREAS TO FIX: ${weakAreas.join(', ')}

📚 DSPy-OPTIMIZED KNOWLEDGE BASE (from training data):

${weakAreas.includes('keywords') || weakAreas.includes('experience') ? `
🎯 TOP ACTION VERBS (from successful resumes):
${patterns.actionVerbs.slice(0, 30).join(', ')}

💡 HIGH-VALUE TECHNICAL KEYWORDS (extracted from training data):
${relevantKeywords.join(', ')}

✨ FEW-SHOT EXAMPLES FROM TRAINING DATA:
${fewShotExamples}
` : ''}

📋 CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

🎯 IMPROVEMENT STRATEGY (DSPy-optimized rules):

${patterns.rules.map((rule: string, i: number) => `${i + 1}. ${rule}`).join('\n')}

${weakAreas.includes('completeness') ? `
COMPLETENESS (Target: 90+/100):
   - Add keyword-rich professional summary (3-4 sentences)
   - Include all contact info (email, phone, LinkedIn, GitHub if applicable)
   - Ensure every section has substantial content
   - Add projects section if missing
` : ''}

${weakAreas.includes('keywords') || weakAreas.includes('experience') ? `
KEYWORD OPTIMIZATION (CRITICAL - Target: 85+/100):
   
   ⚠️ THIS IS THE #1 PRIORITY - MAXIMIZE KEYWORD DENSITY ⚠️
   
   TRANSFORMATION FORMULA:
   [Strong Action Verb] + [What You Did] + [3-5 Technologies] + [Quantifiable Metric] + [Business Impact]
   
   RULES FOR EVERY EXPERIENCE BULLET:
   ✅ Start with action verb from: ${patterns.actionVerbs.slice(0, 15).join(', ')}
   ✅ Mention 3-5 specific technologies: ${relevantKeywords.slice(0, 20).join(', ')}
   ✅ Include quantifiable metrics (%, $, numbers, scale)
   ✅ Add business impact/value
   ✅ Use industry buzzwords naturally
   ✅ Expand to 100-200 characters for maximum keyword density
   
   APPLY TO EVERY SINGLE EXPERIENCE ENTRY!
` : ''}

${weakAreas.includes('skills') ? `
SKILLS EXPANSION (Target: 90+/100):
   ⚠️ CRITICAL: PRESERVE ALL EXISTING SKILLS EXACTLY ⚠️
   
   - KEEP every existing skill name unchanged
   - ADD new related skills from: ${relevantKeywords.slice(0, 30).join(', ')}
   - Target: 15-25 total skills
   - Include mix of: languages, frameworks, tools, methodologies
   - DO NOT replace "Python" with "Programming Languages"
   - DO NOT generalize or categorize existing skills
` : ''}

${weakAreas.includes('education') ? `
EDUCATION ENHANCEMENT (Target: 85+/100):
   - Add GPA if 3.0+ (format: "GPA: 3.X/4.0")
   - Include relevant coursework (3-5 courses)
   - Add honors/achievements (Dean's List, scholarships, etc.)
   - Ensure graduation dates are present
` : ''}

🚨 CRITICAL RULES - MUST FOLLOW:
1. ✅ PRESERVE all dates exactly (startDate, endDate, graduationDate)
2. ✅ PRESERVE company names, job titles, institution names
3. ✅ PRESERVE all existing skill names - only ADD new ones
4. ✅ DO NOT fabricate experiences or achievements
5. ✅ DO NOT change the meaning of existing content
6. ✅ DO enhance wording with action verbs and keywords
7. ✅ DO add metrics to existing achievements (if reasonable)
8. ✅ DO inject technical keywords throughout
9. ✅ EVERY experience bullet MUST start with an action verb
10. ✅ EVERY experience entry MUST mention 3-5 technologies

🎯 SUCCESS CRITERIA:
- Every experience bullet starts with strong action verb
- 3-5 technical keywords per experience entry
- Quantifiable metrics in 80%+ of bullets
- Skills list has 15-25 items
- Professional summary with 5+ keywords
- Overall keyword density increased by 50%+

Return ONLY valid JSON with the improved resume data. Focus improvements on: ${weakAreas.join(', ')}.`;
  }

  /**
   * Select relevant keywords based on resume content
   */
  private selectRelevantKeywords(resumeData: any, patterns: any): string[] {
    const content = JSON.stringify(resumeData).toLowerCase();
    const keywords: string[] = [];
    
    // Check which technical categories are relevant
    Object.entries(patterns.technicalKeywords).forEach(([category, terms]: [string, any]) => {
      const relevantTerms = terms.filter((term: string) => 
        content.includes(term.toLowerCase()) || 
        this.isRelatedTechnology(content, term.toLowerCase())
      );
      keywords.push(...relevantTerms);
    });
    
    // If no matches, include general high-value keywords
    if (keywords.length < 10) {
      keywords.push(
        ...patterns.technicalKeywords.cloud.slice(0, 5),
        ...patterns.technicalKeywords.devops.slice(0, 5),
        ...patterns.technicalKeywords.methodologies
      );
    }
    
    return [...new Set(keywords)].slice(0, 40);
  }

  /**
   * Check if technology is related to content
   */
  private isRelatedTechnology(content: string, tech: string): boolean {
    const relatedTerms: { [key: string]: string[] } = {
      'react': ['frontend', 'javascript', 'web', 'ui'],
      'node.js': ['backend', 'javascript', 'api', 'server'],
      'python': ['backend', 'data', 'ml', 'ai', 'script'],
      'aws': ['cloud', 'devops', 'infrastructure'],
      'docker': ['devops', 'container', 'deployment'],
      'kubernetes': ['devops', 'container', 'orchestration']
    };
    
    const related = relatedTerms[tech] || [];
    return related.some(term => content.includes(term));
  }

  private generatePrompt(resumeData: any, atsScore: any, weakAreas: string[], fewShotExamples: string): string {
    return `You are an expert ATS optimization specialist. Analyze this resume and provide specific improvements.

- Skills: ${atsScore.scores.skills}/100

IDENTIFIED WEAK AREAS: ${weakAreas.join(', ')}

CURRENT SUGGESTIONS:
${atsScore.suggestions.map((s: string) => `- ${s}`).join('\n')}

HIGH-QUALITY ATS EXAMPLES FROM DATASET:
${fewShotExamples}

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

IMPROVEMENT STRATEGY:

${weakAreas.includes('completeness') ? `
1. COMPLETENESS IMPROVEMENTS:
   - Add missing sections (summary, objective, projects)
   - Ensure all contact information is complete
   - Add LinkedIn/GitHub if missing
   - SUMMARY MUST BE KEYWORD-RICH: Include role title, years of experience, top 3-5 technical skills, and key achievement
   - Example: "Senior Full-Stack Developer with 5+ years building scalable web applications using React, Node.js, and AWS. Specialized in microservices architecture, CI/CD automation, and cloud infrastructure. Proven track record of delivering high-performance solutions serving 1M+ users."
` : ''}

${weakAreas.includes('formatting') ? `
2. FORMATTING IMPROVEMENTS:
   - Standardize all dates to YYYY-MM format
   - Add quantifiable metrics (%, $, numbers) to achievements
   - Ensure consistent structure across all sections
` : ''}

${weakAreas.includes('keywords') ? `
3. KEYWORD OPTIMIZATION (CRITICAL FOR ATS):
   ⚠️ THIS IS THE MOST IMPORTANT SECTION - MAXIMIZE KEYWORD DENSITY ⚠️
   
   ACTION VERBS - Use these EXTENSIVELY in every experience description:
   • Leadership: Led, Managed, Directed, Coordinated, Supervised, Mentored, Guided, Facilitated
   • Development: Developed, Created, Built, Designed, Engineered, Architected, Implemented, Programmed
   • Improvement: Optimized, Enhanced, Improved, Streamlined, Upgraded, Modernized, Refactored, Automated
   • Achievement: Achieved, Delivered, Accomplished, Exceeded, Surpassed, Attained, Completed, Executed
   • Analysis: Analyzed, Evaluated, Assessed, Investigated, Researched, Diagnosed, Identified, Resolved
   • Growth: Increased, Expanded, Grew, Scaled, Boosted, Elevated, Amplified, Maximized
   • Efficiency: Reduced, Decreased, Minimized, Eliminated, Consolidated, Simplified, Accelerated
   
   TECHNICAL KEYWORDS - Inject these throughout:
   • Cloud: AWS, Azure, GCP, Cloud Computing, Serverless, Microservices, Kubernetes, Docker, CI/CD
   • Data: Big Data, Data Analytics, Machine Learning, AI, Data Science, ETL, Data Pipeline, SQL, NoSQL
   • Web: Full-Stack, Frontend, Backend, REST API, GraphQL, Responsive Design, SPA, PWA, Web Services
   • DevOps: DevOps, Agile, Scrum, Jenkins, GitLab, Terraform, Infrastructure as Code, Monitoring
   • Security: Security, Authentication, Authorization, Encryption, Compliance, GDPR, OAuth, SSL/TLS
   
   INDUSTRY BUZZWORDS - Add to summary and descriptions:
   • Digital Transformation, Innovation, Scalability, Performance Optimization, Best Practices
   • Cross-functional Collaboration, Stakeholder Management, Agile Methodologies, Continuous Improvement
   • Enterprise Solutions, Production Environment, High Availability, Disaster Recovery
   
   TRANSFORMATION EXAMPLES:
   ❌ BEFORE: "Worked on website"
   ✅ AFTER: "Architected and developed responsive web application using React and Node.js, implementing RESTful APIs and optimizing performance to serve 10,000+ concurrent users with 99.9% uptime, resulting in 40% faster load times and 25% increase in user engagement"
   
   ❌ BEFORE: "Managed team"
   ✅ AFTER: "Led cross-functional team of 8 engineers in agile environment, mentoring junior developers and coordinating sprint planning, resulting in 30% faster delivery cycles and 95% on-time project completion rate"
   
   ❌ BEFORE: "Fixed bugs"
   ✅ AFTER: "Diagnosed and resolved critical production issues, implementing automated testing and monitoring solutions that reduced bug reports by 60% and improved system reliability to 99.95% uptime"
   
   KEYWORD INJECTION STRATEGY:
   1. Start EVERY experience bullet with a strong action verb
   2. Include 3-5 technical keywords per experience entry
   3. Add industry buzzwords naturally throughout
   4. Mention specific technologies, frameworks, and tools
   5. Include metrics and quantifiable results (%, $, numbers)
   6. Add relevant certifications if applicable to the role
   7. Use synonyms to avoid repetition (e.g., "developed" → "engineered" → "built")
` : ''}

${weakAreas.includes('experience') ? `
4. EXPERIENCE ENHANCEMENT (KEYWORD-FOCUSED):
   - Transform EVERY bullet point to be keyword-rich and ATS-optimized
   - Start each bullet with a powerful action verb (Led, Developed, Architected, Optimized, etc.)
   - Inject 3-5 technical keywords per entry (technologies, frameworks, methodologies)
   - Add industry buzzwords naturally (scalability, performance, automation, optimization)
   - Include quantifiable metrics (%, $, numbers, timeframes)
   - Expand descriptions to 100-200 characters for maximum keyword density
   - Add impact statements with business value
   
   TRANSFORMATION TEMPLATE:
   [Action Verb] + [What You Did] + [Technologies Used] + [Quantifiable Result] + [Business Impact]
   
   Example: "Architected microservices-based e-commerce platform using Node.js, React, and AWS Lambda, implementing CI/CD pipelines with Jenkins and Docker, resulting in 50% faster deployment cycles, 99.9% uptime, and $2M annual cost savings through infrastructure optimization"
` : ''}

${weakAreas.includes('education') ? `
5. EDUCATION ENHANCEMENT:
   - Add GPA if 3.0 or higher
   - Include relevant coursework
   - Add academic achievements (Dean's List, honors, scholarships)
   - Include graduation dates
` : ''}

${weakAreas.includes('skills') ? `
6. SKILLS EXPANSION:
   ⚠️ CRITICAL: PRESERVE ALL EXISTING SKILLS EXACTLY ⚠️
   
   - KEEP every single existing skill name EXACTLY as written
   - If skills are ["Python", "Django", "JavaScript"], they MUST remain ["Python", "Django", "JavaScript"]
   - ONLY ADD new related skills to the existing list
   - DO NOT replace "Python" with "Programming Languages"
   - DO NOT replace "Django" with "Web Frameworks"
   - DO NOT replace "PostgreSQL" with "Databases"
   - DO NOT generalize or categorize existing skills
   - Preserve the exact data structure (array of strings OR array of objects with category/name)
   
   CORRECT ✅:
   Original: ["Python", "JavaScript", "Django", "React"]
   Enhanced: ["Python", "JavaScript", "Django", "React", "Node.js", "PostgreSQL", "Git", "Docker"]
   → All original skills kept + new ones added
   
   INCORRECT ❌:
   Original: ["Python", "JavaScript", "Django"]
   Enhanced: ["Programming Languages", "Frameworks", "Databases"]
   → Original skills removed and replaced with categories - ABSOLUTELY WRONG!
   
   INCORRECT ❌:
   Original: ["Python", "Django", "React"]
   Enhanced: ["Python", "Web Development", "Frontend Frameworks"]
   → "Django" and "React" were replaced - WRONG!
` : ''}

CRITICAL RULES - PRESERVE ORIGINAL DATA:
⚠️ SKILLS: Keep ALL existing skill names EXACTLY as they appear - DO NOT generalize or categorize them ⚠️
⚠️ KEYWORDS: MAXIMIZE keyword density in ALL descriptions - this is critical for ATS scoring ⚠️
- ❌ DO NOT change dates (startDate, endDate, graduationDate) - keep them EXACTLY as original
- ❌ DO NOT change company names, institution names, or job titles
- ❌ DO NOT change degree names or fields of study
- ❌ DO NOT fabricate new experiences, jobs, or education entries
- ❌ DO NOT add fake metrics - only enhance wording of existing achievements
- ❌ DO NOT replace specific skills like "Python" with generic categories like "Programming Languages"
- ❌ DO NOT remove any existing skills from the skills array
- ✅ DO enhance descriptions with action verbs while keeping the same meaning
- ✅ DO add relevant keywords and technologies that match existing experience
- ✅ DO improve wording to be more ATS-friendly
- ✅ DO expand skills list by ADDING new related technologies (never removing or replacing existing ones)
- ✅ DO inject technical keywords, industry buzzwords, and action verbs THROUGHOUT the resume
- ✅ DO ensure EVERY experience bullet starts with a strong action verb
- ✅ DO add 3-5 technical keywords to EACH experience entry
- Focus improvements on the identified weak areas: ${weakAreas.join(', ')}

KEYWORD DENSITY CHECKLIST (VERIFY BEFORE RETURNING):
□ Summary contains 5+ technical keywords and industry terms
□ Every experience description starts with an action verb
□ Each experience entry mentions 3-5 specific technologies
□ Descriptions include industry buzzwords (scalability, optimization, automation, etc.)
□ Quantifiable metrics are present (%, $, numbers)
□ Skills list has 10-15+ items with specific technologies

ENHANCEMENT EXAMPLES:

CORRECT ✅:
Original: "Worked on website" at "Company X" (2020-2022)
Enhanced: "Developed responsive website using React and Node.js" at "Company X" (2020-2022)
→ Same company, same dates, same work - just better wording

INCORRECT ❌:
Original: "Software Engineer" at "Company X" (2020-2022)
Enhanced: "Senior Software Engineer" at "Company X" (2019-2023)
→ Changed title and dates - THIS IS WRONG!

PRESERVE EXACTLY:
- All dates (startDate, endDate, current, graduationDate)
- All company names
- All institution names  
- All job titles/positions
- All degree names
- All project names
- Number of entries (don't add or remove experiences/education)

RETURN FORMAT (JSON only, no explanations):
{
  "personalInfo": { 
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin": "...",
    "github": "..."
  },
  "summary": "Enhanced 2-3 sentence summary with keywords (150-200 chars)",
  "objective": "Professional career objective (if missing or weak)",
  "skills": ["⚠️ MUST include ALL original skills EXACTLY + new additions. Example: if original was ['Python', 'Django'], result must be ['Python', 'Django', 'Flask', 'FastAPI'] - NEVER ['Programming Languages', 'Frameworks']"],
  "experience": [
    {
      "company": "SAME as original",
      "position": "SAME as original",
      "startDate": "SAME as original",
      "endDate": "SAME as original",
      "current": SAME as original,
      "description": "ENHANCED with action verbs and keywords",
      "achievements": ["ENHANCED with quantifiable metrics like '40% improvement' or '$500K revenue'"],
      "technologies": ["EXPANDED list of relevant technologies"]
    }
  ],
  "education": [
    {
      "institution": "SAME as original",
      "degree": "SAME as original",
      "field": "SAME as original",
      "startDate": "SAME as original",
      "endDate": "SAME as original",
      "gpa": "ADD if applicable",
      "achievements": ["ADD academic honors if applicable"]
    }
  ],
  "projects": [ "ENHANCED or ADDED if missing" ],
  "certifications": [ "SAME or ADDED if relevant" ],
  "languages": [ "SAME as original" ]
}

Return ONLY the JSON object. No markdown, no explanations, no preamble.`;
  }

  /**
   * Identify what changes were made
   */
  private identifyChanges(original: any, improved: any): string[] {
    const changes: string[] = [];

    // Check summary changes
    if (improved.summary && improved.summary !== original.summary) {
      changes.push('Enhanced professional summary with industry keywords');
    }

    // Check objective changes
    if (improved.objective && improved.objective !== original.objective) {
      changes.push('Added/improved career objective statement');
    }

    // Check skills expansion
    if (improved.skills && original.skills) {
      const skillsAdded = improved.skills.length - original.skills.length;
      if (skillsAdded > 0) {
        changes.push(`Added ${skillsAdded} relevant skills`);
      }
    }

    // Check experience improvements
    if (improved.experience && original.experience) {
      let experienceEnhanced = 0;
      improved.experience.forEach((exp: any, idx: number) => {
        const origExp = original.experience[idx];
        if (origExp) {
          const origText = (origExp.description || '') + (origExp.achievements || []).join('');
          const impText = (exp.description || '') + (exp.achievements || []).join('');
          if (impText.length > origText.length + 50) {
            experienceEnhanced++;
          }
        }
      });
      if (experienceEnhanced > 0) {
        changes.push(`Enhanced ${experienceEnhanced} experience entries with metrics and action verbs`);
      }
    }

    // Check education improvements
    if (improved.education && original.education) {
      let educationEnhanced = 0;
      improved.education.forEach((edu: any, idx: number) => {
        const origEdu = original.education[idx];
        if (origEdu && (!origEdu.gpa && edu.gpa)) {
          educationEnhanced++;
        }
      });
      if (educationEnhanced > 0) {
        changes.push(`Added academic details to ${educationEnhanced} education entries`);
      }
    }

    // Check projects
    if (improved.projects && (!original.projects || improved.projects.length > original.projects.length)) {
      changes.push('Added/enhanced project descriptions');
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
    newScore: number
  ): string[] {
    const improvements: string[] = [];

    improvements.push(`Overall ATS score improved from ${oldScore} to ${newScore} (+${newScore - oldScore} points)`);
    
    if (weakAreas.length > 0) {
      improvements.push(`Addressed ${weakAreas.length} weak areas: ${weakAreas.join(', ')}`);
    }

    changesApplied.forEach(change => {
      improvements.push(change);
    });

    return improvements;
  }

  /**
   * Sanitize JSON response
   */
  private sanitizeJSON(jsonText: string): string {
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

    return jsonText.trim();
  }
}

export const atsImprover = new ATSImprover();
