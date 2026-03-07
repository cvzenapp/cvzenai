import { useState, useEffect } from 'react';
import { Building2, Loader2, Save, Upload, Edit2, Globe, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { companyApi } from '@/services/companyApi';
import { PortfolioManager } from '@/components/company/PortfolioManager';
import CultureManager from '@/components/company/CultureManager';
import TestimonialManager from '@/components/company/TestimonialManager';
import type { Company } from '../../../shared/recruiterAuth';

export const RecruiterCompanyPortfolio: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Form state for basic info
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    location: '',
    website: '',
    employeeCount: '',
    foundedYear: '',
    companyType: '',
    sizeRange: '',
    workEnvironment: '',
    companyValues: '',
    specialties: '',
    benefits: '',
    coverImageUrl: '',
    coverImagePosition: '50%',
    logoUrl: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      youtube: '',
    },
  });

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!formData.industry?.trim()) {
      errors.industry = 'Industry is required';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Company description is required';
    } else if (formData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }
    
    if (formData.website && !isValidUrl(formData.website)) {
      errors.website = 'Please enter a valid website URL';
    }
    
    if (formData.socialLinks?.linkedin && !isValidUrl(formData.socialLinks.linkedin)) {
      errors.linkedin = 'Please enter a valid LinkedIn URL';
    }
    
    if (formData.socialLinks?.twitter && !isValidUrl(formData.socialLinks.twitter)) {
      errors.twitter = 'Please enter a valid X (Twitter) URL';
    }
    
    if (formData.socialLinks?.facebook && !isValidUrl(formData.socialLinks.facebook)) {
      errors.facebook = 'Please enter a valid Facebook URL';
    }
    
    if (formData.socialLinks?.instagram && !isValidUrl(formData.socialLinks.instagram)) {
      errors.instagram = 'Please enter a valid Instagram URL';
    }
    
    if (formData.socialLinks?.youtube && !isValidUrl(formData.socialLinks.youtube)) {
      errors.youtube = 'Please enter a valid YouTube URL';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await companyApi.getCompanyProfile();
      
      if (response.success && response.company) {
        setCompany(response.company);
        
        // Populate form data
        setFormData({
          name: response.company.name || '',
          description: response.company.description || '',
          industry: response.company.industry || '',
          location: response.company.location || '',
          website: response.company.website || '',
          employeeCount: response.company.employeeCount?.toString() || '',
          foundedYear: response.company.foundedYear?.toString() || '',
          companyType: response.company.companyType || '',
          sizeRange: response.company.sizeRange || '',
          workEnvironment: response.company.workEnvironment || '',
          companyValues: response.company.companyValues || '',
          specialties: Array.isArray(response.company.specialties) 
            ? response.company.specialties.join(', ') 
            : '',
          benefits: Array.isArray(response.company.benefits) 
            ? response.company.benefits.join(', ') 
            : '',
          coverImageUrl: response.company.coverImageUrl || '',
          coverImagePosition: response.company.coverImagePosition || '50%',
          logoUrl: response.company.logoUrl || '',
          socialLinks: {
            linkedin: response.company.socialLinks?.linkedin || '',
            twitter: response.company.socialLinks?.twitter || '',
            facebook: response.company.socialLinks?.facebook || '',
            instagram: response.company.socialLinks?.instagram || '',
            youtube: response.company.socialLinks?.youtube || '',
          },
        });
      } else {
        setError('Company profile not found');
      }
    } catch (err) {
      console.error('Failed to load company:', err);
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!company) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('🔵 Starting basic info save...');
      
      const updateData: any = {
        ...formData,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        specialties: formData.specialties 
          ? formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        benefits: formData.benefits 
          ? formData.benefits.split(',').map(b => b.trim()).filter(Boolean)
          : [],
      };

      // Get token
      const token = localStorage.getItem("recruiter_token");
      console.log('🔵 Token found:', !!token);
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // console.log('🔵 Making fetch request to save basic info');
      
      // Direct fetch call like image uploads
      const response = await fetch('/api/recruiter/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      // console.log('🔵 Basic info save response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log('🔵 Basic info save response data:', data);
        
        if (data.success) {
          // console.log('✅ Basic info save successful, updating state...');
          setCompany(data.company);
          setEditingBasicInfo(false);
          setValidationErrors({});
          toast({
            title: "Success!",
            description: "Company information saved successfully.",
          });
        } else {
          console.error('❌ Basic info save failed:', data.message);
          toast({
            title: "Save Failed",
            description: data.message || 'Unknown error occurred.',
            variant: "destructive",
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Basic info save failed with status:', response.status, errorText);
        toast({
          title: "Save Failed",
          description: `Server error: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('❌ Basic info save error:', err);
      toast({
        title: "Save Failed",
        description: err.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioUpdate = async (data: any) => {
    if (!company) return;

    try {
      console.log('🔵 Starting portfolio update...');
      console.log('🔵 Raw data received:', data);
      console.log('🔵 Data type:', typeof data);
      console.log('🔵 Data keys:', Object.keys(data));
      console.log('🔵 Data stringified:', JSON.stringify(data, null, 2));
      
      // Check each portfolio field specifically
      if (data.clients) {
        console.log('🔵 Clients data:', {
          isArray: Array.isArray(data.clients),
          length: data.clients?.length,
          firstItem: data.clients?.[0],
          fullData: data.clients
        });
      }
      if (data.projects) {
        console.log('🔵 Projects data:', {
          isArray: Array.isArray(data.projects),
          length: data.projects?.length,
          firstItem: data.projects?.[0]
        });
      }
      if (data.awards) {
        console.log('🔵 Awards data:', {
          isArray: Array.isArray(data.awards),
          length: data.awards?.length,
          firstItem: data.awards?.[0]
        });
      }
      if (data.achievements) {
        console.log('🔵 Achievements data:', {
          isArray: Array.isArray(data.achievements),
          length: data.achievements?.length,
          firstItem: data.achievements?.[0]
        });
      }
      
      // Get token
      const token = localStorage.getItem("recruiter_token");
      console.log('🔵 Token found:', !!token);
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('🔵 Making fetch request to update portfolio');
      console.log('🔵 Request body will be:', JSON.stringify(data, null, 2));
      
      // Direct fetch call like other updates
      const response = await fetch('/api/recruiter/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      console.log('🔵 Portfolio update response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('🔵 Portfolio update response data:', responseData);
        
        if (responseData.success) {
          console.log('✅ Portfolio update successful, updating state...');
          setCompany(responseData.company);
          console.log('✅ Portfolio updated successfully!');
        } else {
          console.error('❌ Portfolio update failed:', responseData.message);
          toast({
            title: "Update Failed",
            description: responseData.message || 'Unknown error occurred.',
            variant: "destructive",
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Portfolio update failed with status:', response.status, errorText);
        toast({
          title: "Update Failed",
          description: `Server error: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('❌ Portfolio update error:', err);
      toast({
        title: "Update Failed",
        description: err.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File Too Large",
        description: "Image size must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('🔵 Starting cover image upload...');
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          console.log('🔵 Base64 conversion complete, length:', base64String.length);
          
          // Get token
          const token = localStorage.getItem("recruiter_token");
          console.log('🔵 Token found:', !!token);
          
          if (!token) {
            toast({
              title: "Authentication Required",
              description: "Please log in again to continue.",
              variant: "destructive",
            });
            setSaving(false);
            return;
          }
          
          console.log('🔵 Making fetch request to /api/recruiter/company/profile');
          
          // Direct fetch call
          const response = await fetch('/api/recruiter/company/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              coverImageUrl: base64String,
              coverImagePosition: 'center'
            })
          });

          console.log('🔵 Response status:', response.status);
          console.log('🔵 Response ok:', response.ok);

          if (response.ok) {
            const data = await response.json();
            console.log('🔵 Response data:', data);
            
            if (data.success) {
              console.log('✅ Upload successful, reloading company data...');
              // Instead of page reload, update the state directly
              await loadCompany();
              toast({
                title: "Success!",
                description: "Cover image uploaded successfully.",
              });
            } else {
              console.error('❌ Upload failed:', data.message);
              toast({
                title: "Upload Failed",
                description: data.message || 'Unknown error occurred.',
                variant: "destructive",
              });
            }
          } else {
            const errorText = await response.text();
            console.error('❌ Upload failed with status:', response.status, errorText);
            toast({
              title: "Upload Failed",
              description: `Server error: ${response.status}`,
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('❌ Upload error:', err);
          toast({
            title: "Upload Failed",
            description: err.message || 'An unexpected error occurred.',
            variant: "destructive",
          });
        } finally {
          setSaving(false);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ File read error');
        toast({
          title: "File Read Error",
          description: "Failed to read the selected file.",
          variant: "destructive",
        });
        setSaving(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('❌ File processing error:', err);
      toast({
        title: "Processing Error",
        description: "Failed to process the selected file.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for logo)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo size must be less than 2MB');
      return;
    }

    try {
      setSaving(true);
      console.log('🔵 Starting logo upload...');
      
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          console.log('🔵 Logo base64 conversion complete, length:', base64String.length);
          
          // Get token
          const token = localStorage.getItem("recruiter_token");
          console.log('🔵 Token found:', !!token);
          
          if (!token) {
            alert('Authentication required. Please log in again.');
            setSaving(false);
            return;
          }
          
          console.log('🔵 Making fetch request for logo upload');
          
          // Direct fetch call
          const response = await fetch('/api/recruiter/company/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              logoUrl: base64String
            })
          });

          console.log('🔵 Logo upload response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('🔵 Logo upload response data:', data);
            
            if (data.success) {
              console.log('✅ Logo upload successful, updating state...');
              // Update both company state and form data
              setCompany(data.company);
              setFormData({ ...formData, logoUrl: base64String });
              alert('Logo uploaded successfully!');
            } else {
              console.error('❌ Logo upload failed:', data.message);
              alert('Logo upload failed: ' + (data.message || 'Unknown error'));
            }
          } else {
            const errorText = await response.text();
            console.error('❌ Logo upload failed with status:', response.status, errorText);
            alert('Logo upload failed: ' + response.status);
          }
        } catch (err) {
          console.error('❌ Logo upload error:', err);
          alert('Logo upload failed: ' + err.message);
        } finally {
          setSaving(false);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ Logo file read error');
        alert('Failed to read logo file');
        setSaving(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('❌ Logo file processing error:', err);
      alert('Failed to process logo file');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading company portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-900 mb-2">Company Profile Not Found</h3>
          <p className="text-gray-500 mb-4">{error || 'Unable to load company profile'}</p>
          <Button onClick={loadCompany}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="p-4 space-y-2 max-w-7xl mx-auto">
        {/* Enhanced Header with CVZen Branding */}
        <div className="flex items-center justify-between py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-main rounded-2xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-jakarta font-bold text-brand-background">Company Portfolio</h1>
                <p className="text-slate-600 mt-1 font-jakarta">Showcase your organization with CVZen's intelligent platform</p>
              </div>
            </div>
          </div>
          <Button asChild variant="outline" className="border-brand-main text-brand-main hover:bg-brand-main hover:text-white">
            <a href={`/company/${company.slug}`} target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4 mr-2" />
              View Public Profile
            </a>
          </Button>
        </div>

      {/* Enhanced Cover Image Section */}
      <Card className="premium-card border-0 shadow-xl">
        <CardHeader className="premium-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg font-jakarta font-medium text-white">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Upload className="h-4 w-4" />
              </div>
              Cover Image
            </CardTitle>
            {!editingBasicInfo && (
              <Button size="sm" onClick={() => setEditingBasicInfo(true)} className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="premium-card-content">
          <div className="relative h-56 bg-gradient-to-r from-brand-background via-brand-main to-indigo-600 rounded-2xl overflow-hidden group shadow-lg">
            {company.coverImageUrl ? (
              <img
                src={company.coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: `center ${company.coverImagePosition || '50%'}` }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center space-y-3">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm mx-auto w-fit">
                    <Upload className="h-12 w-12 opacity-80" />
                  </div>
                  <p className="text-lg font-jakarta opacity-90">Add your company cover image</p>
                  <p className="text-sm opacity-70">Showcase your brand with a stunning visual</p>
                </div>
              </div>
            )}
            
            {/* Enhanced Cover Button */}
            <div className="absolute bottom-6 right-6">
              <input
                type="file"
                id="cover-upload"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageUpload}
                disabled={saving}
              />
              <Button
                size="sm"
                onClick={() => document.getElementById('cover-upload')?.click()}
                disabled={saving}
                className="bg-white/20 border-white/30 text-white hover:bg-white hover:text-brand-background backdrop-blur-sm shadow-lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                {saving ? 'Uploading...' : company.coverImageUrl ? 'Change Cover' : 'Add Cover'}
              </Button>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 bg-blue-400/20 rounded-full blur-lg"></div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Section */}
      <Card className="premium-card border-0 shadow-xl">
        <CardHeader className="premium-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-jakarta font-medium text-white">
              <Building2 className="h-4 w-4" />
              Company Information
            </CardTitle>
            {editingBasicInfo ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingBasicInfo(false)} className="border-white/30 text-white/20 hover:bg-white hover:text-brand-background">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveBasicInfo} disabled={saving} className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setEditingBasicInfo(true)} className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="premium-card-content">
          {editingBasicInfo ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={validationErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <Label>Company Logo</Label>
                <div className="space-y-2">
                  {/* <Input
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png or upload file below"
                  /> */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={saving}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {saving ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    {formData.logoUrl && (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo preview" 
                        className="h-8 w-8 object-contain rounded border"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={validationErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description?.length || 0}/500 characters (minimum 50)
                </p>
              </div>
              <div>
                <Label>Industry</Label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    validationErrors.industry ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-input"
                  }`}
                >
                  <option value="">Select industry...</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Media & Entertainment">Media & Entertainment</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Government">Government</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Energy">Energy</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Other">Other</option>
                </select>
                {validationErrors.industry && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.industry}</p>
                )}
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              {/* <div>
                <Label>Employee Count</Label>
                <Input
                  type="number"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                />
              </div> */}
              <div>
                <Label>Founded Year</Label>
                <Input
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                />
              </div>
              <div>
                <Label>Company Type</Label>
                <select
                  value={formData.companyType}
                  onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select type...</option>
                  <option value="Startup">Startup</option>
                  <option value="SME">SME</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Government">Government</option>
                  <option value="Agency">Agency</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>
              <div>
                <Label>Size Range</Label>
                <select
                  value={formData.sizeRange}
                  onChange={(e) => setFormData({ ...formData, sizeRange: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select size...</option>
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="11-50 employees">11-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-500 employees">201-500 employees</option>
                  <option value="501-1000 employees">501-1000 employees</option>
                  <option value="1001-5000 employees">1001-5000 employees</option>
                  <option value="5001-10000 employees">5001-10000 employees</option>
                  <option value="10000+ employees">10000+ employees</option>
                </select>
              </div>
              <div>
                <Label>Work Environment</Label>
                <select
                  value={formData.workEnvironment}
                  onChange={(e) => setFormData({ ...formData, workEnvironment: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select environment...</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Company Values</Label>
                <Textarea
                  value={formData.companyValues}
                  onChange={(e) => setFormData({ ...formData, companyValues: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Specialties (comma-separated)</Label>
                <Input
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Web Development, Mobile Apps, Cloud Services"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Benefits (comma-separated)</Label>
                <Input
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Health Insurance, Remote Work, Flexible Hours"
                />
              </div>
              
              {/* Social Links */}
              <div className="md:col-span-2">
                <Label className="text-lg font-normal mb-3 block">Social Links</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>LinkedIn</Label>
                    <Input
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                      })}
                      placeholder="https://linkedin.com/in/company/..."
                      className={validationErrors.linkedin ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {validationErrors.linkedin && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.linkedin}</p>
                    )}
                  </div>
                  <div>
                    <Label>X</Label>
                    <Input
                      value={formData.socialLinks.twitter}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                      })}
                      placeholder="https://x.com/..."
                      className={validationErrors.twitter ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {validationErrors.twitter && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.twitter}</p>
                    )}
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={formData.socialLinks.facebook}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                      })}
                      placeholder="https://facebook.com/..."
                      className={validationErrors.facebook ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {validationErrors.facebook && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.facebook}</p>
                    )}
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={formData.socialLinks.instagram}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/..."
                      className={validationErrors.instagram ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {validationErrors.instagram && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.instagram}</p>
                    )}
                  </div>
                  <div>
                    <Label>YouTube</Label>
                    <Input
                      value={formData.socialLinks.youtube}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/..."
                      className={validationErrors.youtube ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {validationErrors.youtube && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.youtube}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {company.logoUrl && (
                  <img src={company.logoUrl} alt={company.name} className="h-16 w-16 object-contain rounded" />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-normal">{company.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                    {company.industry && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {company.industry}
                      </div>
                    )}
                    {company.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </div>
                    )}
                    {company.employeeCount && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.employeeCount.toLocaleString()} employees
                      </div>
                    )}
                    {company.foundedYear && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Founded {company.foundedYear}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {company.description && (
                <p className="text-gray-700">{company.description}</p>
              )}
              {company.specialties && company.specialties.length > 0 && (
                <div>
                  <Label className="mb-2 block">Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {company.specialties.map((specialty, i) => (
                      <Badge key={i} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Social Links Display */}
              <div>
                <Label className="mb-2 block">Social Links</Label>
                <div className="flex flex-wrap gap-3">
                  <a href={company.socialLinks?.linkedin || "https://linkedin.com/company/your-company"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                  <a href={company.socialLinks?.twitter || "https://x.com/your-company"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </a>
                  <a href={company.socialLinks?.facebook || "https://facebook.com/your-company"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                  <a href={company.socialLinks?.instagram || "https://instagram.com/your-company"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323C6.001 8.198 7.152 7.708 8.449 7.708s2.448.49 3.323 1.416c.876.876 1.416 2.027 1.416 3.323s-.54 2.447-1.416 3.323c-.875.807-2.026 1.218-3.323 1.218zm7.718-1.297c-.876.876-2.027 1.297-3.323 1.297s-2.448-.421-3.323-1.297c-.876-.876-1.297-2.027-1.297-3.323s.421-2.448 1.297-3.323c.875-.876 2.027-1.297 3.323-1.297s2.447.421 3.323 1.297c.876.875 1.297 2.027 1.297 3.323s-.421 2.447-1.297 3.323z"/>
                    </svg>
                    Instagram
                  </a>
                  <a href={company.socialLinks?.youtube || "https://youtube.com/@your-company"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </a>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Assets Section */}
      <PortfolioManager
        clients={company.clients || []}
        projects={company.projects || []}
        awards={company.awards || []}
        achievements={company.achievements || []}
        onUpdate={handlePortfolioUpdate}
      />

      {/* Culture & Values Section */}
      <CultureManager
        values={company.cultureValues || []}
        onUpdate={(cultureValues) => handlePortfolioUpdate({ cultureValues })}
      />

      {/* Testimonials Section */}
      <TestimonialManager
        testimonials={company.testimonials || []}
        onUpdate={(testimonials) => handlePortfolioUpdate({ testimonials })}
      />
      </div>
    </div>
  );
};
