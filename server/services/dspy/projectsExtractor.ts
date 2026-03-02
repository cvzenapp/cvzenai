import { datasetLoader } from './datasetLoader.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Projects Extractor - Uses projects dataset and real resume examples to improve extraction accuracy
 */
export class ProjectsExtractor {
  private projectTypes: string[] = [];
  private projectCategories: string[] = [];
  private commonTechnologies: string[] = [];
  private realProjectExamples: string[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load projects data from CSV
      const projectsData = await datasetLoader.loadDataset('07_projects.csv');
      
      this.projectTypes = datasetLoader.extractUniqueValues(projectsData, 'project_type');
      this.projectCategories = datasetLoader.extractUniqueValues(projectsData, 'category');
      
      // Extract common technologies from projects
      projectsData.forEach((row: any) => {
        const tech = row['technologies'] || row['Technologies'];
        if (tech) {
          const techList = tech.split(/[,;|]/).map((t: string) => t.trim()).filter((t: string) => t);
          this.commonTechnologies.push(...techList);
        }
      });
      
      this.commonTechnologies = [...new Set(this.commonTechnologies)];

      // Load real project examples from resume_500 dataset
      await this.loadRealProjectExamples();

      this.initialized = true;
      console.log(`✅ Projects Extractor initialized: ${this.projectTypes.length} types, ${this.commonTechnologies.length} technologies, ${this.realProjectExamples.length} real examples`);
    } catch (error) {
      console.error('❌ Failed to initialize ProjectsExtractor:', error);
    }
  }

  /**
   * Load real project examples from resume_500 dataset as TRAINING DATA
   * These examples teach the AI what project patterns look like in real resumes
   */
  private async loadRealProjectExamples() {
    try {
      const resumesDir = path.join(process.cwd(), 'server', 'data_sets', 'resume_500');
      const files = await fs.readdir(resumesDir);
      
      // Sample 5 resumes to learn project patterns
      const sampleFiles = files.filter(f => f.endsWith('.txt')).slice(0, 5);
      
      for (const file of sampleFiles) {
        const filePath = path.join(resumesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Extract project patterns as training examples
        const lines = content.split('\n');
        const projectPatterns: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Look for project indicators to learn patterns
          if (line.includes('header\tproject') || 
              line.includes('Project #') || 
              line.includes('Product:') ||
              line.includes('Project Summary:')) {
            
            // Capture the pattern (not the actual project data)
            const pattern = line.substring(0, 100);
            projectPatterns.push(pattern);
            
            // Get next line for context (description pattern)
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].substring(0, 80);
              projectPatterns.push(nextLine);
            }
            
            // Limit to 2 patterns per resume to save tokens
            if (projectPatterns.length >= 4) break;
          }
        }
        
        if (projectPatterns.length > 0) {
          // Store as a training example (pattern, not actual data)
          const example = projectPatterns.join('\n');
          this.realProjectExamples.push(example);
        }
      }
      
      console.log(`📚 Loaded ${this.realProjectExamples.length} project pattern examples for training`);
    } catch (error) {
      console.warn('⚠️ Could not load project pattern examples:', error.message);
    }
  }

  /**
   * Check if a line looks like it contains project information
   */
  private looksLikeProject(line: string): boolean {
    const projectKeywords = [
      'project', 'developed', 'built', 'created', 'designed',
      'application', 'system', 'platform', 'website', 'portal'
    ];
    const lowerLine = line.toLowerCase();
    return projectKeywords.some(keyword => lowerLine.includes(keyword));
  }

  /**
   * Generate optimized prompt for projects extraction using TRAINING PATTERNS
   * The resume_500 examples teach the AI what project sections look like
   */
  generatePrompt(): string {
    const sampleTypes = this.projectTypes.slice(0, 15).join(', ');
    const sampleTech = this.commonTechnologies.slice(0, 30).join(', ');
    
    // Use training patterns to show the AI what to look for
    const trainingPatterns = this.realProjectExamples.slice(0, 2).map((pattern, i) => 
      `Pattern ${i + 1}:\n${pattern.substring(0, 150)}`
    ).join('\n\n');

    return `
PROJECTS EXTRACTION (Trained on Real Resume Patterns):

🚨 CRITICAL: "Product:" sections are ALSO projects! Extract them! 🚨

COMMON PROJECT TYPES: ${sampleTypes}
COMMON TECHNOLOGIES: ${sampleTech}

TRAINING PATTERNS (Learn from these real resume examples):
${trainingPatterns}

EXTRACTION RULES:
1. Find sections: "Projects", "Portfolio", "Personal Projects", "Product", "Product Summary"
2. Name (REQUIRED): Extract title or use first line. Never empty!
3. Description: Max 150 chars, focus on what it does
4. Technologies: From "Technology:", "Built with:", "Stack:", or infer from description
5. Links: GitHub, demo, portfolio URLs
6. Dates: "YYYY-MM" or "YYYY" or "Present"
   - Look for: "Started:", "Duration:", "Date:", date ranges
   - Examples: "Jan 2023 - Jun 2023", "2023 - Present"

PROJECT INDICATORS TO LOOK FOR:
- "Project #1:", "Project #2:", "Project:" (explicit labels)
- "Product:", "Product Summary:" (THESE ARE PROJECTS TOO!)
- "header\tproject" or similar formatting markers
- GitHub repos, live demos, portfolio links
- "Built with", "Developed using", "Technologies used"
- Technical descriptions of things built/created

CRITICAL INSTRUCTIONS:
- Each project = separate entry in array
- NEVER leave name empty
- Extract ALL technologies mentioned
- Include links when available
- Extract ALL projects, not just first 2-3
- If you see 5 projects, return 5 entries!
`;
  }

  /**
   * Validate and enhance extracted projects
   */
  validateProjects(extractedProjects: any[]): any[] {
    return extractedProjects.map((project, index) => {
      // Handle different field name variations
      const projectName = project.name || project.title || project.projectName || '';
      const projectDesc = project.description || project.desc || '';
      const projectTech = project.technologies || project.tech || project.stack || [];
      const projectLink = project.link || project.url || project.demo || '';
      const projectGithub = project.github || project.repo || project.repository || '';
      
      // CRITICAL: Ensure project has a name - generate one if missing
      let finalName = projectName.trim();
      if (!finalName) {
        // Try to extract name from description (first 50 chars)
        if (projectDesc) {
          finalName = projectDesc.substring(0, 50).trim();
          if (finalName.length > 40) {
            finalName = finalName.substring(0, 40) + '...';
          }
        } else if (projectLink || projectGithub) {
          // Extract from URL
          const url = projectLink || projectGithub;
          const parts = url.split('/');
          finalName = parts[parts.length - 1] || parts[parts.length - 2] || 'Project';
          finalName = finalName.replace(/[-_]/g, ' ').replace(/\.(html|com|dev|io)$/i, '');
        } else {
          finalName = `Project ${index + 1}`;
        }
      }
      
      // Parse dates - handle multiple formats
      let startDate = project.startDate || '';
      let endDate = project.endDate || '';
      
      // If dates are in other formats, try to normalize
      if (project.date) {
        const dateStr = String(project.date);
        if (dateStr.includes('-') || dateStr.includes('to')) {
          const parts = dateStr.split(/[-–—to]/i).map(p => p.trim());
          startDate = startDate || parts[0] || '';
          endDate = endDate || parts[1] || '';
        } else {
          startDate = startDate || dateStr;
        }
      }
      
      // Ensure required fields
      const validatedProject = {
        name: finalName,
        title: finalName, // Add title as alias
        description: projectDesc,
        technologies: Array.isArray(projectTech) ? projectTech : [],
        link: projectLink,
        github: projectGithub,
        url: projectLink, // Add url as alias
        startDate: startDate,
        endDate: endDate,
        images: project.images || [],
        status: project.status || (endDate === 'Present' ? 'In Progress' : '')
      };

      // Normalize GitHub URLs
      if (validatedProject.github && !validatedProject.github.startsWith('http')) {
        validatedProject.github = `https://github.com/${validatedProject.github}`;
      }

      // Extract technologies from description if not provided
      if (validatedProject.technologies.length === 0 && validatedProject.description) {
        validatedProject.technologies = this.extractTechnologiesFromDescription(validatedProject.description);
      }

      return validatedProject;
    });
  }

  /**
   * Extract technologies from project description
   */
  private extractTechnologiesFromDescription(description: string): string[] {
    const found = new Set<string>();
    const lowerDesc = description.toLowerCase();

    this.commonTechnologies.forEach(tech => {
      if (lowerDesc.includes(tech.toLowerCase())) {
        found.add(tech);
      }
    });

    return Array.from(found);
  }

  /**
   * Categorize project by type
   */
  categorizeProject(project: any): string {
    const description = (project.description || '').toLowerCase();
    const technologies = (project.technologies || []).map((t: string) => t.toLowerCase());

    // Check for mobile
    if (technologies.some(t => ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios'].includes(t))) {
      return 'Mobile Application';
    }

    // Check for web
    if (technologies.some(t => ['react', 'vue', 'angular', 'html', 'css', 'javascript'].includes(t))) {
      return 'Web Application';
    }

    // Check for ML/AI
    if (technologies.some(t => ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'ml', 'ai'].includes(t))) {
      return 'Machine Learning';
    }

    // Check for backend/API
    if (technologies.some(t => ['express', 'fastapi', 'django', 'spring', 'api', 'rest'].includes(t))) {
      return 'Backend/API';
    }

    // Check for data
    if (technologies.some(t => ['pandas', 'numpy', 'plotly', 'tableau', 'powerbi'].includes(t))) {
      return 'Data Science';
    }

    return 'General';
  }
}

export const projectsExtractor = new ProjectsExtractor();
