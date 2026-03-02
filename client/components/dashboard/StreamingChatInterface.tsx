import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Send, Bot, User, Loader2, Zap, Brain, Paperclip, FileText, X } from 'lucide-react';
import { aiChatStreamingService, StreamingChatRequest } from '../../services/aiChatStreamingService';
import { FileUpload } from '../ui/file-upload';
import { fileUploadService, FileUploadResult } from '../../services/fileUploadService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  suggestions?: string[];
  actionItems?: string[];
  analysis?: any;
  memoryUpdated?: boolean;
  contextUsed?: string[];
  attachedFile?: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

export const StreamingChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [usePremium, setUsePremium] = useState(false);
  const [chatType, setChatType] = useState<'general_chat' | 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep'>('general_chat');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !uploadedFile) || isStreaming) return;

    let messageContent = inputMessage;
    let attachedFile = undefined;

    // If there's an uploaded file, analyze it
    if (uploadedFile && uploadedFile.success) {
      messageContent = inputMessage || `Please analyze my resume file: ${uploadedFile.fileName}`;
      attachedFile = {
        fileName: uploadedFile.fileName!,
        fileSize: uploadedFile.fileSize!,
        fileType: uploadedFile.fileType!
      };
      
      // Set chat type to resume analysis for file uploads
      setChatType('resume_analysis');
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachedFile: attachedFile
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    currentStreamingMessageRef.current = '';

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, aiMessage]);

    // If we have a file, send it for analysis first
    if (uploadedFile && uploadedFile.success && uploadedFile.content) {
      try {
        // Send file for analysis
        const token = localStorage.getItem('authToken');
        const analysisResponse = await fetch('/api/ai-chat/analyze-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileContent: uploadedFile.content,
            fileName: uploadedFile.fileName,
            analysisType: 'resume_analysis'
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          
          // Update the AI message with the analysis
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: analysisData.analysis.content,
                  isStreaming: false,
                  suggestions: analysisData.analysis.suggestions,
                  actionItems: analysisData.analysis.actionItems,
                  analysis: analysisData.analysis.analysis,
                  memoryUpdated: analysisData.analysis.memoryUpdated,
                  contextUsed: analysisData.analysis.contextUsed
                }
              : msg
          ));
          
          setIsStreaming(false);
          setUploadedFile(null); // Clear the uploaded file
          setShowFileUpload(false);
          return;
        }
      } catch (error) {
        console.error('File analysis error:', error);
      }
    }

    // Regular streaming chat
    const request: StreamingChatRequest = {
      message: messageContent,
      type: chatType,
      usePremium: usePremium,
      context: {
        userProfile: {
          // Add any user profile data here
        }
      }
    };

    try {
      await aiChatStreamingService.streamChat(request, {
        onConnect: () => {
          console.log('Stream connected');
        },
        
        onTyping: (message) => {
          setIsTyping(true);
          setTypingMessage(message);
        },
        
        onChunk: (content) => {
          setIsTyping(false);
          currentStreamingMessageRef.current += content;
          
          // Update the streaming message
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: currentStreamingMessageRef.current }
              : msg
          ));
        },
        
        onComplete: (data) => {
          setIsStreaming(false);
          setIsTyping(false);
          
          // Update final message with complete data
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: currentStreamingMessageRef.current,
                  isStreaming: false,
                  suggestions: data.suggestions,
                  actionItems: data.actionItems,
                  analysis: data.analysis,
                  memoryUpdated: data.memoryUpdated,
                  contextUsed: data.contextUsed
                }
              : msg
          ));
          
          // Clear uploaded file after successful analysis
          if (uploadedFile) {
            setUploadedFile(null);
            setShowFileUpload(false);
          }
        },
        
        onError: (error) => {
          setIsStreaming(false);
          setIsTyping(false);
          
          // Update message with error
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: `Error: ${error}`,
                  isStreaming: false
                }
              : msg
          ));
        }
      });
    } catch (error) {
      setIsStreaming(false);
      setIsTyping(false);
      console.error('Chat error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (result: FileUploadResult) => {
    setUploadedFile(result);
    if (result.success) {
      // Auto-set to resume analysis when file is uploaded
      setChatType('resume_analysis');
      // Suggest a message if none is provided
      if (!inputMessage.trim()) {
        setInputMessage(`Please analyze my resume file: ${result.fileName}`);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setShowFileUpload(false);
  };

  const quickPrompts = [
    { text: 'Analyze my resume', type: 'resume_analysis' as const },
    { text: 'Give me career advice', type: 'career_advice' as const },
    { text: 'Help me find jobs', type: 'job_search' as const },
    { text: 'Prepare for interviews', type: 'interview_prep' as const },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Streaming AI Chat
            <Badge variant={usePremium ? 'default' : 'secondary'} className="ml-2">
              {usePremium ? 'Premium' : 'Free'}
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2 flex-wrap">
            <select 
              value={chatType} 
              onChange={(e) => setChatType(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="general_chat">General Chat</option>
              <option value="resume_analysis">Resume Analysis</option>
              <option value="career_advice">Career Advice</option>
              <option value="job_search">Job Search</option>
              <option value="interview_prep">Interview Prep</option>
            </select>
            
            <Button
              variant={usePremium ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUsePremium(!usePremium)}
            >
              <Zap className="h-4 w-4 mr-1" />
              Premium
            </Button>
            
            <Button
              variant={showFileUpload ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFileUpload(!showFileUpload)}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach Resume
            </Button>
          </div>
          
          {/* File Upload Section */}
          {showFileUpload && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <FileUpload
                onFileUpload={handleFileUpload}
                onFileRemove={handleRemoveFile}
                disabled={isStreaming}
                showPreview={true}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Start a conversation with the AI assistant!</p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputMessage(prompt.text);
                        setChatType(prompt.type);
                      }}
                    >
                      {prompt.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border shadow-sm'
                  }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Show attached file */}
                    {message.attachedFile && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{message.attachedFile.fileName}</span>
                          <span className="text-gray-500">
                            ({fileUploadService.formatFileSize(message.attachedFile.fileSize)})
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {message.isStreaming && (
                      <div className="flex items-center gap-1 mt-2 text-gray-500">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                    
                    {/* Show metadata for completed AI messages */}
                    {message.type === 'assistant' && !message.isStreaming && (
                      <div className="mt-3 space-y-2">
                        {message.memoryUpdated && (
                          <Badge variant="outline" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            Memory Updated
                          </Badge>
                        )}
                        
                        {message.contextUsed && message.contextUsed.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Context: {message.contextUsed.join(', ')}
                          </div>
                        )}
                        
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-600">Suggestions:</div>
                            {message.suggestions.slice(0, 3).map((suggestion, index) => (
                              <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                • {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {message.analysis && message.analysis.score && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Overall Score: {message.analysis.score}/100
                              </Badge>
                              {message.analysis.atsScore && (
                                <Badge variant="outline" className="text-xs">
                                  ATS Score: {message.analysis.atsScore}/100
                                </Badge>
                              )}
                            </div>
                            
                            {message.analysis.careerLevel && (
                              <Badge variant="outline" className="text-xs">
                                Career Level: {message.analysis.careerLevel}
                              </Badge>
                            )}
                            
                            {message.analysis.skillsExtracted && message.analysis.skillsExtracted.length > 0 && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-600">Skills Found:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {message.analysis.skillsExtracted.slice(0, 8).map((skill: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {message.analysis.skillsExtracted.length > 8 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{message.analysis.skillsExtracted.length - 8} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border shadow-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {typingMessage}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            {/* File Upload Status */}
            {uploadedFile && uploadedFile.success && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {uploadedFile.fileName} ready for analysis
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  uploadedFile && uploadedFile.success 
                    ? "Ask questions about your resume or request specific analysis..."
                    : "Type your message... (Enter to send, Shift+Enter for new line)"
                }
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                disabled={isStreaming}
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  disabled={isStreaming}
                  className="px-3"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !uploadedFile) || isStreaming}
                  className="px-4"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2 text-center">
            Streaming AI responses • Memory-enabled • File upload for resume analysis • Real-time ATS scoring
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamingChatInterface;