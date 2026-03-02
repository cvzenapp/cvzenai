import React, { useState } from 'react';
import { stepValidationService } from '../services/stepValidationService';
import { ResumeFormState } from '../hooks/useFormStateManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { id: 'personal', title: 'Personal Information' },
  { id: 'overview', title: 'Professional Overview' },
  { id: 'experience', title: 'Work Experience' },
  { id: 'education', title: 'Education' },
  { id: 'skills', title: 'Skills' },
  { id: 'projects', title: 'Projects' },
];

export const ValidationDemo: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formState, setFormState] = useState<ResumeFormState>({
    personalInfo: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      avatar: '',
    },
    summary: '',
    objective: '',
    experiences: [],
    education: [],
    skills: [],
    projects: [],
    metadata: {
      lastSaved: null,
      isDirty: false,
      validationStatus: 'valid',
      autoSaveEnabled: true,
      version: 1,
      lastModified: new Date().toISOString(),
    },
  });

  const currentStep = STEPS[currentStepIndex];
  const currentStepValidation = stepValidationService.validateStep(currentStep.id, formState);
  const allStepsValidation = stepValidationService.validateAllSteps(formState);
  const formCompletionStatus = stepValidationService.getFormCompletionStatus(formState);

  const handleNext = () => {
    const nextStepId = STEPS[currentStepIndex + 1]?.id;
    if (nextStepId) {
      const canNavigate = stepValidationService.canNavigateToStep(
        nextStepId,
        currentStep.id,
        formState
      );
      
      if (canNavigate.canNavigate) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        alert(`Cannot proceed: ${canNavigate.reason}`);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const updateField = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Form Validation & Step Navigation Demo
        </h1>
        <p className="text-gray-600">
          This demonstrates the form-level validation and step navigation system
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formCompletionStatus.overallCompletion}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formCompletionStatus.completedSteps}
              </div>
              <div className="text-sm text-gray-600">Steps Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {formCompletionStatus.criticalErrors.length}
              </div>
              <div className="text-sm text-gray-600">Critical Errors</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${formCompletionStatus.isFormValid ? 'text-green-600' : 'text-red-600'}`}>
                {formCompletionStatus.isFormValid ? 'Valid' : 'Invalid'}
              </div>
              <div className="text-sm text-gray-600">Form Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {STEPS.map((step, index) => {
                const stepValidation = allStepsValidation[step.id];
                const isCurrentStep = index === currentStepIndex;
                const isCompleted = stepValidation.isValid && stepValidation.completionPercentage === 100;
                const hasErrors = stepValidation.errors.length > 0;

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isCurrentStep
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : hasErrors ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className="text-sm font-medium">{step.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stepValidation.completionPercentage}%
                      </Badge>
                    </div>
                    {hasErrors && (
                      <div className="mt-1 text-xs text-red-600">
                        {stepValidation.errors.length} error{stepValidation.errors.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{currentStep.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  {currentStepValidation.isValid ? (
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  ) : (
                    <Badge variant="destructive">
                      {currentStepValidation.errors.length} errors
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {currentStepValidation.completionPercentage}% complete
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step Content */}
              {currentStep.id === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formState.personalInfo.name}
                        onChange={(e) => updatePersonalInfo('name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Professional Title *</Label>
                      <Input
                        id="title"
                        value={formState.personalInfo.title}
                        onChange={(e) => updatePersonalInfo('title', e.target.value)}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formState.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formState.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep.id === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="summary">Professional Summary *</Label>
                    <Textarea
                      id="summary"
                      value={formState.summary}
                      onChange={(e) => updateField('summary', e.target.value)}
                      placeholder="Write a compelling summary of your professional experience..."
                      className="min-h-32"
                    />
                  </div>
                  <div>
                    <Label htmlFor="objective">Career Objective</Label>
                    <Textarea
                      id="objective"
                      value={formState.objective}
                      onChange={(e) => updateField('objective', e.target.value)}
                      placeholder="Describe your career goals..."
                      className="min-h-24"
                    />
                  </div>
                </div>
              )}

              {['experience', 'education', 'skills', 'projects'].includes(currentStep.id) && (
                <div className="text-center py-12 text-gray-500">
                  <p>This step is optional and has no required fields.</p>
                  <p>You can proceed to the next step or add content here.</p>
                </div>
              )}

              {/* Validation Errors */}
              {currentStepValidation.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Please fix these errors:
                  </h4>
                  <ul className="space-y-1">
                    {currentStepValidation.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        • {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Warnings */}
              {currentStepValidation.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    Suggestions for improvement:
                  </h4>
                  <ul className="space-y-1">
                    {currentStepValidation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700">
                        • {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {STEPS.length}
            </div>

            {currentStepIndex < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!currentStepValidation.isValid}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => alert('Form completed!')}
                disabled={!formCompletionStatus.isFormValid}
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationDemo;