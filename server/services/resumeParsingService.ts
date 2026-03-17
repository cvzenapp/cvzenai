import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { jsonrepair } from 'jsonrepair';
import { resumeParser } from './dspy/resumeParser.js';
import { skillsExtractor } from './dspy/skillsExtractor.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
    position?: string;
    title?: string;
    location?: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    skills?:string[];
    responsibilities?:string[];
    achievements?: string[];
    others: string[];
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
    link?: string;
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

    // Extract LinkedIn URL or username
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/gi;
    const linkedinUsernameRegex = /linkedin\s*:?\s*([a-zA-Z0-9_-]+)(?:\s|$|\||,|;)/gi;
    
    let linkedinMatches = resumeText.match(linkedinRegex);
    if (linkedinMatches && linkedinMatches.length > 0) {
      personalInfo.linkedin = linkedinMatches[0];
      console.log('✅ LinkedIn URL extracted locally');
    } else {
      // Try to extract LinkedIn username/handle - try multiple patterns
      const patterns = [
        /linkedin\s*:?\s*([a-zA-Z0-9_-]+)(?:\s|$|\||,|;)/gi,
        /linkedin\s*:?\s*([a-zA-Z0-9_-]+)/gi,
        /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/gi
      ];
      
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex
        const usernameMatch = pattern.exec(resumeText);
        if (usernameMatch && usernameMatch[1]) {
          const username = usernameMatch[1].trim();
          personalInfo.linkedin = `https://linkedin.com/in/${username}`;
          console.log('✅ LinkedIn username extracted and converted to URL locally:', username);
          break;
        }
      }
    }

    // Extract GitHub URL or username
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/gi;
    const githubUsernameRegex = /github\s*:?\s*([a-zA-Z0-9_-]+)(?:\s|$|\||,|;)/gi;
    
    let githubMatches = resumeText.match(githubRegex);
    if (githubMatches && githubMatches.length > 0) {
      personalInfo.github = githubMatches[0];
      console.log('✅ GitHub URL extracted locally');
    } else {
      // Try to extract GitHub username/handle - try multiple patterns
      const patterns = [
        /github\s*:?\s*([a-zA-Z0-9_-]+)(?:\s|$|\||,|;)/gi,
        /github\s*:?\s*([a-zA-Z0-9_-]+)/gi,
        /github\.com\/([a-zA-Z0-9_-]+)/gi
      ];
      
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex
        const usernameMatch = pattern.exec(resumeText);
        if (usernameMatch && usernameMatch[1]) {
          const username = usernameMatch[1].trim();
          personalInfo.github = `https://github.com/${username}`;
          console.log('✅ GitHub username extracted and converted to URL locally:', username);
          break;
        }
      }
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
      
      // Look for name in first 15 lines (increased from 10)
      for (let i = 0; i < Math.min(15, lines.length); i++) {
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
        
        // Skip very short or very long lines
        if (line.length < 4 || line.length > 60) {
          continue;
        }
        
        // Name heuristics: 2-4 words, each capitalized, reasonable length
        const words = line.split(/\s+/).filter(w => w.length > 0);
        
        // Must be 2-4 words for full name
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
          return /^[A-Z][a-z]+$/.test(word) && word.length >= 2 && word.length <= 25;
        });
        
        // Additional validation: ensure it's not common non-name patterns
        const hasCommonNonNameWords = words.some(word => {
          const wordLower = word.toLowerCase();
          return ['resume', 'cv', 'curriculum', 'vitae', 'profile', 'contact', 'information', 'personal', 'details'].includes(wordLower);
        });
        
        if (isLikelyName && !hasCommonNonNameWords) {
          personalInfo.fullName = line;
          console.log('✅ Name extracted locally from resume text:', line);
          break;
        }
      }
    }

    // ENHANCED FALLBACK: Try alternative name extraction patterns if still not found
    if (!personalInfo.fullName) {
      console.log('⚠️ Primary name extraction failed, trying alternative patterns...');
      
      // Try to find name patterns anywhere in the first 20 lines
      const firstLines = resumeText.split('\n').slice(0, 20);
      
      for (const line of firstLines) {
        const trimmedLine = line.trim();
        
        // Skip lines with email, phone, URLs, or numbers
        if (emailRegex.test(trimmedLine) || phoneRegex.test(trimmedLine) || 
            trimmedLine.includes('http') || trimmedLine.includes('@') || /\d/.test(trimmedLine)) {
          continue;
        }
        
        // Look for "Name:" or "Full Name:" patterns
        const namePatternMatch = trimmedLine.match(/(?:name|full\s*name)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?){1,3})/i);
        if (namePatternMatch && namePatternMatch[1]) {
          personalInfo.fullName = namePatternMatch[1].trim();
          console.log('✅ Name extracted using pattern matching:', personalInfo.fullName);
          break;
        }
        
        // Look for standalone capitalized words that could be names (more flexible)
        const flexibleNameMatch = trimmedLine.match(/^([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]*\.?){0,2})$/);
        if (flexibleNameMatch && flexibleNameMatch[1] && trimmedLine.length <= 50) {
          const candidateName = flexibleNameMatch[1].trim();
          // Additional validation - ensure it doesn't contain common non-name words
          if (!/(resume|cv|profile|contact|objective|summary|experience|education|skills)/i.test(candidateName)) {
            personalInfo.fullName = candidateName;
            console.log('✅ Name extracted using flexible pattern:', personalInfo.fullName);
            break;
          }
        }
      }
    }

    // LAST RESORT: Extract from email only if absolutely no name found in resume
    if (!personalInfo.fullName && personalInfo.email) {
      console.log('⚠️ No name found in resume text, using email as last resort...');
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
        
        // Only use if it looks reasonable (4-50 chars, preferably 2+ words)
        if (capitalizedName.length >= 4 && capitalizedName.length <= 50) {
          personalInfo.fullName = capitalizedName;
          console.log('✅ Name extracted from email as fallback:', capitalizedName);
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
      // Check if file exists first
      if (!await fs.access(filePath).then(() => true).catch(() => false)) {
        throw new Error(`File not found: ${filePath}. Please ensure the file was uploaded correctly.`);
      }
      
      const fileBuffer = await fs.readFile(filePath);
      return this.extractTextFromBuffer(fileBuffer, mimeType);
    } catch (error: any) {
      console.error('❌ Text extraction failed:', error);
      
      // Provide more specific error messages
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}. The uploaded file may have been moved or deleted. Please try uploading again.`);
      } else if (error.code === 'EACCES') {
        throw new Error(`Permission denied accessing file: ${filePath}. Please try uploading again.`);
      } else if (error.message.includes('File not found')) {
        throw error; // Re-throw our custom file not found error
      } else {
        throw new Error(`Failed to extract text from file: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from buffer (for in-memory file uploads)
   */
  async extractTextFromBuffer(fileBuffer: Buffer, mimeType: string): Promise<string> {
    console.log('📄 Extracting text from buffer:', { mimeType, size: fileBuffer.length });
    
    try {
      if (mimeType === 'application/pdf') {
        // Extract from PDF using pdf-parse v2 (CommonJS require)
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: fileBuffer });
        const result = await parser.getText();
        await parser.destroy();
        
        let cleanText = result.text
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        console.log('✅ PDF text extracted:', {
          originalLength: result.text.length,
          cleanedLength: cleanText.length,
          preview: cleanText.substring(0, 200) + '...'
        });
        
        if (!cleanText || cleanText.length < 50) {
          throw new Error('PDF appears to be empty or contains mostly images. Please ensure your PDF contains selectable text.');
        }
        
        return cleanText;
      } else if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // Extract from DOCX
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        
        // Clean up extracted text
        // let cleanText = result.value
        //   .replace(/\r\n/g, '\n')
        //   .replace(/\r/g, '\n')
        //   .replace(/\n{3,}/g, '\n\n')
        //   .replace(/\s{2,}/g, ' ')
        //   .trim();
        
        const cleanText = result.value
  .replace(/style="[^"]*"/gi, '')
  .replace(/class="[^"]*"/gi, '')
  .replace(/<span[^>]*>/gi, '')
  .replace(/<\/span>/gi, '')
  .replace(/<div[^>]*>/gi, '\n')
  .replace(/<\/div>/gi, '')
  .replace(/<p[^>]*>/gi, '\n')
  .replace(/<\/p>/gi, '')
  .replace(/<[^>]+>/g, match => 
    /^<(h[1-6]|strong|li|ul|ol|\/h[1-6]|\/strong|\/li|\/ul|\/ol)/i.test(match) ? match : '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

        
        console.log('✅ DOCX text extracted:', {
          originalLength: result.value.length,
          cleanedLength: cleanText.length,
          preview: cleanText.substring(0, 200) + '...'
        });
        
        if (!cleanText || cleanText.length < 50) {
          throw new Error('Document appears to be empty or contains mostly images. Please ensure your document contains readable text.');
        }
        
        return cleanText;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, DOC, or DOCX file.`);
      }
    } catch (error: any) {
      console.error('❌ Text extraction failed:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file appears to be corrupted or is not a valid PDF. Please try uploading a different file.');
      } else if (error.message.includes('Password')) {
        throw new Error('Password-protected PDFs are not supported. Please upload an unprotected PDF file.');
      } else if (error.message.includes('empty') || error.message.includes('images')) {
        throw error; // Re-throw our custom empty content errors
      } else {
        throw new Error(`Failed to extract text from file: ${error.message}`);
      }
    }
  }

  /**
   * Parse resume text using Groq AI with DSPy-trained patterns (4.1M+ records)
   * PRIVACY-FIRST: Extracts personal info locally, redacts before sending to AI
   */
  async parseResumeWithAI(resumeText: string, userProvidedInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  }): Promise<ParsedResumeData> {
    console.log('🤖 Parsing resume with DSPy-trained parser (4.1M+ records)...');
    
    if (userProvidedInfo) {
      console.log('👤 User-provided personal info will take precedence:', {
        fullName: userProvidedInfo.fullName,
        email: userProvidedInfo.email,
        phone: userProvidedInfo.phone,
        location: userProvidedInfo.location
      });
    }
    
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
      
      // Step 4: Initialize skills extractor and process skills
      await skillsExtractor.initialize();
      
      // Step 5: Process skills through the skills extractor to add categories, proficiency, and core skill detection
      let processedSkills: any[] = [];
      if (parsedData.skills && parsedData.skills.length > 0) {
        console.log('🎯 Processing skills through skills extractor...');
        processedSkills = skillsExtractor.validateSkills(parsedData.skills);
        console.log(`✅ Processed ${processedSkills.length} skills with core skill detection`);
      }
      
      // Step 6: Convert to ParsedResumeData format and merge with local personal info
      const result: ParsedResumeData = {
        personalInfo: {
          // User-provided info takes highest precedence, then local extraction, then parsed data
          fullName: userProvidedInfo?.fullName || localPersonalInfo.fullName || parsedData.personalInfo?.name || '',
          email: userProvidedInfo?.email || localPersonalInfo.email || parsedData.personalInfo?.email || '',
          phone: userProvidedInfo?.phone || localPersonalInfo.phone || parsedData.personalInfo?.phone || '',
          location: userProvidedInfo?.location || parsedData.personalInfo?.location || '',
          linkedin: userProvidedInfo?.linkedin || localPersonalInfo.linkedin || parsedData.personalInfo?.linkedin || '',
          github: userProvidedInfo?.github || localPersonalInfo.github || '',
          website: userProvidedInfo?.website || localPersonalInfo.website || ''
        },
        summary: parsedData.summary || '',
        objective: parsedData.objective || '',
        skills: processedSkills, // Use processed skills with core detection
        skillCategories: parsedData.skillCategories || {},
        experience: parsedData.experience || [],
        education: (parsedData.education || []).map(edu => ({
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: edu.field || '',
          location: edu.location || '',
          startDate: edu.startDate || edu.year || '',
          endDate: edu.endDate || edu.year || '',
          gpa: edu.gpa || '',
          achievements: []
        })),
        projects: (parsedData.projects || []).map(proj => ({
          name: proj.name || '',
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.url || ''
        })),
        certifications: (parsedData.certifications || []).map(cert => {
          if (typeof cert === 'string') {
            return {
              name: cert,
              issuer: '',
              date: ''
            };
          } else {
            return {
              name: cert.name || '',
              issuer: cert.issuer || '',
              date: cert.date || '',
              link: cert.link || ''
            };
          }
        }),
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
        coreSkills: processedSkills.filter(s => s.isCore).length || 0,
        experience: result.experience?.length || 0,
        education: result.education?.length || 0,
        projects: result.projects?.length || 0,
        certifications: result.certifications?.length || 0,
        personalInfoSource: 'local_extraction',
        trainingData: '4.1M+ records from 8 datasets'
      });
      
      if (result.projects && result.projects.length > 0) {
        console.log(`📋 Project details: ${result.projects.map(p => `"${p.name}" (${(p.technologies || []).join(', ')})`).join(', ')}`);
      } else {
        console.log('⚠️ No projects found in parsed resume - check if resume has projects section');
      }
      
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
   * Server-side GitHub repository fetching
   */
  private async fetchGitHubRepositories(githubProfileUrl: string): Promise<any[]> {
    try {
      // Extract username from GitHub URL
      const username = this.extractGitHubUsername(githubProfileUrl);
      if (!username) {
        console.warn('Invalid GitHub profile URL:', githubProfileUrl);
        return [];
      }

      const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CVZen-Resume-Builder',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`GitHub user not found: ${username}`);
          return [];
        }
        if (response.status === 403) {
          console.warn('GitHub API rate limit exceeded');
          return [];
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      return data
        .filter((repo: any) => !repo.fork) // Exclude forked repositories
        .slice(0, 10) // Limit to 10 repositories
        .map((repo: any) => ({
          name: repo.name,
          description: repo.description || `${repo.name} - GitHub repository`,
          technologies: repo.language ? [repo.language] : [],
          link: repo.html_url,
          stars: repo.stargazers_count,
          isGitHubProject: true
        }));
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      return [];
    }
  }

  /**
   * Extract GitHub username from profile URL
   */
  private extractGitHubUsername(url: string): string | null {
    try {
      const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
      const match = cleanUrl.match(/github\.com\/([^/]+)\/?$/);
      if (match) {
        return match[1];
      }
      return null;
    } catch (error) {
      console.error('Error extracting GitHub username:', error);
      return null;
    }
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
