import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Building, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RefereeResponseService, ReferralDetails, RefereeResponseData } from '@/services/refereeResponseService';

const RefereeResponse: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const refereeService = new RefereeResponseService();

  const [referralDetails, setReferralDetails] = useState<ReferralDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [response, setResponse] = useState<'interested' | 'declined' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    linkedinUrl: ''
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid referral link');
      setLoading(false);
      return;
    }

    fetchReferralDetails();
  }, [token]);

  const fetchReferralDetails = async () => {
    try {
      const details = await refereeService.getReferralByToken(token!);
      setReferralDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response) {
      toast({
        title: "Response Required",
        description: "Please indicate whether you're interested or not.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const responseData: RefereeResponseData = {
        action: response,
        feedback: feedback.trim() || undefined,
        createAccount: createAccount,
        accountData: createAccount ? {
          firstName: accountData.firstName.trim(),
          lastName: accountData.lastName.trim(),
          phone: accountData.phone.trim() || undefined,
          linkedinUrl: accountData.linkedinUrl.trim() || undefined
        } : undefined
      };

      await refereeService.submitResponse(token!, responseData);

      setSubmitted(true);
      toast({
        title: "Response Submitted",
        description: response === 'interested' 
          ? "Thank you for your interest! The referrer has been notified."
          : "Thank you for your response. The referrer has been notified.",
      });

    } catch (err) {
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : 'Failed to submit response',
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" data-testid="loading-spinner" />
          <p className="text-gray-600">Loading referral details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Response Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {response === 'interested' 
                ? "Thank you for your interest! We'll be in touch soon with next steps."
                : "Thank you for your response. We appreciate you taking the time to review this opportunity."
              }
            </p>
            {createAccount && response === 'interested' && (
              <Alert className="mb-4">
                <AlertDescription>
                  Your account has been created. You'll receive an email with login instructions shortly.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => navigate('/')} className="w-full">
              Explore CVZen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!referralDetails) {
    return null;
  }

  const isExpired = new Date(referralDetails.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You've Been Referred!
          </h1>
          <p className="text-gray-600">
            {referralDetails.referrerName} thinks you'd be perfect for this opportunity
          </p>
        </div>

        {isExpired && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>
              This referral has expired. Please contact the referrer directly if you're still interested.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {referralDetails.positionTitle}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {referralDetails.companyName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralDetails.personalMessage && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Personal Message from {referralDetails.referrerName}:</h4>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <p className="text-gray-700 italic">"{referralDetails.personalMessage}"</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Referral reward: ${referralDetails.rewardAmount}</span>
            </div>
          </CardContent>
        </Card>

        {!isExpired && (
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                Please let us know if you're interested in this opportunity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Are you interested in this opportunity?</Label>
                  <RadioGroup 
                    value={response || ''} 
                    onValueChange={(value) => setResponse(value as 'interested' | 'declined')}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="interested" id="interested" />
                      <Label htmlFor="interested" className="cursor-pointer">
                        Yes, I'm interested
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="declined" id="declined" />
                      <Label htmlFor="declined" className="cursor-pointer">
                        No, not interested
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="feedback">
                    {response === 'interested' ? 'Additional comments (optional)' : 'Reason for declining (optional)'}
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={
                      response === 'interested' 
                        ? "Any questions or additional information you'd like to share..."
                        : "Help us understand why this opportunity isn't a good fit..."
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {response === 'interested' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createAccount"
                        checked={createAccount}
                        onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                      />
                      <Label htmlFor="createAccount" className="cursor-pointer">
                        Create a CVZen account to track this opportunity
                      </Label>
                    </div>

                    {createAccount && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">Account Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                              id="firstName"
                              value={accountData.firstName}
                              onChange={(e) => setAccountData(prev => ({ ...prev, firstName: e.target.value }))}
                              required={createAccount}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                              id="lastName"
                              value={accountData.lastName}
                              onChange={(e) => setAccountData(prev => ({ ...prev, lastName: e.target.value }))}
                              required={createAccount}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={accountData.phone}
                            onChange={(e) => setAccountData(prev => ({ ...prev, phone: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                          <Input
                            id="linkedinUrl"
                            type="url"
                            value={accountData.linkedinUrl}
                            onChange={(e) => setAccountData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || !response}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RefereeResponse;