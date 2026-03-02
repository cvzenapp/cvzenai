import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Mail, Lock, Building, Phone, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RecruiterSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recruiter, setRecruiter] = useState<any>(null);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    linkedinUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const recruiterData = localStorage.getItem('recruiter_user');
    if (recruiterData) {
      const parsed = JSON.parse(recruiterData);
      setRecruiter(parsed);
      setProfileData({
        firstName: parsed.firstName || '',
        lastName: parsed.lastName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        jobTitle: parsed.jobTitle || '',
        linkedinUrl: parsed.linkedinUrl || ''
      });
    }
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('recruiter_token');
      const response = await fetch('/api/recruiter/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('recruiter_user', JSON.stringify(result.recruiter));
        setRecruiter(result.recruiter);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully'
        });
      } else {
        toast({
          title: 'Update failed',
          description: result.error || 'Failed to update profile',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords match',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('recruiter_token');
      const response = await fetch('/api/recruiter/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast({
          title: 'Password changed',
          description: 'Your password has been changed successfully'
        });
      } else {
        toast({
          title: 'Password change failed',
          description: result.error || 'Failed to change password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-normal text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={profileData.linkedinUrl}
                  onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                  className="pl-10"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="bg-brand-background hover:bg-brand-background/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">At least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="bg-brand-background hover:bg-brand-background/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
