import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsedResumeData {
  personalInfo?: any;
  summary?: string;
  objective?: string;
  skills?: any[];
  experience?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
  languages?: any[];
}

interface ResumeParsingAnalysisProps {
  parsedData: ParsedResumeData;
  resumeId: string;
  onContinue: () => void;
  onPreview: () => void;
  onCancel: () => void;
  hideButtons?: boolean; // Add option to hide buttons for job application mode
}

interface AnalysisItem {
  field: string;
  status: 'complete' | 'incomplete' | 'missing';
  message: string;
  icon: React.ReactNode;
}

export default function ResumeParsingAnalysis({ 
  parsedData,
  resumeId,
  onContinue,
  onPreview,
  onCancel,
  hideButtons = false
}: ResumeParsingAnalysisProps) {
  
  const analyzeResume = (): AnalysisItem[] => {
    const items: AnalysisItem[] = [];

    // Personal Info
    const hasName = parsedData.personalInfo?.fullName || parsedData.personalInfo?.firstName;
    const hasEmail = parsedData.personalInfo?.email;
    const hasPhone = parsedData.personalInfo?.phone;
    
    if (hasName && hasEmail && hasPhone) {
      items.push({
        field: 'Contact Information',
        status: 'complete',
        message: 'Name, email, and phone extracted',
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      });
    } else {
      const missing = [];
      if (!hasName) missing.push('name');
      if (!hasEmail) missing.push('email');
      if (!hasPhone) missing.push('phone');
      items.push({
        field: 'Contact Information',
        status: 'incomplete',
        message: `Missing: ${missing.join(', ')}`,
        icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />
      });
    }

    // Summary/Objective
    if (parsedData.summary || parsedData.objective) {
      items.push({
        field: 'Professional Summary',
        status: 'complete',
        message: 'Summary extracted',
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      });
    } else {
      items.push({
        field: 'Professional Summary',
        status: 'missing',
        message: 'Add a professional summary in the builder',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />
      });
    }

    // Skills
    if (parsedData.skills && parsedData.skills.length > 0) {
      items.push({
        field: 'Skills',
        status: 'complete',
        message: `${parsedData.skills.length} skills extracted`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      });
    } else {
      items.push({
        field: 'Skills',
        status: 'missing',
        message: 'No skills found - add them manually',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />
      });
    }

    // Experience
    if (parsedData.experience && parsedData.experience.length > 0) {
      const missingDates = parsedData.experience.filter(exp => 
        !exp.startDate || !exp.endDate
      ).length;
      
      if (missingDates > 0) {
        items.push({
          field: 'Work Experience',
          status: 'incomplete',
          message: `${parsedData.experience.length} entries found, ${missingDates} missing dates`,
          icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />
        });
      } else {
        items.push({
          field: 'Work Experience',
          status: 'complete',
          message: `${parsedData.experience.length} entries extracted`,
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
        });
      }
    } else {
      items.push({
        field: 'Work Experience',
        status: 'missing',
        message: 'No experience found - add manually',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />
      });
    }

    // Education
    if (parsedData.education && parsedData.education.length > 0) {
      const missingDates = parsedData.education.filter(edu => 
        !edu.startDate || !edu.endDate
      ).length;
      
      if (missingDates > 0) {
        items.push({
          field: 'Education',
          status: 'incomplete',
          message: `${parsedData.education.length} entries found, ${missingDates} missing dates`,
          icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />
        });
      } else {
        items.push({
          field: 'Education',
          status: 'complete',
          message: `${parsedData.education.length} entries extracted`,
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
        });
      }
    } else {
      items.push({
        field: 'Education',
        status: 'missing',
        message: 'No education found - add manually',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />
      });
    }

    // Projects
    if (parsedData.projects && parsedData.projects.length > 0) {
      items.push({
        field: 'Projects',
        status: 'complete',
        message: `${parsedData.projects.length} projects extracted`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      });
    } else {
      items.push({
        field: 'Projects',
        status: 'missing',
        message: 'No projects found - consider adding them',
        icon: <Info className="h-4 w-4 text-blue-600" />
      });
    }

    // Certifications
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      items.push({
        field: 'Certifications',
        status: 'complete',
        message: `${parsedData.certifications.length} certifications extracted`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      });
    } else {
      items.push({
        field: 'Certifications',
        status: 'missing',
        message: 'No certifications found - add if applicable',
        icon: <Info className="h-4 w-4 text-blue-600" />
      });
    }

    return items;
  };

  const analysis = analyzeResume();
  const completeCount = analysis.filter(item => item.status === 'complete').length;
  const incompleteCount = analysis.filter(item => item.status === 'incomplete').length;
  const missingCount = analysis.filter(item => item.status === 'missing').length;

  return (
    <div className="space-y-4">
      <div className="bg-brand-auxiliary-1/20 border border-brand-main/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-brand-main mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-brand-background mb-1">Resume Analysis Complete</h4>
            <p className="text-sm text-slate-600">
              We've extracted your resume data. Review what was found and what needs attention.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{completeCount}</div>
          <div className="text-xs text-green-600">Complete</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{incompleteCount}</div>
          <div className="text-xs text-yellow-600">Needs Review</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{missingCount}</div>
          <div className="text-xs text-red-600">Missing</div>
        </div>
      </div>

      <div className="space-y-3">
        {analysis.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-2 rounded-lg border ${
              item.status === 'complete'
                ? 'bg-green-50 border-green-200'
                : item.status === 'incomplete'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {item.icon}
            <div className="flex-1">
              <div className="font-medium text-sm">{item.field}</div>
              <div className="text-xs text-gray-600 mt-0.5">{item.message}</div>
            </div>
          </div>
        ))}
      </div>

      {(incompleteCount > 0 || missingCount > 0) && !hideButtons && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> You can add missing information and fix incomplete data in the resume builder.
          </p>
        </div>
      )}

      {!hideButtons && (
        <>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onPreview}
              variant="outline"
              className="flex-1 h-9 text-sm border-brand-main/30 text-brand-main hover:bg-brand-main/10"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview Resume
            </Button>
            <Button
              onClick={onContinue}
              className="flex-1 h-9 text-sm bg-brand-main hover:bg-brand-main/90 text-white"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit in Builder
            </Button>
          </div>
          
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full h-8 text-sm"
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
