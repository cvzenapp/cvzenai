import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ResumeBuilderWithValidation from './ResumeBuilderWithValidation';
import { useFormStateManager } from '@/hooks/useFormStateManager';
import { useStepNavigation } from '@/hooks/useStepValidation';

// Mock the hooks
vi.mock('@/hooks/useFormStateManager');
vi.mock('@/hooks/useStepValidation');

// Mock components that might not be available in test environment
vi.mock('@/components/ui/StepValidationSummary', () => ({
  StepValidationSummary: ({ stepTitle, validationResult }: any) => (
    <div data-testid="step-validation-summary">
      <h3>{stepTitle}</h3>
      <div>Errors: {validationResult.errors.length}</div>
      <div>Warnings: {validationResult.warnings.length}</div>
      <div>Completion: {validationResult.completionPercentage}%</div>
    </div>
  ),
  MultiStepValidationSummary: ({ stepValidations, currentStepId }: any) => (
    <div data-testid="multi-step-validation-summary">
      <div>Current Step: {currentStepId}</div>
      <div>Total Steps: {Object.keys(stepValidations).length}</div>
    </div>
  ),
  NavigationBlocker: ({ canNavigate, reason, onDismiss }: any) => (
    <div data-testid="navigation-blocker">
      <div>Can Navigate: {canNavigate.toString()}</div>
      <div>Reason: {reason}</div>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ResumeBuilderWithValidation', () => {
  let mockFormManager: any;
  let mockStepNavigation: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock form state manager
    mockFormManager = {
      state: {
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
      },
      updateField: vi.fn(),
      updatePersonalInfo: vi.fn(),
      updateSummary: vi.fn(),
      updateObjective: vi.fn(),
      addArrayItem: vi.fn(),
      removeArrayItem: vi.fn(),
      updateArrayItem: vi.fn(),
      reorderArrayItem: vi.fn(),
      validateForm: vi.fn(() => []),
      resetForm: vi.fn(),
      loadFromStorage: vi.fn(),
      getFieldState: vi.fn(),
      markFieldDirty: vi.fn(),
      clearValidationErrors: vi.fn(),
    };

    // Mock step navigation
    mockStepNavigation = {
      currentStepValidation: {
        isValid: true,
        errors: [],
        warnings: [],
        completionPercentage: 100,
        requiredFieldsCompleted: 3,
        totalRequiredFields: 3,
      },
      allStepsValidation: {
        personal: {
          isValid: true,
          errors: [],
          warnings: [],
          completionPercentage: 100,
          requiredFieldsCompleted: 3,
          totalRequiredFields: 3,
        },
        overview: {
          isValid: false,
          errors: [
            {
              field: 'summary',
              message: 'Professional summary is required',
              severity: 'error',
              code: 'REQUIRED_FIELD',
            },
          ],
          warnings: [],
          completionPercentage: 0,
          requiredFieldsCompleted: 0,
          totalRequiredFields: 1,
        },
      },
      validateCurrentStep: vi.fn(),
      validateAllSteps: vi.fn(),
      canNavigateToStep: vi.fn(() => ({ canNavigate: true })),
      formCompletionStatus: {
        overallCompletion: 50,
        completedSteps: 1,
        totalSteps: 6,
        isFormValid: false,
        criticalErrors: [],
      },
      getStepValidation: vi.fn((stepId: string) => mockStepNavigation.allStepsValidation[stepId] || {
        isValid: true,
        errors: [],
        warnings: [],
        completionPercentage: 0,
        requiredFieldsCompleted: 0,
        totalRequiredFields: 0,
      }),
      isStepValid: vi.fn(() => true),
      isStepComplete: vi.fn(() => false),
      getStepErrors: vi.fn(() => []),
      getStepWarnings: vi.fn(() => []),
      isValidating: false,
      lastValidationTime: new Date(),
      navigateToStep: vi.fn(),
      navigateNext: vi.fn(),
      navigatePrevious: vi.fn(),
      canNavigateNext: { canNavigate: true },
      canNavigatePrevious: { canNavigate: false },
      navigationBlocked: { blocked: false },
      clearNavigationBlock: vi.fn(),
    };

    // Setup mocks
    (useFormStateManager as Mock).mockReturnValue(mockFormManager);
    (useStepNavigation as Mock).mockReturnValue(mockStepNavigation);
  });

  describe('Component Rendering', () => {
    it('should render the resume builder with all main sections', () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      // Check header elements
      expect(screen.getByText('Resume Builder')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('All changes saved')).toBeInTheDocument();

      // Check action buttons
      expect(screen.getByText('Validation Summary')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();

      // Check progress bar
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // Check step navigation
      expect(screen.getByText('Steps')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Professional Overview')).toBeInTheDocument();
    });

    it('should display step validation status correctly', () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      // Check that validation status is displayed
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('100% Complete')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 required fields')).toBeInTheDocument();
    });

    it('should show error state when validation fails', () => {
      // Update mock to show errors
      mockStepNavigation.currentStepValidation = {
        isValid: false,
        errors: [
          {
            field: 'personalInfo.name',
            message: 'Name is required',
            severity: 'error',
            code: 'REQUIRED_FIELD',
          },
        ],
        warnings: [],
        completionPercentage: 50,
        requiredFieldsCompleted: 1,
        totalRequiredFields: 2,
      };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      expect(screen.getByText('1 errors')).toBeInTheDocument();
      expect(screen.getByText('50% Complete')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step when validation passes', async () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockStepNavigation.navigateNext).toHaveBeenCalled();
      });
    });

    it('should prevent navigation when validation fails', async () => {
      // Mock navigation to fail
      mockStepNavigation.canNavigateNext = { canNavigate: false, reason: 'Validation errors' };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockStepNavigation.navigateNext).not.toHaveBeenCalled();
      });
    });

    it('should navigate to previous step', async () => {
      // Set current step to allow previous navigation
      mockStepNavigation.canNavigatePrevious = { canNavigate: true };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(mockStepNavigation.navigatePrevious).toHaveBeenCalled();
      });
    });

    it('should navigate to specific step when clicked', async () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const overviewStep = screen.getByText('Professional Overview');
      fireEvent.click(overviewStep);

      await waitFor(() => {
        expect(mockStepNavigation.navigateToStep).toHaveBeenCalledWith('overview');
      });
    });

    it('should disable next button when current step has validation errors', () => {
      // Mock current step with errors
      mockStepNavigation.currentStepValidation = {
        isValid: false,
        errors: [{ field: 'test', message: 'Test error', severity: 'error', code: 'TEST' }],
        warnings: [],
        completionPercentage: 0,
        requiredFieldsCompleted: 0,
        totalRequiredFields: 1,
      };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Validation Summary', () => {
    it('should show validation summary when button is clicked', async () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const summaryButton = screen.getByText('Validation Summary');
      fireEvent.click(summaryButton);

      await waitFor(() => {
        expect(screen.getByTestId('multi-step-validation-summary')).toBeInTheDocument();
      });
    });

    it('should hide validation summary when hide button is clicked', async () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      // Show summary first
      const summaryButton = screen.getByText('Validation Summary');
      fireEvent.click(summaryButton);

      await waitFor(() => {
        expect(screen.getByTestId('multi-step-validation-summary')).toBeInTheDocument();
      });

      // Hide summary
      const hideButton = screen.getByText('Hide Validation Summary');
      fireEvent.click(hideButton);

      await waitFor(() => {
        expect(screen.queryByTestId('multi-step-validation-summary')).not.toBeInTheDocument();
      });
    });

    it('should show step validation summary for current step with errors', () => {
      // Mock current step with errors
      mockStepNavigation.currentStepValidation = {
        isValid: false,
        errors: [{ field: 'test', message: 'Test error', severity: 'error', code: 'TEST' }],
        warnings: [{ field: 'test2', message: 'Test warning', severity: 'warning', code: 'TEST2' }],
        completionPercentage: 50,
        requiredFieldsCompleted: 1,
        totalRequiredFields: 2,
      };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      expect(screen.getByTestId('step-validation-summary')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Errors: 1')).toBeInTheDocument();
      expect(screen.getByText('Warnings: 1')).toBeInTheDocument();
    });
  });

  describe('Navigation Blocking', () => {
    it('should show navigation blocker when navigation is blocked', () => {
      // Mock blocked navigation
      mockStepNavigation.navigationBlocked = {
        blocked: true,
        reason: 'Please fix validation errors',
        blockingErrors: [{ field: 'test', message: 'Test error', severity: 'error', code: 'TEST' }],
      };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      expect(screen.getByTestId('navigation-blocker')).toBeInTheDocument();
      expect(screen.getByText('Can Navigate: false')).toBeInTheDocument();
      expect(screen.getByText('Reason: Please fix validation errors')).toBeInTheDocument();
    });

    it('should clear navigation block when dismiss is clicked', async () => {
      // Mock blocked navigation
      mockStepNavigation.navigationBlocked = {
        blocked: true,
        reason: 'Please fix validation errors',
        blockingErrors: [],
      };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(mockStepNavigation.clearNavigationBlock).toHaveBeenCalled();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save resume when save button is clicked', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockFormManager.updateField).toHaveBeenCalledWith('metadata.lastSaved', expect.any(String));
        expect(mockFormManager.updateField).toHaveBeenCalledWith('metadata.isDirty', false);
      });
    });

    it('should prevent save when form has validation errors', async () => {
      const mockOnSave = vi.fn();
      
      // Mock form with errors
      mockStepNavigation.validateAllSteps.mockReturnValue({
        personal: { isValid: false, errors: [{ field: 'test', message: 'Error', severity: 'error', code: 'TEST' }] },
      });

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should show saving state during save operation', async () => {
      const mockOnSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Should show saving state
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Should return to normal state after save
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Preview Functionality', () => {
    it('should call onPreview when preview button is clicked', async () => {
      const mockOnPreview = vi.fn();

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation onPreview={mockOnPreview} />
        </TestWrapper>
      );

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(mockOnPreview).toHaveBeenCalled();
      });
    });

    it('should disable preview button when form is invalid', () => {
      // Mock invalid form
      mockStepNavigation.formCompletionStatus = {
        overallCompletion: 30,
        completedSteps: 0,
        totalSteps: 6,
        isFormValid: false,
        criticalErrors: [{ field: 'test', message: 'Error', severity: 'error', code: 'TEST' }],
      };

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      const previewButton = screen.getByText('Preview');
      expect(previewButton).toBeDisabled();
    });
  });

  describe('Integration Tests', () => {
    it('should properly integrate form state manager and step validation', () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      // Verify hooks are called with correct parameters
      expect(useFormStateManager).toHaveBeenCalledWith('1');
      expect(useStepNavigation).toHaveBeenCalledWith(
        mockFormManager.state,
        'personal',
        expect.any(Function),
        {
          enableRealTimeValidation: true,
          debounceMs: 500,
        }
      );
    });

    it('should update step when navigation callback is called', async () => {
      render(
        <TestWrapper>
          <ResumeBuilderWithValidation />
        </TestWrapper>
      );

      // Get the navigation callback passed to useStepNavigation
      const navigationCallback = (useStepNavigation as Mock).mock.calls[0][2];
      
      // Call the callback with a new step
      act(() => {
        navigationCallback('overview');
      });

      // Should update the current step display
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });
    });

    it('should handle localStorage operations correctly', async () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
      const mockOnSave = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ResumeBuilderWithValidation resumeId="test-resume" onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith('resume-test-resume', expect.any(String));
      });

      mockSetItem.mockRestore();
    });
  });
});