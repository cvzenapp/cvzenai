/**
 * Example implementation of ResumeDisplay with section-by-section ATS improvement
 * 
 * This file demonstrates how to integrate the useSectionImprovement hook
 * into the ResumeDisplay component for granular AI improvements.
 * 
 * Key features:
 * - Each section can be improved independently
 * - Real-time preview updates
 * - Shimmer effect during improvement
 * - No page reloads required
 */

import { useState, useEffect } from "react";
import { Resume } from "@shared/api";
import { TemplateConfig } from "@/services/templateService";
import { useSectionImprovement } from "@/hooks/useSectionImprovement";
import { ImprovableSection } from "@/components/templates/components/ImprovableSection";
import { Button } from "@/components/ui/button";
import { Download, Share2, Save, AlertCircle } from "lucide-react";

interface ResumeDisplayWithSectionImprovementProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  mode: 'preview' | 'shared';
  onShare?: () => void;
  onDownloadPDF?: () => void;
  onSave?: (resume: Resume) => Promise<void>;
}

export default function ResumeDisplayWithSectionImprovement({
  resume,
  templateConfig,
  mode,
  onShare,
  onDownloadPDF,
  onSave
}: ResumeDisplayWithSectionImprovementProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize section improvement hook
  const {
    improveSection,
    isImprovingSection,
    getSectionError,
    getImprovedResume,
    hasImprovements
  } = useSectionImprovement(Number(resume.id), resume);

  // Get the resume to display (with improvements if any)
  const displayResume = hasImprovements ? getImprovedResume() : resume;

  // Only show improve buttons in preview mode (user's own resume)
  const showImproveButtons = mode === 'preview';

  // Handle save with improvements
  const handleSaveImprovements = async () => {
    if (!hasImprovements || !onSave) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(getImprovedResume());
      console.log('✅ Improvements saved successfully');
    } catch (error) {
      console.error('❌ Error saving improvements:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save improvements');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {displayResume.personalInfo.name}'s Resume
              </h1>
              {hasImprovements && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Improvements Applied
                </span>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Save Button - Only show if there are improvements */}
              {hasImprovements && onSave && (
                <Button
                  onClick={handleSaveImprovements}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Improvements'}</span>
                </Button>
              )}

              {/* Share Button */}
              {onShare && (
                <Button
                  onClick={onShare}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}
              
              {/* Download Button */}
              {onDownloadPDF && (
                <Button
                  onClick={onDownloadPDF}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Save Failed</h4>
              <p className="text-sm text-red-800">{saveError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resume Content */}
      <div className="w-full pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-8 space-y-8">
            
            {/* Professional Summary Section */}
            {displayResume.summary && (
              <ImprovableSection
                sectionType="summary"
                onImprove={() => improveSection('summary', displayResume.summary)}
                isImproving={isImprovingSection('summary')}
                showImproveButton={showImproveButtons}
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Professional Summary</h2>
                  <p className="text-gray-700 leading-relaxed">{displayResume.summary}</p>
                </div>
              </ImprovableSection>
            )}

            {/* Career Objective Section */} Test
            {displayResume.objective && (
              <ImprovableSection
                sectionType="objective"
                onImprove={() => improveSection('objective', displayResume.objective)}
                isImproving={isImprovingSection('objective')}
                showImproveButton={showImproveButtons}
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Career Objective</h2>
                  <p className="text-gray-700 leading-relaxed">{displayResume.objective}</p>
                </div>
              </ImprovableSection>
            )}

            {/* Skills Section */}
            {displayResume.skills && displayResume.skills.length > 0 && (
              <ImprovableSection
                sectionType="skills"
                onImprove={() => improveSection('skills', displayResume.skills)}
                isImproving={isImprovingSection('skills')}
                showImproveButton={showImproveButtons}
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {displayResume.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </ImprovableSection>
            )}

            {/* Experience Section */}
            {displayResume.experience && displayResume.experience.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Experience</h2>
                <div className="space-y-6">
                  {displayResume.experience.map((exp, index) => (
                    <ImprovableSection
                      key={index}
                      sectionType="experience"
                      sectionIndex={index}
                      onImprove={() => improveSection('experience', exp, index)}
                      isImproving={isImprovingSection('experience', index)}
                      showImproveButton={showImproveButtons}
                      className="border-l-4 border-blue-500 pl-4"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{exp.position}</h3>
                        <p className="text-gray-600 font-medium">{exp.company}</p>
                        {exp.duration && (
                          <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                        )}
                        {exp.description && (
                          <p className="text-gray-700 mb-2">{exp.description}</p>
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </ImprovableSection>
                  ))}
                </div>
              </div>
            )}

            {/* Education Section */}
            {displayResume.education && displayResume.education.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
                <div className="space-y-6">
                  {displayResume.education.map((edu, index) => (
                    <ImprovableSection
                      key={index}
                      sectionType="education"
                      sectionIndex={index}
                      onImprove={() => improveSection('education', edu, index)}
                      isImproving={isImprovingSection('education', index)}
                      showImproveButton={showImproveButtons}
                      className="border-l-4 border-purple-500 pl-4"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {edu.degree} in {edu.field}
                        </h3>
                        <p className="text-gray-600 font-medium">{edu.institution}</p>
                        {edu.graduationDate && (
                          <p className="text-sm text-gray-500">{edu.graduationDate}</p>
                        )}
                        {edu.gpa && (
                          <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>
                        )}
                      </div>
                    </ImprovableSection>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Section */}
            {displayResume.projects && displayResume.projects.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Projects</h2>
                <div className="space-y-6">
                  {displayResume.projects.map((project, index) => (
                    <ImprovableSection
                      key={index}
                      sectionType="project"
                      sectionIndex={index}
                      onImprove={() => improveSection('project', project, index)}
                      isImproving={isImprovingSection('project', index)}
                      showImproveButton={showImproveButtons}
                      className="border-l-4 border-green-500 pl-4"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        {project.description && (
                          <p className="text-gray-700 mb-2">{project.description}</p>
                        )}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.technologies.map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </ImprovableSection>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
