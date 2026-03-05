import { initializeDatabase, closeDatabase } from '../database/connection.js';
import { ParsedResumeData } from './resumeParsingService.js';

export interface StoredResumeResult {
  resumeId: number;
  success: boolean;
  message: string;
}

// Skill categorization functions (copied from resume routes)
function cleanSkillName(skillName: string): string {
  if (!skillName || typeof skillName !== 'string') return '';
  
  // Remove common prefixes and suffixes
  let cleaned = skillName
    .replace(/^(Skills?|Technologies?|Programming|Languages?|Frameworks?|Tools?|Software|Platforms?|Databases?|Operating Systems?|OS|Methodologies?|Concepts?|Additional Skills?|Technical Skills?|Core Skills?|Professional Skills?)[\s:,-]*/i, '')
    .replace(/[\s:,-]*$/g, '')
    .trim();
  
  // Skip if it's just a category name or too short
  if (cleaned.length < 2) return '';
  
  // Skip common category indicators
  const categoryIndicators = [
    'programming languages', 'frameworks', 'databases', 'tools', 'software',
    'operating systems', 'methodologies', 'concepts', 'skills', 'technologies',
    'platforms', 'languages', 'technical', 'professional', 'core', 'additional'
  ];
  
  if (categoryIndicators.includes(cleaned.toLowerCase())) return '';
  
  return cleaned;
}

