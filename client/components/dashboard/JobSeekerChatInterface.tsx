import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { FileUploadResult } from '@/services/fileUploadService';
import { aiChatApi, JobResult, ResumeAdvice, AIAnalysis } from '@/services/aiChatApi';
import { aiChatStreamingService } from '@/services/aiChatStreamingService';
import { 
  Send, 
  Bot, 
  User, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building,
  FileText,
  Sparkles,
  Search,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  Target,
  Brain,
  CornerDownLeft,
  Paperclip,
  Plus,
  Trash2,
  MessageSquare,
  History
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  jobResults?: JobResult[];
  resumeAdvice?: ResumeAdvice;
  analysis?: AIAnalysis;
  suggestions?: string[];
  actionItems?: string[];
  attachedFile?: {
    name: string;
    type: string;
    size: number;
  };
}

const QUICK_ACTIONS = [
  { icon: Search, label: 'Find Jobs', query: 'Show me frontend developer jobs in San Francisco', type: 'job_search' },
  { icon: FileText, label: 'CV Help', query: 'How can I improve my resume for tech jobs?', type: 'resume_analysis' },
  { icon: Paperclip, label: 'Upload CV', query: '', type: 'file_upload' },
  { icon: TrendingUp, label: 'Career Tips', query: 'What skills should I learn to advance my career?', type: 'career_advice' },
  { icon: Briefcase, label: 'Interview', query: 'Give me tips for technical interviews', type: 'interview_prep' }
];

const EXAMPLE_PROMPTS = [
  {
    category: 'Resume Analysis',
    prompt: `Please analyze my resume for a Software Engineer position:

Alex Morgan
Software Engineer | 3 years experience
Email: alex@example.com | Phone: (555) 123-4567

EXPERIENCE:
• Frontend Developer at TechCorp (2021-2023)
  - Built React applications with TypeScript
  - Improved user engagement by 25%
  - Led team of 3 developers

SKILLS:
JavaScript, React, TypeScript, Node.js, Python, AWS

EDUCATION:
Bachelor's in Computer Science (2021)

What can I improve to get more interviews?`
  },
  {
    category: 'Career Transition',
    prompt: `I'm planning a career transition and need guidance:

Current Role: Marketing Manager (5 years experience)
Target Role: Product Manager in tech
Skills: Data analysis, project management, user research
Education: MBA in Marketing

Questions:
1. What skills should I develop for product management?
2. How can I make my marketing experience relevant?
3. What certifications would help my transition?
4. How should I network in the tech industry?`
  },
  {
    category: 'Job Search Strategy',
    prompt: `I need help with my job search strategy:

Background: Senior Frontend Developer, 7 years experience
Location: Open to remote or San Francisco Bay Area
Target: Senior/Lead Frontend or Full-Stack roles
Salary expectation: $130k-160k

Current challenges:
- Not getting responses to applications
- Unsure which companies to target
- Need help with salary negotiation

Can you provide a comprehensive job search plan?`
  }
];

