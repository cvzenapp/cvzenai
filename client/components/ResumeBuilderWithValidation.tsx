import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFormStateManager } from '@/hooks/useFormStateManager';
import { useStepNavigation } from '@/hooks/useStepValidation';
import { StepValidationSummary, MultiStepValidationSummary, NavigationBlocker, FormCompletionSummary } from '@/components/ui/StepValidationSummary';
import { ValidationErrorList } from '@/components/ui/ValidationError';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Briefcase,
  GraduationCap,
  Code2,
  FolderOpen,
  Save,
  Eye,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

// Step configuration
const STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic information and contact details',
    icon: User,
  },
  {
    id: 'overview',
    title: 'Professional Overview',
    description: 'Professional summary and objectives',
    icon: User,
  },
  {
    id: 'experience',
    title: 'Work Experience',
    description: 'Work history and achievements',
    icon: Briefcase,
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Academic background and qualifications',
    icon: GraduationCap,
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'Technical and professional abilities',
    icon: Code2,
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Portfolio and project showcase',
    icon: FolderOpen,
  },
];

const STEP_TITLES = STEPS.reduce((acc, step) => {
  acc[step.id] = step.title;
  return acc;
}, {} as Record<string, string>);

interface ResumeBuilderWithValidationProps {
  resumeId?: string;
  onSave?: (data: any) => Promise<void>;
  onPreview?: () => void;
}

