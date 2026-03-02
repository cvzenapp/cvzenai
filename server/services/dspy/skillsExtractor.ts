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
          isCore: this.isCoreSkill(normalized)
        };
        
        console.log(`✅ [SKILLS VALIDATOR] Skill ${index + 1}: "${normalized}" → Category: "${category}"`);
        validated.push(skillObj);
      } else {
        console.log(`⚠️ [SKILLS VALIDATOR] Skill ${index + 1}: "${normalized}" rejected (too short or unknown)`);
      }
    });

    console.log(`✅ [SKILLS VALIDATOR] Validated ${validated.length} skills with categories`);
    
    // Log category distribution
    const categoryCount = validated.reduce((acc, skill) => {
      acc[skill.category] = (acc[skill.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 [SKILLS VALIDATOR] Category distribution:', categoryCount);

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
   * Determine if skill is a core/primary skill
   */
  private isCoreSkill(skill: string): boolean {
    const lowerSkill = skill.toLowerCase();
    
    // Programming languages and major frameworks are typically core skills
    const coreSkillKeywords = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue',
      'node', 'django', 'spring', 'sql', 'aws', 'docker'
    ];
    
    return coreSkillKeywords.some(core => lowerSkill.includes(core));
  }
}

export const skillsExtractor = new SkillsExtractor();
