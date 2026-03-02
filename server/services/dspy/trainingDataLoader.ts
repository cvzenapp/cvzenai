import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DSPy-style training data loader
 * Loads resume dataset and converts to training examples
 */

export interface TrainingExample {
  // Input
  resume: {
    skills: string[];
    experience: string[];
    education: string[];
    summary?: string;
  };
  // Expected output (label)
  atsScore: number;
  category: string;
  // Metadata
  rawContent: string;
}

export class TrainingDataLoader {
  private examples: TrainingExample[] = [];
  
  /**
   * Load and parse UpdatedResumeDataSetSkills.csv
   * Format: Category,Resume (multiline content in quotes)
   */
  async loadDataset(): Promise<TrainingExample[]> {
    try {
      const datasetPath = path.join(__dirname, '../../data_sets/UpdatedResumeDataSetSkills.csv');
      
      if (!fs.existsSync(datasetPath)) {
        console.log('⚠️ Dataset not found, using synthetic examples');
        return this.getSyntheticExamples();
      }
      
      const content = fs.readFileSync(datasetPath, 'utf-8');
      
      // Parse CSV with multiline quoted fields
      const examples = this.parseMultilineCSV(content);
      
      console.log(`✅ Loaded ${examples.length} training examples from dataset`);
      
      this.examples = examples;
      return examples;
      
    } catch (error) {
      console.error('Error loading dataset:', error);
      return this.getSyntheticExamples();
    }
  }
  
  /**
   * Parse CSV with multiline quoted content
   */
  private parseMultilineCSV(content: string): TrainingExample[] {
    const examples: TrainingExample[] = [];
    const lines = content.split('\n');
    
    let currentCategory = '';
    let currentContent = '';
    let inQuotes = false;
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i];
      
      if (!line.trim()) continue;
      
      // Check if starting new entry (Category,"Content...)
      if (!inQuotes && line.includes(',"')) {
        // Save previous entry if exists
        if (currentCategory && currentContent) {
          const example = this.parseResumeContent(currentCategory, currentContent);
          if (example) examples.push(example);
        }
        
        // Start new entry
        const parts = line.split(',"');
        currentCategory = parts[0].trim();
        currentContent = parts[1] || '';
        inQuotes = true;
      } else if (inQuotes) {
        // Continue multiline content
        currentContent += ' ' + line;
        
        // Check if quotes closed
        if (line.includes('"') && !line.endsWith(',"')) {
          inQuotes = false;
          currentContent = currentContent.replace(/"+$/g, '').trim();
        }
      }
    }
    
    // Save last entry
    if (currentCategory && currentContent) {
      const example = this.parseResumeContent(currentCategory, currentContent);
      if (example) examples.push(example);
    }
    
