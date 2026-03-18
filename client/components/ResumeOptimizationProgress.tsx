import React, { useState, useEffect } from 'react';
import { resumeOptimizationStreamService, OptimizationProgress } from '../services/resumeOptimizationStreamApi';

interface ResumeOptimizationProgressProps {
  resumeId: string;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export const ResumeOptimizationProgress: React.FC<ResumeOptimizationProgressProps> = ({
  resumeId,
  jobTitle,
  jobDescription,
  companyName,
  onComplete,
  onCancel
}) => {
  const [progress, setProgress] = useState<OptimizationProgress | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState<string>('');

  useEffect(() => {
    startOptimization();
    
    return () => {
      resumeOptimizationStreamService.disconnect();
    };
  }, []);

  const startOptimization = async () => {
    setIsOptimizing(true);
    setError(null);
    setCompletedSections([]);
    setCurrentSection('');

    await resumeOptimizationStreamService.optimizeResumeWithProgress(
      resumeId,
      jobTitle,
      jobDescription,
      companyName,
      handleProgress,
      handleComplete,
      handleError
    );
  };

  const handleProgress = (progressData: OptimizationProgress) => {
    setProgress(progressData);
    
    if (progressData.type === 'section_completed') {
      setCompletedSections(prev => [...prev, progressData.sectionName || '']);
    }
    
    if (progressData.currentSection) {
      setCurrentSection(progressData.currentSection);
    }
  };

  const handleComplete = (result: any) => {
    setIsOptimizing(false);
    onComplete(result);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsOptimizing(false);
  };

  const getProgressPercentage = () => {
    return progress?.progress || 0;
  };

  const getSectionStatus = (sectionName: string) => {
    if (completedSections.includes(sectionName)) {
      return 'completed';
    }
    if (currentSection === sectionName) {
      return 'processing';
    }
    return 'pending';
  };

  const sections = [
    'Professional Summary',
    'Skills',
    'Work Experience',
    'Education',
    'Projects'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Optimizing Your Resume
          </h3>
          <p className="text-gray-600">
            AI is analyzing and improving your resume section by section
          </p>
        </div>

        {error ? (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Optimization Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            {progress && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Current Status:</p>
                <p className="text-sm font-medium text-gray-900">
                  {progress.message}
                </p>
                {progress.originalScore && progress.newScore && (
                  <div className="mt-2 text-sm text-green-600">
                    Score improved: {progress.originalScore} → {progress.newScore} 
                    (+{progress.improvement} points)
                  </div>
                )}
              </div>
            )}

            {/* Section Progress */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Sections:</p>
              <div className="space-y-2">
                {sections.map((section) => {
                  const status = getSectionStatus(section);
                  return (
                    <div key={section} className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {status === 'completed' ? (
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : status === 'processing' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                        )}
                      </div>
                      <span className={`text-sm ${
                        status === 'completed' ? 'text-green-600 font-medium' :
                        status === 'processing' ? 'text-blue-600 font-medium' :
                        'text-gray-500'
                      }`}>
                        {section}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Improvements List */}
            {progress?.improvements && progress.improvements.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Recent Improvements:</p>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <ul className="text-sm text-green-800 space-y-1">
                    {progress.improvements.slice(-3).map((improvement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Cancel Button */}
            {isOptimizing && (
              <div className="flex justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};