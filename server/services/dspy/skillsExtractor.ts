import { datasetLoader } from './datasetLoader.js';
import { SKILL_CATEGORIES, type SkillCategory } from '../../../shared/skillCategories.js';

/**
 * Skills Extractor - Uses multiple skill datasets to improve extraction accuracy
 */
export class SkillsExtractor {
  private technicalSkills: string[] = [];
  private personalSkills: string[] = [];
  private jobRoleSkills: Map<string, string[]> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load technical skills from skills.csv
      const skillsData = await datasetLoader.loadDataset('06_skills.csv');
      this.technicalSkills = datasetLoader.extractUniqueValues(skillsData, 'skill_name');

      // Load IT job role skills
      const itSkillsData = await datasetLoader.loadDataset('IT_Job_Roles_Skills.csv');
      itSkillsData.forEach((row: any) => {
        const role = row['Job Role'] || row['job_role'];
        const skills = row['Skills'] || row['skills'];
        if (role && skills) {
          const skillList = skills.split(/[,;|]/).map((s: string) => s.trim()).filter((s: string) => s);
          this.jobRoleSkills.set(role, skillList);
          this.technicalSkills.push(...skillList);
        }
      });

      // Load personal/soft skills from person_skills.csv
      const personSkillsData = await datasetLoader.loadDataset('05_person_skills.csv');
      this.personalSkills = datasetLoader.extractUniqueValues(personSkillsData, 'skill_name');

      // Remove duplicates
      this.technicalSkills = [...new Set(this.technicalSkills)];
      this.personalSkills = [...new Set(this.personalSkills)];