    // Return ALL examples (no limit) - use entire dataset for training
    console.log(`   Parsed ${examples.length} total examples from dataset`);
    return examples;
  }
  
  /**
   * Parse resume content into structured format
   */
  private parseResumeContent(category: string, content: string): TrainingExample | null {
    try {
      const lowerContent = content.toLowerCase();
      
      // Extract skills
      const skills = this.extractSkills(content);
      
      // Extract experience descriptions
      const experience = this.extractExperience(content);
      
      // Extract education
      const education = this.extractEducation(content);
      
      // Extract summary/objective
      const summary = this.extractSummary(content);
      
      // Calculate estimated ATS score based on content quality
      const atsScore = this.estimateATSScore(skills, experience, education, summary);
      
      // Only include high-quality examples (score >= 75)
      if (atsScore < 75) return null;
      
      return {
        resume: {
          skills,
          experience,
          education,
          summary
        },
        atsScore,
        category,
        rawContent: content.substring(0, 1000) // Limit size
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Extract skills from resume content
   */
  private extractSkills(content: string): string[] {
    const skills: string[] = [];
    
    // Look for skills section
    const skillsMatch = content.match(/Skills[:\s*]+([^\.]+(?:\.[^\.]+){0,3})/i);
    if (skillsMatch) {
      const skillsText = skillsMatch[1];
      
      // Extract individual skills (comma or bullet separated)
      const extracted = skillsText
        .split(/[,\*\n\r•]/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 50)
        .slice(0, 30);
      
      skills.push(...extracted);
    }
    
    // Also extract common tech keywords
    const techKeywords = [
      'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 
      'Kubernetes', 'SQL', 'MongoDB', 'Git', 'Agile', 'Scrum', 'CI/CD'
    ];
    
    techKeywords.forEach(keyword => {
      if (content.includes(keyword) && !skills.includes(keyword)) {
        skills.push(keyword);
      }
    });
    
    return skills.slice(0, 25);
  }
  
  /**
   * Extract experience descriptions
   */
  private extractExperience(content: string): string[] {
    const experience: string[] = [];
    
    // Look for experience/work section
    const expMatch = content.match(/(?:Experience|Work|Employment)[:\s]+(.+?)(?:Education|Skills|$)/is);
    if (expMatch) {
      const expText = expMatch[1];
      
      // Split by common delimiters
      const bullets = expText
        .split(/[\*\n\r•]/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 500)
        .slice(0, 10);
      
      experience.push(...bullets);
    }
    
    return experience;
  }
  
  /**
   * Extract education
   */
  private extractEducation(content: string): string[] {
    const education: string[] = [];
    
    const eduMatch = content.match(/Education[:\s]+(.+?)(?:Skills|Experience|$)/is);
    if (eduMatch) {
      const eduText = eduMatch[1];
      const entries = eduText
        .split(/[\n\r]/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && s.length < 200)
        .slice(0, 5);
      
      education.push(...entries);
    }
    
    return education;
  }
  
  /**
   * Extract summary/objective
   */
  private extractSummary(content: string): string | undefined {
    const summaryMatch = content.match(/(?:Summary|Objective|Profile)[:\s]+(.+?)(?:\n\n|Skills|Experience|Education)/is);
    if (summaryMatch) {
      return summaryMatch[1].trim().substring(0, 500);
    }
    return undefined;
  }
  
  /**
   * Estimate ATS score based on content quality
   * This simulates the "label" in DSPy training data
   */
  private estimateATSScore(
    skills: string[], 
    experience: string[], 
    education: string[], 
    summary?: string
  ): number {
    let score = 0;
    
    // Skills (30 points)
    if (skills.length >= 15) score += 30;
    else if (skills.length >= 10) score += 25;
    else if (skills.length >= 5) score += 20;
    else score += 10;
    
    // Experience (40 points)
    if (experience.length >= 5) score += 40;
    else if (experience.length >= 3) score += 30;
    else if (experience.length >= 1) score += 20;
    else score += 10;
    
    // Check for action verbs and metrics in experience
    const hasActionVerbs = experience.some(exp => 
      /^(Led|Developed|Managed|Created|Built|Designed|Implemented|Architected|Optimized)/i.test(exp)
    );
    if (hasActionVerbs) score += 5;
    
    const hasMetrics = experience.some(exp => 
      /\d+%|\$\d+|\d+[kmb]?\+?\s*(users|customers|projects)/i.test(exp)
    );
    if (hasMetrics) score += 5;
    
    // Education (15 points)
    if (education.length >= 1) score += 15;
    else score += 5;
    
    // Summary (10 points)
    if (summary && summary.length > 100) score += 10;
    else if (summary) score += 5;
    
    return Math.min(score, 100);
  }
  
  /**
   * Get synthetic high-quality examples if dataset unavailable
   */
  private getSyntheticExamples(): TrainingExample[] {
    return [
      {
        resume: {
          skills: ['Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Git', 'CI/CD', 'Agile', 'Scrum', 'TensorFlow', 'Machine Learning', 'REST API'],
          experience: [
            'Led development of microservices architecture serving 1M+ users, implementing Docker and Kubernetes for container orchestration, resulting in 99.9% uptime and 45% reduction in infrastructure costs',
            'Architected and deployed CI/CD pipeline using Jenkins and GitLab, automating testing and deployment processes, accelerating release cycles by 60% and reducing deployment errors by 80%',
            'Developed machine learning models using TensorFlow and Python, achieving 92% accuracy in production, processing 500K+ requests daily with sub-100ms latency'
          ],
          education: ['B.S. Computer Science, Stanford University, GPA: 3.8/4.0', 'Relevant Coursework: Machine Learning, Distributed Systems, Algorithms'],
          summary: 'Senior Software Engineer with 8+ years building scalable web applications using React, Node.js, and AWS. Specialized in microservices architecture, machine learning, and cloud infrastructure. Proven track record of delivering high-performance solutions serving millions of users.'
        },
        atsScore: 95,
        category: 'Software Engineering',
        rawContent: 'High-quality software engineering resume'
      },
      {
        resume: {
          skills: ['Data Science', 'Python', 'SQL', 'Tableau', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'AWS', 'Big Data', 'Spark', 'Hadoop'],
          experience: [
            'Developed predictive models using machine learning algorithms (Random Forest, XGBoost, Neural Networks), improving customer churn prediction accuracy by 35% and generating $2M annual savings',
            'Built end-to-end data pipelines processing 10TB+ daily using Apache Spark and AWS EMR, reducing data processing time by 70% and enabling real-time analytics',
            'Created interactive dashboards using Tableau and Python, providing actionable insights to C-level executives, driving data-driven decision making across organization'
          ],
          education: ['M.S. Data Science, MIT, GPA: 3.9/4.0', 'B.S. Statistics, UC Berkeley'],
          summary: 'Data Scientist with 6+ years experience in machine learning, big data analytics, and statistical modeling. Expert in Python, SQL, and cloud technologies. Track record of delivering data-driven solutions that generate measurable business impact.'
        },
        atsScore: 93,
        category: 'Data Science',
        rawContent: 'High-quality data science resume'
      }
    ];
  }
  
  /**
   * Get training examples split into train/dev sets
   */
  getTrainDevSplit(trainRatio: number = 0.8): { train: TrainingExample[], dev: TrainingExample[] } {
    const shuffled = [...this.examples].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * trainRatio);
    
    return {
      train: shuffled.slice(0, splitIndex),
      dev: shuffled.slice(splitIndex)
    };
  }
}

export const trainingDataLoader = new TrainingDataLoader();
