import { tavilyService } from './tavilyService.js';
import { groqService } from './groqService.js';

export interface CompanyData {
  name: string;
  website: string;
  description: string;
  industry: string;
  size_range: string;
  location: string;
  founded_year?: number;
  employee_count?: number;
  company_type?: string;
  work_environment?: string;
  company_values?: string;
  specialties?: string[];
  benefits?: string[];
}

export interface CrawlResult {
  url: string;
  content: string;
  metadata?: any;
}

class CompanyDataExtractionService {
  /**
   * Crawl company website using Tavily API
   */
  async crawlCompanyWebsite(website: string): Promise<CrawlResult> {
    try {
      console.log(`🕷️ Crawling company website: ${website}`);
      
      // Ensure website has protocol
      const url = website.startsWith('http') ? website : `https://${website}`;
      
      const result = await tavilyService.crawlJobPosting(url);
      
      return {
        url: result.url,
        content: result.content,
        metadata: result.metadata
      };
    } catch (error) {
      console.error("❌ Website crawling error:", error);
      throw new Error(`Failed to crawl website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract company information from crawled content using Groq AI
   */
  async extractCompanyData(crawlResult: CrawlResult, website: string): Promise<CompanyData> {
    try {
      console.log(`🤖 Extracting company data using Groq AI`);
      
      const systemPrompt = this.getCompanyExtractionSystemPrompt();
      const userPrompt = this.buildExtractionPrompt(crawlResult.content, website);
      
      const groqResponse = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.1, // Low temperature for consistent extraction
          maxTokens: 1024,
          auditContext: {
            serviceName: 'company_extraction',
            operationType: 'extract_company_data'
          }
        }
      );

      if (!groqResponse.success || !groqResponse.response) {
        throw new Error('Failed to extract company data from AI response');
      }

      return this.parseCompanyDataFromAI(groqResponse.response, website);
    } catch (error) {
      console.error("❌ Company data extraction error:", error);
      throw new Error(`Failed to extract company data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get system prompt for company extraction
   */
  private getCompanyExtractionSystemPrompt(): string {
    return `You are a company data extraction specialist that outputs ONLY valid JSON.

🚨 ABSOLUTE REQUIREMENTS 🚨
1. Your FIRST character must be {
2. Your LAST character must be }
3. ZERO text before the JSON object
4. ZERO text after the JSON object
5. NO explanations or commentary
6. NO markdown formatting

TASK: Extract structured company information from website content.
FOCUS: Company name, industry, size, location, description, values, specialties, benefits.

Extract only factual information from the provided content. If information is not clearly available, use reasonable defaults or null values. Ensure all extracted data is accurate and professional.`;
  }

  /**
   * Build extraction prompt for Groq AI
   */
  private buildExtractionPrompt(content: string, website: string): string {
    return `
Website URL: ${website}

Website Content:
${content.substring(0, 4000)}

Please extract and return the following company information in JSON format:

{
  "name": "Company name (required)",
  "website": "${website}",
  "description": "Brief company description (2-3 sentences, required)",
  "industry": "Primary industry (e.g., Technology, Healthcare, Finance, etc.)",
  "size_range": "Company size range (e.g., '1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1000 employees', '1001-5000 employees', '5001-10000 employees', '10000+ employees')",
  "location": "Primary company location (city, state/country)",
  "founded_year": "Year founded (number, if available)",
  "employee_count": "Approximate number of employees (number, if available)",
  "company_type": "Type of company (e.g., 'Startup', 'Enterprise', 'SME', 'Corporation')",
  "work_environment": "Work environment (e.g., 'Remote', 'Hybrid', 'On-site', 'Flexible')",
  "company_values": "Core company values or mission statement",
  "specialties": ["Array of company specialties or focus areas"],
  "benefits": ["Array of employee benefits mentioned"]
}

Rules:
1. Extract only factual information from the content
2. If information is not available, use null for optional fields
3. For required fields (name, description), make reasonable inferences from available content
4. Keep descriptions concise but informative
5. Use standard industry categories
6. Return only valid JSON without additional text
7. If the website appears to be a personal blog or non-business site, still extract what information is available
`;
  }

  /**
   * Parse company data from AI response
   */
  private parseCompanyDataFromAI(aiResponse: string, website: string): CompanyData {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Validate and set defaults for required fields
      const companyData: CompanyData = {
        name: parsedData.name || this.extractCompanyNameFromWebsite(website),
        website: website,
        description: parsedData.description || 'Company information will be updated soon.',
        industry: parsedData.industry || 'Other',
        size_range: this.validateSizeRange(parsedData.size_range) || '1-10 employees',
        location: parsedData.location || 'Location not specified',
        founded_year: parsedData.founded_year ? parseInt(parsedData.founded_year) : undefined,
        employee_count: parsedData.employee_count ? parseInt(parsedData.employee_count) : undefined,
        company_type: parsedData.company_type || 'Company',
        work_environment: parsedData.work_environment || 'On-site',
        company_values: parsedData.company_values || null,
        specialties: Array.isArray(parsedData.specialties) ? parsedData.specialties : [],
        benefits: Array.isArray(parsedData.benefits) ? parsedData.benefits : []
      };

      return companyData;
    } catch (error) {
      console.error("❌ Error parsing AI response:", error);
      
      // Return fallback data
      return {
        name: this.extractCompanyNameFromWebsite(website),
        website: website,
        description: 'Company information will be updated soon.',
        industry: 'Other',
        size_range: '1-10 employees',
        location: 'Location not specified'
      };
    }
  }

  /**
   * Extract company name from website domain
   */
  private extractCompanyNameFromWebsite(website: string): string {
    try {
      const url = website.startsWith('http') ? website : `https://${website}`;
      const domain = new URL(url).hostname.replace('www.', '');
      const name = domain.split('.')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return website.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
    }
  }

  /**
   * Validate company size range
   */
  private validateSizeRange(sizeRange: string): string | null {
    const validSizes = [
      '1-10 employees',
      '11-50 employees', 
      '51-200 employees',
      '201-500 employees',
      '501-1000 employees',
      '1001-5000 employees',
      '5001-10000 employees',
      '10000+ employees'
    ];

    if (validSizes.includes(sizeRange)) {
      return sizeRange;
    }

    // Try to map common variations
    if (sizeRange && sizeRange.toLowerCase().includes('startup')) {
      return '1-10 employees';
    }
    if (sizeRange && sizeRange.toLowerCase().includes('small')) {
      return '11-50 employees';
    }
    if (sizeRange && sizeRange.toLowerCase().includes('medium')) {
      return '51-200 employees';
    }
    if (sizeRange && sizeRange.toLowerCase().includes('large')) {
      return '501-1000 employees';
    }

    return null;
  }

  /**
   * Complete company data extraction workflow
   */
  async extractCompanyDataFromWebsite(website: string): Promise<CompanyData> {
    try {
      console.log(`🏢 Starting company data extraction for: ${website}`);
      
      // Step 1: Crawl website
      const crawlResult = await this.crawlCompanyWebsite(website);
      
      // Step 2: Extract data using AI
      const companyData = await this.extractCompanyData(crawlResult, website);
      
      console.log(`✅ Company data extraction completed for: ${companyData.name}`);
      return companyData;
      
    } catch (error) {
      console.error("❌ Complete extraction workflow error:", error);
      
      // Return minimal fallback data
      return {
        name: this.extractCompanyNameFromWebsite(website),
        website: website,
        description: 'Company information will be updated soon.',
        industry: 'Other',
        size_range: '1-10 employees',
        location: 'Location not specified'
      };
    }
  }
}

export const companyDataExtractionService = new CompanyDataExtractionService();