export const ResumeBuilderWithValidation: React.FC<ResumeBuilderWithValidationProps> = ({
  resumeId = '1',
  onSave,
  onPreview,
}) => {
  const [searchParams] = useSearchParams();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Initialize form state manager
  const formManager = useFormStateManager(resumeId);
  const currentStepId = STEPS[currentStepIndex].id;

  // Initialize step validation with navigation
  const stepNavigation = useStepNavigation(
    formManager.state,
    currentStepId,
    (stepId: string) => {
      const stepIndex = STEPS.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      }
    },
    {
      enableRealTimeValidation: true,
      debounceMs: 500,
    }
  );

  // Handle step navigation
  const handleNextStep = useCallback(() => {
    const canNavigate = stepNavigation.canNavigateNext;
    if (canNavigate.canNavigate) {
      stepNavigation.navigateNext();
    } else {
      setShowValidationSummary(true);
    }
  }, [stepNavigation]);

  const handlePreviousStep = useCallback(() => {
    stepNavigation.navigatePrevious();
  }, [stepNavigation]);

  const handleStepClick = useCallback((stepId: string) => {
    stepNavigation.navigateToStep(stepId);
  }, [stepNavigation]);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      // Validate entire form before saving
      const allStepsValidation = stepNavigation.validateAllSteps();
      const hasErrors = Object.values(allStepsValidation).some(result => !result.isValid);
      
      if (hasErrors) {
        setShowValidationSummary(true);
        return;
      }

      // Convert form state to resume format
      const resumeData = {
        id: resumeId,
        ...formManager.state,
      };

      // Save to localStorage
      localStorage.setItem(`resume-${resumeId}`, JSON.stringify(resumeData));

      // Call external save handler if provided
      if (onSave) {
        await onSave(resumeData);
      }

      // Update metadata
      formManager.updateField('metadata.lastSaved', new Date().toISOString());
      formManager.updateField('metadata.isDirty', false);

    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  }, [formManager, stepNavigation, resumeId, onSave]);

  // Get current step validation
  const currentStepValidation = stepNavigation.currentStepValidation;
  const formCompletionStatus = stepNavigation.formCompletionStatus;

  // Calculate overall progress
  const overallProgress = Math.round(
    ((currentStepIndex + 1) / STEPS.length) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Resume Builder</h1>
              <Badge variant="outline" className="text-xs">
                Step {currentStepIndex + 1} of {STEPS.length}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Validation Status Indicator */}
              {currentStepValidation && (
                <div className="flex items-center space-x-2">
                  {currentStepValidation.isValid ? (
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      <span className="text-sm">Valid</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">{currentStepValidation.errors.length} errors</span>
                    </div>
                  )}
                </div>
              )}

              {/* Save Status */}
              <div className="text-sm text-gray-500">
                {formManager.state.metadata.isDirty ? 'Unsaved changes' : 'All changes saved'}
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                onClick={() => setShowValidationSummary(!showValidationSummary)}
              >
                Validation Summary
              </Button>
              
              <Button
                variant="outline"
                onClick={onPreview}
                disabled={!formCompletionStatus.isFormValid}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{formCompletionStatus.overallCompletion}%</span>
          </div>
          <Progress value={formCompletionStatus.overallCompletion} className="h-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STEPS.map((step, index) => {
                  const stepValidation = stepNavigation.getStepValidation(step.id);
                  const isCurrentStep = index === currentStepIndex;
                  const isCompleted = stepValidation.isValid && stepValidation.completionPercentage === 100;
                  const hasErrors = stepValidation.errors.length > 0;
                  const canNavigate = stepNavigation.canNavigateToStep(step.id, currentStepId).canNavigate;

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      disabled={!canNavigate && !isCurrentStep}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isCurrentStep
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : canNavigate
                          ? 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                          : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : hasErrors
                              ? 'bg-red-100 text-red-600'
                              : isCurrentStep
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{step.title}</div>
                            <div className="text-xs text-gray-500">{step.description}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                          {hasErrors && <AlertCircle className="h-4 w-4 text-red-600" />}
                          {stepValidation.warnings.length > 0 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{stepValidation.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              isCompleted
                                ? 'bg-green-500'
                                : hasErrors
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${stepValidation.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Current Step Validation Summary */}
            {currentStepValidation && (currentStepValidation.errors.length > 0 || currentStepValidation.warnings.length > 0) && (
              <div className="mt-6">
                <StepValidationSummary
                  stepId={currentStepId}
                  stepTitle={STEPS[currentStepIndex].title}
                  validationResult={currentStepValidation}
                  showDetails={true}
                />
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation Blocker */}
            {stepNavigation.navigationBlocked.blocked && (
              <div className="mb-6">
                <NavigationBlocker
                  canNavigate={false}
                  reason={stepNavigation.navigationBlocked.reason}
                  blockingErrors={stepNavigation.navigationBlocked.blockingErrors}
                  onDismiss={stepNavigation.clearNavigationBlock}
                  onFixErrors={() => setShowValidationSummary(true)}
                />
              </div>
            )}

            {/* Validation Summary Modal/Panel */}
            {showValidationSummary && (
              <div className="mb-6 space-y-6">
                <MultiStepValidationSummary
                  stepValidations={stepNavigation.allStepsValidation}
                  stepTitles={STEP_TITLES}
                  currentStepId={currentStepId}
                  onNavigateToStep={handleStepClick}
                />
                
                {/* Form Completion Summary */}
                <FormCompletionSummary
                  completionResult={stepNavigation.validateFormCompletion()}
                  stepTitles={STEP_TITLES}
                  onNavigateToStep={handleStepClick}
                  onCompleteForm={handleSave}
                />
              </div>
            )}

            {/* Step Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {React.createElement(STEPS[currentStepIndex].icon, { className: "h-5 w-5" })}
                      <span>{STEPS[currentStepIndex].title}</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {STEPS[currentStepIndex].description}
                    </p>
                  </div>
                  
                  {/* Step Progress */}
                  {currentStepValidation && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {currentStepValidation.completionPercentage}% Complete
                      </div>
                      {currentStepValidation.totalRequiredFields > 0 && (
                        <div className="text-xs text-gray-500">
                          {currentStepValidation.requiredFieldsCompleted} of {currentStepValidation.totalRequiredFields} required fields
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Step-specific content will be rendered here */}
                <div className="space-y-6">
                  {/* This is where the actual step content components would go */}
                  <div className="text-center py-12 text-gray-500">
                    Step content for "{STEPS[currentStepIndex].title}" will be implemented here.
                    <br />
                    This component provides the validation framework and navigation logic.
                  </div>
                </div>

                {/* Step Validation Errors */}
                {currentStepValidation && currentStepValidation.errors.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      Please fix these errors before proceeding:
                    </h4>
                    <ValidationErrorList errors={currentStepValidation.errors} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowValidationSummary(!showValidationSummary)}
                >
                  {showValidationSummary ? 'Hide' : 'Show'} Validation Summary
                </Button>

                {currentStepIndex < STEPS.length - 1 ? (
                  <Button
                    onClick={handleNextStep}
                    disabled={currentStepValidation && !currentStepValidation.isValid}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={!formCompletionStatus.isFormValid || saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Complete & Save'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderWithValidation;