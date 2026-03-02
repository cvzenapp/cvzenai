/**
 * Template Preview Demo Component
 * Demonstrates the template preview functionality with user content
 */

import React, { useState } from 'react';
import { Resume } from '@shared/api';
import { TemplatePreviewWithSwitcher } from './TemplatePreviewWithSwitcher';

// Sample resume data for demonstration
const sampleResume: Resume = {
  id: '1',
  personalInfo: {
    name: 'Sarah Johnson',
    title: 'Senior Full Stack Developer',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'sarahjohnson.dev',
    linkedin: 'linkedin.com/in/sarahjohnson',
    github: 'github.com/sarahjohnson'
  },
  summary: 'Experienced full-stack developer with 8+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies.',
  objective: 'Seeking a senior engineering role where I can leverage my expertise in modern web technologies.',
  skills: [
    { id: '1', name: 'JavaScript', level: 95, category: 'Programming Languages' },
    { id: '2', name: 'React', level: 92, category: 'Frontend Frameworks' },
    { id: '3', name: 'Node.js', level: 88, category: 'Backend Technologies' },
    { id: '4', name: 'TypeScript', level: 90, category: 'Programming Languages' },
    { id: '5', name: 'Python', level: 85, category: 'Programming Languages' }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechCorp Inc.',
      position: 'Senior Full Stack Developer',
      startDate: '2022-01',
      endDate: null,
      description: 'Leading cross-functional development teams to deliver scalable web solutions for enterprise clients.',
      technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
      achievements: [
        'Led a team of 5 developers in delivering mission-critical platform features',
        'Implemented microservices architecture reducing system downtime by 60%'
      ],
      keyMetrics: [
        { metric: 'Performance Improvement', value: '60%', description: 'Reduced system downtime' },
        { metric: 'Team Size', value: '5', description: 'Developers managed' }
      ]
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09',
      endDate: '2018-05',
      gpa: '3.8'
    }
  ],
  projects: [
    {
      id: '1',
      name: 'EcoTracker App',
      description: 'Revolutionary carbon footprint tracking app with AI-powered recommendations.',
      technologies: ['React Native', 'Firebase', 'Python', 'Machine Learning'],
      startDate: '2023-01-01',
      endDate: '2023-06-01',
      url: 'https://ecotracker.app',
      github: 'github.com/username/ecotracker'
    }
  ],
  upvotes: 127,
  rating: 4.8,
  isShortlisted: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

export default function TemplatePreviewDemo() {
  const [currentTemplate, setCurrentTemplate] = useState('technology');

  const handleTemplateChange = (templateId: string) => {
    setCurrentTemplate(templateId);
    console.log('Template changed to:', templateId);
  };

  const handleDownload = (templateId: string) => {
    console.log('Download PDF for template:', templateId);
    // In a real implementation, this would trigger PDF generation
    alert(`Downloading PDF with ${templateId} template...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Template Preview Demo
          </h1>
          <p className="text-gray-600">
            This demonstrates the template preview system with user content adaptation,
            placeholder content for missing fields, and responsive design.
          </p>
        </div>

        <TemplatePreviewWithSwitcher
          resumeData={sampleResume}
          initialTemplateId={currentTemplate}
          onTemplateChange={handleTemplateChange}
          onDownload={handleDownload}
          className="bg-white rounded-lg shadow-lg p-6"
        />

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Features Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Content Adaptation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• User resume data applied to template structure</li>
                <li>• Template-specific display formats</li>
                <li>• Section prioritization based on template</li>
                <li>• Feature-based content highlighting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Placeholder System</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Meaningful placeholder content for missing fields</li>
                <li>• Completion percentage calculation</li>
                <li>• Template compatibility scoring</li>
                <li>• Improvement recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Template Switching</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Content preservation across templates</li>
                <li>• Real-time template compatibility analysis</li>
                <li>• Template recommendation system</li>
                <li>• Seamless template transitions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Responsive Preview</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mobile, tablet, and desktop viewports</li>
                <li>• Responsive design adaptation</li>
                <li>• Real-time viewport switching</li>
                <li>• Optimized layouts for each screen size</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}