import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, getAuthenticatedUser } from "../middleware/unifiedAuth.js";
import { initializeDatabase, closeDatabase } from "../database/connection.js";
import { aiService } from "../services/aiService.js";
import { aiMemoryService } from "../services/aiMemoryService.js";
import { tavilyService } from "../services/tavilyService.js";
import { candidateSearchService } from "../services/candidateSearchService.js";
import { recruiterChatPromptOptimizer } from "../services/dspy/recruiterChatPromptOptimizer.js";
import { jobDescriptionGenerator } from "../services/dspy/jobDescriptionGenerator.js";
import multer from 'multer';
import { fileProcessingService } from "../services/fileProcessingService.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types for resume analysis
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Validation schemas
const recruiterChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  searchSource: z.enum(['cvzen', 'web', 'both']).optional().default('both'),
  context: z.object({
    selectedJobId: z.number().optional().nullable(),
    recruiterProfile: z.object({
      company: z.string().optional(),
      industry: z.string().optional(),
      location: z.string().optional(),
      jobTitle: z.string().optional(),
    }).optional(),
  }).optional(),
});

interface CandidateResult {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  availability: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  email?: string;
  summary: string;
  // AI Screening fields
  aiScore?: number;
  aiRecommendation?: 'Highly Recommended' | 'Recommended' | 'Maybe' | 'Not Recommended';
  aiStrengths?: string[];
  aiConcerns?: string[];
  aiReasoning?: string;
}

interface RecruiterChatResponse {
  success: boolean;
  response: {
    type: 'text' | 'candidates' | 'job_description';
    content: string;
    candidateResults?: CandidateResult[];
    jobDescription?: any; // Job description template object
    suggestions?: string[];
    actionItems?: string[];
  };
}

// Function to search candidates in CVZen database
async function searchCandidatesInDatabase(searchQuery: string): Promise<CandidateResult[]> {
  try {
    console.log('🔍 [DATABASE SEARCH] Starting search with query:', searchQuery);
    
    // Extract search parameters from query
    const lowerQuery = searchQuery.toLowerCase();
    
    // Extract skills from query
    const techKeywords = ['react', 'node', 'python', 'java', 'typescript', 'javascript', 'vue', 
                         'angular', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql',
                         'redis', 'graphql', 'rest', 'git', 'ci/cd', 'agile', 'microservices',
                         'frontend', 'backend', 'fullstack', 'full stack', 'devops', 'mobile',
                         'ios', 'android', 'flutter', 'react native'];
    
    const skills = techKeywords.filter(keyword => 
      lowerQuery.includes(keyword.toLowerCase())
    );
    
    // Extract location if mentioned
    const locationMatch = lowerQuery.match(/in\s+([a-z\s]+?)(?:\s|$|,)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    // Search database
    const dbCandidates = await candidateSearchService.searchLocalCandidates({
      query: searchQuery,
      skills: skills.length > 0 ? skills : undefined,
      location,
      limit: 10
    });
    
    console.log(`✅ [DATABASE SEARCH] Found ${dbCandidates.length} candidates from CVZen database`);
    
    // Transform to CandidateResult format
    const candidates: CandidateResult[] = dbCandidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      title: candidate.title,
      location: candidate.location,
      experience: candidate.experience,
      skills: candidate.skills,
      matchScore: candidate.matchScore,
      availability: candidate.availability,
      resumeUrl: candidate.resumeUrl,
      linkedinUrl: candidate.linkedinUrl,
      email: candidate.email,
      summary: candidate.summary
    }));
    
    return candidates;
    
  } catch (error) {
    console.error('❌ [DATABASE SEARCH] Error:', error);
    return [];
  }
}

// Function to search candidates using Tavily (external search)
async function searchCandidatesWithTavily(searchQuery: string): Promise<CandidateResult[]> {
  try {
    console.log('🔍 [TAVILY CANDIDATE SEARCH] Starting search with query:', searchQuery);
    
    // Build candidate-focused search query for Tavily
    // Focus on finding professional profiles, not job postings
    let tavilyQuery = searchQuery;
    
    // Remove job-posting keywords that might confuse the search
    tavilyQuery = tavilyQuery.replace(/\b(job|position|opening|hiring|vacancy|vacancies)\b/gi, '');
    
    // Add candidate-specific keywords to find profiles
    const hasProfileKeywords = /\b(linkedin|github|portfolio|profile|resume|cv)\b/i.test(tavilyQuery);
    if (!hasProfileKeywords) {
      tavilyQuery += " site:linkedin.com/in OR site:github.com profile";
    }
    
    console.log('📝 [TAVILY] Final search query:', tavilyQuery);
    
    // Use Tavily to search for candidate profiles
    const searchResults = await tavilyService.searchJobs({
      query: tavilyQuery,
      maxResults: 10
    });
    
    console.log(`✅ [TAVILY] Received ${searchResults.length} results from Tavily API`);
    
    if (searchResults.length > 0) {
      console.log('📊 [TAVILY] Sample result:', {
        title: searchResults[0].title,
        url: searchResults[0].url,
        contentPreview: searchResults[0].content?.substring(0, 100)
      });
    }
    
    // Filter out job posting sites and keep only profile sites
    const profileResults = searchResults.filter(result => {
      const url = result.url.toLowerCase();
      const isJobBoard = url.includes('indeed.com') || 
                        url.includes('glassdoor.com') || 
                        url.includes('monster.com') ||
                        url.includes('ziprecruiter.com') ||
                        url.includes('careerbuilder.com') ||
                        url.includes('/jobs/') ||
                        url.includes('/job/');
      
      const isProfile = url.includes('linkedin.com/in/') || 
                       url.includes('github.com/') ||
                       url.includes('portfolio') ||
                       url.includes('about') ||
                       url.includes('profile');
      
      return !isJobBoard || isProfile;
    });
    
    console.log(`🎯 [TAVILY] Filtered to ${profileResults.length} profile results (removed job boards)`);
    
    // Transform Tavily results to CandidateResult format
    const candidates: CandidateResult[] = profileResults.map((result, index) => {
      const title = result.title || 'Professional';
      const content = result.content || '';
      const url = result.url;
      
      console.log(`👤 [TAVILY] Processing candidate ${index + 1}:`, {
        title: title.substring(0, 50),
        url: url
      });
      
      // Extract name from title (LinkedIn format: "Name - Title | Company")
      let name = `Candidate ${index + 1}`;
      const linkedInNameMatch = title.match(/^([^-|]+?)(?:\s*[-|]|$)/);
      if (linkedInNameMatch) {
        name = linkedInNameMatch[1].trim();
      }
      
      // Extract job title from title or content
      let jobTitle = 'Professional';
      const titleMatch = title.match(/[-|]\s*([^|]+?)(?:\s*\||$)/);
      if (titleMatch) {
        jobTitle = titleMatch[1].trim();
      } else {
        // Try to find title in content
        const titleKeywords = ['Software Engineer', 'Developer', 'Engineering Manager', 'Product Manager', 
                              'Designer', 'Data Scientist', 'DevOps Engineer', 'Full Stack', 'Frontend', 
                              'Backend', 'Mobile Developer', 'Architect', 'Tech Lead'];
        for (const keyword of titleKeywords) {
          if (content.includes(keyword)) {
            jobTitle = keyword;
            break;
          }
        }
      }
      
      // Extract skills from content
      const techKeywords = ['React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript', 'Vue', 
                           'Angular', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL',
                           'Redis', 'GraphQL', 'REST API', 'Git', 'CI/CD', 'Agile', 'Microservices'];
      const skills = techKeywords.filter(keyword => 
        new RegExp(`\\b${keyword}\\b`, 'i').test(content)
      );
      
      // Extract location
      let location = 'Location not specified';
      const locationPatterns = [
        /(?:Based in|Located in|From)\s+([A-Z][a-z]+(?:,?\s+[A-Z]{2,})?)/,
        /([A-Z][a-z]+,\s+[A-Z]{2,})\s+(?:Area|Metropolitan)/,
        /\b([A-Z][a-z]+(?:,?\s+(?:CA|NY|TX|FL|WA|IL|MA|CO|GA|NC|VA|PA|OH|MI|AZ|MN|WI|TN|MO|MD|IN|SC|OR|KY|OK|CT|UT|NV|NM|WV|NE|ID|HI|ME|NH|RI|MT|DE|SD|ND|AK|VT|WY)))\b/
      ];
      
      for (const pattern of locationPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          location = match[1].trim();
          break;
        }
      }
      
      // Extract experience years
      let experience = 'Experience not specified';
      const expMatch = content.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i);
      if (expMatch) {
        experience = `${expMatch[1]}+ years`;
      }
      
      // Create summary from content
      const summary = content.substring(0, 250).trim() + (content.length > 250 ? '...' : '');
      
      // Determine if it's a LinkedIn or GitHub profile
      const isLinkedIn = url.includes('linkedin.com');
      const isGitHub = url.includes('github.com');
      
      const candidate: CandidateResult = {
        id: `tavily-${Date.now()}-${index}`,
        name: name,
        title: jobTitle,
        location: location,
        experience: experience,
        skills: skills.slice(0, 8),
        matchScore: Math.round(result.score * 100),
        availability: 'Contact via profile',
        summary: summary,
        linkedinUrl: isLinkedIn ? url : undefined,
        resumeUrl: url
      };
      
      console.log(`✅ [TAVILY] Processed candidate:`, {
        name: candidate.name,
        title: candidate.title,
        skills: candidate.skills.length,
        matchScore: candidate.matchScore
      });
      
      return candidate;
    });
    
    console.log(`🎉 [TAVILY] Successfully processed ${candidates.length} candidates`);
    
    return candidates;
    
  } catch (error) {
    console.error('❌ [TAVILY] Candidate search error:', error);
    return [];
  }
}

// Function to check if query is too vague and needs clarification
function isQueryTooVague(message: string): { isVague: boolean; missingDetails: string[] } {
  const lowerMessage = message.toLowerCase();
  const missingDetails: string[] = [];
  
  // Check for vague candidate search queries
  const hasSearchIntent = /\b(find|search|looking for|need|hire|recruit)\b/i.test(message);
  const hasRoleKeyword = /\b(candidate|developer|engineer|designer|manager|analyst|architect|programmer|specialist|consultant|professional)\b/i.test(message);
  
  if (hasSearchIntent && hasRoleKeyword) {
    // Check for specific details
    const hasSpecificSkills = /\b(react|node|python|java|typescript|javascript|vue|angular|aws|docker|kubernetes|sql|mongodb|postgresql|\.net|c\+\+|c#|ruby|go|rust|swift|kotlin|php|laravel|django|flask|spring|express|graphql|rest|api|microservices|devops|ci\/cd|agile|scrum|machine learning|ai|data science|analytics|frontend|backend|fullstack|full stack|mobile|ios|android|flutter|react native)\b/i.test(message);
    
    const hasExperienceLevel = /\b(\d+\+?\s*years?|entry|junior|mid|senior|lead|principal|staff|expert|experienced|fresher|graduate)\b/i.test(message);
    
    const hasLocation = /\b(in|at|near|around|location|remote|hybrid|on-?site|onsite)\s+([a-z\s,]+)/i.test(message) || /\b(san francisco|new york|london|berlin|bangalore|seattle|austin|boston|chicago|los angeles|toronto|sydney|singapore|tokyo|paris|amsterdam|dublin|munich|barcelona|madrid|stockholm|copenhagen|helsinki|oslo|zurich|geneva|hong kong|shanghai|beijing|delhi|mumbai|pune|hyderabad|chennai|kolkata)\b/i.test(message);
    
    const hasJobType = /\b(full.?time|part.?time|contract|freelance|permanent|temporary|internship)\b/i.test(message);
    
    const hasSalaryRange = /\b(\$|salary|compensation|pay|budget)\s*[\d,k\-]+/i.test(message);
    
    // Determine what's missing
    if (!hasSpecificSkills) {
      missingDetails.push('specific technical skills or technologies');
    }
    if (!hasExperienceLevel) {
      missingDetails.push('experience level (junior, mid, senior, etc.)');
    }
    if (!hasLocation) {
      missingDetails.push('location or remote preference');
    }
    
    // Query is vague if missing 2 or more key details
    const isVague = missingDetails.length >= 2;
    
    return { isVague, missingDetails };
  }
  
  // Check for other vague queries
  const vaguePhrases = [
    /^find candidates?$/i,
    /^search for candidates?$/i,
    /^i need (a |some )?candidates?$/i,
    /^looking for (a |some )?candidates?$/i,
    /^find (me )?(a |some )?(good |qualified )?candidates?$/i,
    /^find (someone|people) with skills?$/i,
    /^need (a |some )?(developer|engineer|designer)s?$/i
  ];
  
  const isGenericQuery = vaguePhrases.some(pattern => pattern.test(message.trim()));
  
  if (isGenericQuery) {
    return {
      isVague: true,
      missingDetails: ['role/position', 'required skills', 'experience level', 'location']
    };
  }
  
  return { isVague: false, missingDetails: [] };
}

// Function to generate clarifying questions
function generateClarifyingQuestions(missingDetails: string[], recruiterName?: string): string {
  const greeting = recruiterName ? `Hey ${recruiterName}! ` : 'Hey! ';
  
  const questions: string[] = [];
  
  if (missingDetails.includes('specific technical skills or technologies')) {
    questions.push('What specific skills or tech stack are you looking for? (like React, Python, AWS, etc.)');
  }
  if (missingDetails.includes('experience level (junior, mid, senior, etc.)')) {
    questions.push('What experience level works for you? (junior, mid-level, senior, etc.)');
  }
  if (missingDetails.includes('location or remote preference')) {
    questions.push('Where should they be located? (or is remote okay?)');
  }
  if (missingDetails.includes('role/position')) {
    questions.push('What role are you hiring for exactly? (like Senior Frontend Dev, DevOps Engineer, etc.)');
  }
  if (missingDetails.includes('required skills')) {
    questions.push('What are the must-have skills?');
  }
  
  const intro = `${greeting}I'd love to help you find great candidates! Just need a few more details:\n\n`;
  const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  const outro = '\n\nGive me these details and I\'ll find you some perfect matches! 🎯';
  
  return intro + questionsList + outro;
}

// AI response generation function for recruiters
async function generateRecruiterAIResponse(
  message: string, 
  searchSource: 'cvzen' | 'web' | 'both' = 'both',
  recruiterContext?: any,
  recruiterName?: string
): Promise<RecruiterChatResponse> {
  console.log('🎯 [RECRUITER AI] Received message:', message);
  console.log('🔍 [SEARCH SOURCE]:', searchSource);
  
  const lowerMessage = message.toLowerCase();
  
  // Check if query is too vague
  const { isVague, missingDetails } = isQueryTooVague(message);
  
  if (isVague) {
    console.log('⚠️ [VAGUE QUERY DETECTED] Missing details:', missingDetails);
    
    const clarificationMessage = generateClarifyingQuestions(missingDetails, recruiterName);
    
    return {
      success: true,
      response: {
        type: 'text',
        content: clarificationMessage,
        suggestions: [
          'Find senior React developers with 5+ years in San Francisco',
          'Search for mid-level Python engineers, remote OK',
          'Looking for DevOps specialists with AWS and Kubernetes in NYC'
        ],
        actionItems: [
          'Specify the role and seniority level',
          'List must-have technical skills',
          'Mention location or remote preferences'
        ]
      }
    };
  }
  
  // Check if this is a job description request
  const jobDescKeywords = ['job description', 'jd', 'create job', 'write job', 'draft job', 'job posting', 'job post'];
  const isJobDescriptionRequest = jobDescKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check if this is a candidate search query - improved detection
  const searchKeywords = ['find', 'search', 'looking for', 'need', 'hire', 'recruit'];
  const roleKeywords = ['candidate', 'developer', 'engineer', 'designer', 'manager', 'analyst', 
                       'architect', 'programmer', 'specialist', 'consultant', 'professional'];
  const excludeKeywords = ['job description', 'create', 'write', 'draft', 'how to'];
  
  const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasRoleKeyword = roleKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasExcludeKeyword = excludeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  const isCandidateSearch = hasSearchIntent && hasRoleKeyword && !hasExcludeKeyword && !isJobDescriptionRequest;
  
  console.log('🔍 [REQUEST DETECTION]', {
    message: message.substring(0, 50),
    isJobDescriptionRequest,
    isCandidateSearch,
    searchSource
  });
  
  // Handle job description generation requests
  if (isJobDescriptionRequest) {
    console.log('📝 [JOB DESCRIPTION] Generating job description...');
    
    // Extract job details from message
    const jobTitleMatch = message.match(/(?:for|create|write|draft)\s+(?:a\s+)?(?:job\s+description\s+for\s+)?(?:a\s+)?([^.!?\n]+?)(?:\s+position|\s+role|$)/i);
    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Software Developer';
    
    // Extract additional context
    const experienceMatch = message.match(/(\d+[\+\-]?\s*(?:to\s+\d+)?\s*years?)/i);
    const locationMatch = message.match(/(?:in|at|location:?)\s+([a-z\s,]+?)(?:\s|$|,)/i);
    const workTypeMatch = message.match(/\b(remote|hybrid|on-?site|full-?time|part-?time|contract)\b/i);
    
    const jobDescResult = await jobDescriptionGenerator.generateJobDescription({
      jobTitle,
      experience: experienceMatch ? experienceMatch[1] : undefined,
      location: locationMatch ? locationMatch[1].trim() : undefined,
      workType: workTypeMatch ? workTypeMatch[1] : undefined,
      additionalContext: message
    });
    
    // Format the job description for display
    const formattedDescription = `
${jobDescResult.jobTitle}

${jobDescResult.description}

Key Responsibilities:
${jobDescResult.responsibilities.map(r => `• ${r}`).join('\n')}

Required Skills:
${jobDescResult.skills.map(s => `• ${s}`).join('\n')}

Qualifications:
${jobDescResult.qualifications}

Benefits:
${jobDescResult.benefits.map(b => `• ${b}`).join('\n')}

Experience Required: ${jobDescResult.experience}
Work Type: ${jobDescResult.workType}
    `.trim();
    
    // Create structured job description object for the card
    // Extract department from job title or role
    const extractDepartment = (title: string, role: string): string => {
      const titleLower = (title + ' ' + role).toLowerCase();
      if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('software')) return 'Engineering';
      if (titleLower.includes('design') || titleLower.includes('ux') || titleLower.includes('ui')) return 'Design';
      if (titleLower.includes('market') || titleLower.includes('growth')) return 'Marketing';
      if (titleLower.includes('sales') || titleLower.includes('account')) return 'Sales';
      if (titleLower.includes('product')) return 'Product';
      if (titleLower.includes('data') || titleLower.includes('analyst')) return 'Data & Analytics';
      if (titleLower.includes('hr') || titleLower.includes('people') || titleLower.includes('recruit')) return 'Human Resources';
      if (titleLower.includes('finance') || titleLower.includes('accounting')) return 'Finance';
      if (titleLower.includes('operations') || titleLower.includes('ops')) return 'Operations';
      if (titleLower.includes('customer') || titleLower.includes('support')) return 'Customer Success';
      return 'General';
    };
    
    // Extract level from experience or title
    const extractLevel = (experience: string, title: string): string => {
      const expLower = (experience + ' ' + title).toLowerCase();
      if (expLower.includes('senior') || expLower.includes('sr.') || expLower.includes('lead') || expLower.includes('principal')) return 'Senior';
      if (expLower.includes('junior') || expLower.includes('jr.') || expLower.includes('entry') || expLower.includes('associate')) return 'Junior';
      if (expLower.includes('mid') || expLower.includes('intermediate')) return 'Mid-Level';
      // Parse years of experience
      const yearsMatch = experience.match(/(\d+)/);
      if (yearsMatch) {
        const years = parseInt(yearsMatch[1]);
        if (years >= 5) return 'Senior';
        if (years <= 2) return 'Junior';
        return 'Mid-Level';
      }
      return 'Mid-Level';
    };
    
    const jobDescriptionTemplate = {
      title: jobDescResult.jobTitle,
      department: extractDepartment(jobDescResult.jobTitle, jobDescResult.role),
      level: extractLevel(jobDescResult.experience, jobDescResult.jobTitle),
      type: jobDescResult.workType || 'Full-Time',
      description: jobDescResult.description,
      responsibilities: jobDescResult.responsibilities,
      requirements: jobDescResult.skills,
      benefits: jobDescResult.benefits,
      salaryRange: jobDescResult.salaryRange
    };
    
    return {
      success: true,
      response: {
        type: 'job_description',
        content: `I've created a job description for ${jobDescResult.jobTitle}. You can review it below and use the "Screen with AI" button to find matching candidates.`,
        jobDescription: jobDescriptionTemplate,
        suggestions: [
          'Screen candidates with AI for this role',
          'Customize the job description for your company',
          'Post this job on multiple platforms'
        ],
        actionItems: [
          'Review and edit the job description',
          'Add your company branding and culture',
          'Post to job boards and LinkedIn'
        ]
      }
    };
  }
  
  if (isCandidateSearch) {
    let allCandidates: CandidateResult[] = [];
    let searchSummary = '';
    
    // Search based on source preference
    if (searchSource === 'cvzen' || searchSource === 'both') {
      console.log('🔍 [SEARCH] Searching CVZen database...');
      const dbCandidates = await searchCandidatesInDatabase(message);
      allCandidates.push(...dbCandidates);
      console.log(`✅ Found ${dbCandidates.length} candidates from CVZen database`);
    }
    
    if (searchSource === 'web' || searchSource === 'both') {
      console.log('🔍 [SEARCH] Searching web via Tavily...');
      const webCandidates = await searchCandidatesWithTavily(message);
      allCandidates.push(...webCandidates);
      console.log(`✅ Found ${webCandidates.length} candidates from web search`);
    }
    
    // Create search summary
    if (searchSource === 'both') {
      const dbCount = allCandidates.filter(c => c.id.startsWith('cvzen-')).length;
      const webCount = allCandidates.filter(c => c.id.startsWith('tavily-')).length;
      searchSummary = `Found ${allCandidates.length} total candidates: ${dbCount} from CVZen database and ${webCount} from web search.`;
    } else if (searchSource === 'cvzen') {
      searchSummary = `Found ${allCandidates.length} candidates from CVZen database.`;
    } else {
      searchSummary = `Found ${allCandidates.length} candidates from web search.`;
    }
    
    console.log(`✅ ${searchSummary}`);
    
    // Sort by match score
    allCandidates.sort((a, b) => b.matchScore - a.matchScore);
    
    // Generate AI response about the search
    const aiPrompt = `${searchSummary} Write a brief (1-2 sentences) professional message to the recruiter about these search results. Do NOT describe individual candidates - just acknowledge the search was completed and mention the sources used.`;

    const aiResult = await aiService.generateResponse({
      type: 'general_chat',
      content: aiPrompt,
      context: recruiterContext
    });
    
    return {
      success: true,
      response: {
        type: 'candidates',
        content: aiResult.response,
        candidateResults: allCandidates,
        suggestions: [
          searchSource === 'cvzen' || searchSource === 'both' 
            ? 'Contact CVZen candidates directly through the platform'
            : 'Reach out via LinkedIn for better response rates',
          'Review their profiles and portfolios carefully',
          'Consider candidates with transferable skills from related technologies'
        ],
        actionItems: [
          searchSource === 'cvzen' || searchSource === 'both'
            ? 'Shortlist promising CVZen candidates for interviews'
            : 'Send personalized connection requests on LinkedIn',
          'Prepare a compelling job opportunity message',
          'Schedule initial screening calls with interested candidates'
        ]
      }
    };
  }
  
  // For all other queries, use AI service with recruiter-specific context
  const aiResult = await aiService.generateResponse({
    type: 'general_chat',
    content: `You are a friendly, casual recruiting assistant - like a helpful colleague, not a formal business assistant.

IMPORTANT TONE GUIDELINES:
- Use casual, conversational language
- NO formal greetings like "Dear Recruiter" or signatures
- Be direct and friendly, like chatting with a coworker
- Use contractions (I'll, you're, let's) to sound natural
- Keep it brief and to the point

User question: ${message}

Provide practical, actionable recruiting advice in a friendly, casual tone.`,
    context: recruiterContext
  });
  
  return {
    success: true,
    response: {
      type: 'text',
      content: aiResult.response,
      suggestions: [
        'Ask for specific examples or templates',
        'Request detailed analysis of your situation',
        'Explore related topics or best practices'
      ]
    }
  };
}

