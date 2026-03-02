import { useState, useEffect } from 'react';
import { Building2, Loader2, Save, Upload, Edit2, Globe, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
        alert('Authentication required. Please log in again.');
        setSaving(false);
        return;
      }
      
      console.log('🔵 Making fetch request to save basic info');
      
      // Direct fetch call like image uploads
      const response = await fetch('/api/recruiter/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('🔵 Basic info save response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔵 Basic info save response data:', data);
        
        if (data.success) {
          console.log('✅ Basic info save successful, updating state...');
          setCompany(data.company);
          setEditingBasicInfo(false);
          alert('Company information saved successfully!');
        } else {
          console.error('❌ Basic info save failed:', data.message);
          alert('Save failed: ' + (data.message || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Basic info save failed with status:', response.status, errorText);
        alert('Save failed: ' + response.status);
      }
    } catch (err) {
      console.error('❌ Basic info save error:', err);
      alert('Save failed: ' + err.message);
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
        alert('Authentication required. Please log in again.');
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
          alert('Portfolio update failed: ' + (responseData.message || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Portfolio update failed with status:', response.status, errorText);
        alert('Portfolio update failed: ' + response.status);
      }
    } catch (err) {
      console.error('❌ Portfolio update error:', err);
      alert('Portfolio update failed: ' + err.message);
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image size must be less than 2MB');
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
            alert('Authentication required. Please log in again.');
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
              alert('Cover image uploaded successfully!');
            } else {
              console.error('❌ Upload failed:', data.message);
              alert('Upload failed: ' + (data.message || 'Unknown error'));
            }
          } else {
            const errorText = await response.text();
            console.error('❌ Upload failed with status:', response.status, errorText);
            alert('Upload failed: ' + response.status);
          }
        } catch (err) {
          console.error('❌ Upload error:', err);
          alert('Upload failed: ' + err.message);
        } finally {
          setSaving(false);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ File read error');
        alert('Failed to read file');
        setSaving(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('❌ File processing error:', err);
      alert('Failed to process file');
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal text-gray-900">Company Portfolio</h1>
          <p className="text-gray-600 mt-1">Manage your company's public profile</p>
        </div>
        <Button asChild variant="outline">
          <a href={`/company/${company.slug}`} target="_blank" rel="noopener noreferrer">
            <Globe className="h-4 w-4 mr-2" />
            View Public Profile
          </a>
        </Button>
      </div>

      {/* Cover Image Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cover Image
            </CardTitle>
            {!editingBasicInfo && (
              <Button size="sm" variant="outline" onClick={() => setEditingBasicInfo(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg overflow-hidden group">
            {company.coverImageUrl ? (
              <img
                src={company.coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
                style={{ objectPosition: `center ${company.coverImagePosition || '50%'}` }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">No cover image</p>
                </div>
              </div>
            )}
            
            {/* Add Cover Button - Always visible */}
            <div className="absolute bottom-4 right-4">
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
                variant="secondary"
                onClick={() => document.getElementById('cover-upload')?.click()}
                disabled={saving}
              >
                <Upload className="h-4 w-4 mr-2" />
                {saving ? 'Uploading...' : company.coverImageUrl ? 'Change Cover' : 'Add Cover'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            {editingBasicInfo ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingBasicInfo(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveBasicInfo} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditingBasicInfo(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingBasicInfo ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Company Logo</Label>
                <div className="space-y-2">
                  <Input
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png or upload file below"
                  />
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
                />
              </div>
              <div>
                <Label>Industry</Label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <div>
                <Label>Employee Count</Label>
                <Input
                  type="number"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                />
              </div>
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
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                  <div>
                    <Label>Twitter</Label>
                    <Input
                      value={formData.socialLinks.twitter}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                      })}
                      placeholder="https://twitter.com/..."
                    />
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
                    />
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
                    />
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
                    />
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links Section */}
      {!editingBasicInfo && company.socialLinks && (
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {company.socialLinks.linkedin && (
                <a href={company.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn
                </a>
              )}
              {company.socialLinks.twitter && (
                <a href={company.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                  Twitter
                </a>
              )}
              {company.socialLinks.facebook && (
                <a href={company.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  Facebook
                </a>
              )}
              {company.socialLinks.instagram && (
                <a href={company.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                  Instagram
                </a>
              )}
              {company.socialLinks.youtube && (
                <a href={company.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                  YouTube
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
  );
};