      this.initialized = true;
      console.log(`✅ Skills Extractor initialized: ${this.technicalSkills.length} technical, ${this.personalSkills.length} personal`);
    } catch (error) {
      console.error('❌ Failed to initialize SkillsExtractor:', error);
    }
  }

  /**
   * Generate optimized prompt for skills extraction
   */
  generatePrompt(): string {
    // Sample skills for prompt (top 100 most common)
    const sampleTechnical = this.technicalSkills.slice(0, 100).join(', ');
    const samplePersonal = this.personalSkills.slice(0, 50).join(', ');

    return `
SKILLS EXTRACTION GUIDELINES:

TECHNICAL SKILLS (look for these and similar):
${sampleTechnical}

SOFT/PERSONAL SKILLS (look for these and similar):
${samplePersonal}

SKILL CATEGORIES TO RECOGNIZE:
- Programming Languages: JavaScript, Python, Java, C++, TypeScript, etc.
- Frontend: React, Angular, Vue, Next.js, Redux, etc.
- Backend: Node.js, Express, Django, Flask, Spring Boot, etc.
- Databases: MySQL, PostgreSQL, MongoDB, Redis, etc.
- Cloud Platforms: AWS, Azure, GCP, Heroku, etc.
- DevOps: Docker, Kubernetes, Jenkins, CI/CD, Terraform, etc.
- Mobile Development: React Native, Flutter, iOS, Android, etc.
- Data Science & AI: Machine Learning, TensorFlow, PyTorch, Pandas, etc.
- Testing & QA: Jest, Cypress, Selenium, Unit Testing, etc.
- Design & UI/UX: Figma, Sketch, Adobe XD, UI Design, etc.
- Development Tools: Git, GitHub, JIRA, Postman, VS Code, etc.
- Web Technologies: HTML, CSS, REST API, GraphQL, etc.
- Soft Skills: Leadership, Communication, Problem Solving, etc.

EXTRACTION RULES:
1. Extract ALL technical skills (programming languages, frameworks, tools, technologies)
2. Extract soft skills (leadership, communication, problem-solving, etc.)
3. Normalize skill names (e.g., "JavaScript" not "java script", "React.js" not "reactjs")
4. Include skill variations (e.g., "Node.js", "NodeJS", "Node")
5. Look for skills in:
   - Dedicated "Skills" section
   - Experience descriptions (e.g., "Developed using React")
   - Project descriptions
   - Certifications
   - Technologies used in projects
6. Return as flat array of strings (no categories in output - we will categorize them)
7. Extract specific technology names, not generic terms (e.g., "React" not "frontend framework")
8. Include both hard skills and soft skills

IMPORTANT: Each skill will be automatically categorized based on its name, so extract specific skill names.
`;
  }

  /**
   * Validate and enhance extracted skills with categories and proficiency
   * Limits core skills to 6-10 most important skills
   */
  validateSkills(extractedSkills: string[]): any[] {
    console.log(`🎯 [SKILLS VALIDATOR] Processing ${extractedSkills.length} extracted skills...`);
    
    const validated: any[] = [];
    const allKnownSkills = [...this.technicalSkills, ...this.personalSkills].map(s => s.toLowerCase());

    extractedSkills.forEach((skill, index) => {
      const normalized = typeof skill === 'string' ? skill.trim() : '';
      if (!normalized) {
        console.log(`⚠️ [SKILLS VALIDATOR] Skill ${index + 1}: Empty skill, skipping`);
        return;
      }

      // Check if skill is known or similar to known skills
      const lowerSkill = normalized.toLowerCase();
      const isKnown = allKnownSkills.some(known => 
        known === lowerSkill || 
        known.includes(lowerSkill) || 
        lowerSkill.includes(known)
      );

      if (isKnown || normalized.length >= 2) {
        // Create skill object with category and default proficiency
        const category = this.categorizeSkill(normalized);
        const skillObj = {
          name: normalized,
          category: category, // NEVER null - always has a value
          proficiency: this.estimateProficiency(normalized),
          yearsOfExperience: 0, // Default, user can update
          isCore: false, // Will be set later based on priority ranking
          coreSkillPriority: this.getCoreSkillPriority(normalized) // Add priority for ranking
        };
        
        console.log(`✅ [SKILLS VALIDATOR] Skill ${index + 1}: "${normalized}" → Category: "${category}"`);
        validated.push(skillObj);
      } else {
        console.log(`⚠️ [SKILLS VALIDATOR] Skill ${index + 1}: "${normalized}" rejected (too short or unknown)`);
      }
    });

    // Sort skills by core skill priority (higher priority = more likely to be core)
    validated.sort((a, b) => b.coreSkillPriority - a.coreSkillPriority);
    
    // Mark top 6-10 skills as core skills (limit to prevent too many core skills)
    const maxCoreSkills = Math.min(10, Math.max(6, Math.floor(validated.length * 0.3))); // 30% of skills or 6-10 max
    const actualCoreSkills = Math.min(maxCoreSkills, validated.length);
    
    for (let i = 0; i < actualCoreSkills; i++) {
      validated[i].isCore = true;
    }
    
    // Ensure remaining skills are marked as non-core
    for (let i = actualCoreSkills; i < validated.length; i++) {
      validated[i].isCore = false;
    }
    
    // Remove the temporary priority field
    validated.forEach(skill => delete skill.coreSkillPriority);

    console.log(`✅ [SKILLS VALIDATOR] Validated ${validated.length} skills with ${validated.filter(s => s.isCore).length} core skills (max allowed: ${actualCoreSkills})`);
    
    // Log category distribution
    const categoryCount = validated.reduce((acc, skill) => {
      acc[skill.category] = (acc[skill.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 [SKILLS VALIDATOR] Category distribution:', categoryCount);
    console.log(`🎯 [SKILLS VALIDATOR] Core skills (${validated.filter(s => s.isCore).length}/${actualCoreSkills}): ${validated.filter(s => s.isCore).map(s => s.name).join(', ')}`);
    console.log(`📝 [SKILLS VALIDATOR] Additional skills (${validated.filter(s => !s.isCore).length}): ${validated.filter(s => !s.isCore).map(s => s.name).slice(0, 5).join(', ')}${validated.filter(s => !s.isCore).length > 5 ? '...' : ''}`);

    return validated;
  }

  /**
   * Categorize skill into specific categories - NEVER returns null
   */
  categorizeSkill(skill: string): string {
    const lowerSkill = skill.toLowerCase().trim();
    
    // Programming Languages
    const programmingLanguages = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'java', 'c++', 'cpp', 
      'c#', 'csharp', 'ruby', 'go', 'golang', 'rust', 'php', 'swift', 'kotlin', 
      'scala', 'perl', 'r', 'matlab', 'dart', 'elixir', 'haskell', 'lua'
    ];
    if (programmingLanguages.some(lang => lowerSkill === lang || lowerSkill.includes(lang))) {
      return 'Programming Languages';
    }

    // Frontend Frameworks & Libraries
    const frontend = [
      'react', 'reactjs', 'react.js', 'angular', 'vue', 'vuejs', 'vue.js', 
      'svelte', 'next', 'nextjs', 'next.js', 'nuxt', 'gatsby', 'ember',
      'jquery', 'backbone', 'redux', 'mobx', 'webpack', 'vite', 'rollup'
    ];
    if (frontend.some(fw => lowerSkill === fw || lowerSkill.includes(fw))) {
      return 'Frontend';
    }

    // Backend Frameworks & Libraries
    const backend = [
      'node', 'nodejs', 'node.js', 'express', 'expressjs', 'django', 'flask', 
      'spring', 'springboot', 'laravel', '.net', 'dotnet', 'asp.net', 'fastapi',
      'nestjs', 'koa', 'hapi', 'rails', 'sinatra', 'gin', 'echo', 'fiber'
    ];
    if (backend.some(fw => lowerSkill === fw || lowerSkill.includes(fw))) {
      return 'Backend';
    }

    // Databases
    const databases = [
      'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'redis', 
      'oracle', 'cassandra', 'dynamodb', 'sqlite', 'mariadb', 'mssql', 
      'elasticsearch', 'neo4j', 'couchdb', 'firebase', 'supabase'
    ];
    if (databases.some(db => lowerSkill === db || lowerSkill.includes(db))) {
      return 'Databases';
    }

    // Cloud Platforms
    const cloud = [
      'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 
      'google cloud', 'heroku', 'digitalocean', 'linode', 'vercel', 'netlify'
    ];
    if (cloud.some(c => lowerSkill === c || lowerSkill.includes(c))) {
      return 'Cloud Platforms';
    }

    // DevOps & Infrastructure
    const devops = [
      'docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'terraform', 
      'ansible', 'puppet', 'chef', 'gitlab', 'github actions', 'circleci',
      'travis', 'nginx', 'apache', 'linux', 'bash', 'shell'
    ];
    if (devops.some(d => lowerSkill === d || lowerSkill.includes(d))) {
      return 'DevOps';
    }

    // Mobile Development
    const mobile = [
      'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic',
      'cordova', 'swift', 'objective-c', 'kotlin'
    ];
    if (mobile.some(m => lowerSkill === m || lowerSkill.includes(m))) {
      return 'Mobile Development';
    }

    // Data Science & AI/ML
    const dataScience = [
      'machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence',
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
      'data analysis', 'data science', 'nlp', 'computer vision', 'opencv'
    ];
    if (dataScience.some(ds => lowerSkill === ds || lowerSkill.includes(ds))) {
      return 'Data Science & AI';
    }

    // Testing & QA
    const testing = [
      'jest', 'mocha', 'chai', 'jasmine', 'cypress', 'selenium', 'playwright',
      'testing', 'unit testing', 'integration testing', 'e2e', 'tdd', 'bdd',
      'vitest', 'pytest', 'junit', 'testng'
    ];
    if (testing.some(t => lowerSkill === t || lowerSkill.includes(t))) {
      return 'Testing & QA';
    }

    // Design & UI/UX
    const design = [
      'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux',
      'ui design', 'ux design', 'wireframing', 'prototyping', 'design systems'
    ];
    if (design.some(d => lowerSkill === d || lowerSkill.includes(d))) {
      return 'Design & UI/UX';
    }

    // Development Tools
    const tools = [
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'postman',
      'insomnia', 'vscode', 'visual studio', 'intellij', 'eclipse', 'vim',
      'slack', 'trello', 'asana'
    ];
    if (tools.some(tool => lowerSkill === tool || lowerSkill.includes(tool))) {
      return 'Development Tools';
    }

    // Web Technologies
    const web = [
      'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind',
      'bootstrap', 'material-ui', 'mui', 'chakra', 'rest', 'restful', 'api',
      'graphql', 'websocket', 'http', 'ajax', 'json', 'xml'
    ];
    if (web.some(w => lowerSkill === w || lowerSkill.includes(w))) {
      return 'Web Technologies';
    }

    // Soft Skills
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
      'critical thinking', 'time management', 'project management', 'agile',
      'scrum', 'collaboration', 'mentoring', 'presentation', 'negotiation',
      'adaptability', 'creativity', 'attention to detail'
    ];
    if (softSkills.some(s => lowerSkill === s || lowerSkill.includes(s))) {
      return 'Soft Skills';
    }

    // Check against loaded datasets
    if (this.personalSkills.some(s => s.toLowerCase() === lowerSkill || s.toLowerCase().includes(lowerSkill))) {
      return 'Soft Skills';
    }

    if (this.technicalSkills.some(s => s.toLowerCase() === lowerSkill || s.toLowerCase().includes(lowerSkill))) {
      return 'Technical';
    }

    // Default category - NEVER null
    return 'Other';
  }

  /**
   * Estimate proficiency level (0-100) based on skill type
   */
  private estimateProficiency(skill: string): number {
    const lowerSkill = skill.toLowerCase();
    
    // Common/popular skills get higher default proficiency
    const popularSkills = [
      'javascript', 'python', 'react', 'node', 'sql', 'git', 
      'html', 'css', 'communication', 'teamwork', 'problem solving'
    ];
    
    if (popularSkills.some(popular => lowerSkill.includes(popular))) {
      return 70; // Intermediate-Advanced
    }

    // Specialized/advanced skills get medium proficiency
    const specializedSkills = [
      'kubernetes', 'machine learning', 'blockchain', 'rust', 'go',
      'tensorflow', 'pytorch', 'aws', 'azure'
    ];
    
    if (specializedSkills.some(spec => lowerSkill.includes(spec))) {
      return 60; // Intermediate
    }

    // Default proficiency for other skills
    return 50; // Intermediate
  }

  /**
   * Get priority score for core skill ranking (higher = more likely to be core)
   * This helps limit core skills to the most important 6-10 skills
   */
  private getCoreSkillPriority(skill: string): number {
    const lowerSkill = skill.toLowerCase();
    
    // Tier 1: Most critical skills (priority 100-90)
    const tier1Skills = [
      'javascript', 'js', 'python', 'java', 'react', 'reactjs', 'react.js',
      'node', 'nodejs', 'node.js', 'sql', 'aws', 'docker', 'git'
    ];
    
    // Tier 2: Very important skills (priority 89-80)
    const tier2Skills = [
      'typescript', 'ts', 'angular', 'vue', 'vuejs', 'express', 'django',
      'spring', 'mysql', 'postgresql', 'mongodb', 'kubernetes', 'k8s',
      'azure', 'gcp', 'html', 'css', 'rest', 'api'
    ];
    
    // Tier 3: Important skills (priority 79-70)
    const tier3Skills = [
      'c++', 'cpp', 'c#', 'csharp', 'php', 'ruby', 'go', 'golang',
      'flask', 'laravel', 'next', 'nextjs', 'redux', 'graphql',
      'redis', 'jenkins', 'terraform', 'ansible'
    ];
    
    // Tier 4: Valuable skills (priority 69-60)
    const tier4Skills = [
      'swift', 'kotlin', 'flutter', 'react native', 'android', 'ios',
      'tensorflow', 'pytorch', 'machine learning', 'ml', 'pandas',
      'numpy', 'elasticsearch', 'nginx', 'apache'
    ];
    
    // Tier 5: Good to have skills (priority 59-50)
    const tier5Skills = [
      'sass', 'scss', 'webpack', 'babel', 'jest', 'cypress', 'selenium',
      'figma', 'sketch', 'photoshop', 'jira', 'confluence', 'postman'
    ];
    
    // Tier 6: Soft skills and others (priority 49-40)
    const tier6Skills = [
      'leadership', 'communication', 'teamwork', 'problem solving',
      'project management', 'agile', 'scrum', 'analytical thinking'
    ];
    
    // Check tiers and assign priority
    for (const tier1 of tier1Skills) {
      if (lowerSkill === tier1 || lowerSkill.includes(tier1) || tier1.includes(lowerSkill)) {
        return 95 + Math.random() * 5; // 95-100
      }
    }
    
    for (const tier2 of tier2Skills) {
      if (lowerSkill === tier2 || lowerSkill.includes(tier2) || tier2.includes(lowerSkill)) {
        return 80 + Math.random() * 9; // 80-89
      }
    }
    
    for (const tier3 of tier3Skills) {
      if (lowerSkill === tier3 || lowerSkill.includes(tier3) || tier3.includes(lowerSkill)) {
        return 70 + Math.random() * 9; // 70-79
      }
    }
    
    for (const tier4 of tier4Skills) {
      if (lowerSkill === tier4 || lowerSkill.includes(tier4) || tier4.includes(lowerSkill)) {
        return 60 + Math.random() * 9; // 60-69
      }
    }
    
    for (const tier5 of tier5Skills) {
      if (lowerSkill === tier5 || lowerSkill.includes(tier5) || tier5.includes(lowerSkill)) {
        return 50 + Math.random() * 9; // 50-59
      }
    }
    
    for (const tier6 of tier6Skills) {
      if (lowerSkill === tier6 || lowerSkill.includes(tier6) || tier6.includes(lowerSkill)) {
        return 40 + Math.random() * 9; // 40-49
      }
    }
    
    // Default priority for unrecognized skills
    return 30 + Math.random() * 9; // 30-39
  }

  /**
   * Determine if skill is a core/primary skill
   * Enhanced logic to identify major skills that should be highlighted
   */
  private isCoreSkill(skill: string): boolean {
    const lowerSkill = skill.toLowerCase();
    
    // Programming languages are typically core skills
    const programmingLanguages = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'java', 'c++', 'cpp', 
      'c#', 'csharp', 'ruby', 'go', 'golang', 'rust', 'php', 'swift', 'kotlin', 
      'scala', 'dart', 'r'
    ];
    
    // Major frameworks and libraries
    const majorFrameworks = [
      'react', 'reactjs', 'react.js', 'angular', 'vue', 'vuejs', 'vue.js',
      'node', 'nodejs', 'node.js', 'express', 'django', 'flask', 'spring',
      'springboot', 'laravel', '.net', 'dotnet', 'asp.net', 'next', 'nextjs'
    ];
    
    // Essential databases
    const majorDatabases = [
      'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'redis',
      'oracle', 'sqlite'
    ];
    
    // Major cloud platforms
    const majorCloudPlatforms = [
      'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 
      'google cloud platform', 'google cloud'
    ];
    
    // Essential DevOps tools
    const majorDevOpsTools = [
      'docker', 'kubernetes', 'k8s', 'jenkins', 'git', 'github', 'gitlab',
      'ci/cd', 'terraform', 'ansible'
    ];
    
    // Popular mobile development
    const majorMobile = [
      'android', 'ios', 'react native', 'flutter'
    ];
    
    // Major data science/AI tools
    const majorDataScience = [
      'machine learning', 'ml', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'scikit-learn', 'data science', 'artificial intelligence', 'ai'
    ];
    
    // Essential web technologies
    const essentialWeb = [
      'html', 'html5', 'css', 'css3', 'rest', 'restful', 'api', 'graphql'
    ];
    
    // Important soft skills
    const coreSoftSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving', 
      'project management', 'agile', 'scrum'
    ];
    
    // Check if skill matches any core skill category
    const allCoreSkills = [
      ...programmingLanguages,
      ...majorFrameworks,
      ...majorDatabases,
      ...majorCloudPlatforms,
      ...majorDevOpsTools,
      ...majorMobile,
      ...majorDataScience,
      ...essentialWeb,
      ...coreSoftSkills
    ];
    
    return allCoreSkills.some(core => {
      // Exact match or contains match for flexibility
      return lowerSkill === core || 
             lowerSkill.includes(core) || 
             core.includes(lowerSkill);
    });
  }
}

export const skillsExtractor = new SkillsExtractor();