// POST /api/recruiter-ai-chat/message
router.post("/message", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }

    const validatedData = recruiterChatMessageSchema.parse(req.body);
    const { message, searchSource, context } = validatedData;
    
    const startTime = Date.now();
    
    // Get or create active chat session for recruiter
    let session;
    try {
      session = await aiMemoryService.getOrCreateActiveSession(user.id, 'recruiter');
      console.log(`✅ Got/created session ${session.id} for recruiter ${user.id}`);
      
      // Save user message to chat history
      await aiMemoryService.saveChatMessage(
        session.id,
        user.id,
        'user',
        message,
        {
          aiType: 'recruiter_chat',
          contextData: { searchSource, ...context }
        }
      );
      console.log(`✅ Saved user message to session ${session.id}`);
    } catch (dbError) {
      console.error('❌ Database error saving message:', dbError);
      // Continue without saving - don't block the chat
    }
    
    // Generate AI response with search source and recruiter name
    const aiResponse = await generateRecruiterAIResponse(
      message, 
      searchSource, 
      { recruiterId: user.id, ...context },
      user.firstName || user.name
    );
    
    const processingTime = Date.now() - startTime;
    
    // Save assistant response to chat history
    if (session) {
      try {
        await aiMemoryService.saveChatMessage(
          session.id,
          user.id,
          'assistant',
          aiResponse.response.content,
          {
            aiType: 'recruiter_chat',
            processingTimeMs: processingTime,
            contextData: {
              responseType: aiResponse.response.type,
              searchSource,
              candidateCount: aiResponse.response.candidateResults?.length || 0
            }
          }
        );
        console.log(`✅ Saved assistant response to session ${session.id}`);
      } catch (dbError) {
        console.error('❌ Database error saving assistant response:', dbError);
      }
    }
    
    // Log the interaction (optional - for analytics)
    console.log(`Recruiter AI Chat - User ${user.id}: ${message} [Source: ${searchSource}]`);
    
    res.json(aiResponse);
    
  } catch (error) {
    console.error("Recruiter AI Chat error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request format",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to process your message. Please try again."
    });
  }
});

// POST /api/recruiter-ai-chat/stream - Streaming endpoint for real-time responses
router.post("/stream", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }

    console.log('📥 Received stream request:', {
      body: req.body,
      user: { id: user.id, userType: user.userType }
    });

    let validatedData;
    try {
      validatedData = recruiterChatMessageSchema.parse(req.body);
    } catch (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validationError instanceof Error ? validationError.message : 'Unknown validation error'
      });
    }

    const { message, searchSource, context } = validatedData;
    
    const startTime = Date.now();
    
    // Get or create active chat session for recruiter
    let session;
    try {
      session = await aiMemoryService.getOrCreateActiveSession(user.id, 'recruiter');
      console.log(`✅ [STREAM] Got/created session ${session.id} for recruiter ${user.id}`);
      
      // Save user message to chat history
      await aiMemoryService.saveChatMessage(
        session.id,
        user.id,
        'user',
        message,
        {
          aiType: 'recruiter_chat',
          contextData: { searchSource, ...context }
        }
      );
      console.log(`✅ [STREAM] Saved user message to session ${session.id}`);
    } catch (dbError) {
      console.error('❌ [STREAM] Database error saving message:', dbError);
      // Continue without saving - don't block the chat
    }
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stream connected' })}\n\n`);
    
    // Variable to accumulate the full response for saving
    let fullResponse = '';

    try {
      console.log('🎯 [RECRUITER AI STREAM] Received message:', message);
      
      const lowerMessage = message.toLowerCase();
      
      // Check if this is a candidate search request - improved detection
      const candidateSearchKeywords = ['find', 'search', 'looking for', 'need', 'hire', 'recruit', 'get me'];
      const candidateRoleKeywords = ['developer', 'engineer', 'designer', 'manager', 'candidate'];
      
      const hasCandidateSearchIntent = candidateSearchKeywords.some(keyword => lowerMessage.includes(keyword)) &&
                                       candidateRoleKeywords.some(keyword => lowerMessage.includes(keyword));
      
      let jobBasedSearchCompleted = false;
      
      console.log('🔍 Candidate search detection:', {
        message: lowerMessage,
        hasCandidateSearchIntent,
        hasSelectedJob: !!context?.selectedJobId,
        candidateSearchKeywords: candidateSearchKeywords.filter(k => lowerMessage.includes(k)),
        candidateRoleKeywords: candidateRoleKeywords.filter(k => lowerMessage.includes(k))
      });
      
      // If candidate search with selected job, get job details and search
      if (hasCandidateSearchIntent && context?.selectedJobId) {
        console.log('🎯 Candidate search with selected job:', context.selectedJobId);
        const db = await initializeDatabase();
        const jobResult = await db.query(
          'SELECT title, description, requirements, location, experience_level FROM job_postings WHERE id = $1 AND recruiter_id = $2',
          [context.selectedJobId, user.id]
        );
        
        if (jobResult.rows.length > 0) {
          const job = jobResult.rows[0];
          
          // Create a more specific search query based on job details
          const jobSkills = job.requirements ? 
            (typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements) : [];
          const skillsText = Array.isArray(jobSkills) ? jobSkills.join(' ') : '';
          
          const searchQuery = `${job.title} ${job.experience_level} developer ${job.location} ${skillsText}`.trim();
          
          console.log('🔍 Searching candidates with job-based query:', searchQuery);
          
          // Show selected job info first
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk',
            content: `**Searching candidates for: ${job.title}**\n\n📍 Location: ${job.location}\n🎯 Experience: ${job.experience_level}\n\nSearching for qualified candidates...`
          })}\n\n`);
          
          // Use Tavily to search for candidates (simplified approach)
          const searchResults = await tavilyService.searchJobs({
            query: searchQuery,
            location: job.location || '',
            maxResults: 10
          });
          
          // Convert job search results to candidate format (simplified)
          const candidates = searchResults.map((result, index) => ({
            id: `tavily-${index}`,
            name: `Candidate ${index + 1}`,
            title: job.title,
            location: job.location || 'Not specified',
            experience: job.experience_level || 'Not specified',
            skills: skillsText.split(' ').filter(s => s.length > 2).slice(0, 5),
            matchScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
            availability: 'Available',
            summary: result.content?.substring(0, 200) || 'No summary available',
            linkedinUrl: result.url
          }));
          
          if (candidates && candidates.length > 0) {
            res.write(`data: ${JSON.stringify({ 
              type: 'candidates',
              candidateResults: candidates,
              content: `Found ${candidates.length} potential candidates for **${job.title}** position:`
            })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({ 
              type: 'chunk',
              content: `I searched for candidates matching your **${job.title}** position but didn't find any suitable matches. You might want to try broadening your search criteria or posting on job boards.`
            })}\n\n`);
          }
          
          res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
          res.end();
          jobBasedSearchCompleted = true;
          return;
        }
      }
      
      // If candidate search without job selected, show job selection
      if (hasCandidateSearchIntent && !context?.selectedJobId) {
        console.log('🎯 Job selection required - fetching active jobs for recruiter:', user.id);
        const db = await initializeDatabase();
        const jobsResult = await db.query(
          'SELECT id, title, location, job_type, status FROM job_postings WHERE recruiter_id = $1 AND status = $2 ORDER BY created_at DESC',
          [user.id, 'active']
        );
        
        console.log('📋 Found active jobs:', jobsResult.rows.length);
        
        if (jobsResult.rows.length > 0) {
          const jobSelectionMessage = { 
            type: 'job_selection_required',
            jobs: jobsResult.rows,
            message: 'Please select which job you\'re hiring for:'
          };
          
          console.log('📤 About to send job selection message:', JSON.stringify(jobSelectionMessage));
          
          const dataLine = `data: ${JSON.stringify(jobSelectionMessage)}\n\n`;
          console.log('📤 Writing data line:', dataLine);
          
          res.write(dataLine);
          
          console.log('📤 Job selection message written, now sending complete');
          res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
          
          console.log('📤 Complete message written, ending response');
          res.end();
          return;
        } else {
          console.log('⚠️ No active jobs found for recruiter');
        }
      }
      
      // Check if this is a job description request
      const jobDescKeywords = ['job description', 'jd', 'create job', 'write job', 'draft job', 'job posting', 'job post'];
      const isJobDescriptionRequest = jobDescKeywords.some(keyword => lowerMessage.includes(keyword));
      
      // Check if query is too vague first
      const { isVague, missingDetails } = isQueryTooVague(message);
      
      if (isVague) {
        console.log('⚠️ [VAGUE QUERY DETECTED IN STREAM] Missing details:', missingDetails);
        
        const clarificationMessage = generateClarifyingQuestions(missingDetails, user.firstName || user.name?.split(' ')[0]);
        
        // Stream the clarification message word by word
        await aiService.generateStreamingResponse({
          type: 'general_chat',
          content: clarificationMessage,
          context: { userId: user.id, ...context }
        }, (chunk) => {
          if (chunk.content) {
            fullResponse += chunk.content;
            res.write(`data: ${JSON.stringify({ 
              type: 'chunk',
              content: chunk.content,
              isComplete: false
            })}\n\n`);
          }
        });
        
        // Send completion with helpful suggestions
        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          suggestions: [
            'Find senior React developers with 5+ years experience in San Francisco',
            'Search for mid-level Python engineers, remote-friendly',
            'Looking for DevOps specialists with AWS and Kubernetes experience in NYC'
          ],
          actionItems: [
            'Specify the exact role and seniority level',
            'List the must-have technical skills',
            'Mention location or remote work preferences'
          ]
        })}\n\n`);
        
        res.end();
        return;
      }
      
      // Handle job description generation requests
      if (isJobDescriptionRequest) {
        console.log('📝 [JOB DESCRIPTION STREAM] Generating job description...');
        res.write(`data: ${JSON.stringify({ type: 'typing', message: 'Creating job description...' })}\n\n`);
        
        // Extract job details from message
        const jobTitleMatch = message.match(/(?:for|create|write|draft)\s+(?:a\s+)?(?:job\s+description\s+for\s+)?(?:a\s+)?([^.!?\n]+?)(?:\s+position|\s+role|$)/i);
        const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Software Developer';
        
        // Extract additional context
        const experienceMatch = message.match(/(\d+[\+\-]?\s*(?:to\s+\d+)?\s*years?)/i);
        const locationMatch = message.match(/(?:in|at|location:?)\s+([a-z\s,]+?)(?:\s|$|,)/i);
        const workTypeMatch = message.match(/\b(remote|hybrid|on-?site|full-?time|part-?time|contract)\b/i);
        
        const jobDescResult = await jobDescriptionGenerator.generateJobDescription({
          jobTitle,
          experience: experienceMatch ? experienceMatch[1] : undefined,
          location: locationMatch ? locationMatch[1].trim() : undefined,
          workType: workTypeMatch ? workTypeMatch[1] : undefined,
          additionalContext: message
        });
        
        // Create structured job description object for the card
        // Extract department from job title or role
        const extractDepartment = (title: string, role: string): string => {
          const titleLower = (title + ' ' + role).toLowerCase();
          if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('software')) return 'Engineering';
          if (titleLower.includes('design') || titleLower.includes('ux') || titleLower.includes('ui')) return 'Design';
          if (titleLower.includes('market') || titleLower.includes('growth')) return 'Marketing';
          if (titleLower.includes('sales') || titleLower.includes('account')) return 'Sales';
          if (titleLower.includes('product')) return 'Product';
          if (titleLower.includes('data') || titleLower.includes('analyst')) return 'Data & Analytics';
          if (titleLower.includes('hr') || titleLower.includes('people') || titleLower.includes('recruit')) return 'Human Resources';
          if (titleLower.includes('finance') || titleLower.includes('accounting')) return 'Finance';
          if (titleLower.includes('operations') || titleLower.includes('ops')) return 'Operations';
          if (titleLower.includes('customer') || titleLower.includes('support')) return 'Customer Success';
          return 'General';
        };
        
        // Extract level from experience or title
        const extractLevel = (experience: string, title: string): string => {
          const expLower = (experience + ' ' + title).toLowerCase();
          if (expLower.includes('senior') || expLower.includes('sr.') || expLower.includes('lead') || expLower.includes('principal')) return 'Senior';
          if (expLower.includes('junior') || expLower.includes('jr.') || expLower.includes('entry') || expLower.includes('associate')) return 'Junior';
          if (expLower.includes('mid') || expLower.includes('intermediate')) return 'Mid-Level';
          // Parse years of experience
          const yearsMatch = experience.match(/(\d+)/);
          if (yearsMatch) {
            const years = parseInt(yearsMatch[1]);
            if (years >= 5) return 'Senior';
            if (years <= 2) return 'Junior';
            return 'Mid-Level';
          }
          return 'Mid-Level';
        };
        
        const jobDescriptionTemplate = {
          title: jobDescResult.jobTitle,
          department: extractDepartment(jobDescResult.jobTitle, jobDescResult.role),
          level: extractLevel(jobDescResult.experience || '', jobDescResult.jobTitle),
          type: jobDescResult.workType || 'Full-Time',
          description: jobDescResult.description,
          responsibilities: jobDescResult.responsibilities,
          requirements: jobDescResult.skills,
          benefits: jobDescResult.benefits
          // Note: salaryRange not included - not in training data
        };
        
        // Send the structured job description object
        res.write(`data: ${JSON.stringify({ 
          type: 'job_description',
          jobDescription: jobDescriptionTemplate
        })}\n\n`);
        
        // Send a brief confirmation message instead of the full formatted text
        const confirmationMessage = `I've created a job description for ${jobDescResult.jobTitle}. You can review it in the card below and use the "Screen with AI" button to find matching candidates.`;
        
        // Stream the confirmation message word by word
        const words = confirmationMessage.split(' ');
        for (const word of words) {
          fullResponse += word + ' ';
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk',
            content: word + ' ',
            isComplete: false
          })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        // Send completion with suggestions
        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          suggestions: [
            'Screen candidates with AI for this role',
            'Customize the job description for your company',
            'Post this job on multiple platforms'
          ],
          actionItems: [
            'Review and edit the job description',
            'Add your company branding and culture',
            'Post to job boards and LinkedIn'
          ]
        })}\n\n`);
        
        res.end();
        return;
      }
      
      // Check if this is a candidate search query - improved detection
      const searchKeywords = ['find', 'search', 'looking for', 'need', 'hire', 'recruit'];
      const roleKeywords = ['candidate', 'developer', 'engineer', 'designer', 'manager', 'analyst', 
                           'architect', 'programmer', 'specialist', 'consultant', 'professional'];
      const excludeKeywords = ['job description', 'create', 'write', 'draft', 'how to'];
      
      const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));
      const hasRoleKeyword = roleKeywords.some(keyword => lowerMessage.includes(keyword));
      const hasExcludeKeyword = excludeKeywords.some(keyword => lowerMessage.includes(keyword));
      
      const isCandidateSearch = hasSearchIntent && hasRoleKeyword && !hasExcludeKeyword && !isJobDescriptionRequest;
      
      console.log('🔍 [STREAMING REQUEST DETECTION]', {
        message: message.substring(0, 50),
        isJobDescriptionRequest,
        isCandidateSearch,
        searchSource,
        jobBasedSearchCompleted
      });
      
      if (isCandidateSearch && !jobBasedSearchCompleted) {
        // Send typing indicator
        res.write(`data: ${JSON.stringify({ type: 'typing', message: 'Searching for candidates...' })}\n\n`);
        
        let allCandidates: CandidateResult[] = [];
        let searchSummary = '';
        
        // Search based on source preference
        if (searchSource === 'cvzen' || searchSource === 'both') {
          console.log('🔍 [STREAM] Searching CVZen database...');
          const dbCandidates = await searchCandidatesInDatabase(message);
          allCandidates.push(...dbCandidates);
          console.log(`✅ Found ${dbCandidates.length} candidates from CVZen database`);
        }
        
        if (searchSource === 'web' || searchSource === 'both') {
          console.log('🔍 [STREAM] Searching web via Tavily...');
          const webCandidates = await searchCandidatesWithTavily(message);
          allCandidates.push(...webCandidates);
          console.log(`✅ Found ${webCandidates.length} candidates from web search`);
        }
        
        // Create search summary
        if (searchSource === 'both') {
          const dbCount = allCandidates.filter(c => c.id.startsWith('cvzen-')).length;
          const webCount = allCandidates.filter(c => c.id.startsWith('tavily-')).length;
          searchSummary = `Found ${allCandidates.length} total candidates: ${dbCount} from CVZen database and ${webCount} from web search.`;
        } else if (searchSource === 'cvzen') {
          searchSummary = `Found ${allCandidates.length} candidates from CVZen database.`;
        } else {
          searchSummary = `Found ${allCandidates.length} candidates from web search.`;
        }
        
        console.log(`✅ ${searchSummary}`);
        
        // AI SCREENING INTEGRATION: Screen CVZen candidates if found
        let screenedCandidates = allCandidates;
        const cvzenCandidates = allCandidates.filter(c => c.id.toString().startsWith('cvzen-') || !c.id.toString().startsWith('tavily-'));
        
        if (cvzenCandidates.length > 0) {
          console.log(`🤖 [AI SCREENING] Starting AI screening for ${cvzenCandidates.length} CVZen candidates...`);
          res.write(`data: ${JSON.stringify({ type: 'typing', message: 'Screening candidates with AI...' })}\n\n`);
          
          try {
            // Import AI screening service
            const { aiResumeScreeningService } = await import('../services/aiResumeScreeningService.js');
            
            // Fetch full candidate data from database for screening
            const db = await initializeDatabase();
            const candidateIds = cvzenCandidates.map(c => c.id);
            const placeholders = candidateIds.map((_, i) => `$${i + 1}`).join(',');
            
            const fullCandidatesResult = await db.query(
              `SELECT 
                u.id as user_id,
                u.first_name,
                u.last_name,
                r.id as resume_id,
                r.title,
                r.personal_info,
                r.skills,
                r.experience,
                r.education,
                r.projects,
                r.summary
              FROM users u
              LEFT JOIN resumes r ON r.user_id = u.id
              WHERE u.id = ANY($1)`,
              [candidateIds]
            );
            
            const fullCandidates = fullCandidatesResult.rows.map(row => ({
              id: row.user_id,
              firstName: row.first_name,
              lastName: row.last_name,
              title: row.title,
              resume: {
                personal_info: row.personal_info,
                skills: row.skills,
                experience: row.experience,
                education: row.education,
                projects: row.projects,
                summary: row.summary
              }
            }));
            
            await closeDatabase();
            
            // Screen candidates with AI (streaming)
            const screeningResults: any[] = [];
            for await (const event of aiResumeScreeningService.screenCandidatesStreaming(fullCandidates, message)) {
              if (event.type === 'batch') {
                // Stream screening progress
                res.write(`data: ${JSON.stringify({ 
                  type: 'screening_progress',
                  progress: event.data.progress,
                  batchNumber: event.data.batchNumber,
                  totalBatches: event.data.totalBatches
                })}\n\n`);
                
                screeningResults.push(...event.data.results);
              } else if (event.type === 'complete') {
                console.log(`✅ [AI SCREENING] Completed screening ${event.data.results.length} candidates`);
                
                // Merge screening results with original candidates
                screenedCandidates = allCandidates.map(candidate => {
                  const screening = event.data.results.find((r: any) => r.id === candidate.id);
                  if (screening) {
                    return {
                      ...candidate,
                      aiScore: screening.score,
                      aiRecommendation: screening.recommendation,
                      aiStrengths: screening.strengths,
                      aiConcerns: screening.concerns,
                      aiReasoning: screening.reasoning,
                      matchScore: screening.score // Update match score with AI score
                    };
                  }
                  return candidate;
                });
                
                // Sort by AI score
                screenedCandidates.sort((a, b) => (b.aiScore || b.matchScore) - (a.aiScore || a.matchScore));
              }
            }
          } catch (screeningError) {
            console.error('❌ [AI SCREENING] Error:', screeningError);
            // Continue with unscreened candidates if screening fails
          }
        }
        
        // Send candidate results (with AI screening if available)
        res.write(`data: ${JSON.stringify({ 
          type: 'candidates',
          candidateResults: screenedCandidates,
          isComplete: false
        })}\n\n`);
        
        // Generate AI commentary using DSPy-optimized prompt with Groq
        const recruiterName = user.firstName || user.name?.split(' ')[0];
        const optimizedResponse = await recruiterChatPromptOptimizer.generateOptimizedResponse({
          recruiterName,
          query: message,
          candidatesFound: screenedCandidates.length,
          searchSource,
          hasResults: screenedCandidates.length > 0
        });

        // Ensure optimizedResponse is a string
        const responseText = typeof optimizedResponse === 'string' 
          ? optimizedResponse 
          : (optimizedResponse as any)?.response || String(optimizedResponse);

        // Stream the optimized response word by word
        const words = responseText.split(' ');
        for (const word of words) {
          fullResponse += word + ' ';
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk',
            content: word + ' ',
            isComplete: false
          })}\n\n`);
          // Small delay for streaming effect
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Send completion signal with contextual suggestions
        const suggestions = screenedCandidates.length > 0 
          ? [
              searchSource === 'cvzen' || searchSource === 'both' 
                ? 'Contact CVZen candidates directly through the platform'
                : 'Reach out via LinkedIn for better response rates',
              'Review their profiles and portfolios carefully',
              'Consider candidates with transferable skills'
            ]
          : [
              'Create a compelling job description to attract candidates',
              'Post your job on multiple platforms',
              'Set up interview questions and evaluation criteria'
            ];

        const actionItems = screenedCandidates.length > 0
          ? [
              'Shortlist top candidates for interviews',
              'Prepare personalized outreach messages',
              'Schedule screening calls with interested candidates'
            ]
          : [
              'Draft a job description highlighting your company culture',
              'Identify alternative sourcing channels',
              'Prepare your interview process while waiting for candidates'
            ];

        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          suggestions,
          actionItems
        })}\n\n`);
        
      } else {
        // For non-candidate-search queries, use AI service with word-by-word streaming
        res.write(`data: ${JSON.stringify({ type: 'typing', message: 'AI is thinking...' })}\n\n`);
        
        const recruiterName = user.firstName || user.name?.split(' ')[0] || 'there';
        
        await aiService.generateStreamingResponse({
          type: 'general_chat',
          content: `You are a friendly, casual recruiting assistant - like a helpful colleague, not a formal business assistant. 

IMPORTANT TONE GUIDELINES:
- Address the recruiter as "${recruiterName}" in a casual, friendly way
- Use casual, conversational language
- NO formal greetings like "Dear Recruiter" or signatures
- Be direct and friendly, like chatting with a coworker
- Use contractions (I'll, you're, let's) to sound natural
- Keep it brief and to the point

User question: ${message}

Provide practical, actionable recruiting advice in a friendly, casual tone.`,
          context: { userId: user.id, ...context }
        }, (chunk) => {
          // Stream each word/chunk to the client
          if (chunk.content) {
            fullResponse += chunk.content;
            res.write(`data: ${JSON.stringify({ 
              type: 'chunk',
              content: chunk.content,
              isComplete: false
            })}\n\n`);
          }
        });
        
        // Send completion signal
        res.write(`data: ${JSON.stringify({ 
          type: 'complete',
          suggestions: [
            'Ask for specific examples or templates',
            'Request detailed analysis of your situation',
            'Explore related topics or best practices'
          ]
        })}\n\n`);
      }
      
    } catch (error) {
      console.error("Streaming AI Chat error:", error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process your message. Please try again.' 
      })}\n\n`);
    } finally {
      // Save assistant response to chat history after streaming completes
      if (fullResponse && session) {
        const processingTime = Date.now() - startTime;
        try {
          await aiMemoryService.saveChatMessage(
            session.id,
            user.id,
            'assistant',
            fullResponse.trim(),
            {
              aiType: 'recruiter_chat',
              processingTimeMs: processingTime,
              contextData: { searchSource, streaming: true }
            }
          );
          console.log(`✅ [STREAM] Saved assistant response to session ${session.id}`);
        } catch (saveError) {
          console.error('❌ [STREAM] Failed to save assistant response:', saveError);
        }
      }
    }

    res.end();
    
  } catch (error) {
    console.error("Recruiter AI Chat streaming error:", error);
    
    if (error instanceof z.ZodError) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: "Invalid request format",
        errors: error.errors
      }));
      return;
    }
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: "Failed to process your message. Please try again."
    }));
  }
});

// GET /api/recruiter-ai-chat/sessions - Get all chat sessions
router.get("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    const sessions = await aiMemoryService.getAllUserSessions(user.id, 'recruiter');
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load sessions"
    });
  }
});

// POST /api/recruiter-ai-chat/sessions - Create new session
router.post("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    const { sessionName } = req.body;
    const newSession = await aiMemoryService.createNewSession(user.id, 'recruiter', sessionName);
    
    res.json({
      success: true,
      session: newSession
    });
    
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session"
    });
  }
});

// PUT /api/recruiter-ai-chat/sessions/:id/activate - Switch to session
router.put("/sessions/:id/activate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    const sessionId = parseInt(req.params.id);
    const session = await aiMemoryService.switchToSession(user.id, 'recruiter', sessionId);
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error("Switch session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to switch session"
    });
  }
});

// DELETE /api/recruiter-ai-chat/sessions/:id - Delete session
router.delete("/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    const sessionId = parseInt(req.params.id);
    await aiMemoryService.deleteSession(user.id, 'recruiter', sessionId);
    
    res.json({
      success: true,
      message: "Session deleted"
    });
    
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete session"
    });
  }
});

// PUT /api/recruiter-ai-chat/sessions/:id/name - Update session name
router.put("/sessions/:id/name", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    const sessionId = parseInt(req.params.id);
    const { sessionName } = req.body;
    
    await aiMemoryService.updateSessionName(user.id, 'recruiter', sessionId, sessionName);
    
    res.json({
      success: true
    });
    
  } catch (error) {
    console.error("Update session name error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update session name"
    });
  }
});

