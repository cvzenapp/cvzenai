import React from 'react';
import { StreamingChatInterface } from '../components/dashboard/StreamingChatInterface';
import { AIMemoryDemo } from '../components/dashboard/AIMemoryDemo';

export const StreamingChatDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Chat with Streaming & Memory
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience real-time AI responses that stream like human typing, powered by 
            comprehensive memory that remembers your conversations, resume analyses, and career goals.
          </p>
        </div>

        {/* Streaming Chat Interface */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">Real-time Streaming Chat</h2>
          <StreamingChatInterface />
        </div>

        {/* Memory System Demo */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center">AI Memory System</h2>
          <AIMemoryDemo />
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-sm p-8 mt-12">
          <h3 className="text-xl font-semibold mb-6 text-center">Key Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-medium mb-2">Real-time Streaming</h4>
              <p className="text-sm text-gray-600">
                Responses appear instantly as they're generated, creating a natural conversation flow
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="font-medium mb-2">Persistent Memory</h4>
              <p className="text-sm text-gray-600">
                Remembers your career goals, resume feedback, and conversation history
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-medium mb-2">Contextual Responses</h4>
              <p className="text-sm text-gray-600">
                Uses your profile and history to provide personalized, relevant advice
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📄</span>
              </div>
              <h4 className="font-medium mb-2">Resume Analysis</h4>
              <p className="text-sm text-gray-600">
                Comprehensive resume feedback with skill extraction and improvement tracking
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💼</span>
              </div>
              <h4 className="font-medium mb-2">Career Guidance</h4>
              <p className="text-sm text-gray-600">
                Personalized career advice based on your skills, goals, and industry trends
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔄</span>
              </div>
              <h4 className="font-medium mb-2">Progressive Learning</h4>
              <p className="text-sm text-gray-600">
                Gets smarter with each interaction, providing increasingly relevant suggestions
              </p>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">How to Use</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</span>
              <div>
                <strong>Start a conversation:</strong> Type your message and select the appropriate chat type (general, resume analysis, career advice, etc.)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</span>
              <div>
                <strong>Watch real-time responses:</strong> See the AI response appear word by word, just like human typing
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</span>
              <div>
                <strong>Build your profile:</strong> The AI remembers your interactions and builds a comprehensive profile for better future responses
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">4</span>
              <div>
                <strong>Get personalized advice:</strong> Follow-up questions will reference your previous conversations and profile data
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingChatDemo;