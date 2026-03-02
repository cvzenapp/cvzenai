import React, { useState } from 'react';
import { ScheduleInterviewForm } from '../components/interviews/ScheduleInterviewForm';
import { InterviewResponseModal } from '../components/interviews/InterviewResponseModal';
import { InterviewsDashboard } from '../components/interviews/InterviewsDashboard';
import { InterviewAuthTest } from '../components/interviews/InterviewAuthTest';
import { Calendar, User, Video } from 'lucide-react';
import type { InterviewInvitation } from '@shared/api';

export const InterviewDemo: React.FC = () => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Mock interview data for demo
  const mockInterview: InterviewInvitation = {
    id: 1,
    recruiterId: 1,
    candidateId: 2,
    resumeId: 1,
    title: 'Frontend Developer Interview',
    description: 'Technical interview for React.js position',
    interviewType: 'video_call',
    proposedDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    timezone: 'UTC',
    meetingLink: 'https://zoom.us/j/123456789',
    meetingInstructions: 'Please join 5 minutes early and have your portfolio ready.',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recruiter: {
      id: 1,
      name: 'John Smith',
      email: 'john@company.com',
      company: 'Tech Corp'
    },
    candidate: {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com'
    },
    resume: {
      id: 1,
      title: 'Frontend Developer Resume'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Scheduling Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Test the interview scheduling components without full authentication
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schedule Interview Demo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Schedule Interview
                </h3>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                Comprehensive recruiter interface to schedule interviews with candidate selection
              </p>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Schedule Form
              </button>
            </div>

            {/* Respond to Interview Demo */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-8 h-8 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">
                  Respond to Interview
                </h3>
              </div>
              <p className="text-green-700 text-sm mb-4">
                Candidate interface to accept/decline interview invitations
              </p>
              <button
                onClick={() => setShowResponseModal(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Open Response Modal
              </button>
            </div>

            {/* Dashboard Demo */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Video className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">
                  Interviews Dashboard
                </h3>
              </div>
              <p className="text-purple-700 text-sm mb-4">
                Main dashboard showing all interviews with filtering
              </p>
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
              </button>
            </div>
          </div>

          {/* Dashboard Display */}
          {showDashboard && (
            <div className="mt-8 border-t pt-8">
              <h2 className="text-xl font-semibold mb-4">Interviews Dashboard</h2>
              <InterviewsDashboard userType="recruiter" />
            </div>
          )}

          {/* Feature List */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">Features Implemented</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Recruiters:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Smart candidate selection from shortlisted candidates</li>
                  <li>• Multiple interview types (video, phone, in-person, technical)</li>
                  <li>• Set date, time, duration, and meeting details</li>
                  <li>• Add instructions and internal notes</li>
                  <li>• View all scheduled interviews with filtering</li>
                  <li>• Cancel or reschedule interviews</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Candidates:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Receive interview invitations</li>
                  <li>• View interview details and instructions</li>
                  <li>• Accept or decline with optional message</li>
                  <li>• Request rescheduling</li>
                  <li>• Access meeting links when accepted</li>
                  <li>• Track interview status</li>
                </ul>
              </div>
            </div>
          </div>

          {/* New Features */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">✨ New: Enhanced Candidate Selection</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Searchable candidate dropdown with multiple sources</li>
              <li>• View candidate details, resume titles, and upvotes</li>
              <li>• Filter by shortlisted candidates, applications, or all candidates</li>
              <li>• Auto-populate interview title based on selected candidate</li>
            </ul>
          </div>

          {/* Authentication Test */}
          <div className="mt-6">
            <InterviewAuthTest />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScheduleForm && (
        <ScheduleInterviewForm
          isOpen={true}
          onClose={() => setShowScheduleForm(false)}
          onSuccess={() => {
            setShowScheduleForm(false);
            alert('Interview scheduled successfully! (Demo mode)');
          }}
        />
      )}

      {showResponseModal && (
        <InterviewResponseModal
          isOpen={true}
          onClose={() => setShowResponseModal(false)}
          interview={mockInterview}
          onSuccess={() => {
            setShowResponseModal(false);
            alert('Interview response submitted! (Demo mode)');
          }}
        />
      )}
    </div>
  );
};