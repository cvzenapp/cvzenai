import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUpload } from '@/components/ui/file-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploadResult } from '@/services/fileUploadService';
import { recruiterAiChatApi, CandidateResult, JobDescriptionTemplate, HRAdvice } from '@/services/recruiterAiChatApi';
import { recruiterAiChatStreamingService } from '@/services/recruiterAiChatStreamingService';
import { AIScreeningModal } from '@/components/recruiter/AIScreeningModal';
import { candidatesApi } from '@/services/candidatesApi';
import { jobPostingsApi, JobPostingCreateRequest } from '@/services/jobPostingsApi';
import { 
  Send, 
  Bot, 
  User, 
  Users, 
  MapPin, 
  Clock, 
  Building,
  FileText,
  Sparkles,
  Search,
  TrendingUp,
  Loader2,
  UserCheck,
  Briefcase,
  Star,
  Mail,
  Linkedin,
  Download,
  Eye,
  MessageSquare,
  Target,
  Award,
  Settings,
  Paperclip,
  CornerDownLeft,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Brain,
  XCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  candidateResults?: CandidateResult[];
  jobDescription?: JobDescriptionTemplate;
  hrAdvice?: HRAdvice;
  suggestions?: string[];
  actionItems?: string[];
  attachedFile?: {
    name: string;
    type: string;
    size: number;
  };
  jobSelectionRequired?: boolean;
  availableJobs?: Array<{
    id: number;
    title: string;
    location: string;
    employment_type: string;
    status: string;
  }>;
}

const QUICK_ACTIONS = [
  { icon: Search, label: 'Find Candidates', query: '', type: 'candidate_search' },
  { icon: FileText, label: 'Job Description', query: 'Create a job description for a Senior Frontend Developer position', type: 'job_posting' },
  { icon: Users, label: 'HR Advice', query: 'Best practices for conducting technical interviews', type: 'hr_guidance' },
  { icon: TrendingUp, label: 'Hiring Strategy', query: 'How to improve our hiring process and reduce time-to-hire?', type: 'process_improvement' },
  { icon: DollarSign, label: 'Compensation', query: 'What should we offer a senior developer in the current market?', type: 'compensation' },
  { icon: Paperclip, label: 'Upload Resume', query: '', type: 'file_upload' }
];

const EXAMPLE_PROMPTS = [
  {
    category: 'Candidate Sourcing',
    prompt: `I need to hire for multiple positions and want to optimize my sourcing strategy:

Open Positions:
• Senior Frontend Developer (React, TypeScript) - Remote/SF Bay Area
• Backend Engineer (Node.js, Python) - New York
• DevOps Engineer (AWS, Kubernetes) - Austin, TX

Current challenges:
- Low response rates to outreach messages
- Difficulty finding diverse candidates
- Long time-to-hire (average 8 weeks)
- Competition from FAANG companies

Budget: $120k-180k per role
Timeline: Need to fill within 6 weeks

Can you provide a comprehensive sourcing and outreach strategy?`
  },
  {
    category: 'Interview Process Optimization',
    prompt: `Help me design an effective technical interview process:

Role: Senior Full-Stack Developer
Team: 8 engineers, growing to 12
Tech Stack: React, Node.js, PostgreSQL, AWS
Company Stage: Series B startup (100 employees)

Current process issues:
- Inconsistent evaluation criteria
- Too many interview rounds (5 rounds)
- High candidate drop-off rate
- Interviewers not aligned on what to assess

Requirements:
- Must assess technical skills, cultural fit, and leadership potential
- Process should take max 3 weeks
- Need to compete with big tech offers
- Want to reduce bias in evaluation

What's the optimal interview structure and evaluation framework?`
  },
  {
    category: 'Compensation Strategy',
    prompt: `I need help with compensation benchmarking and offer strategy:

Company: 200-person SaaS startup, Series C
Location: Austin, TX (hybrid/remote options)
Role: Senior Software Engineer (5+ years experience)

Candidate Profile:
- Currently at Google (L5 level)
- 6 years experience, strong React/Node.js skills
- Looking for more ownership and startup experience
- Has competing offers from other startups

Market Research Needed:
- Salary benchmarks for Austin vs SF vs Remote
- Equity compensation best practices
- Non-monetary benefits that matter to senior engineers
- How to structure offers to compete with big tech

What's a competitive offer structure that balances cost and attractiveness?`
  }
];

const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years experience' },
  { value: 'mid', label: 'Mid Level', description: '3-5 years experience' },
  { value: 'senior', label: 'Senior Level', description: '6+ years experience' },
  { value: 'executive', label: 'Executive', description: 'Leadership role' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
] as const;

export default function RecruiterChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI recruiting assistant powered by advanced language models. I can help you find qualified candidates, create compelling job descriptions, provide HR guidance, analyze resumes, and optimize your hiring process. You can also upload candidate resumes for detailed analysis. What would you like to work on today?",
      timestamp: new Date(),
      suggestions: [
        'Find candidates with specific skills',
        'Create a job description',
        'Get HR best practices advice'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAIScreening, setShowAIScreening] = useState(false);
  const [screeningCandidates, setScreeningCandidates] = useState<any[]>([]);
  const [jobRequirementsForScreening, setJobRequirementsForScreening] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
  const searchSource = 'web'; // Always use web search
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([
    'Find candidates with specific skills',
    'Create a job description',
    'Get HR best practices advice'
  ]);
  const [currentActionItems, setCurrentActionItems] = useState<string[]>([]);
  const messageCounterRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Session management state
  const [sessions, setSessions] = useState<Array<{
    id: number;
    sessionName: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Job posting modal state
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);
  const [jobPostingFormData, setJobPostingFormData] = useState<JobPostingCreateRequest>({
    title: '',
    department: '',
    location: '',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: 'USD',
    description: '',
    requirements: [],
    benefits: [],
    isActive: true,
  });
  const [savingJobPosting, setSavingJobPosting] = useState(false);
  const [requirementInput, setRequirementInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [pendingSearchMessage, setPendingSearchMessage] = useState<string>('');
  const [showJobSelectionModal, setShowJobSelectionModal] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const handleJobSelection = async (jobId: number) => {
    if (!pendingSearchMessage) return;
    
    setSelectedJobId(jobId);
    setShowJobSelectionModal(false);
    
    // Send message with job context
    await sendMessage(pendingSearchMessage, { selectedJobId: jobId });
    setPendingSearchMessage('');
  };

  const fetchActiveJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobPostingsApi.getJobPostings();
      if (response.success && response.jobPostings) {
        const activeJobs = response.jobPostings.filter(job => job.isActive);
        setAvailableJobs(activeJobs);
        return activeJobs;
      }
      return [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleCandidateSearchClick = async () => {
    const jobs = await fetchActiveJobs();
    if (jobs.length === 0) {
      // No jobs, show message to create one first
      const noJobsMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "You don't have any active job postings yet. Please create a job posting first before searching for candidates.",
        timestamp: new Date(),
        suggestions: ['Create a job description']
      };
      setMessages(prev => [...prev, noJobsMessage]);
      return;
    }
    
    setPendingSearchMessage('Find candidates for the selected job');
    setShowJobSelectionModal(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    loadSessions();
    loadChatHistory();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await recruiterAiChatApi.getSessions();
      if (response.success && response.sessions) {
        setSessions(response.sessions);
        const activeSession = response.sessions.find(s => s.isActive);
        if (activeSession) {
          setCurrentSessionId(activeSession.id);
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await recruiterAiChatApi.createSession('New Chat');
      if (response.success && response.session) {
        setSessions(prev => [response.session, ...prev.map(s => ({ ...s, isActive: false }))]);
        setCurrentSessionId(response.session.id);
        setMessages([{
          id: '1',
          type: 'assistant',
          content: "Hi! I'm your AI recruiting assistant. What would you like to work on today?",
          timestamp: new Date(),
          suggestions: [
            'Find candidates with specific skills',
            'Create a job description',
            'Get HR best practices advice'
          ]
        }]);
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const handleSwitchSession = async (sessionId: number) => {
    try {
      const response = await recruiterAiChatApi.switchSession(sessionId);
      if (response.success) {
        setSessions(prev => prev.map(s => ({ ...s, isActive: s.id === sessionId })));
        setCurrentSessionId(sessionId);
        // Load messages for this session
        await loadChatHistory();
      }
    } catch (error) {
      console.error('Failed to switch session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat session?')) return;
    
    try {
      await recruiterAiChatApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted session was active, create new one
      if (sessionId === currentSessionId) {
        await handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const historyData = await recruiterAiChatApi.getChatHistory(10);
      
      if (historyData.success && historyData.recentMessages && historyData.recentMessages.length > 0) {
        const historicalMessages: Message[] = [];
        
        // Messages are already separated by type in the database
        historyData.recentMessages.forEach((msg) => {
          if (msg.messageType === 'user') {
            historicalMessages.push({
              id: `user-${msg.id}`,
              type: 'user',
              content: msg.content,
              timestamp: new Date(msg.createdAt)
            });
          } else if (msg.messageType === 'assistant') {
            historicalMessages.push({
              id: `assistant-${msg.id}`,
              type: 'assistant',
              content: msg.content,
              timestamp: new Date(msg.createdAt)
            });
          }
        });
        
        if (historicalMessages.length > 0) {
          // Replace the initial welcome message with history
          setMessages(historicalMessages);
          setOldestMessageId(historyData.recentMessages[0].id);
          setHasMoreHistory(historyData.recentMessages.length >= 10);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!hasMoreHistory || isLoadingHistory || !oldestMessageId) return;
    
    try {
      setIsLoadingHistory(true);
      const historyData = await recruiterAiChatApi.getChatHistory(10);
      
      if (historyData.success && historyData.recentMessages && historyData.recentMessages.length > 0) {
        const newMessages = historyData.recentMessages.filter(
          msg => msg.id < oldestMessageId
        );
        
        if (newMessages.length > 0) {
          const historicalMessages: Message[] = [];
          
          newMessages.forEach((msg) => {
            historicalMessages.push({
              id: `user-${msg.id}`,
              type: 'user',
              content: msg.content,
              timestamp: new Date(msg.createdAt)
            });
            
            if (msg.response) {
              historicalMessages.push({
                id: `assistant-${msg.id}`,
                type: 'assistant',
                content: msg.response,
                timestamp: new Date(msg.createdAt)
              });
            }
          });
          
          setMessages(prev => [...historicalMessages, ...prev]);
          setOldestMessageId(newMessages[0].id);
          setHasMoreHistory(newMessages.length >= 10);
        } else {
          setHasMoreHistory(false);
        }
      } else {
        setHasMoreHistory(false);
      }
    } catch (error) {
      console.error('Failed to load more history:', error);
      setHasMoreHistory(false);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Job posting modal helper functions
  const handleCreateJobPost = (jobDesc: JobDescriptionTemplate) => {
    // Parse salary range if available
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    let salaryCurrency = 'USD';
    
    if (jobDesc.salaryRange) {
      console.log('🔍 Parsing salary range:', jobDesc.salaryRange);
      
      // Detect currency first
      if (jobDesc.salaryRange.includes('€') || jobDesc.salaryRange.toLowerCase().includes('eur')) salaryCurrency = 'EUR';
      else if (jobDesc.salaryRange.includes('£') || jobDesc.salaryRange.toLowerCase().includes('gbp')) salaryCurrency = 'GBP';
      else if (jobDesc.salaryRange.includes('₹') || jobDesc.salaryRange.toLowerCase().includes('inr') || jobDesc.salaryRange.toLowerCase().includes('rupee')) salaryCurrency = 'INR';
      else if (jobDesc.salaryRange.includes('C$') || jobDesc.salaryRange.toLowerCase().includes('cad')) salaryCurrency = 'CAD';
      else if (jobDesc.salaryRange.includes('A$') || jobDesc.salaryRange.toLowerCase().includes('aud')) salaryCurrency = 'AUD';
      
      // Remove currency symbols and common words for easier parsing
      const cleanedRange = jobDesc.salaryRange
        .replace(/[$€£₹,]/g, '')
        .replace(/\s*(USD|EUR|GBP|INR|CAD|AUD|per year|annually|\/year|\/yr|rupees?|lakh|lakhs?|cr|crore|crores?)\s*/gi, '')
        .trim();
      
      console.log('🔍 Cleaned salary range:', cleanedRange);
      
      // Try multiple regex patterns
      const patterns = [
        /(\d+)k?\s*[-–—to]\s*(\d+)k?/i,           // "80k - 120k" or "80 - 120"
        /(\d+),?(\d{3})?\s*[-–—to]\s*(\d+),?(\d{3})?/i, // "80,000 - 120,000"
        /(\d+\.?\d*)\s*[-–—to]\s*(\d+\.?\d*)/i,   // "80.5 - 120.5"
      ];
      
      for (const pattern of patterns) {
        const match = cleanedRange.match(pattern);
        if (match) {
          console.log('✅ Salary match found:', match);
          
          // Handle different match groups based on pattern
          if (pattern.source.includes('k?')) {
            // Pattern with 'k' suffix
            const isK = jobDesc.salaryRange.toLowerCase().includes('k');
            salaryMin = parseInt(match[1]) * (isK ? 1000 : 1);
            salaryMax = parseInt(match[2]) * (isK ? 1000 : 1);
          } else if (match[4]) {
            // Pattern with comma-separated thousands (4 groups)
            salaryMin = parseInt(match[1] + (match[2] || ''));
            salaryMax = parseInt(match[3] + (match[4] || ''));
          } else {
            // Simple pattern
            salaryMin = Math.round(parseFloat(match[1]) * 1000);
            salaryMax = Math.round(parseFloat(match[2]) * 1000);
          }
          
          console.log('💰 Parsed salary:', { salaryMin, salaryMax, salaryCurrency });
          break;
        }
      }
      
      // If no range found, try single value
      if (!salaryMin && !salaryMax) {
        const singleMatch = cleanedRange.match(/(\d+)k?/i);
        if (singleMatch) {
          const isK = jobDesc.salaryRange.toLowerCase().includes('k');
          salaryMin = parseInt(singleMatch[1]) * (isK ? 1000 : 1);
          console.log('💰 Parsed single salary value:', salaryMin);
        }
      }
    }
    
    // Parse benefits - handle both array and JSON string/object
    let parsedBenefits: string[] = [];
    if (jobDesc.benefits) {
      if (Array.isArray(jobDesc.benefits)) {
        parsedBenefits = jobDesc.benefits;
      } else if (typeof jobDesc.benefits === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(jobDesc.benefits);
          if (Array.isArray(parsed)) {
            parsedBenefits = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            // If it's an object, extract values
            parsedBenefits = Object.values(parsed as Record<string, unknown>).filter(v => typeof v === 'string') as string[];
          } else if (typeof jobDesc.benefits === 'string') {
            // If it's a plain string, split by common delimiters
            parsedBenefits = jobDesc.benefits.split(/[,;•\n]/).map(b => b.trim()).filter(b => b.length > 0);
          }
        } catch {
          // If JSON parse fails, treat as comma/newline separated string
          if (typeof jobDesc.benefits === 'string') {
            parsedBenefits = jobDesc.benefits.split(/[,;•\n]/).map(b => b.trim()).filter(b => b.length > 0);
          }
        }
      }
    }
    
    // Parse requirements - handle both array and JSON string/object
    let parsedRequirements: string[] = [];
    if (jobDesc.requirements) {
      if (Array.isArray(jobDesc.requirements)) {
        parsedRequirements = jobDesc.requirements;
      } else if (typeof jobDesc.requirements === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(jobDesc.requirements);
          if (Array.isArray(parsed)) {
            parsedRequirements = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            // If it's an object, extract values
            parsedRequirements = Object.values(parsed as Record<string, unknown>).filter(v => typeof v === 'string') as string[];
          } else if (typeof jobDesc.requirements === 'string') {
            // If it's a plain string, split by common delimiters
            parsedRequirements = jobDesc.requirements.split(/[,;•\n]/).map(r => r.trim()).filter(r => r.length > 0);
          }
        } catch {
          // If JSON parse fails, treat as comma/newline separated string
          if (typeof jobDesc.requirements === 'string') {
            parsedRequirements = jobDesc.requirements.split(/[,;•\n]/).map(r => r.trim()).filter(r => r.length > 0);
          }
        }
      }
    }
    
    // Map job description to form data
    setJobPostingFormData({
      title: jobDesc.title || '',
      department: jobDesc.department || '',
      location: 'Remote', // Default, can be edited
      jobType: (jobDesc.type?.toLowerCase() as any) || 'full-time',
      experienceLevel: (jobDesc.level?.toLowerCase() as any) || 'mid',
      salaryMin,
      salaryMax,
      salaryCurrency,
      description: jobDesc.description || '',
      requirements: parsedRequirements,
      benefits: parsedBenefits,
      isActive: true,
    });
    
    setRequirementInput('');
    setBenefitInput('');
    setShowJobPostingModal(true);
  };
  
  const handleSaveJobPosting = async () => {
    try {
      setSavingJobPosting(true);
      const response = await jobPostingsApi.createJobPosting(jobPostingFormData);
      if (response.success) {
        setShowJobPostingModal(false);
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Great! I've created the job posting for "${jobPostingFormData.title}". You can view and manage it in the Jobs tab.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (err) {
      console.error('Failed to save job posting:', err);
    } finally {
      setSavingJobPosting(false);
    }
  };
  
  const addRequirement = () => {
    if (requirementInput.trim()) {
      setJobPostingFormData({
        ...jobPostingFormData,
        requirements: [...(jobPostingFormData.requirements || []), requirementInput.trim()]
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setJobPostingFormData({
      ...jobPostingFormData,
      requirements: jobPostingFormData.requirements?.filter((_, i) => i !== index) || []
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setJobPostingFormData({
        ...jobPostingFormData,
        benefits: [...(jobPostingFormData.benefits || []), benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setJobPostingFormData({
      ...jobPostingFormData,
      benefits: jobPostingFormData.benefits?.filter((_, i) => i !== index) || []
    });
  };

  const generateResponse = async (userMessage: string, messageType?: string, context?: { selectedJobId?: number }): Promise<Message> => {
    return new Promise((resolve, reject) => {
      console.log('🤖 Starting streaming recruiter AI request:', { message: userMessage });
      
      let fullResponse = '';
      let responseData: any = {};
      
      // Create a temporary message for streaming with unique ID
      messageCounterRef.current += 1;
      const streamingMessageId = `streaming-${Date.now()}-${messageCounterRef.current}`;
      const streamingMessage: Message = {
        id: streamingMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      console.log('📝 Created streaming message with ID:', streamingMessageId);
      
      // Add the streaming message to the messages array
      setMessages(prev => {
        console.log('➕ Adding streaming message to state');
        return [...prev, streamingMessage];
      });
      
      // Include file content if available
      let messageWithFile = userMessage;
      if (uploadedFile && uploadedFile.content) {
        messageWithFile = `${userMessage}\n\n[Attached Resume/Document Content]:\n${uploadedFile.content}`;
      }
      
      recruiterAiChatStreamingService.streamChat(
        {
          message: messageWithFile,
          searchSource: searchSource,
          context: {
            ...(context?.selectedJobId && { selectedJobId: context.selectedJobId }),
            recruiterProfile: {
              // Add recruiter context if available
            }
          }
        },
        {
          onConnect: () => {
            console.log('🔗 Stream connected');
          },
          
          onTyping: (message) => {
            console.log('⌨️ AI is typing:', message);
            // Update the streaming message to show typing indicator
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: message, candidateResults: msg.candidateResults || responseData.candidateResults }
                : msg
            ));
          },
          
          onChunk: (content) => {
            fullResponse += content;
            // Update the streaming message with new content
            // IMPORTANT: Preserve candidateResults when updating content
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fullResponse, candidateResults: msg.candidateResults || responseData.candidateResults }
                : msg
            ));
          },
          
          onJobSelectionRequired: (jobs, message) => {
            console.log('🎯 Job selection required callback triggered:', { jobs, message });
            console.log('🎯 Setting pending search message:', userMessage);
            setPendingSearchMessage(userMessage);
            setMessages(prev => {
              console.log('🎯 Updating message with job selection UI');
              return prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { 
                      ...msg, 
                      content: message,
                      jobSelectionRequired: true,
                      availableJobs: jobs
                    }
                  : msg
              );
            });
          },
          
          onCandidates: (candidates) => {
            console.log('👥 RecruiterChatInterface onCandidates callback triggered!');
            console.log('👥 Received candidate results:', {
              count: candidates.length,
              candidates: candidates,
              streamingMessageId: streamingMessageId
            });
            // Store candidate results in responseData
            responseData.candidateResults = candidates;
            // Update the message with candidate results immediately
            setMessages(prev => {
              const updated = prev.map(msg => {
                if (msg.id === streamingMessageId) {
                  console.log('✅ Updating message with candidate results:', {
                    messageId: msg.id,
                    candidateCount: candidates.length,
                    currentCandidateResults: msg.candidateResults
                  });
                  return { ...msg, candidateResults: candidates };
                }
                return msg;
              });
              console.log('📝 Updated messages state with candidates');
              return updated;
            });
          },
          
          onScreeningProgress: (progress, batchNumber, totalBatches) => {
            console.log(`🤖 AI Screening progress: ${progress}% (batch ${batchNumber}/${totalBatches})`);
            // Update typing message to show screening progress
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: `Screening candidates with AI... ${progress}% complete (batch ${batchNumber}/${totalBatches})`, candidateResults: msg.candidateResults || responseData.candidateResults }
                : msg
            ));
          },
          
          onJobDescription: (jobDescription) => {
            console.log('📄 Received job description');
            responseData.jobDescription = jobDescription;
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, jobDescription: jobDescription }
                : msg
            ));
          },
          
          onHRAdvice: (hrAdvice) => {
            console.log('💡 Received HR advice');
            responseData.hrAdvice = hrAdvice;
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, hrAdvice: hrAdvice }
                : msg
            ));
          },
          
          onComplete: (data) => {
            console.log('✅ Stream completed:', data);
            responseData = { ...responseData, ...data };
            
            // Update current suggestions and action items for the chip bar
            if (data.suggestions) {
              setCurrentSuggestions(data.suggestions);
            }
            if (data.actionItems) {
              setCurrentActionItems(data.actionItems);
            }
            
            // Update the final message with all data
            const finalMessage: Message = {
              id: streamingMessageId,
              type: 'assistant',
              content: fullResponse,
              timestamp: new Date(),
              candidateResults: responseData.candidateResults,
              jobDescription: responseData.jobDescription,
              hrAdvice: responseData.hrAdvice,
              suggestions: responseData.suggestions,
              actionItems: responseData.actionItems
            };
            
            console.log('🏁 Final message:', {
              id: finalMessage.id,
              hasCandidateResults: !!finalMessage.candidateResults,
              candidateCount: finalMessage.candidateResults?.length
            });
            
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId ? finalMessage : msg
            ));
            
            resolve(finalMessage);
          },
          
          onError: (error) => {
            console.error('❌ Streaming error:', error);
            
            // Update message to show error, but also try fallback
            const errorMessage: Message = {
              id: streamingMessageId,
              type: 'assistant',
              content: 'I apologize, but I encountered an error processing your request. Let me try a different approach.',
              timestamp: new Date()
            };
            
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId ? errorMessage : msg
            ));
            
            // Try fallback to regular API
            recruiterAiChatApi.sendMessageWithContext(messageWithFile)
              .then(response => {
                if (response.success) {
                  const fallbackMessage: Message = {
                    id: streamingMessageId,
                    type: 'assistant',
                    content: response.response.content,
                    timestamp: new Date(),
                    candidateResults: response.response.candidateResults,
                    jobDescription: response.response.jobDescription,
                    hrAdvice: response.response.hrAdvice,
                    suggestions: response.response.suggestions,
                    actionItems: response.response.actionItems
                  };
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === streamingMessageId ? fallbackMessage : msg
                  ));
                  
                  resolve(fallbackMessage);
                } else {
                  reject(new Error('Both streaming and fallback failed'));
                }
              })
              .catch(fallbackError => {
                console.error('❌ Fallback also failed:', fallbackError);
                reject(new Error('AI service unavailable'));
              });
          }
        }
      );
    });
  };

  const handleFileUpload = (result: FileUploadResult) => {
    if (result.success) {
      setUploadedFile(result);
      setShowFileUpload(false);
      // Auto-suggest resume analysis
      if (!inputValue.trim()) {
        setInputValue("Please analyze this candidate's resume and provide feedback on their qualifications, strengths, and fit for our open positions.");
      }
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const sendMessage = async (message: string, context?: { selectedJobId?: number }) => {
    if (!message.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      await generateResponse(message, undefined, context);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageType?: string) => {
    if ((!inputValue.trim() && !uploadedFile) || isLoading) return;
    
    // Check message length
    if (inputValue.length > 2000) {
      console.warn('Message too long. Please keep it under 2000 characters.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || (uploadedFile ? "I've uploaded a file for analysis." : ""),
      timestamp: new Date(),
      attachedFile: uploadedFile ? {
        name: uploadedFile.fileName || 'uploaded-file',
        type: uploadedFile.fileType || 'unknown',
        size: uploadedFile.fileSize || 0
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    const currentFile = uploadedFile;
    setInputValue('');
    setUploadedFile(null);
    setIsLoading(true);

    try {
      // If there's a file, include it in the message context
      let messageWithFile = currentInput;
      if (currentFile && currentFile.content) {
        messageWithFile = `${currentInput}\n\n[Attached Resume/Document Content]:\n${currentFile.content}`;
      }
      
      // generateResponse already adds and updates the message in state via streaming
      await generateResponse(messageWithFile, messageType, { selectedJobId });
      
      // Auto-update session name if this is the first user message
      if (currentSessionId && messages.filter(m => m.type === 'user').length === 0) {
        const sessionName = currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : '');
        try {
          await recruiterAiChatApi.updateSessionName?.(currentSessionId, sessionName);
          setSessions(prev => prev.map(s => 
            s.id === currentSessionId ? { ...s, sessionName } : s
          ));
        } catch (error) {
          console.error('Failed to update session name:', error);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string, type?: string) => {
    if (type === 'candidate_search') {
      handleCandidateSearchClick();
      return;
    }
    if (type === 'file_upload') {
      setShowFileUpload(true);
      return;
    }
    
    setInputValue(query);
    inputRef.current?.focus();
    // Auto-send the quick action after a short delay
    setTimeout(() => {
      handleSendMessage(type);
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter allows new line
  };

  const SuggestionsCard = ({ suggestions, actionItems }: { suggestions?: string[], actionItems?: string[] }) => {
    if (!suggestions?.length && !actionItems?.length) return null;
    
    return (
      <Card className="mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions && suggestions.length > 0 && (
              <div>
                <h4 className="font-normal mb-2">Suggestions:</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">💡</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {actionItems && actionItems.length > 0 && (
              <div>
                <h4 className="font-normal mb-2">Action Items:</h4>
                <ul className="space-y-1">
                  {actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-1">📋</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const CandidateCard = ({ candidate }: { candidate: CandidateResult }) => {
    const getRecommendationColor = (recommendation?: string) => {
      switch (recommendation) {
        case 'Highly Recommended':
          return 'text-green-600 bg-green-50 border-green-200';
        case 'Recommended':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'Maybe':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'Not Recommended':
          return 'text-red-600 bg-red-50 border-red-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getRecommendationIcon = (recommendation?: string) => {
      switch (recommendation) {
        case 'Highly Recommended':
          return <CheckCircle className="w-3.5 h-3.5" />;
        case 'Recommended':
          return <TrendingUp className="w-3.5 h-3.5" />;
        case 'Maybe':
          return <AlertCircle className="w-3.5 h-3.5" />;
        case 'Not Recommended':
          return <XCircle className="w-3.5 h-3.5" />;
        default:
          return <Star className="w-3.5 h-3.5" />;
      }
    };

    return (
      <Card className="mb-2.5 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-normal text-blue-600 hover:text-blue-800 cursor-pointer truncate">
                {candidate.name}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-gray-600 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span className="text-sm font-medium truncate">{candidate.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {candidate.aiScore !== undefined ? (
                <>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{candidate.aiScore}</div>
                    <div className="text-[10px] text-gray-500">AI Score</div>
                  </div>
                  <Badge className={`flex items-center gap-1 px-2 py-0.5 border text-xs ${getRecommendationColor(candidate.aiRecommendation)}`}>
                    {getRecommendationIcon(candidate.aiRecommendation)}
                    <span className="font-medium whitespace-nowrap">
                      {candidate.aiRecommendation}
                    </span>
                  </Badge>
                  {/* LinkedIn/Profile button inline with score */}
                  {(candidate.linkedinUrl || candidate.resumeUrl) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => window.open(candidate.linkedinUrl || candidate.resumeUrl, '_blank')}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {candidate.matchScore}% match
                  </Badge>
                  {/* LinkedIn/Profile button inline with match score */}
                  {(candidate.linkedinUrl || candidate.resumeUrl) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => window.open(candidate.linkedinUrl || candidate.resumeUrl, '_blank')}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {candidate.aiReasoning && (
            <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded">
              <div className="flex items-start gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-900 leading-relaxed">{candidate.aiReasoning}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{candidate.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{candidate.experience}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{candidate.availability}</span>
            </div>
          </div>
          
          {!candidate.aiReasoning && (
            <p className="text-xs text-gray-700 mb-2 line-clamp-2 leading-relaxed">{candidate.summary}</p>
          )}
          
          {(candidate.aiStrengths || candidate.aiConcerns) && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {candidate.aiStrengths && candidate.aiStrengths.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-gray-700 mb-1">Strengths</div>
                  <ul className="space-y-0.5">
                    {candidate.aiStrengths.slice(0, 2).map((strength, idx) => (
                      <li key={idx} className="text-[11px] text-green-700 flex items-start gap-1">
                        <CheckCircle className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {candidate.aiConcerns && candidate.aiConcerns.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-gray-700 mb-1">Concerns</div>
                  <ul className="space-y-0.5">
                    {candidate.aiConcerns.slice(0, 2).map((concern, idx) => (
                      <li key={idx} className="text-[11px] text-orange-700 flex items-start gap-1">
                        <AlertCircle className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 6).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 6 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{candidate.skills.length - 6}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const JobDescriptionCard = ({ jobDesc }: { jobDesc: JobDescriptionTemplate }) => {
    const handleScreenWithAI = () => {
      // Format job requirements into a string
      const formattedRequirements = [
        `Position: ${jobDesc.title}`,
        `Department: ${jobDesc.department}`,
        `Level: ${jobDesc.level}`,
        `Type: ${jobDesc.type}`,
        '',
        'Requirements:',
        ...jobDesc.requirements.map(req => `• ${req}`),
        '',
        'Key Responsibilities:',
        ...jobDesc.responsibilities.map(resp => `• ${resp}`)
      ].join('\n');
      
      // Set the formatted requirements and open modal
      // Modal will handle fetching candidates from backend
      setJobRequirementsForScreening(formattedRequirements);
      setScreeningCandidates([]); // Empty - backend will fetch
      setShowAIScreening(true);
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-normal">
            <FileText className="w-5 h-5 text-blue-500" />
            {jobDesc.title}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{jobDesc.department}</Badge>
            <Badge variant="outline">{jobDesc.level}</Badge>
            <Badge variant="outline">{jobDesc.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-normal mb-2">Job Description:</h4>
              <p className="text-sm text-gray-700">{jobDesc.description}</p>
            </div>
            
            <div>
              <h4 className="font-normal mb-2">Key Responsibilities:</h4>
              <ul className="space-y-1">
                {jobDesc.responsibilities.map((resp, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-normal mb-2">Requirements:</h4>
              <ul className="space-y-1">
                {jobDesc.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-normal mb-2">Benefits:</h4>
              <ul className="space-y-1">
                {jobDesc.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-500 mt-1">★</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {jobDesc.salaryRange && (
              <div>
                <h4 className="font-normal mb-2">Salary Range:</h4>
                <p className="text-sm font-normal text-green-600">{jobDesc.salaryRange}</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={handleScreenWithAI}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Screen with AI
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleCreateJobPost(jobDesc)}
              >
                <Briefcase className="w-4 h-4 mr-1" />
                Create Job Post
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const HRAdviceCard = ({ advice }: { advice: HRAdvice }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          {advice.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-normal mb-2">Recommendations:</h4>
            <ul className="space-y-1">
              {advice.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {advice.actionItems && (
            <div>
              <h4 className="font-normal mb-2">Action Items:</h4>
              <ul className="space-y-1">
                {advice.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {advice.templates && (
            <div>
              <h4 className="font-normal mb-2">Templates & Resources:</h4>
              <ul className="space-y-1">
                {advice.templates.map((template, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-500 mt-1">📄</span>
                    <span>{template}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full">
      {/* Session Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r bg-slate-50 flex flex-col shrink-0">
          {/* New Chat Button */}
          <div className="p-3 border-b">
            <Button
              onClick={handleNewChat}
              className="w-full bg-brand-background hover:bg-brand-background/90 text-white flex items-center justify-center gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
          
          {/* Sessions List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No chat sessions yet
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      session.isActive
                        ? 'bg-brand-background text-white'
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span 
                      className="flex-1 min-w-0 text-sm font-normal overflow-hidden text-ellipsis whitespace-nowrap block"
                      style={{ maxWidth: '140px' }}
                    >
                      {session.sessionName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className={`opacity-0 group-hover:opacity-100 h-6 w-6 p-0 shrink-0 ${
                        session.isActive
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-gray-300 text-gray-600'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {/* Toggle Sidebar Button */}
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="w-full text-xs text-gray-600 hover:text-gray-900"
            >
              Hide Sidebar
            </Button>
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Show Sidebar Button (when hidden) */}
        {!showSidebar && (
          <div className="absolute top-2 left-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="bg-white shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        )}
        
      {/* Compact Header with Quick Actions */}
      <div className="px-4 md:px-6 py-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
        {/* Compact Quick Actions */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {QUICK_ACTIONS.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 h-7 py-1 px-2 text-xs whitespace-nowrap shrink-0"
              onClick={() => handleQuickAction(action.query, action.type)}
            >
              <action.icon className="w-3 h-3" />
              <span>{action.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const randomPrompt = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
              setInputValue(randomPrompt.prompt);
              inputRef.current?.focus();
            }}
            className="text-xs h-7 px-2 whitespace-nowrap shrink-0"
          >
            Try Example
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 md:px-6 py-4">
        <div className="space-y-4 w-full max-w-full">
          {/* Load More Button */}
          {hasMoreHistory && !isLoadingHistory && (
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreHistory}
                className="text-xs"
              >
                Load Previous Messages
              </Button>
            </div>
          )}
          
          {/* Loading History Indicator */}
          {isLoadingHistory && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading previous messages...</span>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-blue-100">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                    {message.type === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>,
                          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5 mt-2 first:mt-0">{children}</h3>,
                          code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2">{children}</blockquote>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                  
                  {/* Show attached file info */}
                  {message.attachedFile && (
                    <div className="mt-2 p-2 bg-black/10 rounded text-xs flex items-center gap-2">
                      <Paperclip className="w-3 h-3" />
                      <span>{message.attachedFile.name}</span>
                      <span className="opacity-70">
                        ({(message.attachedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Job Selection UI */}
                {message.jobSelectionRequired && message.availableJobs && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Select a job to search candidates for:</h4>
                    <div className="space-y-2">
                      {message.availableJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => handleJobSelection(job.id)}
                          className="w-full text-left p-3 bg-white rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-600">{job.location} • {job.job_type}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Candidate Results */}
                {message.candidateResults && (
                  <div className="mt-3 space-y-3">
                    {message.candidateResults.map((candidate) => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                )}
                
                {/* Job Description */}
                {message.jobDescription && (
                  <div className="mt-3">
                    <JobDescriptionCard jobDesc={message.jobDescription} />
                  </div>
                )}
                
                {/* HR Advice */}
                {message.hrAdvice && (
                  <div className="mt-3">
                    <HRAdviceCard advice={message.hrAdvice} />
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {message.type === 'user' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-gray-200">
                    <User className="w-4 h-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-blue-100">
                  <Bot className="w-4 h-4 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Compact */}
      <div className="border-t bg-card shrink-0">
        {/* Compact Suggestion Chips Bar */}
        {(currentSuggestions.length > 0 || currentActionItems.length > 0) && (
          <div className="px-4 md:px-6 py-2 border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="flex gap-1.5">
                {currentSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => {
                      setInputValue(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-blue-50 border border-blue-200 rounded-full transition-colors text-gray-700 hover:text-blue-700 whitespace-nowrap shrink-0"
                  >
                    <span>💡</span>
                    <span className="max-w-[200px] truncate">{suggestion}</span>
                  </button>
                ))}
                {currentActionItems.slice(0, 2).map((item, index) => (
                  <button
                    key={`action-${index}`}
                    onClick={() => {
                      setInputValue(item);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-green-50 border border-green-200 rounded-full transition-colors text-gray-700 hover:text-green-700 whitespace-nowrap shrink-0"
                  >
                    <span>📋</span>
                    <span className="max-w-[200px] truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="px-4 md:px-6 py-2.5">
        <div className="w-full max-w-full">
          {/* Compact File Upload Section */}
        {showFileUpload && (
          <div className="mb-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-medium text-gray-700">Upload Resume/Document</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="h-5 w-5 p-0 text-xs"
              >
                ×
              </Button>
            </div>
            <FileUpload
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              accept=".pdf,.doc,.docx,.txt"
              showPreview={true}
              className="w-full"
              uploadFunction={async (file) => {
                return await recruiterAiChatStreamingService.uploadFile(file);
              }}
            />
          </div>
        )}

        {/* Current uploaded file display - compact */}
        {uploadedFile && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-green-800">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{uploadedFile.fileName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileRemove}
                className="h-5 w-5 p-0 text-green-600 hover:text-green-800 shrink-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about finding candidates, job descriptions, HR practices, or interview strategies..."
              className="min-h-[60px] max-h-[120px] resize-none pr-10 text-sm leading-relaxed"
              disabled={isLoading}
              rows={2}
            />
            <div className="absolute bottom-1.5 right-1.5 text-[10px] text-gray-400 flex items-center gap-0.5">
              <CornerDownLeft className="w-2.5 h-2.5" />
              <span>Send</span>
            </div>
          </div>
          
          {/* Compact File Upload Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={isLoading}
            className="h-[60px] px-3"
            title="Upload resume"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          {/* Compact Send Button */}
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={(!inputValue.trim() && !uploadedFile) || isLoading}
            size="sm"
            className="h-[60px] px-4 bg-brand-background hover:bg-brand-background/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Compact character count */}
        <div className="flex justify-between items-center mt-1.5 text-[10px] text-gray-400">
          <span>{inputValue.length}/2000</span>
          <span>💡 Be specific for better results</span>
        </div>
        </div>
        </div>
      </div>

      {/* AI Screening Modal */}
      <AIScreeningModal
        isOpen={showAIScreening}
        onClose={() => {
          setShowAIScreening(false);
          setJobRequirementsForScreening('');
        }}
        candidates={screeningCandidates}
        initialJobRequirements={jobRequirementsForScreening}
        onScreeningComplete={(results) => {
          console.log('Screening complete:', results);
          // Don't auto-close - let recruiter review results
        }}
      />
      
      {/* Job Posting Modal */}
      <Dialog open={showJobPostingModal} onOpenChange={() => setShowJobPostingModal(false)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col z-50">
          <DialogHeader className="pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-normal text-slate-900">
                  Create Job Posting
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Review and customize the AI-generated job posting
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-6 px-1">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    Job Information
                  </h3>
                  
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="job-title" className="text-sm font-medium text-slate-700">
                      Job Title *
                    </Label>
                    <Input
                      id="job-title"
                      value={jobPostingFormData.title}
                      onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, title: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                      className="h-11 text-base"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="job-department" className="text-sm font-medium text-slate-700">
                      Department *
                    </Label>
                    <Input
                      id="job-department"
                      value={jobPostingFormData.department}
                      onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, department: e.target.value })}
                      placeholder="e.g., Engineering"
                      className="h-11 text-base"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="job-location" className="text-sm font-medium text-slate-700">
                      Location *
                    </Label>
                    <Input
                      id="job-location"
                      value={jobPostingFormData.location}
                      onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, location: e.target.value })}
                      placeholder="e.g., Remote / San Francisco, CA"
                      className="h-11 text-base"
                    />
                  </div>

                  {/* Job Type & Experience Level */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-type" className="text-sm font-medium text-slate-700">
                        Job Type *
                      </Label>
                      <Select
                        value={jobPostingFormData.jobType}
                        onValueChange={(value: any) => setJobPostingFormData({ ...jobPostingFormData, jobType: value })}
                      >
                        <SelectTrigger id="job-type" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience-level" className="text-sm font-medium text-slate-700">
                        Experience Level *
                      </Label>
                      <Select
                        value={jobPostingFormData.experienceLevel}
                        onValueChange={(value: any) => setJobPostingFormData({ ...jobPostingFormData, experienceLevel: value })}
                      >
                        <SelectTrigger id="experience-level" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div>
                                <div className="font-medium">{level.label}</div>
                                <div className="text-xs text-slate-500">{level.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Salary Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Salary Range
                    <span className="text-xs text-slate-400 font-normal ml-2">(Optional)</span>
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary-min" className="text-sm font-medium text-slate-700">
                        Minimum
                      </Label>
                      <Input
                        id="salary-min"
                        type="number"
                        value={jobPostingFormData.salaryMin || ''}
                        onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="50000"
                        className="h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary-max" className="text-sm font-medium text-slate-700">
                        Maximum
                      </Label>
                      <Input
                        id="salary-max"
                        type="number"
                        value={jobPostingFormData.salaryMax || ''}
                        onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, salaryMax: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="80000"
                        className="h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary-currency" className="text-sm font-medium text-slate-700">
                        Currency
                      </Label>
                      <Select
                        value={jobPostingFormData.salaryCurrency}
                        onValueChange={(value) => setJobPostingFormData({ ...jobPostingFormData, salaryCurrency: value })}
                      >
                        <SelectTrigger id="salary-currency" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Description & Details */}
              <div className="space-y-6">
                {/* Job Description */}
                <div className="space-y-2">
                  <Label htmlFor="job-description" className="text-sm font-medium text-slate-700">
                    Job Description *
                  </Label>
                  <Textarea
                    id="job-description"
                    value={jobPostingFormData.description}
                    onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, description: e.target.value })}
                    placeholder="Describe the role and responsibilities..."
                    rows={6}
                    className="text-base resize-none"
                  />
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Requirements
                    <span className="text-xs text-slate-400 font-normal ml-2">(Optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      placeholder="e.g., 3+ years React experience"
                      className="flex-1 h-10"
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    />
                    <Button
                      type="button"
                      onClick={addRequirement}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {jobPostingFormData.requirements && jobPostingFormData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {jobPostingFormData.requirements.map((req, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-pointer"
                          onClick={() => removeRequirement(index)}
                        >
                          {req}
                          <Trash2 className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Benefits & Perks
                    <span className="text-xs text-slate-400 font-normal ml-2">(Optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="e.g., Health insurance, Remote work"
                      className="flex-1 h-10"
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                    />
                    <Button
                      type="button"
                      onClick={addBenefit}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {jobPostingFormData.benefits && jobPostingFormData.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {jobPostingFormData.benefits.map((benefit, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                          onClick={() => removeBenefit(index)}
                        >
                          {benefit}
                          <Trash2 className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Visibility
                  </Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jobPostingFormData.isActive}
                        onChange={(e) => setJobPostingFormData({ ...jobPostingFormData, isActive: e.target.checked })}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">
                        Publish immediately
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowJobPostingModal(false)}
              className="flex-1 h-11"
              disabled={savingJobPosting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveJobPosting} 
              disabled={!jobPostingFormData.title.trim() || !jobPostingFormData.department.trim() || !jobPostingFormData.location.trim() || !jobPostingFormData.description.trim() || savingJobPosting}
              className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {savingJobPosting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Selection Modal */}
      <Dialog open={showJobSelectionModal} onOpenChange={setShowJobSelectionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Job for Candidate Search</DialogTitle>
          </DialogHeader>
          
          {loadingJobs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading jobs...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobSelection(job.id)}
                  className="w-full text-left p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{job.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {job.location} • {job.jobType} • {job.experienceLevel}
                  </div>
                  {job.description && (
                    <div className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {job.description.substring(0, 150)}...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}