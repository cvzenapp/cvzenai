import mammoth from 'mammoth';
import fs from 'fs/promises';
import { groqService } from './groqService.js';
import { jsonrepair } from 'jsonrepair';
import { resumeParser } from './dspy/resumeParser.js';
import { resumeExtractionOrchestrator } from './dspy/resumeExtractionOrchestrator.js';

export interface ParsedResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  objective?: string;
  skills: string[];
  skillCategories?: {
    programmingLanguages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    cloudPlatforms?: string[];
    testing?: string[];
    other?: string[];
  };
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    location?: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    achievements?: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  atsScore?: {
    overallScore: number;
    scores: {
      completeness: number;
      formatting: number;
      keywords: number;
      experience: number;
      education: number;
      skills: number;
    };
    suggestions: string[];
    strengths: string[];
  };
}

class ResumeParsingService {
  /**
   * Extract personal information locally using regex patterns (privacy-first approach)
   */
  private extractPersonalInfoLocally(resumeText: string): {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    website: string;
  } {
    console.log('🔒 Extracting personal info locally (privacy-first)...');
    
    const personalInfo = {
      fullName: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      website: ''
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = resumeText.match(emailRegex);
    if (emailMatches && emailMatches.length > 0) {
      personalInfo.email = emailMatches[0];
      console.log('✅ Email extracted locally');
    }

    // Extract phone numbers (various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,}/g;
    const phoneMatches = resumeText.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      personalInfo.phone = phoneMatches[0].trim();
      console.log('✅ Phone extracted locally');
    }

    // Extract LinkedIn URL
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/gi;
    const linkedinMatches = resumeText.match(linkedinRegex);
    if (linkedinMatches && linkedinMatches.length > 0) {
      personalInfo.linkedin = linkedinMatches[0];
      console.log('✅ LinkedIn extracted locally');
    }

    // Extract GitHub URL
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/gi;
    const githubMatches = resumeText.match(githubRegex);
    if (githubMatches && githubMatches.length > 0) {
      personalInfo.github = githubMatches[0];
      console.log('✅ GitHub extracted locally');
    }

    // Extract website/portfolio URL (excluding LinkedIn, GitHub, email domains)
    const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w]{2,}(?:\/[\w-]*)?/gi;
    const websiteMatches = resumeText.match(websiteRegex);
    if (websiteMatches && websiteMatches.length > 0) {
      // Filter out LinkedIn, GitHub, and common email domains
      const filteredWebsites = websiteMatches.filter(url => 
        !url.toLowerCase().includes('linkedin.com') &&
        !url.toLowerCase().includes('github.com') &&
        !url.toLowerCase().includes('gmail.com') &&
        !url.toLowerCase().includes('yahoo.com') &&
        !url.toLowerCase().includes('outlook.com') &&
        !url.toLowerCase().includes('hotmail.com')
      );
      if (filteredWebsites.length > 0) {
        personalInfo.website = filteredWebsites[0];
        console.log('✅ Website extracted locally');
      }
    }

    // Extract name from first few lines (heuristic approach)
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      // Common resume section headers and job-related terms to skip
      const skipPatterns = [
        // Section headers
        'career objective', 'objective', 'summary', 'professional summary',
        'profile', 'about me', 'experience', 'work experience', 'education',
        'skills', 'technical skills', 'projects', 'certifications', 'languages',
        'references', 'contact', 'personal information', 'resume', 'curriculum vitae',
        'cv', 'professional experience', 'employment history', 'qualifications',
        // Job titles and roles (common patterns)
        'developer', 'engineer', 'manager', 'administrator', 'analyst', 'designer',
        'consultant', 'specialist', 'coordinator', 'director', 'architect', 'lead',
        'senior', 'junior', 'associate', 'assistant', 'intern', 'trainee',
        'software', 'database', 'system', 'network', 'web', 'mobile', 'cloud',
        'data', 'business', 'product', 'project', 'program', 'technical',
        'full stack', 'front end', 'back end', 'devops', 'qa', 'scrum master',
        // Company/organization indicators
        'llc', 'inc', 'corp', 'ltd', 'company', 'corporation', 'limited',
        'technologies', 'solutions', 'systems', 'services', 'consulting'
      ];
      
      // Look for name in first 10 lines (increased from 5)
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Skip lines with email, phone, or URLs
        if (emailRegex.test(line) || phoneRegex.test(line) || line.includes('http') || line.includes('@')) {
          continue;
        }
        
        // Skip if line contains any skip patterns
        if (skipPatterns.some(pattern => lineLower.includes(pattern))) {
          continue;
        }
        
        // Skip lines with numbers (likely dates, phone numbers, or addresses)
        if (/\d/.test(line)) {
          continue;
        }
        
        // Name heuristics: 2-4 words, each capitalized, reasonable length
        const words = line.split(/\s+/).filter(w => w.length > 0);
        
        // Must be 2-4 words
        if (words.length < 2 || words.length > 4) {
          continue;
        }
        
        // Check if it looks like a name
        const isLikelyName = words.every(word => {
          // Each word should start with capital letter
          // Allow for middle initials (single capital letter with optional period)
          if (word.length === 1 || (word.length === 2 && word.endsWith('.'))) {
            return /^[A-Z]\.?$/.test(word);
          }
          // Regular name words: capital letter followed by lowercase
          return /^[A-Z][a-z]+$/.test(word) && word.length >= 2 && word.length <= 20;
        });
        
        // Additional checks: line should not be too long and should look like a proper name
        if (isLikelyName && line.length <= 50 && line.length >= 4) {
          personalInfo.fullName = line;
          console.log('✅ Name extracted locally:', line);
          break;
        }
      }
    }

    // FALLBACK: If name not found, try to extract from email
    if (!personalInfo.fullName && personalInfo.email) {
      console.log('⚠️ Name not found in resume, attempting to extract from email...');
      const emailLocalPart = personalInfo.email.split('@')[0];
      
      // Remove common separators and numbers
      const cleanedName = emailLocalPart
        .replace(/[._-]/g, ' ')
        .replace(/\d+/g, '')
        .trim();
      
      // Capitalize each word
      const words = cleanedName.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 1 && words.length <= 4) {
        const capitalizedName = words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        // Only use if it looks reasonable (2-50 chars, at least 2 words ideally)
        if (capitalizedName.length >= 2 && capitalizedName.length <= 50) {
          personalInfo.fullName = capitalizedName;
          console.log('✅ Name extracted from email:', capitalizedName);
        }
      }
    }

    console.log('🔒 Personal info extraction complete:', {
      hasName: !!personalInfo.fullName,
      hasEmail: !!personalInfo.email,
      hasPhone: !!personalInfo.phone,
      hasLinkedIn: !!personalInfo.linkedin,
      hasGitHub: !!personalInfo.github,
      hasWebsite: !!personalInfo.website
    });

    return personalInfo;
  }

  /**
   * Redact personal information from resume text before sending to AI
   */
  private redactPersonalInfo(resumeText: string, personalInfo: any): string {
    let redactedText = resumeText;

    // Redact email
    if (personalInfo.email) {
      redactedText = redactedText.replace(new RegExp(personalInfo.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[EMAIL_REDACTED]');
    }

    // Redact phone
    if (personalInfo.phone) {
      redactedText = redactedText.replace(new RegExp(personalInfo.phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[PHONE_REDACTED]');
    }

    // Redact name
    if (personalInfo.fullName) {
      redactedText = redactedText.replace(new RegExp(personalInfo.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[NAME_REDACTED]');
    }

    // Redact LinkedIn
    if (personalInfo.linkedin) {
      redactedText = redactedText.replace(new RegExp(personalInfo.linkedin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[LINKEDIN_REDACTED]');
    }

    // Redact GitHub
    if (personalInfo.github) {
      redactedText = redactedText.replace(new RegExp(personalInfo.github.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[GITHUB_REDACTED]');
    }

    // Redact website
    if (personalInfo.website) {
      redactedText = redactedText.replace(new RegExp(personalInfo.website.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[WEBSITE_REDACTED]');
    }

    console.log('🔒 Personal info redacted from resume text');
    return redactedText;
  }

  /**
   * Extract text from uploaded resume file (from file path)
   */
  async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    console.log('📄 Extracting text from file:', { filePath, mimeType });
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      return this.extractTextFromBuffer(fileBuffer, mimeType);
    } catch (error: any) {
      console.error('❌ Text extraction failed:', error);
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  /**
   * Extract text from buffer (for in-memory file uploads)
   */
  async extractTextFromBuffer(fileBuffer: Buffer, mimeType: string): Promise<string> {
    console.log('📄 Extracting text from buffer:', { mimeType, size: fileBuffer.length });
    
    try {
      if (mimeType === 'application/pdf') {
        // Extract from PDF - use dynamic import to avoid initialization issues
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileBuffer);
        console.log('✅ PDF text extracted:', pdfData.text.length, 'characters');
        return pdfData.text;
      } else if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // Extract from DOCX
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        console.log('✅ DOCX text extracted:', result.value.length, 'characters');
        return result.value;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error: any) {
      console.error('❌ Text extraction failed:', error);
      throw new Error(`Failed to extract text from buffer: ${error.message}`);
    }
  }

  /**
   * Parse resume text using Groq AI with DSPy-trained patterns (4.1M+ records)
   * PRIVACY-FIRST: Extracts personal info locally, redacts before sending to AI
   */
  async parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
    console.log('🤖 Parsing resume with DSPy-trained parser (4.1M+ records)...');
    
    try {
      // Step 1: Extract personal info locally (no AI involved)
      const localPersonalInfo = this.extractPersonalInfoLocally(resumeText);
      
      // Step 2: Redact personal info from resume text before sending to AI
      const redactedText = this.redactPersonalInfo(resumeText, localPersonalInfo);
      
      console.log('🔒 Privacy check:', {
        originalLength: resumeText.length,
        redactedLength: redactedText.length,
        personalInfoExtractedLocally: true
      });
      
      // Step 3: Use DSPy-trained parser (trained on 4.1M+ records from 8 datasets)
      const parsedData = await resumeParser.parseResume(redactedText);
      
      // Step 4: Convert to ParsedResumeData format and merge with local personal info
      const result: ParsedResumeData = {
        personalInfo: {
          fullName: localPersonalInfo.fullName || parsedData.personalInfo?.name || '',
          email: localPersonalInfo.email || parsedData.personalInfo?.email || '',
          phone: localPersonalInfo.phone || parsedData.personalInfo?.phone || '',
          location: parsedData.personalInfo?.location || '',
          linkedin: localPersonalInfo.linkedin || parsedData.personalInfo?.linkedin || '',
          github: localPersonalInfo.github || '',
          website: localPersonalInfo.website || ''
        },
        summary: parsedData.summary || '',
        objective: '',
        skills: parsedData.skills || [],
        skillCategories: parsedData.skillCategories || {},
        experience: (parsedData.experience || []).map(exp => ({
          company: exp.company || '',
          position: exp.title || '',
          location: exp.location || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          current: exp.endDate?.toLowerCase() === 'present',
          description: exp.description || '',
          achievements: exp.responsibilities || []
        })),
        education: (parsedData.education || []).map(edu => ({
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: edu.field || '',
          location: edu.location || '',
          startDate: edu.startDate || edu.year || '',
          endDate: edu.endDate || edu.year || '',
          gpa: '',
          achievements: []
        })),
        projects: (parsedData.projects || []).map(proj => ({
          name: proj.name || '',
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.url || ''
        })),
        certifications: (parsedData.certifications || []).map(cert => ({
          name: typeof cert === 'string' ? cert : cert,
          issuer: '',
          date: ''
        })),
        languages: (parsedData.languages || []).map(lang => ({
          language: typeof lang === 'string' ? lang : lang,
          proficiency: ''
        }))
      };
      
      console.log('✅ Resume parsed successfully with DSPy-trained parser (4.1M+ records):', {
        name: result.personalInfo?.fullName || 'N/A',
        email: result.personalInfo?.email || 'N/A',
        phone: result.personalInfo?.phone || 'N/A',
        skills: result.skills?.length || 0,
        experience: result.experience?.length || 0,
        education: result.education?.length || 0,
        projects: result.projects?.length || 0,
        certifications: result.certifications?.length || 0,
        personalInfoSource: 'local_extraction',
        trainingData: '4.1M+ records from 8 datasets'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Resume parsing failed:', error);
      throw new Error(`Failed to parse resume with AI: ${error.message}`);
    }
  }

  /**
   * Remove markdown code blocks from JSON response
   */
  private removeMarkdownCodeBlocks(text: string): string {
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/g, '');
    }
    return text.trim();
  }

  /**
   * Basic JSON sanitization
   */
  private sanitizeJSON(jsonText: string): string {
    // Remove any text before the first {
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > 0) {
      jsonText = jsonText.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }
    
    return jsonText;
  }

  /**
   * Validate parsed resume data
   */
  validateParsedData(data: ParsedResumeData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate personal info
    if (!data.personalInfo?.fullName || data.personalInfo.fullName.trim() === '') {
      errors.push('Full name is required');
    }
    
    // Validate arrays
    if (!Array.isArray(data.skills)) {
      errors.push('Skills must be an array');
    }
    if (!Array.isArray(data.experience)) {
      errors.push('Experience must be an array');
    }
    if (!Array.isArray(data.education)) {
      errors.push('Education must be an array');
    }
    
    // Validate experience entries
    data.experience?.forEach((exp, index) => {
      if (!exp.company || !exp.position) {
        errors.push(`Experience entry ${index + 1} missing company or position`);
      }
    });
    
    // Validate education entries
    data.education?.forEach((edu, index) => {
      if (!edu.institution || !edu.degree) {
        errors.push(`Education entry ${index + 1} missing institution or degree`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up uploaded file after processing
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log('🗑️ Cleaned up temporary file:', filePath);
    } catch (error) {
      console.warn('⚠️ Failed to cleanup file:', error.message);
    }
  }
}

export const resumeParsingService = new ResumeParsingService();
