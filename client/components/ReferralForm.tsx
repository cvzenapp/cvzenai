import React, { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ValidationError, FieldValidationError } from '@/components/ui/ValidationError';
import { ValidationError as ValidationErrorType } from '@/hooks/useFormStateManager';
import { 
  CreateReferralRequest, 
  REFERRAL_CONSTANTS,
  formatRewardAmount 
} from '@shared/referrals';
import { 
  UserPlus, 
  Mail, 
  Building, 
  Briefcase, 
  MessageSquare, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralFormProps {
  onSubmit: (referralData: CreateReferralRequest) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  defaultRewardAmount?: number;
  maxReferralsPerDay?: number;
  currentReferralsToday?: number;
}

interface FormData {
  refereeEmail: string;
  refereeName: string;
  positionTitle: string;
  companyName: string;
  personalMessage: string;
  rewardAmount: number;
}

interface FormErrors {
  [key: string]: ValidationErrorType[];
}

const ReferralForm: React.FC<ReferralFormProps> = ({
  onSubmit,
  isLoading = false,
  className,
  defaultRewardAmount = REFERRAL_CONSTANTS.DEFAULT_REWARD_AMOUNT,
  maxReferralsPerDay = REFERRAL_CONSTANTS.MAX_REFERRALS_PER_DAY,
  currentReferralsToday = 0
}) => {
  const [formData, setFormData] = useState<FormData>({
    refereeEmail: '',
    refereeName: '',
    positionTitle: '',
    companyName: '',
    personalMessage: '',
    rewardAmount: defaultRewardAmount
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
    isDuplicate: boolean;
    message?: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateEmail = useCallback((email: string): ValidationErrorType[] => {
    const errors: ValidationErrorType[] = [];
    
    if (!email.trim()) {
      errors.push({
        field: 'refereeEmail',
        code: 'required',
        message: 'Email address is required',
        severity: 'error'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'refereeEmail',
        code: 'invalid_format',
        message: 'Please enter a valid email address',
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  const validateName = useCallback((name: string): ValidationErrorType[] => {
    const errors: ValidationErrorType[] = [];
    
    if (!name.trim()) {
      errors.push({
        field: 'refereeName',
        code: 'required',
        message: 'Referee name is required',
        severity: 'error'
      });
    } else if (name.trim().length < 2) {
      errors.push({
        field: 'refereeName',
        code: 'min_length',
        message: 'Name must be at least 2 characters long',
        severity: 'error'
      });
    } else if (name.trim().length > 255) {
      errors.push({
        field: 'refereeName',
        code: 'max_length',
        message: 'Name must be less than 255 characters',
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  const validatePosition = useCallback((position: string): ValidationErrorType[] => {
    const errors: ValidationErrorType[] = [];
    
    if (!position.trim()) {
      errors.push({
        field: 'positionTitle',
        code: 'required',
        message: 'Position title is required',
        severity: 'error'
      });
    } else if (position.trim().length < 2) {
      errors.push({
        field: 'positionTitle',
        code: 'min_length',
        message: 'Position title must be at least 2 characters long',
        severity: 'error'
      });
    } else if (position.trim().length > 255) {
      errors.push({
        field: 'positionTitle',
        code: 'max_length',
        message: 'Position title must be less than 255 characters',
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  const validateCompany = useCallback((company: string): ValidationErrorType[] => {
    const errors: ValidationErrorType[] = [];
    
    if (!company.trim()) {
      errors.push({
        field: 'companyName',
        code: 'required',
        message: 'Company name is required',
        severity: 'error'
      });
    } else if (company.trim().length < 2) {
      errors.push({
        field: 'companyName',
        code: 'min_length',
        message: 'Company name must be at least 2 characters long',
        severity: 'error'
      });
    } else if (company.trim().length > 255) {
      errors.push({
        field: 'companyName',
        code: 'max_length',
        message: 'Company name must be less than 255 characters',
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  const validatePersonalMessage = useCallback((message: string): ValidationErrorType[] => {
    const errors: ValidationErrorType[] = [];
    
    if (message.length > REFERRAL_CONSTANTS.MAX_PERSONAL_MESSAGE_LENGTH) {
      errors.push({
        field: 'personalMessage',
        code: 'max_length',
        message: `Personal message must be less than ${REFERRAL_CONSTANTS.MAX_PERSONAL_MESSAGE_LENGTH} characters`,
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  const validateRewardAmount = useCallback((amount: number): ValidationErrorType[] => {
    const errors: ValidationErrorType[] = [];
    
    if (amount < 0) {
      errors.push({
        field: 'rewardAmount',
        code: 'min_value',
        message: 'Reward amount cannot be negative',
        severity: 'error'
      });
    } else if (amount > 1000) {
      errors.push({
        field: 'rewardAmount',
        code: 'max_value',
        message: 'Reward amount cannot exceed $1,000',
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    newErrors.refereeEmail = validateEmail(formData.refereeEmail);
    newErrors.refereeName = validateName(formData.refereeName);
    newErrors.positionTitle = validatePosition(formData.positionTitle);
    newErrors.companyName = validateCompany(formData.companyName);
    newErrors.personalMessage = validatePersonalMessage(formData.personalMessage);
    newErrors.rewardAmount = validateRewardAmount(formData.rewardAmount);

    // Check daily limit
    if (currentReferralsToday >= maxReferralsPerDay) {
      newErrors.general = [{
        field: 'general',
        code: 'daily_limit',
        message: `You have reached the daily limit of ${maxReferralsPerDay} referrals. Please try again tomorrow.`,
        severity: 'error'
      }];
    }
    
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.values(newErrors).every(fieldErrors => fieldErrors.length === 0);
  }, [formData, validateEmail, validateName, validatePosition, validateCompany, validatePersonalMessage, validateRewardAmount, currentReferralsToday, maxReferralsPerDay]);

  // Duplicate checking
  const checkForDuplicate = useCallback(async (email: string) => {
    if (!email || validateEmail(email).length > 0) return;
    
    setIsDuplicateChecking(true);
    setDuplicateCheckResult(null);
    
    try {
      // Mock API call - in production this would call the actual API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock duplicate check logic
      const isDuplicate = Math.random() < 0.1; // 10% chance of duplicate for demo
      
      setDuplicateCheckResult({
        isDuplicate,
        message: isDuplicate 
          ? 'This person has already been referred recently. You can still proceed if this is for a different position.'
          : 'No recent referrals found for this email address.'
      });
    } catch (error) {
      setDuplicateCheckResult({
        isDuplicate: false,
        message: 'Unable to check for duplicates. Please proceed with caution.'
      });
    } finally {
      setIsDuplicateChecking(false);
    }
  }, [validateEmail]);

  // Field change handlers
  const handleFieldChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
    
    // Trigger duplicate check for email
    if (field === 'refereeEmail' && typeof value === 'string') {
      const timeoutId = setTimeout(() => checkForDuplicate(value), 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [errors, checkForDuplicate]);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setShowSuccess(false);
    
    try {
      const referralData: CreateReferralRequest = {
        refereeEmail: formData.refereeEmail.trim(),
        refereeName: formData.refereeName.trim(),
        positionTitle: formData.positionTitle.trim(),
        companyName: formData.companyName.trim(),
        personalMessage: formData.personalMessage.trim() || undefined,
        rewardAmount: formData.rewardAmount
      };
      
      await onSubmit(referralData);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form on successful submission
      setFormData({
        refereeEmail: '',
        refereeName: '',
        positionTitle: '',
        companyName: '',
        personalMessage: '',
        rewardAmount: defaultRewardAmount
      });
      setErrors({});
      setDuplicateCheckResult(null);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      // You could add error state here if needed
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, defaultRewardAmount]);

  const remainingReferrals = maxReferralsPerDay - currentReferralsToday;
  const messageCharacterCount = formData.personalMessage.length;
  const messageCharacterLimit = REFERRAL_CONSTANTS.MAX_PERSONAL_MESSAGE_LENGTH;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
          <UserPlus className="w-8 h-8 text-blue-600" />
          Refer a Friend
        </h2>
        <p className="text-slate-600">
          Help someone find their next great opportunity and earn rewards
        </p>
      </div>

      {/* Daily limit info */}
      {remainingReferrals <= 3 && remainingReferrals > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have {remainingReferrals} referral{remainingReferrals !== 1 ? 's' : ''} remaining today.
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {showSuccess && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Referral sent successfully!</strong> Your referral has been created and an invitation email will be sent to the referee. You can track the progress in your referrals dashboard.
          </AlertDescription>
        </Alert>
      )}

      {/* General errors */}
      {errors.general && errors.general.length > 0 && (
        <div className="space-y-2">
          {errors.general.map((error, index) => (
            <ValidationError key={index} error={error} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Referral Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referee Email */}
            <div className="space-y-2">
              <Label htmlFor="refereeEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Referee Email Address *
              </Label>
              <div className="relative">
                <Input
                  id="refereeEmail"
                  type="email"
                  value={formData.refereeEmail}
                  onChange={(e) => handleFieldChange('refereeEmail', e.target.value)}
                  placeholder="john.doe@example.com"
                  className={cn(
                    errors.refereeEmail?.length > 0 && 'border-red-500',
                    duplicateCheckResult?.isDuplicate && 'border-yellow-500'
                  )}
                  disabled={isLoading}
                />
                {isDuplicateChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <FieldValidationError fieldName="refereeEmail" errors={errors.refereeEmail || []} />
              
              {/* Duplicate check result */}
              {duplicateCheckResult && (
                <Alert className={duplicateCheckResult.isDuplicate ? 'border-yellow-500' : 'border-green-500'}>
                  {duplicateCheckResult.isDuplicate ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription className={duplicateCheckResult.isDuplicate ? 'text-yellow-800' : 'text-green-800'}>
                    {duplicateCheckResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Referee Name */}
            <div className="space-y-2">
              <Label htmlFor="refereeName">
                Referee Full Name *
              </Label>
              <Input
                id="refereeName"
                value={formData.refereeName}
                onChange={(e) => handleFieldChange('refereeName', e.target.value)}
                placeholder="John Doe"
                className={cn(errors.refereeName?.length > 0 && 'border-red-500')}
                disabled={isLoading}
              />
              <FieldValidationError fieldName="refereeName" errors={errors.refereeName || []} />
            </div>

            <Separator />

            {/* Position Title */}
            <div className="space-y-2">
              <Label htmlFor="positionTitle" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Position Title *
              </Label>
              <Input
                id="positionTitle"
                value={formData.positionTitle}
                onChange={(e) => handleFieldChange('positionTitle', e.target.value)}
                placeholder="Senior Software Engineer"
                className={cn(errors.positionTitle?.length > 0 && 'border-red-500')}
                disabled={isLoading}
              />
              <FieldValidationError fieldName="positionTitle" errors={errors.positionTitle || []} />
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company Name *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="Tech Corp Inc."
                className={cn(errors.companyName?.length > 0 && 'border-red-500')}
                disabled={isLoading}
              />
              <FieldValidationError fieldName="companyName" errors={errors.companyName || []} />
            </div>

            <Separator />

            {/* Personal Message */}
            <div className="space-y-2">
              <Label htmlFor="personalMessage" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Personal Message (Optional)
              </Label>
              <Textarea
                id="personalMessage"
                value={formData.personalMessage}
                onChange={(e) => handleFieldChange('personalMessage', e.target.value)}
                placeholder="Hi John, I came across this amazing opportunity that I think would be perfect for you. The company has a great culture and the role aligns perfectly with your skills..."
                rows={4}
                className={cn(errors.personalMessage?.length > 0 && 'border-red-500')}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                <FieldValidationError fieldName="personalMessage" errors={errors.personalMessage || []} />
                <span className={cn(
                  'text-sm',
                  messageCharacterCount > messageCharacterLimit * 0.9 ? 'text-red-600' : 'text-gray-500'
                )}>
                  {messageCharacterCount}/{messageCharacterLimit}
                </span>
              </div>
            </div>

            {/* Reward Amount */}
            <div className="space-y-2">
              <Label htmlFor="rewardAmount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Reward Amount
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rewardAmount"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.01"
                  value={formData.rewardAmount}
                  onChange={(e) => handleFieldChange('rewardAmount', parseFloat(e.target.value) || 0)}
                  className={cn(
                    'w-32',
                    errors.rewardAmount?.length > 0 && 'border-red-500'
                  )}
                  disabled={isLoading}
                />
                <Badge variant="secondary" className="text-sm">
                  {formatRewardAmount(formData.rewardAmount)}
                </Badge>
              </div>
              <FieldValidationError fieldName="rewardAmount" errors={errors.rewardAmount || []} />
              <p className="text-sm text-gray-600">
                You'll earn this amount when your referral is successfully hired.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || remainingReferrals <= 0}
            className="min-w-48"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Referral...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Send Referral
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

ReferralForm.displayName = 'ReferralForm';

// Custom comparison function for memo optimization
const areEqual = (prevProps: ReferralFormProps, nextProps: ReferralFormProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.defaultRewardAmount === nextProps.defaultRewardAmount &&
    prevProps.maxReferralsPerDay === nextProps.maxReferralsPerDay &&
    prevProps.currentReferralsToday === nextProps.currentReferralsToday &&
    prevProps.className === nextProps.className
  );
};

export default memo(ReferralForm, areEqual);