function categorizeSkill(skillName: string): string {
  const skill = skillName.toLowerCase();
  
  // Programming Languages
  if (/\b(javascript|typescript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab|perl|lua|dart|elixir|haskell|clojure|f#|vb\.net|objective-c|assembly|cobol|fortran|pascal|ada|prolog|lisp|scheme|erlang|julia|groovy|powershell|bash|shell|sql|html|css|xml|json|yaml|toml)\b/.test(skill)) {
    return 'Programming Languages';
  }
  
  // Frameworks & Libraries
  if (/\b(react|angular|vue|svelte|next\.js|nuxt\.js|gatsby|express|fastapi|django|flask|spring|laravel|rails|asp\.net|node\.js|jquery|bootstrap|tailwind|material-ui|ant design|chakra ui|semantic ui|foundation|bulma|ionic|cordova|phonegap|xamarin|flutter|react native|electron|webpack|vite|rollup|parcel|babel|eslint|prettier|storybook|lerna|nx|turborepo)\b/.test(skill)) {
    return 'Frameworks & Libraries';
  }
  
  // Testing & QA
  if (/\b(jest|mocha|chai|cypress|selenium|playwright|puppeteer|pytest|jasmine|karma|protractor|webdriver|testng|junit|nunit|xunit|cucumber|behave|rspec|minitest|qunit|ava|tape|supertest|enzyme|react testing library|vue test utils|angular testing|postman|insomnia|jmeter|loadrunner|gatling|k6|artillery|burp suite|owasp zap|sonarqube|quality assurance|test automation|manual testing|regression testing|performance testing|load testing|stress testing|security testing|penetration testing|api testing|integration testing|unit testing|e2e testing|acceptance testing|smoke testing|sanity testing|usability testing|accessibility testing|cross browser testing|mobile testing|test planning|test strategy|test cases|test scripts|bug tracking|defect management|test reporting|test metrics|agile testing|tdd|bdd|atdd)\b/.test(skill)) {
    return 'Testing & QA';
  }
  
  // Databases
  if (/\b(mysql|postgresql|mongodb|redis|elasticsearch|cassandra|dynamodb|firebase|supabase|sqlite|oracle|sql server|mariadb|couchdb|neo4j|influxdb|clickhouse|snowflake|bigquery|redshift|athena|cosmos db|aurora|rds|documentdb)\b/.test(skill)) {
    return 'Databases';
  }
  
  // Cloud & DevOps
  if (/\b(aws|azure|gcp|google cloud|docker|kubernetes|jenkins|gitlab ci|github actions|circleci|travis ci|terraform|ansible|chef|puppet|vagrant|helm|istio|prometheus|grafana|elk stack|datadog|new relic|splunk|nagios|zabbix|consul|vault|nomad|packer|cloudformation|arm templates|pulumi)\b/.test(skill)) {
    return 'Cloud & DevOps';
  }
  
  // Development Tools
  if (/\b(git|github|gitlab|bitbucket|svn|mercurial|vs code|visual studio|intellij|eclipse|atom|sublime|vim|emacs|xcode|android studio|postman|insomnia|swagger|figma|sketch|adobe xd|photoshop|illustrator|after effects|premiere|blender|unity|unreal engine|godot|api testing)\b/.test(skill)) {
    return 'Development Tools';
  }
  
  // Operating Systems
  if (/\b(linux|ubuntu|centos|rhel|debian|fedora|arch|macos|windows|unix|freebsd|solaris|aix)\b/.test(skill)) {
    return 'Operating Systems';
  }
  
  // Soft Skills
  if (/\b(leadership|communication|teamwork|problem solving|critical thinking|creativity|adaptability|time management|project management|analytical thinking|attention to detail|collaboration|mentoring|coaching|public speaking|presentation|negotiation|conflict resolution|emotional intelligence|empathy|customer service|sales|marketing|strategic thinking|innovation|entrepreneurship)\b/.test(skill)) {
    return 'Soft Skills';
  }
  
  // Methodologies
  if (/\b(agile|scrum|kanban|lean|waterfall|devops|ci\/cd|tdd|bdd|ddd|microservices|serverless|event-driven|rest|graphql|soap|grpc|oauth|jwt|saml|ldap|active directory|sso|mfa|rbac|gdpr|hipaa|sox|pci dss|iso 27001)\b/.test(skill)) {
    return 'Methodologies';
  }
  
  // Default category
  return 'Technical Skills';
}

function processSkills(skills: any[]): any[] {
  if (!Array.isArray(skills)) return [];
  
  const processedSkills: any[] = [];
  
  skills.forEach((skill: any, index: number) => {
    // If already an object with name
    if (typeof skill === 'object' && skill.name) {
      const skillName = skill.name.trim();
      
      // Check if it's a grouped skill (contains colons and commas)
      if (skillName.includes(':') && skillName.includes(',')) {
        // Split grouped skills like "Programming Languages: Python, TypeScript, PHP"
        const [categoryPart, skillsPart] = skillName.split(':');
        if (skillsPart) {
          const individualSkills = skillsPart.split(',').map(s => s.trim()).filter(s => s.length > 0);
          
          individualSkills.forEach((individualSkill, subIndex) => {
            const cleanedName = cleanSkillName(individualSkill);
            if (cleanedName) {
              processedSkills.push({
                id: `skill-${Date.now()}-${index}-${subIndex}`,
                name: cleanedName,
                level: skill.level || 70,
                proficiency: skill.proficiency || skill.level || 70,
                category: categorizeSkill(cleanedName),
                isCore: skill.isCore || false
              });
            }
          });
        }
      } else {
        // Single skill
        const cleanedName = cleanSkillName(skillName);
        if (cleanedName) {
          processedSkills.push({
            ...skill,
            name: cleanedName,
            category: categorizeSkill(cleanedName)
          });
        }
      }
    }
    // If it's a string
    else if (typeof skill === 'string') {
      const skillName = skill.trim();
      
      // Check if it's a grouped skill
      if (skillName.includes(':') && skillName.includes(',')) {
        const [categoryPart, skillsPart] = skillName.split(':');
        if (skillsPart) {
          const individualSkills = skillsPart.split(',').map(s => s.trim()).filter(s => s.length > 0);
          
          individualSkills.forEach((individualSkill, subIndex) => {
            const cleanedName = cleanSkillName(individualSkill);
            if (cleanedName) {
              processedSkills.push({
                id: `skill-${Date.now()}-${index}-${subIndex}`,
                name: cleanedName,
                level: 70,
                proficiency: 70,
                category: categorizeSkill(cleanedName),
                isCore: false
              });
            }
          });
        }
      } else {
        // Single skill
        const cleanedName = cleanSkillName(skillName);
        if (cleanedName) {
          processedSkills.push({
            id: `skill-${Date.now()}-${index}`,
            name: cleanedName,
            level: 70,
            proficiency: 70,
            category: categorizeSkill(cleanedName),
            isCore: false
          });
        }
      }
    }
  });
  
  // Mark top 5-6 skills as core based on priority categories
  const priorityCategories = ['Programming Languages', 'Frameworks & Libraries', 'Databases', 'Cloud & DevOps', 'Development Tools'];
  let coreSkillsCount = 0;
  const maxCoreSkills = 6;
  
  // First pass: mark skills from priority categories as core
  for (const category of priorityCategories) {
    if (coreSkillsCount >= maxCoreSkills) break;
    
    const categorySkills = processedSkills.filter(skill => skill.category === category);
    for (const skill of categorySkills) {
      if (coreSkillsCount >= maxCoreSkills) break;
      skill.isCore = true;
      coreSkillsCount++;
    }
  }
  
  // Second pass: if we still need more core skills, mark highest level skills
  if (coreSkillsCount < maxCoreSkills) {
    const remainingSkills = processedSkills
      .filter(skill => !skill.isCore)
      .sort((a, b) => (b.level || 0) - (a.level || 0));
    
    for (let i = 0; i < Math.min(remainingSkills.length, maxCoreSkills - coreSkillsCount); i++) {
      remainingSkills[i].isCore = true;
    }
  }
  
  return processedSkills;
}

class ResumeStorageService {
  /**
   * Store parsed resume data in database
   */
  async storeResumeData(userId: string | number, parsedData: ParsedResumeData, title?: string): Promise<StoredResumeResult> {
    console.log('💾 Storing resume data for user:', userId);
    
    const db = await initializeDatabase();
    
    try {
      // Generate resume title if not provided
      const resumeTitle = title || `${parsedData.personalInfo.fullName}'s Resume`;
      
      // Prepare JSONB data for database
      const personalInfoJson = JSON.stringify({
        fullName: parsedData.personalInfo.fullName,
        email: parsedData.personalInfo.email,
        phone: parsedData.personalInfo.phone,
        location: parsedData.personalInfo.location,
        linkedin: parsedData.personalInfo.linkedin || '',
        github: parsedData.personalInfo.github || '',
        website: parsedData.personalInfo.website || ''
      });
      
      // Process and categorize skills
      const processedSkills = processSkills(parsedData.skills || []);
      console.log('💾 Processed skills:', JSON.stringify(processedSkills, null, 2));
      
      // Store both flat skills array and categorized skills
      const skillsData = {
        skills: processedSkills,
        categories: parsedData.skillCategories || {}
      };
      const skillsJson = JSON.stringify(skillsData);
      
      const experienceJson = JSON.stringify(
        (parsedData.experience || []).map(exp => ({
          company: exp.company,
          position: exp.title, // Map title to position
          location: exp.location || '',
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current || false,
          description: exp.description || '',
          achievements: exp.responsibilities || [] // Map responsibilities to achievements
        }))
      );
      
      const educationJson = JSON.stringify(
        (parsedData.education || []).map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          location: edu.location || '',
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.gpa || '',
          achievements: edu.achievements || []
        }))
      );
      
      const projectsJson = JSON.stringify(
        (parsedData.projects || []).map(proj => ({
          name: proj.name,
          description: proj.description,
          technologies: proj.technologies || [],
          link: proj.link || '',
          startDate: proj.startDate || '',
          endDate: proj.endDate || ''
        }))
      );
      
      // Log what we're about to store
      console.log('💾 Data being stored:');
      console.log('  Processed Skills:', JSON.stringify(processedSkills, null, 2));
      console.log('  Experience:', experienceJson.substring(0, 200));
      console.log('  Education:', educationJson.substring(0, 200));
      console.log('  Projects:', projectsJson.substring(0, 200));
      
      // Insert resume into database (without ATS score initially)
      const result = await db.query(
        `INSERT INTO resumes (
          user_id, 
          title, 
          personal_info, 
          summary, 
          objective, 
          skills, 
          experience, 
          education, 
          projects,
          template_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id`,
        [
          userId,
          resumeTitle,
          personalInfoJson,
          parsedData.summary || '',
          parsedData.objective || '',
          skillsJson,
          experienceJson,
          educationJson,
          projectsJson,
          'modern-professional' // Default template
        ]
      );
      const resumeId = result.rows[0].id;
      
      console.log('✅ Resume stored successfully:', {
        resumeId,
        userId,
        title: resumeTitle
      });
      
      return {
        resumeId,
        success: true,
        message: 'Resume parsed and stored successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to store resume:', error);
      throw new Error(`Database error: ${error.message}`);
    } finally {
      // Don't close database - let connection pool manage connections
    }
  }

  /**
   * Check if user already has a resume
   */
  async getUserResumeCount(userId: string | number): Promise<number> {
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM resumes WHERE user_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      // Don't close database - let connection pool manage connections
    }
  }

  /**
   * Get user's most recent resume
   */
  async getUserLatestResume(userId: string | number): Promise<any | null> {
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        'SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      return result.rows[0] || null;
    } finally {
      // Don't close database - let connection pool manage connections
    }
  }
}

export const resumeStorageService = new ResumeStorageService();
