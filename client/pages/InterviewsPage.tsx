import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus } from 'lucide-react';
import { EnterpriseInterviewManager } from '../components/interviews/EnterpriseInterviewManager';
import { ShortlistWithInterviews } from '../components/interviews/ShortlistWithInterviews';
import { ScheduleInterviewForm } from '../components/interviews/ScheduleInterviewForm';
import { unifiedAuthService } from '../services/unifiedAuthService';

type TabType = 'interviews' | 'shortlist';

export const InterviewsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('interviews');
  const [userType, setUserType] = useState<'recruiter' | 'job_seeker'>('job_seeker');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    // Determine user type from tokens
    const hasRecruiterToken = !!localStorage.getItem('recruiter_token');
    const hasAuthToken = !!localStorage.getItem('authToken');
    const detectedUserType = hasRecruiterToken ? 'recruiter' : 'job_seeker';
    
    setUserType(detectedUserType);
    
    // Set default tab based on user type
    if (detectedUserType === 'recruiter') {
      setActiveTab('interviews');
    }
  }, []);

  const handleScheduleSuccess = () => {
    setShowScheduleForm(false);
  };

  const tabs = [
    {
      id: 'interviews' as TabType,
      label: userType === 'recruiter' ? 'Scheduled Interviews' : 'My Interviews',
      icon: Calendar,
      description: userType === 'recruiter' 
        ? 'Manage interviews you\'ve scheduled with candidates'
        : 'View and respond to interview invitations'
    },
    ...(userType === 'recruiter' ? [{
      id: 'shortlist' as TabType,
      label: 'Shortlisted Candidates',
      icon: Users,
      description: 'Schedule interviews with your shortlisted candidates'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {userType === 'recruiter' ? 'Interview Management' : 'My Interviews'}
            </h1>
            <p className="text-gray-600">
              {userType === 'recruiter' 
                ? 'Enterprise-level interview scheduling and management'
                : 'View and respond to interview invitations from recruiters'
              }
            </p>
          </div>
          
          {/* Quick Schedule Button for Recruiters */}
          {userType === 'recruiter' && (
            <button
              onClick={() => setShowScheduleForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    activeTab === id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'interviews' && (
            <EnterpriseInterviewManager userType={userType} />
          )}
          
          {activeTab === 'shortlist' && userType === 'recruiter' && (
            <ShortlistWithInterviews />
          )}
        </div>
      </div>

      {/* Schedule Interview Form */}
      {showScheduleForm && (
        <ScheduleInterviewForm
          isOpen={true}
          onClose={() => setShowScheduleForm(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
};