export default function JobSeekerChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI career assistant powered by advanced language models. I can help you find jobs, improve your resume, provide career advice, and prepare for interviews. You can also upload your resume for personalized analysis. What would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
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
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

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
      const response = await aiChatApi.getSessions();
      if ((response as any).success && (response as any).sessions) {
        setSessions((response as any).sessions);
        const activeSession = (response as any).sessions.find((s: any) => s.isActive);
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
      const response = await aiChatApi.createSession('New Chat');
      if ((response as any).success && (response as any).session) {
        setSessions(prev => [(response as any).session, ...prev.map(s => ({ ...s, isActive: false }))]);
        setCurrentSessionId((response as any).session.id);
        setMessages([{
          id: '1',
          type: 'assistant',
          content: "Hi! I'm your AI career assistant. What would you like to explore today?",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const handleSwitchSession = async (sessionId: number) => {
    try {
      const response = await aiChatApi.switchSession(sessionId);
      if ((response as any).success) {
        setSessions(prev => prev.map(s => ({ ...s, isActive: s.id === sessionId })));
        setCurrentSessionId(sessionId);
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
      await aiChatApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
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
      const historyData = await aiChatApi.getChatHistory(10);
      
      if (historyData.success && historyData.recentMessages && historyData.recentMessages.length > 0) {
        // Convert server messages to UI message format
        const historicalMessages: Message[] = [];
        
        historyData.recentMessages.forEach((msg) => {
          // Add user message
          historicalMessages.push({
            id: `user-${msg.id}`,
            type: 'user',
            content: msg.content,
            timestamp: new Date(msg.createdAt)
          });
          
          // Add assistant response
          if (msg.response) {
            historicalMessages.push({
              id: `assistant-${msg.id}`,
              type: 'assistant',
              content: msg.response,
              timestamp: new Date(msg.createdAt)
            });
          }
        });
        
        // Add historical messages before the welcome message
        if (historicalMessages.length > 0) {
          setMessages(prev => [...historicalMessages, ...prev]);
          setOldestMessageId(historyData.recentMessages[0].id);
          setHasMoreHistory(historyData.recentMessages.length >= 10);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Don't show error to user, just continue with empty history
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!hasMoreHistory || isLoadingHistory || !oldestMessageId) return;
    
    try {
      setIsLoadingHistory(true);
      const historyData = await aiChatApi.getChatHistory(10);
      
      if (historyData.success && historyData.recentMessages && historyData.recentMessages.length > 0) {
        // Filter out messages we already have
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
          
          // Prepend older messages
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

  const generateResponse = async (userMessage: string, messageType?: string): Promise<Message> => {
    return new Promise((resolve, reject) => {
      // Determine message type based on content or explicit type
      let type: 'general_chat' | 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep' = 'general_chat';
      
      if (messageType) {
        type = messageType as any;
      } else {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
          type = 'resume_analysis';
        } else if (lowerMessage.includes('career') || lowerMessage.includes('advice')) {
          type = 'career_advice';
        } else if (lowerMessage.includes('job') || lowerMessage.includes('search')) {
          type = 'job_search';
        } else if (lowerMessage.includes('interview')) {
          type = 'interview_prep';
        }
      }

      console.log('🤖 Starting streaming AI request:', { message: userMessage, type });
      
      let fullResponse = '';
      let responseData: any = {};
      
      // Create a temporary message for streaming
      const streamingMessageId = `streaming-${Date.now()}`;
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
      
      aiChatStreamingService.streamChat(
        {
          message: userMessage,
          type: type,
          context: {
            userProfile: {
              // Add user context if available
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
            // IMPORTANT: Preserve jobResults when updating typing status
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: message, jobResults: msg.jobResults || responseData.jobResults }
                : msg
            ));
          },
          
          onChunk: (content) => {
            fullResponse += content;
            // Update the streaming message with new content
            // IMPORTANT: Preserve jobResults when updating content
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fullResponse, jobResults: msg.jobResults || responseData.jobResults }
                : msg
            ));
          },
          
          onJobs: (jobs) => {
            console.log('💼 JobSeekerChatInterface onJobs callback triggered!');
            console.log('💼 Received job results:', {
              count: jobs.length,
              jobs: jobs,
              streamingMessageId: streamingMessageId
            });
            // Store job results in responseData
            responseData.jobResults = jobs;
            // Update the message with job results immediately
            setMessages(prev => {
              const updated = prev.map(msg => {
                if (msg.id === streamingMessageId) {
                  console.log('✅ Updating message with job results:', {
                    messageId: msg.id,
                    jobCount: jobs.length,
                    currentJobResults: msg.jobResults
                  });
                  return { ...msg, jobResults: jobs };
                }
                return msg;
              });
              console.log('📝 Updated messages state with jobs');
              return updated;
            });
          },
          
          onComplete: (data) => {
            console.log('✅ Stream completed:', data);
            responseData = { ...responseData, ...data };
            
            // Update the final message with all data
            const finalMessage: Message = {
              id: streamingMessageId,
              type: 'assistant',
              content: fullResponse,
              timestamp: new Date(),
              jobResults: responseData.jobResults,
              resumeAdvice: responseData.resumeAdvice,
              analysis: responseData.analysis,
              suggestions: responseData.suggestions,
              actionItems: responseData.actionItems
            };
            
            console.log('🏁 Final message:', {
              id: finalMessage.id,
              hasJobResults: !!finalMessage.jobResults,
              jobCount: finalMessage.jobResults?.length
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
            aiChatApi.sendTypedMessage(userMessage, type)
              .then(response => {
                if (response.success) {
                  const fallbackMessage: Message = {
                    id: streamingMessageId,
                    type: 'assistant',
                    content: response.response.content,
                    timestamp: new Date(),
                    jobResults: response.response.jobResults,
                    resumeAdvice: response.response.resumeAdvice,
                    analysis: response.response.analysis,
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
        setInputValue("Please analyze my uploaded resume and provide feedback on how I can improve it for better job opportunities.");
      }
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleSendMessage = async (messageType?: string) => {
    if ((!inputValue.trim() && !uploadedFile) || isLoading) return;
    
    // Check message length
    if (inputValue.length > 2000) {
      // You could show a toast notification here
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

    // Auto-update session name if this is the first user message
    if (currentSessionId && messages.filter(m => m.type === 'user').length === 0) {
      const sessionName = currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : '');
      try {
        await aiChatApi.updateSessionName(currentSessionId, sessionName);
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId ? { ...s, sessionName } : s
        ));
      } catch (error) {
        console.error('Failed to update session name:', error);
      }
    }

    try {
      // If there's a file, include it in the message context
      let messageWithFile = currentInput;
      if (currentFile && currentFile.content) {
        messageWithFile = `${currentInput}\n\n[Attached Resume Content]:\n${currentFile.content}`;
      }
      
      // The generateResponse function now handles streaming internally
      // and updates the messages state directly, so we don't need to add the response here
      await generateResponse(messageWithFile, messageType);
      
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

  const JobCard = ({ job }: { job: JobResult }) => {
    console.log('🎴 Rendering JobCard:', { id: job.id, title: job.title, company: job.company });
    
    return (
    <Card className="mb-2 sm:mb-3 hover:shadow-lg transition-all duration-200 border-l-4 border-l-brand-background">
      <CardHeader className="pb-2 p-3 sm:p-4">
        <div className="flex justify-between items-start gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base font-normal text-brand-main hover:text-brand-main/80 cursor-pointer mb-1 line-clamp-2">
              {job.url ? (
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {job.title}
                </a>
              ) : (
                job.title
              )}
            </CardTitle>
            <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
              <Building className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="font-normal truncate">{job.company}</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 flex-shrink-0 text-xs">
            {job.matchScore}% match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2 sm:pb-3 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">{job.location}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">{job.salary}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{job.postedDate}</span>
          </div>
        </div>
        <p className="text-gray-700 text-xs sm:text-sm mb-2 line-clamp-2">{job.description}</p>
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
          {job.requirements.slice(0, 3).map((req, index) => (
            <Badge key={index} variant="outline" className="text-xs py-0 px-1.5 sm:px-2">
              {req}
            </Badge>
          ))}
          {job.requirements.length > 3 && (
            <Badge variant="outline" className="text-xs py-0 px-1.5 sm:px-2 bg-gray-100">
              +{job.requirements.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-7 sm:h-8 text-xs bg-brand-background hover:bg-brand-background/90 text-white flex-1 sm:flex-none" asChild>
            <a href={job.url || '#'} target="_blank" rel="noopener noreferrer">
              Apply Job
            </a>
          </Button>
          <Button size="sm" variant="outline" className="h-7 sm:h-8 text-xs border-brand-background text-brand-background hover:bg-brand-background hover:text-white">
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );};

  const AIAnalysisCard = ({ analysis }: { analysis: AIAnalysis }) => (
    <Card className="mb-3 sm:mb-4 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          AI Analysis Results
          {analysis.score && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Score: {analysis.score}/100
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {analysis.score && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium">Overall Score</span>
                <span className="text-xs sm:text-sm text-gray-600">{analysis.score}/100</span>
              </div>
              <Progress value={analysis.score} className="h-2" />
            </div>
          )}
          
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.improvements && analysis.improvements.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {analysis.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const SuggestionsCard = ({ suggestions, actionItems }: { suggestions?: string[], actionItems?: string[] }) => {
    if (!suggestions?.length && !actionItems?.length) return null;
    
    return (
      <Card className="mb-3 sm:mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {suggestions && suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">Suggestions:</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="text-blue-500 mt-1">💡</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {actionItems && actionItems.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">Action Items:</h4>
                <ul className="space-y-1">
                  {actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
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

  const ResumeAdviceCard = ({ advice }: { advice: ResumeAdvice }) => (
    <Card className="mb-3 sm:mb-4">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          {advice.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-sm">Suggestions:</h4>
            <ul className="space-y-1">
              {advice.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          {advice.actionItems && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Action Items:</h4>
              <ul className="space-y-1">
                {advice.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-green-500 mt-1">✓</span>
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with History Dropdown */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Chat History</span>
                <span className="sm:hidden">History</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 sm:w-80 max-h-80 sm:max-h-96">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="text-sm">Recent Sessions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-56 sm:max-h-64">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading sessions...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No chat sessions yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <DropdownMenuItem
                      key={session.id}
                      className={`flex items-center justify-between p-3 cursor-pointer group ${
                        session.isActive ? 'bg-brand-background/10' : ''
                      }`}
                      onClick={() => handleSwitchSession(session.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {session.sessionName}
                        </span>
                        {session.isActive && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-brand-background" />
            <span className="font-medium text-gray-900 text-sm sm:text-base">AI Assistant</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New Chat</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 relative overflow-hidden">
        
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
      {/* Quick Actions */}
      <div className="mb-3 sm:mb-4 px-2 sm:px-0 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Quick Actions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const randomPrompt = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
              setInputValue(randomPrompt.prompt);
              inputRef.current?.focus();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 h-6 px-2"
          >
            Try Example
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {QUICK_ACTIONS.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 h-auto py-2 px-2 sm:px-3 text-xs"
              onClick={() => handleQuickAction(action.query, action.type)}
            >
              <action.icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 border rounded-lg p-2 sm:p-4 mb-3 sm:mb-4 bg-gradient-to-b from-white to-gray-50 min-h-0">
        <div className="space-y-3 sm:space-y-4 pb-4">
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
              className={`flex gap-2 sm:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-blue-100">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`${message.jobResults ? 'w-full' : 'max-w-[85%] sm:max-w-[80%]'} ${message.type === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`rounded-lg p-2 sm:p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none">
                    {message.type === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1 sm:mb-2 last:mb-0 text-xs sm:text-sm">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-xs sm:text-sm leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2 mt-2 sm:mt-4 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 mt-2 sm:mt-3 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xs sm:text-sm font-semibold mb-1 mt-1 sm:mt-2 first:mt-0">{children}</h3>,
                          code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2">{children}</blockquote>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap text-xs sm:text-sm">{message.content}</div>
                    )}
                  </div>
                  
                  {/* Show attached file info */}
                  {message.attachedFile && (
                    <div className="mt-2 p-2 bg-black/10 rounded text-xs flex items-center gap-2">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate">{message.attachedFile.name}</span>
                      <span className="opacity-70 shrink-0">
                        ({(message.attachedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* AI Analysis */}
                {message.analysis && (
                  <div className="mt-2 sm:mt-3">
                    <AIAnalysisCard analysis={message.analysis} />
                  </div>
                )}
                
                {/* AI Suggestions and Action Items */}
                {(message.suggestions || message.actionItems) && (
                  <div className="mt-2 sm:mt-3">
                    <SuggestionsCard suggestions={message.suggestions} actionItems={message.actionItems} />
                  </div>
                )}
                
                {/* Job Results */}
                {message.jobResults && message.jobResults.length > 0 && (
                  <div className="mt-2 sm:mt-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                          <span className="font-semibold text-blue-900 text-xs sm:text-sm">
                            Found {message.jobResults.length} Job{message.jobResults.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          <span className="hidden sm:inline">Scroll to view all</span>
                          <span className="sm:hidden">View all</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 w-full">
                      {message.jobResults.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Resume Advice */}
                {message.resumeAdvice && (
                  <div className="mt-2 sm:mt-3">
                    <ResumeAdviceCard advice={message.resumeAdvice} />
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {message.type === 'user' && (
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-gray-200">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 mt-1">
                <AvatarFallback className="bg-blue-100">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-600" />
                  <span className="text-xs sm:text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-2 sm:p-3 shadow-lg shrink-0">
        {/* File Upload Section */}
        {showFileUpload && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700">Upload CV for Analysis</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <FileUpload
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              accept=".pdf,.doc,.docx,.txt"
              showPreview={true}
              className="max-w-md"
            />
          </div>
        )}

        {/* Current uploaded file display */}
        {uploadedFile && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-800">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">Resume uploaded: {uploadedFile.fileName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileRemove}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
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
              placeholder={uploadedFile 
                ? "Ask me to analyze your uploaded resume or ask any career-related questions..."
                : "Ask me about jobs, resume analysis, career advice, or interview preparation..."
              }
              className="min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none pr-10 sm:pr-12 text-xs sm:text-sm leading-relaxed"
              disabled={isLoading}
              rows={2}
            />
            <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 flex items-center gap-1 text-xs text-gray-400">
              <CornerDownLeft className="w-2 h-2 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Send</span>
            </div>
          </div>
          
          {/* File Upload Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={isLoading}
            className="h-[50px] sm:h-[60px] px-2 sm:px-3"
            title="Upload cv for analysis"
          >
            <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          
          {/* Send Button */}
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={(!inputValue.trim() && !uploadedFile) || isLoading}
            size="lg"
            className="h-[50px] sm:h-[60px] px-3 sm:px-5 bg-brand-background hover:bg-brand-background/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
        
        {/* Character count and tips */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <span>{inputValue.length}/2000</span>
            {inputValue.length > 1500 && (
              <span className="text-orange-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Approaching limit</span>
                <span className="sm:hidden">Limit</span>
              </span>
            )}
          </div>
          <div className="text-gray-400 flex items-center gap-1 sm:gap-2">
            <span className="hidden sm:inline">💡 Tip: Be specific for better AI responses</span>
            <span className="sm:hidden">💡 Be specific</span>
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}