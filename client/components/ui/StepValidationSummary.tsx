import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepValidationResult, StepDefinition } from '@/services/stepValidationService';

interface StepValidationSummaryProps {
  step: StepDefinition;
  validationResult: StepValidationResult;
  isActive?: boolean;
  isAccessible?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StepValidationSummary: React.FC<StepValidationSummaryProps> = ({
  step,
  validationResult,
  isActive = false,
  isAccessible = true,
  onClick,
  className
}) => {
  const getStepIcon = () => {
    if (validationResult.isValid && validationResult.completionPercentage === 100) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (validationResult.errors.length > 0) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    } else if (validationResult.warnings.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatus = () => {
    if (validationResult.isValid && validationResult.completionPercentage === 100) {
      return 'Complete';
    } else if (validationResult.errors.length > 0) {
      return 'Has Errors';
    } else if (validationResult.completionPercentage > 0) {
      return 'In Progress';
    } else {
      return 'Not Started';
    }
  };

  const getStepColorClasses = () => {
    if (!isAccessible) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    
    if (isActive) {
      return 'bg-blue-50 border-blue-200 text-blue-900';
    }
    
    if (validationResult.isValid && validationResult.completionPercentage === 100) {
      return 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100';
    } else if (validationResult.errors.length > 0) {
      return 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100';
    } else if (validationResult.warnings.length > 0) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-900 hover:bg-yellow-100';
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <div
      className={cn(
        'p-4 border rounded-lg transition-colors cursor-pointer',
        getStepColorClasses(),
        !isAccessible && 'pointer-events-none',
        className
      )}
      onClick={isAccessible ? onClick : undefined}
      role="button"
      tabIndex={isAccessible ? 0 : -1}
      aria-disabled={!isAccessible}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {getStepIcon()}
          <h3 className="font-medium">{step.name}</h3>
        </div>
        <span className="text-sm font-medium">{getStepStatus()}</span>
      </div>
      
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(validationResult.completionPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              validationResult.isValid && validationResult.completionPercentage === 100
                ? 'bg-green-600'
                : validationResult.errors.length > 0
                ? 'bg-red-600'
                : 'bg-blue-600'
            )}
            style={{ width: `${validationResult.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Error and warning counts */}
      {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
        <div className="flex gap-4 text-sm">
          {validationResult.errors.length > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              {validationResult.errors.length} error{validationResult.errors.length > 1 ? 's' : ''}
            </span>
          )}
          {validationResult.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              {validationResult.warnings.length} warning{validationResult.warnings.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Required fields completion */}
      {validationResult.totalRequiredFields > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {validationResult.requiredFieldsCompleted} of {validationResult.totalRequiredFields} required fields completed
        </div>
      )}
    </div>
  );
};

interface StepNavigationProps {
  steps: StepDefinition[];
  stepResults: Record<string, StepValidationResult>;
  currentStepId: string;
  onStepChange: (stepId: string) => void;
  canNavigateToStep: (stepId: string) => boolean;
  className?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  stepResults,
  currentStepId,
  onStepChange,
  canNavigateToStep,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume Sections</h2>
      {steps.map((step) => (
        <StepValidationSummary
          key={step.id}
          step={step}
          validationResult={stepResults[step.id]}
          isActive={currentStepId === step.id}
          isAccessible={canNavigateToStep(step.id)}
          onClick={() => onStepChange(step.id)}
        />
      ))}
    </div>
  );
};

interface OverallValidationSummaryProps {
  overallValidation: {
    isValid: boolean;
    completionPercentage: number;
    totalErrors: number;
    totalWarnings: number;
    stepResults: Record<string, StepValidationResult>;
  };
  className?: string;
}

export const OverallValidationSummary: React.FC<OverallValidationSummaryProps> = ({
  overallValidation,
  className
}) => {
  const getOverallStatus = () => {
    if (overallValidation.isValid && overallValidation.completionPercentage === 100) {
      return { text: 'Resume Complete', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    } else if (overallValidation.totalErrors > 0) {
      return { text: 'Has Errors', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (overallValidation.completionPercentage > 0) {
      return { text: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    } else {
      return { text: 'Not Started', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  const status = getOverallStatus();

  return (
    <div className={cn('p-4 border rounded-lg', status.bgColor, status.borderColor, className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('font-semibold', status.color)}>Overall Progress</h3>
        <span className={cn('text-sm font-medium', status.color)}>{status.text}</span>
      </div>
      
      {/* Overall progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Completion</span>
          <span>{Math.round(overallValidation.completionPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={cn(
              'h-3 rounded-full transition-all',
              overallValidation.isValid && overallValidation.completionPercentage === 100
                ? 'bg-green-600'
                : overallValidation.totalErrors > 0
                ? 'bg-red-600'
                : 'bg-blue-600'
            )}
            style={{ width: `${overallValidation.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Error and warning summary */}
      {(overallValidation.totalErrors > 0 || overallValidation.totalWarnings > 0) && (
        <div className="flex gap-4 text-sm">
          {overallValidation.totalErrors > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              {overallValidation.totalErrors} total error{overallValidation.totalErrors > 1 ? 's' : ''}
            </span>
          )}
          {overallValidation.totalWarnings > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              {overallValidation.totalWarnings} total warning{overallValidation.totalWarnings > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};