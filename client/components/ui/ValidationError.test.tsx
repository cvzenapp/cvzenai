import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  ValidationError, 
  ValidationErrorList, 
  FieldValidationError, 
  ValidationSummary 
} from './ValidationError';
import { ValidationError as ValidationErrorType } from '../../hooks/useFormStateManager';

describe('ValidationError Components', () => {
  const mockError: ValidationErrorType = {
    field: 'personalInfo.name',
    message: 'Name is required',
    severity: 'error',
    code: 'REQUIRED_FIELD'
  };

  const mockWarning: ValidationErrorType = {
    field: 'personalInfo.phone',
    message: 'Phone format may be invalid',
    severity: 'warning',
    code: 'PHONE_FORMAT_WARNING'
  };

  const mockInfo: ValidationErrorType = {
    field: 'personalInfo.email',
    message: 'Consider using a professional email',
    severity: 'info',
    code: 'EMAIL_SUGGESTION'
  };

  describe('ValidationError', () => {
    it('should render error message with correct styling', () => {
      render(<ValidationError error={mockError} />);
      
      expect(screen.getByText('Name is required')).toBeDefined();
      expect(screen.getByRole('alert')).toBeDefined();
    });

    it('should display correct icon for error severity', () => {
      const { container } = render(<ValidationError error={mockError} />);
      
      // Check for AlertCircle icon (error)
      expect(container.querySelector('svg')).toBeDefined();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ValidationError error={mockError} className="custom-class" />
      );
      
      expect((container.firstChild as HTMLElement)?.className).toContain('custom-class');
    });

    it('should have proper accessibility attributes', () => {
      render(<ValidationError error={mockError} />);
      
      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('ValidationErrorList', () => {
    const mockErrors: ValidationErrorType[] = [
      mockError,
      mockWarning,
      mockInfo
    ];

    it('should render all errors when count is within limit', () => {
      render(<ValidationErrorList errors={mockErrors} />);
      
      expect(screen.getByText('Name is required')).toBeDefined();
      expect(screen.getByText('Phone format may be invalid')).toBeDefined();
      expect(screen.getByText('Consider using a professional email')).toBeDefined();
    });

    it('should limit visible errors and show count of hidden ones', () => {
      const manyErrors = Array.from({ length: 8 }, (_, i) => ({
        ...mockError,
        field: `field${i}`,
        message: `Error ${i + 1}`
      }));

      render(<ValidationErrorList errors={manyErrors} maxVisible={3} />);
      
      // Should show first 3 errors
      expect(screen.getByText('Error 1')).toBeDefined();
      expect(screen.getByText('Error 2')).toBeDefined();
      expect(screen.getByText('Error 3')).toBeDefined();
      
      // Should not show 4th error
      expect(screen.queryByText('Error 4')).toBeNull();
      
      // Should show hidden count
      expect(screen.getByText('... and 5 more errors')).toBeDefined();
    });

    it('should render nothing when no errors provided', () => {
      const { container } = render(<ValidationErrorList errors={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('FieldValidationError', () => {
    const fieldErrors: ValidationErrorType[] = [
      { ...mockError, field: 'personalInfo.name' },
      { ...mockWarning, field: 'personalInfo.name' },
      { ...mockInfo, field: 'personalInfo.email' }
    ];

    it('should render errors for specific field only', () => {
      render(
        <FieldValidationError 
          fieldName="personalInfo.name" 
          errors={fieldErrors} 
        />
      );
      
      // Should show the first error for the specified field
      expect(screen.getByText('Name is required')).toBeDefined();
      
      // Should not show errors for other fields
      expect(screen.queryByText('Consider using a professional email')).toBeNull();
    });

    it('should render nothing when no errors for field', () => {
      const { container } = render(
        <FieldValidationError 
          fieldName="nonexistent.field" 
          errors={fieldErrors} 
        />
      );
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ValidationSummary', () => {
    const errors: ValidationErrorType[] = [mockError];
    const warnings: ValidationErrorType[] = [mockWarning];

    it('should render errors and warnings sections', () => {
      render(<ValidationSummary errors={errors} warnings={warnings} />);
      
      expect(screen.getByText('Validation Summary')).toBeDefined();
      expect(screen.getByText('Errors (1)')).toBeDefined();
      expect(screen.getByText('Warnings (1)')).toBeDefined();
      expect(screen.getByText('Name is required')).toBeDefined();
      expect(screen.getByText('Phone format may be invalid')).toBeDefined();
    });

    it('should render nothing when no errors or warnings', () => {
      const { container } = render(<ValidationSummary errors={[]} warnings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should use custom title', () => {
      render(
        <ValidationSummary 
          errors={errors} 
          warnings={warnings} 
          title="Form Validation Results"
        />
      );
      
      expect(screen.getByText('Form Validation Results')).toBeDefined();
      expect(screen.queryByText('Validation Summary')).toBeNull();
    });
  });
});