// GET /api/recruiter-ai-chat/memory/sessions - Get chat history
router.get("/memory/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get active session and chat history
    const activeSession = await aiMemoryService.getOrCreateActiveSession(user.id, 'recruiter');
    const chatHistory = await aiMemoryService.getChatHistory(activeSession.id, limit);
    
    // Transform messages to match frontend format
    const recentMessages = chatHistory.map(msg => ({
      id: msg.id,
      messageType: msg.messageType,
      content: msg.content,
      response: msg.messageType === 'assistant' ? msg.content : '',
      createdAt: msg.createdAt
    }));
    
    res.json({
      success: true,
      activeSession: {
        id: activeSession.id,
        sessionName: activeSession.sessionName || 'Chat Session',
        createdAt: activeSession.createdAt,
        updatedAt: activeSession.updatedAt
      },
      recentMessages
    });
    
  } catch (error) {
    console.error("Get recruiter chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load chat history"
    });
  }
});

// GET /api/recruiter-ai-chat/suggestions
router.get("/suggestions", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }
    
    // Generate personalized quick action suggestions based on recruiter profile
    const suggestions = [
      {
        icon: 'Search',
        label: 'Find Candidates',
        query: 'Find me React developers with 3+ years experience in San Francisco',
        category: 'candidate_search'
      },
      {
        icon: 'FileText',
        label: 'Job Description',
        query: 'Create a job description for a Senior Frontend Developer position',
        category: 'job_posting'
      },
      {
        icon: 'Users',
        label: 'HR Advice',
        query: 'Best practices for conducting technical interviews',
        category: 'hr_guidance'
      },
      {
        icon: 'TrendingUp',
        label: 'Hiring Strategy',
        query: 'How to improve our hiring process and reduce time-to-hire?',
        category: 'process_improvement'
      },
      {
        icon: 'DollarSign',
        label: 'Compensation',
        query: 'What should we offer a senior developer in the current market?',
        category: 'compensation'
      }
    ];
    
    res.json({
      success: true,
      suggestions
    });
    
  } catch (error) {
    console.error("Recruiter AI Chat suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load suggestions"
    });
  }
});

