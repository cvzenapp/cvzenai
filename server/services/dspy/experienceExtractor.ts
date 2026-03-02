import { datasetLoader } from './datasetLoader.js';

/**
 * Experience Extractor - Uses experience dataset to improve extraction accuracy
 */
export class ExperienceExtractor {
  private jobTitles: string[] = [];
  private companies: string[] = [];
  private industries: string[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load experience data
      const experienceData = await datasetLoader.loadDataset('04_experience.csv');
      
      this.jobTitles = datasetLoader.extractUniqueValues(experienceData, 'job_title');
      this.companies = datasetLoader.extractUniqueValues(experienceData, 'company');

      // Load job roles from candidate dataset
      const candidateData = await datasetLoader.loadDataset('candidate_job_role_dataset.csv');
      const additionalTitles = datasetLoader.extractUniqueValues(candidateData, 'job_role');
      this.jobTitles.push(...additionalTitles);
      this.jobTitles = [...new Set(this.jobTitles)];

      this.initialized = true;
      console.log(`✅ Experience Extractor initialized: ${this.jobTitles.length} job titles`);
    } catch (error) {
      console.error('❌ Failed to initialize ExperienceExtractor:', error);
    }
  }

  /**
   * Generate optimized prompt for experience extraction
   */
  generatePrompt(): string {
    const commonTitles = [
      'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
      'Backend Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager',
      'Project Manager', 'Team Lead', 'Technical Lead', 'Engineering Manager',
      'Software Developer', 'Web Developer', 'Mobile Developer', 'QA Engineer'
    ];

    const employmentTypes = [
      'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Co-op'
    ];

    return `
EXPERIENCE EXTRACTION GUIDELINES:

COMMON JOB TITLES:
${commonTitles.join(', ')}

EMPLOYMENT TYPES:
${employmentTypes.join(', ')}

EXTRACTION RULES:
1. Look for experience in sections: "Experience", "Work Experience", "Professional Experience", "Employment History"
2. Extract job title/position (e.g., "Senior Software Engineer")
3. Extract company name
4. Extract location (city, state, country)
5. Extract dates (start date, end date)
6. Identify current positions (look for "Present", "Current", "Now")
7. Extract job description/responsibilities
8. Extract key achievements (look for metrics, numbers, impact)
9. Extract technologies used (mentioned in description)
10. Determine employment type if mentioned

DATE FORMATS TO RECOGNIZE:
- "Jan 2020 - Present"
- "2020-01 to 2023-06"
- "January 2020 - June 2023"
- "2020 - Present"

CURRENT POSITION INDICATORS:
- "Present", "Current", "Now", "Ongoing"
- If current: set endDate to "Present" and current: true

ACHIEVEMENT INDICATORS:
- Numbers/metrics (e.g., "increased by 50%", "reduced by 30%")
- Action verbs (e.g., "Led", "Developed", "Implemented", "Managed")
- Impact statements (e.g., "resulting in", "which led to")

IMPORTANT:
- Each job should be a separate entry
- Keep descriptions concise (max 150 chars)
- Extract technologies mentioned in descriptions
`;
  }

  /**
   * Validate and enhance extracted experience
   */
  validateExperience(extractedExperience: any[]): any[] {
    return extractedExperience.map(exp => {
      // Ensure required fields
      if (!exp.company) exp.company = 'Company';
      if (!exp.position) exp.position = 'Position';
      if (!exp.description) exp.description = '';
      if (!exp.achievements) exp.achievements = [];
      if (!exp.technologies) exp.technologies = [];

      // Normalize current flag
      if (exp.endDate && (
        exp.endDate.toLowerCase().includes('present') ||
        exp.endDate.toLowerCase().includes('current') ||
        exp.endDate.toLowerCase().includes('now')
      )) {
        exp.current = true;
        exp.endDate = 'Present';
      } else {
        exp.current = exp.current || false;
      }

      return exp;
    });
  }

  /**
   * Extract technologies from description
   */
  extractTechnologies(description: string, existingTech: string[] = []): string[] {
    const techKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch'
    ];

    const found = new Set(existingTech);
    
    techKeywords.forEach(tech => {
      if (description.toLowerCase().includes(tech.toLowerCase())) {
        found.add(tech);
      }
    });

    return Array.from(found);
  }
}

export const experienceExtractor = new ExperienceExtractor();
