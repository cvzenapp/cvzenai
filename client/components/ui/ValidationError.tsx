import React from 'react';
import { ValidationError as ValidationErrorType } from '@/hooks/useFormStateManager';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationErrorProps {
  error: ValidationErrorType;
  className?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ error, className }) => {
  const getIcon = () => {
    switch (error.severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getColorClasses = () => {
    switch (error.severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border text-sm',
        getColorClasses(),
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      <span>{error.message}</span>
    </div>
  );
};

interface ValidationErrorListProps {
  errors: ValidationErrorType[];
  className?: string;
  maxVisible?: number;
}

export const ValidationErrorList: React.FC<ValidationErrorListProps> = ({ 
  errors, 
  className,
  maxVisible = 5 
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenCount = errors.length - maxVisible;

  return (
    <div className={cn('space-y-2', className)}>
      {visibleErrors.map((error, index) => (
        <ValidationError key={`${error.field}-${error.code}-${index}`} error={error} />
      ))}
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-500 italic">
          ... and {hiddenCount} more error{hiddenCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

interface FieldValidationErrorProps {
  fieldName: string;
  errors: ValidationErrorType[];
  className?: string;
}

export const FieldValidationError: React.FC<FieldValidationErrorProps> = ({ 
  fieldName, 
  errors, 
  className 
}) => {
  const fieldErrors = errors.filter(error => error.field === fieldName);
  
  if (fieldErrors.length === 0) {
    return null;
  }

  // Show only the first error for inline display
  const primaryError = fieldErrors[0];

  return (
    <div className={cn('mt-1', className)}>
      <ValidationError error={primaryError} />
    </div>
  );
};

interface ValidationSummaryProps {
  errors: ValidationErrorType[];
  warnings: ValidationErrorType[];
  className?: string;
  title?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errors, 
  warnings, 
  className,
  title = 'Validation Summary'
}) => {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  return (
    <div className={cn('p-4 border rounded-lg bg-white', className)}>
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      
      {hasErrors && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Errors ({errors.length})
          </h4>
          <ValidationErrorList errors={errors} />
        </div>
      )}
      
      {hasWarnings && (
        <div>
          <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Warnings ({warnings.length})
          </h4>
          <ValidationErrorList errors={warnings} />
        </div>
      )}
    </div>
  );
};