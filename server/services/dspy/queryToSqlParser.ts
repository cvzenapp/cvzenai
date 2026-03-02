import { groqService } from '../groqService.js';

/**
 * Intelligent Query Parser using Groq LLM
 * Converts natural language recruiter queries into structured SQL search parameters
 * Now integrated with audit logging via groqService
 */

export interface ParsedSearchQuery {
  skills: string[];
  location?: string;
  experienceYears?: {
    min?: number;
    max?: number;
  };
  jobTitle?: string;
  keywords: string[];
  remote?: boolean;
}

class QueryToSqlParser {
  constructor() {
    // No longer needs direct Groq instance - uses groqService
  }

  /**
   * Parse natural language query into structured search parameters
   */
  async parseQuery(query: string): Promise<ParsedSearchQuery> {
    try {
      console.log('🔍 [QUERY PARSER] Parsing query:', query);

      const response = await groqService.generateResponse(
        `You are a query parser that extracts structured search parameters from recruiter queries.

Extract the following information from the query and return ONLY a valid JSON object:
{
  "skills": ["array", "of", "technical", "skills"],
  "location": "city or region if mentioned",
  "experienceYears": {"min": number, "max": number},
  "jobTitle": "role or position title",
  "keywords": ["other", "relevant", "keywords"],
  "remote": true/false if remote work is mentioned
}

RULES:
1. Extract ALL technical skills mentioned (programming languages, frameworks, tools, technologies)
2. Extract location if mentioned (city, state, country, or "remote")
3. Extract experience years (e.g., "5-10 years" = {"min": 5, "max": 10}, "5+ years" = {"min": 5})
4. Extract job title/role (e.g., "full stack developer", "senior engineer")
5. Extract other relevant keywords (e.g., "marketing", "sales", "digital marketing")
6. Set remote=true if "remote" is mentioned
7. Return ONLY the JSON object, no explanations

EXAMPLES:

Query: "Find me full stack developers"
{"skills":["full stack"],"jobTitle":"full stack developer","keywords":["developer"],"remote":false}

Query: "I'm looking for mid-level candidates with around 5-10 years of experience in marketing and sales"
{"skills":["marketing","sales","digital marketing"],"experienceYears":{"min":5,"max":10},"jobTitle":"marketing specialist","keywords":["mid-level","marketing","sales"],"remote":false}

Query: "Search for React developers with 3+ years in San Francisco"
{"skills":["React","JavaScript"],"location":"San Francisco","experienceYears":{"min":3},"jobTitle":"React developer","keywords":["developer"],"remote":false}

Query: "Need senior Python engineers, remote OK"
{"skills":["Python"],"jobTitle":"senior Python engineer","keywords":["senior","engineer"],"remote":true}

Query: "Looking for DevOps specialists with AWS and Kubernetes experience"
{"skills":["DevOps","AWS","Kubernetes","Docker","CI/CD"],"jobTitle":"DevOps specialist","keywords":["specialist","cloud"],"remote":false}`,
        `Parse this query: "${query}"`,
        {
          temperature: 0.3,
          maxTokens: 300,
          auditContext: {
            serviceName: 'queryToSqlParser',
            operationType: 'query_parsing',
            userContext: {
              queryLength: query.length
            }
          }
        }
      );
      
      if (!response) {
        console.warn('⚠️ [QUERY PARSER] No response from LLM');
        return this.getFallbackParse(query);
      }

      // Extract JSON from response (in case LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ [QUERY PARSER] No JSON found in response:', response);
        return this.getFallbackParse(query);
      }

      const parsed: ParsedSearchQuery = JSON.parse(jsonMatch[0]);
      
      console.log('✅ [QUERY PARSER] Parsed successfully:', JSON.stringify(parsed, null, 2));
      
      return parsed;
    } catch (error) {
      console.error('❌ [QUERY PARSER] Error:', error);
      return this.getFallbackParse(query);
    }
  }

  /**
   * Fallback parser using simple keyword extraction
   */
  private getFallbackParse(query: string): ParsedSearchQuery {
    const lowerQuery = query.toLowerCase();
    
    // Extract skills using common tech keywords
    const techKeywords = [
      'react', 'vue', 'angular', 'node', 'nodejs', 'python', 'java', 'javascript', 
      'typescript', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql',
      'redis', 'graphql', 'rest', 'api', 'git', 'ci/cd', 'devops', 'agile',
      'full stack', 'fullstack', 'frontend', 'backend', 'mobile', 'ios', 'android',
      'marketing', 'sales', 'digital marketing', 'social media', 'content creation',
      'seo', 'sem', 'analytics', 'campaign', 'crm'
    ];
    
    const skills = techKeywords.filter(keyword => 
      lowerQuery.includes(keyword.toLowerCase())
    );
    
    // Extract location
    const locationMatch = lowerQuery.match(/in\s+([a-z\s]+?)(?:\s|$|,)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    // Extract experience years
    const expMatch = lowerQuery.match(/(\d+)[\s-]*(?:to|-)?\s*(\d+)?\s*(?:\+)?\s*years?/i);
    let experienceYears: { min?: number; max?: number } | undefined;
    if (expMatch) {
      experienceYears = {
        min: parseInt(expMatch[1]),
        max: expMatch[2] ? parseInt(expMatch[2]) : undefined
      };
    }
    
    // Extract job title
    const titleKeywords = ['developer', 'engineer', 'designer', 'manager', 'analyst', 'specialist'];
    const jobTitle = titleKeywords.find(keyword => lowerQuery.includes(keyword));
    
    // Check for remote
    const remote = /\b(remote|work from home|wfh)\b/i.test(query);
    
    return {
      skills,
      location,
      experienceYears,
      jobTitle,
      keywords: skills,
      remote
    };
  }
}

export const queryToSqlParser = new QueryToSqlParser();
