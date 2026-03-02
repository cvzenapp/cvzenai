import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Brain, MessageSquare, FileText, User, Clock, TrendingUp } from 'lucide-react';

interface UserMemory {
  careerStage?: string;
  primarySkills?: string[];
  industries?: string[];
  jobTitles?: string[];
  interactionCount: number;
  lastResumeAnalysis?: string;
  lastJobSearch?: string;
  lastCareerAdvice?: string;
}

interface ResumeMemory {
  id: number;
  analysisSummary?: string;
  overallScore?: number;
  careerLevel?: string;
  skillsExtracted?: string[];
  createdAt: string;
}

interface ChatMessage {
  id: number;
  messageType: 'user' | 'assistant';
  content: string;
  aiType?: string;
  createdAt: string;
}

export const AIMemoryDemo: React.FC = () => {
  const [userMemory, setUserMemory] = useState<UserMemory | null>(null);
  const [resumeMemories, setResumeMemories] = useState<ResumeMemory[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMemoryData();
  }, []);

  const loadMemoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please log in to view memory data');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load user profile memory
      const profileResponse = await fetch('/api/ai-chat/memory/profile', { headers });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserMemory(profileData.profile);
      }

      // Load resume memories
      const resumeResponse = await fetch('/api/ai-chat/memory/resumes', { headers });
      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json();
        setResumeMemories(resumeData.resumes || []);
      }

      // Load recent chat sessions
      const sessionsResponse = await fetch('/api/ai-chat/memory/sessions', { headers });
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setRecentMessages(sessionsData.recentMessages || []);
      }

    } catch (err) {
      setError('Failed to load memory data');
      console.error('Memory data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testMemoryChat = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/ai-chat/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'What do you remember about me?',
          type: 'general_chat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`AI Response: ${data.response.content}\n\nMemory Updated: ${data.response.memoryUpdated}\nContext Used: ${data.response.contextUsed?.join(', ')}`);
        loadMemoryData(); // Refresh data
      }
    } catch (err) {
      console.error('Test chat error:', err);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading memory data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-red-600 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">AI Memory System Demo</h2>
        <Button onClick={testMemoryChat} variant="outline" size="sm">
          Test Memory Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Profile Memory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userMemory ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Career Stage:</span>
                  <Badge variant="secondary" className="ml-2">
                    {userMemory.careerStage || 'Unknown'}
                  </Badge>
                </div>
                
                <div>
                  <span className="font-medium">Interactions:</span>
                  <span className="ml-2">{userMemory.interactionCount}</span>
                </div>

                {userMemory.primarySkills && userMemory.primarySkills.length > 0 && (
                  <div>
                    <span className="font-medium">Top Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userMemory.primarySkills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {userMemory.industries && userMemory.industries.length > 0 && (
                  <div>
                    <span className="font-medium">Industries:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userMemory.industries.map((industry, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  {userMemory.lastResumeAnalysis && (
                    <div>Last Resume Analysis: {new Date(userMemory.lastResumeAnalysis).toLocaleDateString()}</div>
                  )}
                  {userMemory.lastJobSearch && (
                    <div>Last Job Search: {new Date(userMemory.lastJobSearch).toLocaleDateString()}</div>
                  )}
                  {userMemory.lastCareerAdvice && (
                    <div>Last Career Advice: {new Date(userMemory.lastCareerAdvice).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No profile memory available</div>
            )}
          </CardContent>
        </Card>

        {/* Resume Analysis Memory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumeMemories.length > 0 ? (
              <div className="space-y-4">
                {resumeMemories.slice(0, 2).map((resume) => (
                  <div key={resume.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        Score: {resume.overallScore || 'N/A'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {resume.careerLevel && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Level:</span> {resume.careerLevel}
                      </div>
                    )}
                    
                    {resume.skillsExtracted && resume.skillsExtracted.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resume.skillsExtracted.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {resume.analysisSummary && (
                      <div className="text-xs text-gray-600 mt-2">
                        {resume.analysisSummary.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
                
                {resumeMemories.length > 2 && (
                  <div className="text-sm text-gray-500 text-center">
                    +{resumeMemories.length - 2} more analyses
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">No resume analyses yet</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Chat History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMessages.length > 0 ? (
              <div className="space-y-3">
                {recentMessages.slice(-4).map((message) => (
                  <div key={message.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={message.messageType === 'user' ? 'default' : 'secondary'}>
                        {message.messageType}
                      </Badge>
                      {message.aiType && (
                        <Badge variant="outline" className="text-xs">
                          {message.aiType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      {message.content.substring(0, 80)}
                      {message.content.length > 80 && '...'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No chat history yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memory Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Memory System Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Contextual Memory</h3>
              <p className="text-sm text-gray-600">Remembers your career goals and preferences</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Resume Analysis</h3>
              <p className="text-sm text-gray-600">Tracks resume improvements over time</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Chat History</h3>
              <p className="text-sm text-gray-600">Maintains conversation context</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-medium">Progressive Learning</h3>
              <p className="text-sm text-gray-600">Gets smarter with each interaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMemoryDemo;