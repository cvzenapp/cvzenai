import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Briefcase, MapPin, Calendar, DollarSign, Building, Clock, User } from 'lucide-react';
import { jobPreferencesApi, type JobPreferences, type JobPreferencesOptions } from '@/services/jobPreferencesApi';

interface JobPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JobPreferencesModal({ isOpen, onClose }: JobPreferencesModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<JobPreferencesOptions | null>(null);
  
  // Form state
  const [preferences, setPreferences] = useState<Partial<JobPreferences>>(
    jobPreferencesApi.getDefaultPreferences()
  );

  // Load preferences and options on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load options first
      const optionsResult = await jobPreferencesApi.getJobPreferencesOptions();
      if (optionsResult.success && optionsResult.data) {
        setOptions(optionsResult.data);
      }

      // Load existing preferences
      const preferencesResult = await jobPreferencesApi.getJobPreferences();
      if (preferencesResult.success && preferencesResult.data) {
        if (preferencesResult.data.exists) {
          setPreferences(preferencesResult.data);
        } else {
          // Use defaults if no preferences exist
          setPreferences(jobPreferencesApi.getDefaultPreferences());
        }
      }
    } catch (error) {
      console.error('Error loading job preferences data:', error);
      setError('Failed to load job preferences data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await jobPreferencesApi.saveJobPreferences(preferences);
      
      if (result.success) {
        console.log('✅ Job preferences saved successfully');
        onClose();
      } else {
        setError(result.error || 'Failed to save job preferences');
      }
    } catch (error) {
      console.error('Error saving job preferences:', error);
      setError('Failed to save job preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleArrayFieldChange = (field: keyof JobPreferences, value: string, checked: boolean) => {
    setPreferences(prev => {
      const currentArray = (prev[field] as string[]) || [];
      
      if (checked) {
        // Add value if not already present
        if (!currentArray.includes(value)) {
          return {
            ...prev,
            [field]: [...currentArray, value]
          };
        }
      } else {
        // Remove value
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
      
      return prev;
    });
  };

  const handleInterviewAvailabilityChange = (field: 'days' | 'timeSlots' | 'timezone', value: string | string[]) => {
    setPreferences(prev => ({
      ...prev,
      interviewAvailability: {
        ...prev.interviewAvailability,
        days: prev.interviewAvailability?.days || [],
        timeSlots: prev.interviewAvailability?.timeSlots || [],
        timezone: prev.interviewAvailability?.timezone || 'UTC',
        [field]: value
      }
    }));
  };

  const addCustomLocation = (field: 'preferredCountries' | 'preferredStates' | 'preferredCities', value: string) => {
    if (value.trim()) {
      setPreferences(prev => {
        const currentArray = (prev[field] as string[]) || [];
        if (!currentArray.includes(value.trim())) {
          return {
            ...prev,
            [field]: [...currentArray, value.trim()]
          };
        }
        return prev;
      });
    }
  };

  const removeLocation = (field: 'preferredCountries' | 'preferredStates' | 'preferredCities', value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: ((prev[field] as string[]) || []).filter(item => item !== value)
    }));
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading preferences...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Job Preferences
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Work Type & Employment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                Work Type Preferences
              </Label>
              <div className="space-y-2">
                {options?.workTypes.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`workType-${option.value}`}
                      checked={(preferences.workType || []).includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleArrayFieldChange('workType', option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`workType-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Employment Type
              </Label>
              <div className="space-y-2">
                {options?.employmentTypes.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`employmentType-${option.value}`}
                      checked={(preferences.employmentType || []).includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleArrayFieldChange('employmentType', option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`employmentType-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location Preferences */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Location Preferences
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Countries */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Preferred Countries</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(preferences.preferredCountries || []).map(country => (
                    <Badge key={country} variant="secondary" className="text-xs">
                      {country}
                      <button
                        onClick={() => removeLocation('preferredCountries', country)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add country..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomLocation('preferredCountries', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="text-sm"
                />
              </div>

              {/* States */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Preferred States</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(preferences.preferredStates || []).map(state => (
                    <Badge key={state} variant="secondary" className="text-xs">
                      {state}
                      <button
                        onClick={() => removeLocation('preferredStates', state)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add state..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomLocation('preferredStates', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="text-sm"
                />
              </div>

              {/* Cities */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Preferred Cities</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(preferences.preferredCities || []).map(city => (
                    <Badge key={city} variant="secondary" className="text-xs">
                      {city}
                      <button
                        onClick={() => removeLocation('preferredCities', city)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add city..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomLocation('preferredCities', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="willingToRelocate"
                checked={preferences.willingToRelocate || false}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, willingToRelocate: checked as boolean }))
                }
              />
              <Label htmlFor="willingToRelocate" className="text-sm">
                Willing to relocate
              </Label>
            </div>
          </div>

          {/* Availability */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Notice Period (Days)
              </Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={preferences.noticePeriodDays || 30}
                onChange={(e) => 
                  setPreferences(prev => ({ ...prev, noticePeriodDays: parseInt(e.target.value) || 30 }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Working Day</Label>
              <Input
                type="date"
                value={preferences.lastWorkingDay || ''}
                onChange={(e) => 
                  setPreferences(prev => ({ ...prev, lastWorkingDay: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="immediateAvailability"
                checked={preferences.immediateAvailability || false}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, immediateAvailability: checked as boolean }))
                }
              />
              <Label htmlFor="immediateAvailability" className="text-sm">
                Available immediately
              </Label>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Compensation Expectations
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Currency</Label>
                <Select
                  value={preferences.salaryCurrency || 'USD'}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, salaryCurrency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.currencies.map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Minimum Salary</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={preferences.expectedSalaryMin || ''}
                  onChange={(e) => 
                    setPreferences(prev => ({ 
                      ...prev, 
                      expectedSalaryMin: e.target.value ? parseInt(e.target.value) : undefined 
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Maximum Salary</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={preferences.expectedSalaryMax || ''}
                  onChange={(e) => 
                    setPreferences(prev => ({ 
                      ...prev, 
                      expectedSalaryMax: e.target.value ? parseInt(e.target.value) : undefined 
                    }))
                  }
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="salaryNegotiable"
                  checked={preferences.salaryNegotiable !== false}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, salaryNegotiable: checked as boolean }))
                  }
                />
                <Label htmlFor="salaryNegotiable" className="text-sm">
                  Negotiable
                </Label>
              </div>
            </div>
          </div>

          {/* Interview Preferences */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Interview Preferences
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs text-gray-600">Preferred Days</Label>
                <div className="space-y-2">
                  {options?.daysOfWeek.map(day => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={(preferences.interviewAvailability?.days || []).includes(day.value)}
                        onCheckedChange={(checked) => {
                          const currentDays = preferences.interviewAvailability?.days || [];
                          const newDays = checked 
                            ? [...currentDays, day.value]
                            : currentDays.filter(d => d !== day.value);
                          handleInterviewAvailabilityChange('days', newDays);
                        }}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-gray-600">Preferred Time Slots</Label>
                <div className="space-y-2">
                  {options?.timeSlots.map(slot => (
                    <div key={slot.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`slot-${slot.value}`}
                        checked={(preferences.interviewAvailability?.timeSlots || []).includes(slot.value)}
                        onCheckedChange={(checked) => {
                          const currentSlots = preferences.interviewAvailability?.timeSlots || [];
                          const newSlots = checked 
                            ? [...currentSlots, slot.value]
                            : currentSlots.filter(s => s !== slot.value);
                          handleInterviewAvailabilityChange('timeSlots', newSlots);
                        }}
                      />
                      <Label htmlFor={`slot-${slot.value}`} className="text-sm">
                        {slot.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-gray-600">Interview Mode Preferences</Label>
              <div className="flex flex-wrap gap-4">
                {options?.interviewModes.map(mode => (
                  <div key={mode.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mode-${mode.value}`}
                      checked={(preferences.preferredInterviewMode || []).includes(mode.value)}
                      onCheckedChange={(checked) => 
                        handleArrayFieldChange('preferredInterviewMode', mode.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`mode-${mode.value}`} className="text-sm">
                      {mode.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building className="h-4 w-4" />
                Industry Preferences
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {options?.industries.map(industry => (
                  <div key={industry.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry.value}`}
                      checked={(preferences.industryPreferences || []).includes(industry.value)}
                      onCheckedChange={(checked) => 
                        handleArrayFieldChange('industryPreferences', industry.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`industry-${industry.value}`} className="text-sm">
                      {industry.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building className="h-4 w-4" />
                Company Size Preference
              </Label>
              <div className="space-y-2">
                {options?.companySizes.map(size => (
                  <div key={size.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${size.value}`}
                      checked={(preferences.companySizePreference || []).includes(size.value)}
                      onCheckedChange={(checked) => 
                        handleArrayFieldChange('companySizePreference', size.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`size-${size.value}`} className="text-sm">
                      {size.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Role Level */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Role Level
            </Label>
            <Select
              value={preferences.roleLevel || ''}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, roleLevel: value }))
              }
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select role level..." />
              </SelectTrigger>
              <SelectContent>
                {options?.roleLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}