// POST /api/recruiter-ai-chat/upload - File upload endpoint for recruiters
router.post("/upload", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.userType !== 'recruiter') {
      return res.status(401).json({ error: "Recruiter authentication required" });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;

    console.log(`📄 Recruiter file upload - Recruiter: ${user.id}, File: ${file.originalname}, Size: ${file.size}, Type: ${file.mimetype}`);

    // Process the file based on type
    let extractedText = '';
    
    try {
      extractedText = await fileProcessingService.extractTextFromFile(file.buffer, file.mimetype);
      extractedText = fileProcessingService.cleanText(extractedText);

      // Validate extracted text
      const validation = fileProcessingService.validateResumeContent(extractedText);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Get resume metadata
      const metadata = fileProcessingService.extractResumeMetadata(extractedText);

      // Generate a unique file ID for this upload
      const fileId = `recruiter_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`✅ Recruiter file processed successfully - FileID: ${fileId}`);

      res.json({
        success: true,
        fileId: fileId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        content: extractedText.substring(0, 1000), // Return first 1000 chars as preview
        fullContent: extractedText, // Full content for analysis
        metadata: metadata,
        message: 'File uploaded and processed successfully'
      });

    } catch (processingError) {
      console.error('File processing error:', processingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process file. Please ensure it is a valid resume document.'
      });
    }

  } catch (error) {
    console.error("Recruiter file upload error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file. Please try again.'
    });
  }
});

export default router;

