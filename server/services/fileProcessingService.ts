import mammoth from 'mammoth';

export class FileProcessingService {
  
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid initialization issues
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  async extractTextFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Word document extraction error:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  async extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'text/plain':
        return buffer.toString('utf-8');
      
      case 'application/pdf':
        return this.extractTextFromPDF(buffer);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractTextFromWord(buffer);
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  validateResumeContent(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length < 50) {
      return {
        valid: false,
        error: 'File content is too short. Please ensure the file contains a complete resume.'
      };
    }

    // Check for common resume keywords
    const resumeKeywords = [
      'experience', 'education', 'skills', 'work', 'employment', 
      'university', 'college', 'degree', 'job', 'position',
      'responsibilities', 'achievements', 'projects'
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = resumeKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );

    if (foundKeywords.length < 2) {
      return {
        valid: false,
        error: 'File does not appear to contain resume content. Please upload a valid resume file.'
      };
    }

    return { valid: true };
  }

  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  extractResumeMetadata(text: string): {
    estimatedLength: number;
    hasContactInfo: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
  } {
    const lowerText = text.toLowerCase();
    
    return {
      estimatedLength: text.length,
      hasContactInfo: /email|phone|@|linkedin|github/.test(lowerText),
      hasExperience: /experience|work|employment|job|position/.test(lowerText),
      hasEducation: /education|university|college|degree|school/.test(lowerText),
      hasSkills: /skills|technologies|programming|software/.test(lowerText)
    };
  }
}

export const fileProcessingService = new FileProcessingService();