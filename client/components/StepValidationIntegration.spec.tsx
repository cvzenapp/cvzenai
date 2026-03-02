import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepValidationSummary, StepNavigation } from './ui/StepValidationSummary';
import { FormValidationState } from '@/services/stepValidationService';

describe('Step Validation Integration', () => {
  const mockFormValidationState: FormValidationState = {
    currentStep: 'personal-info',
    steps: {
      'personal-info': {
        stepId: 'personal-info',
        isValid: true,
        isComplete: true,
        errors: [],
        warnings: [],
        fieldErrors: {},
        completionPercentage: 100
      },
      'summary': {
        stepId: 'summary',
        isValid: false,
        isComplete: false,
        errors: [
          {
            field: 'summary',
            message: 'Summary is required',
            severity: 'error',
            code: 'REQUIRED_FIELD'
          }
        ],
        warnings: [],
        fieldErrors: {
          'summary': [
            {
              field: 'summary',
              message: 'Summary is required',
              severity: 'error',
              code: 'REQUIRED_FIELD'
            }
          ]
        },
        completionPercentage: 50
      },
      'experience': {
        stepId: 'experience',
        isValid: true,
        isComplete: false,
        errors: [],
        warnings: [
          {
            field: 'experiences',
            message: 'At least one work experience is recommended',
            severity: 'warning',
            code: 'RECOMMENDED_FIELD'
          }
        ],
        fieldErrors: {},
        completionPercentage: 25
      }
    },
    overallValid: false,
    canProceedToNext: true,
    canGoToPrevious: false
  };

  describe('StepValidationSummary', () => {
    it('should render all steps with correct status', () => {
      render(<StepValidationSummary formValidationState={mockFormValidationState} />);

      expect(screen.getByText('Form Progress')).toBeInTheDocument();
      
      // Check for step completion indicators
      const completeIcons = screen.getAllByTestId('check-circle') || [];
      const errorIcons = screen.getAllByTestId('alert-circle') || [];
      const warningIcons = screen.getAllByTestId('alert-triangle') || [];

      // Should have appropriate icons based on step status
      expect(completeIcons.length + errorIcons.length + warningIcons.length).toBeGreaterThan(0);
    });

    it('should show progress bars when enabled', () => {
      render(
        <StepValidationSummary 
          formValidationState={mockFormValidationState} 
          showProgress={true}
        />
      );

      // Check for progress indicators
      const progressBars = document.querySelectorAll('[style*="width"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should show errors when enabled', () => {
      render(
        <StepValidationSummary 
          formValidationState={mockFormValidationState} 
          showErrors={true}
        />
      );

      expect(screen.getByText('Summary is required')).toBeInTheDocument();
      expect(screen.getByText('At least one work experience is recommended')).toBeInTheDocument();
    });

    it('should handle step clicks', () => {
      const onStepClick = vi.fn();
      render(
        <StepValidationSummary 
          formValidationState={mockFormValidationState} 
          onStepClick={onStepClick}
        />
      );

      // Find and click on a step (this might need adjustment based on actual rendered structure)
      const stepElements = screen.getAllByRole('button') || screen.getAllByText(/personal-info|summary|experience/);
      if (stepElements.length > 0) {
        fireEvent.click(stepElements[0]);
        expect(onStepClick).toHaveBeenCalled();
      }
    });

    it('should render in compact mode', () => {
      const { container } = render(
        <StepValidationSummary 
          formValidationState={mockFormValidationState} 
          compact={true}
        />
      );

      // Compact mode should have different layout
      expect(container.querySelector('.flex.items-center.space-x-2')).toBeInTheDocument();
    });

    it('should calculate overall progress correctly', () => {
      render(<StepValidationSummary formValidationState={mockFormValidationState} />);

      // Should show overall progress (average of all steps)
      const expectedProgress = Math.round((100 + 50 + 25) / 3);
      expect(screen.getByText(`${expectedProgress}%`)).toBeInTheDocument();
    });
  });

  describe('StepNavigation', () => {
    it('should render navigation buttons with correct states', () => {
      render(<StepNavigation formValidationState={mockFormValidationState} />);

      const nextButton = screen.getByText('Next');
      const previousButton = screen.getByText('Previous');

      expect(nextButton).toBeInTheDocument();
      expect(previousButton).toBeInTheDocument();

      // Previous should be disabled (canGoToPrevious is false)
      expect(previousButton).toBeDisabled();
      
      // Next should be enabled (canProceedToNext is true)
      expect(nextButton).not.toBeDisabled();
    });

    it('should handle next button click', () => {
      const onNext = vi.fn();
      render(
        <StepNavigation 
          formValidationState={mockFormValidationState} 
          onNext={onNext}
        />
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should handle previous button click', () => {
      const onPrevious = vi.fn();
      const stateWithPrevious = {
        ...mockFormValidationState,
        canGoToPrevious: true
      };

      render(
        <StepNavigation 
          formValidationState={stateWithPrevious} 
          onPrevious={onPrevious}
        />
      );

      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);
      
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should use custom button labels', () => {
      render(
        <StepNavigation 
          formValidationState={mockFormValidationState}
          nextLabel="Continue"
          previousLabel="Back"
        />
      );

      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should show completion message when step is incomplete', () => {
      const incompleteState = {
        ...mockFormValidationState,
        canProceedToNext: false,
        steps: {
          ...mockFormValidationState.steps,
          'personal-info': {
            ...mockFormValidationState.steps['personal-info'],
            isComplete: false
          }
        }
      };

      render(<StepNavigation formValidationState={incompleteState} />);

      expect(screen.getByText('Complete required fields to continue')).toBeInTheDocument();
    });

    it('should handle step indicator clicks', () => {
      const onStepChange = vi.fn();
      render(
        <StepNavigation 
          formValidationState={mockFormValidationState}
          onStepChange={onStepChange}
          showStepIndicator={true}
        />
      );

      // Should render step indicator with clickable steps
      const stepButtons = screen.getAllByText(/Step \d+/);
      if (stepButtons.length > 0) {
        fireEvent.click(stepButtons[0]);
        expect(onStepChange).toHaveBeenCalled();
      }
    });

    it('should hide step indicator when disabled', () => {
      render(
        <StepNavigation 
          formValidationState={mockFormValidationState}
          showStepIndicator={false}
        />
      );

      // Should not show step indicators
      const stepButtons = screen.queryAllByText(/Step \d+/);
      expect(stepButtons).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle form with all steps complete', () => {
      const completeFormState: FormValidationState = {
        currentStep: 'projects',
        steps: {
          'personal-info': { stepId: 'personal-info', isValid: true, isComplete: true, errors: [], warnings: [], fieldErrors: {}, completionPercentage: 100 },
          'summary': { stepId: 'summary', isValid: true, isComplete: true, errors: [], warnings: [], fieldErrors: {}, completionPercentage: 100 },
          'experience': { stepId: 'experience', isValid: true, isComplete: true, errors: [], warnings: [], fieldErrors: {}, completionPercentage: 100 },
          'education': { stepId: 'education', isValid: true, isComplete: true, errors: [], warnings: [], fieldErrors: {}, completionPercentage: 100 },
          'skills': { stepId: 'skills', isValid: true, isComplete: true, errors: [], warnings: [], fieldErrors: {}, completionPercentage: 100 },
          'projects': { stepId: 'projects', isValid: true, isComplete: true, errors: [], warnings: [], fieldErrors: {}, completionPercentage: 100 }
        },
        overallValid: true,
        canProceedToNext: false, // Last step
        canGoToPrevious: true
      };

      render(<StepValidationSummary formValidationState={completeFormState} />);

      // Should show 100% overall progress
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle form with multiple errors across steps', () => {
      const errorFormState: FormValidationState = {
        currentStep: 'personal-info',
        steps: {
          'personal-info': {
            stepId: 'personal-info',
            isValid: false,
            isComplete: false,
            errors: [
              { field: 'personalInfo.name', message: 'Name is required', severity: 'error', code: 'REQUIRED_FIELD' },
              { field: 'personalInfo.email', message: 'Invalid email format', severity: 'error', code: 'INVALID_FORMAT' }
            ],
            warnings: [],
            fieldErrors: {},
            completionPercentage: 30
          },
          'summary': {
            stepId: 'summary',
            isValid: false,
            isComplete: false,
            errors: [
              { field: 'summary', message: 'Summary is required', severity: 'error', code: 'REQUIRED_FIELD' }
            ],
            warnings: [],
            fieldErrors: {},
            completionPercentage: 0
          }
        },
        overallValid: false,
        canProceedToNext: false,
        canGoToPrevious: false
      };

      render(<StepValidationSummary formValidationState={errorFormState} showErrors={true} />);

      // Should show multiple error messages
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Summary is required')).toBeInTheDocument();
    });
  });
});