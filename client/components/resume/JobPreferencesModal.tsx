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
  jobPreferences?: any; // Job preferences data for read-only mode (shared resumes)
  readOnly?: boolean; // Whether to display in read-only mode
}

export function JobPreferencesModal({ isOpen, onClose, jobPreferences, readOnly = false }: JobPreferencesModalProps) {
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
      if (readOnly && jobPreferences) {
        // For read-only mode (shared resumes), use provided job preferences
        console.log('🔍 [JobPreferencesModal] Read-only mode - received job preferences:', jobPreferences);
        console.log('🔍 [JobPreferencesModal] Job preferences keys:', Object.keys(jobPreferences || {}));
        console.log('🔍 [JobPreferencesModal] Job preferences values:', jobPreferences);
        setPreferences(jobPreferences);
        setLoading(false); // No need to load options for read-only mode
      } else if (readOnly && !jobPreferences) {
        // Read-only mode but no job preferences provided
        console.log('🔍 [JobPreferencesModal] Read-only mode - no job preferences provided');
        setLoading(false);
      } else {
        // For edit mode, load from API
        loadData();
      }
    }
  }, [isOpen, readOnly, jobPreferences]);

  const loadOptions = async () => {
    // Skip loading options for read-only mode (shared resumes)
    if (readOnly) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const optionsResult = await jobPreferencesApi.getJobPreferencesOptions();
      if (optionsResult.success && optionsResult.data) {
        setOptions(optionsResult.data);
      }
    } catch (error) {
      console.error('Error loading job preferences options:', error);
      setError('Failed to load job preferences options');
    } finally {
      setLoading(false);
    }
  };

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
    if (readOnly) return; // Don't allow changes in read-only mode
    
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

  if (loading && !readOnly) {
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
            {readOnly ? 'Job Preferences (View Only)' : 'Job Preferences'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {readOnly && !jobPreferences && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No job preferences available for this resume.</p>
            <p className="text-sm text-gray-400 mt-1">The candidate hasn't set their job preferences yet.</p>
          </div>
        )}

        {readOnly && jobPreferences && Object.keys(jobPreferences).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No job preferences data available.</p>
            <p className="text-sm text-gray-400 mt-1">The candidate's preferences are not configured.</p>
          </div>
        )}

        <div className="space-y-6">
          {readOnly && jobPreferences ? (
            // Read-only view for shared resumes
            <>
              {/* Work Type & Employment */}
              {(jobPreferences.workType?.length > 0 || jobPreferences.employmentType?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobPreferences.workType?.length > 0 && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Briefcase className="h-4 w-4" />
                        Work Type Preferences
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {jobPreferences.workType.map((type: string, index: number) => (
                          <Badge key={`work-type-${index}-${typeof type === 'string' ? type : JSON.stringify(type)}`} variant="secondary" className="text-sm">
                            {typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1) : type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobPreferences.employmentType?.length > 0 && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        Employment Type
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {jobPreferences.employmentType.map((type: string, index: number) => (
                          <Badge key={`employment-type-${index}-${typeof type === 'string' ? type : JSON.stringify(type)}`} variant="secondary" className="text-sm">
                            {typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ') : type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Preferences */}
              {(jobPreferences.preferredCountries?.length > 0 || jobPreferences.preferredStates?.length > 0 || jobPreferences.preferredCities?.length > 0) && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Location Preferences
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {jobPreferences.preferredCountries?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Countries</Label>
                        <div className="flex flex-wrap gap-1">
                          {jobPreferences.preferredCountries.map((country: string, index: number) => (
                            <Badge key={`country-${index}-${typeof country === 'string' ? country : JSON.stringify(country)}`} variant="outline" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {jobPreferences.preferredStates?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">States</Label>
                        <div className="flex flex-wrap gap-1">
                          {jobPreferences.preferredStates.map((state: string, index: number) => (
                            <Badge key={`state-${index}-${typeof state === 'string' ? state : JSON.stringify(state)}`} variant="outline" className="text-xs">
                              {state}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {jobPreferences.preferredCities?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Cities</Label>
                        <div className="flex flex-wrap gap-1">
                          {jobPreferences.preferredCities.map((city: string, index: number) => (
                            <Badge key={`city-${index}-${typeof city === 'string' ? city : JSON.stringify(city)}`} variant="outline" className="text-xs">
                              {city}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {jobPreferences.willingToRelocate !== undefined && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Willing to Relocate</Label>
                      <p className="text-sm">
                        {jobPreferences.willingToRelocate ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Availability */}
              {(jobPreferences.noticePeriodDays || jobPreferences.immediateAvailability !== undefined || jobPreferences.lastWorkingDay) && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Availability
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobPreferences.immediateAvailability !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Immediate Availability</Label>
                        <p className="text-sm">
                          {jobPreferences.immediateAvailability ? 'Available immediately' : 'Not immediately available'}
                        </p>
                      </div>
                    )}
                    
                    {jobPreferences.noticePeriodDays && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Notice Period</Label>
                        <p className="text-sm">
                          {jobPreferences.noticePeriodDays} days
                        </p>
                      </div>
                    )}
                    
                    {jobPreferences.lastWorkingDay && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Last Working Day</Label>
                        <p className="text-sm">
                          {new Date(jobPreferences.lastWorkingDay).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compensation */}
              {(jobPreferences.expectedSalaryMin || jobPreferences.expectedSalaryMax) && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    Compensation Expectations
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Salary Range</Label>
                      <p className="text-sm">
                        {jobPreferences.expectedSalaryMin && jobPreferences.expectedSalaryMax
                          ? `${jobPreferences.expectedSalaryMin.toLocaleString()} - ${jobPreferences.expectedSalaryMax.toLocaleString()} ${jobPreferences.salaryCurrency || 'USD'}`
                          : jobPreferences.expectedSalaryMin
                          ? `From ${jobPreferences.expectedSalaryMin.toLocaleString()} ${jobPreferences.salaryCurrency || 'USD'}`
                          : `Up to ${jobPreferences.expectedSalaryMax.toLocaleString()} ${jobPreferences.salaryCurrency || 'USD'}`
                        }
                      </p>
                    </div>
                    
                    {jobPreferences.salaryNegotiable !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Negotiable</Label>
                        <p className="text-sm">
                          {jobPreferences.salaryNegotiable ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Industry & Company Preferences */}
              {(jobPreferences.industryPreferences?.length > 0 || jobPreferences.companySizePreference?.length > 0) && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Building className="h-4 w-4" />
                    Industry & Company Preferences
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobPreferences.industryPreferences?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Preferred Industries</Label>
                        <div className="flex flex-wrap gap-1">
                          {jobPreferences.industryPreferences.map((industry: string, index: number) => (
                            <Badge key={`industry-${index}-${typeof industry === 'string' ? industry : JSON.stringify(industry)}`} variant="outline" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {jobPreferences.companySizePreference?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Company Size</Label>
                        <div className="flex flex-wrap gap-1">
                          {jobPreferences.companySizePreference.map((size: string, index: number) => (
                            <Badge key={`company-size-${index}-${typeof size === 'string' ? size : JSON.stringify(size)}`} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Role Level */}
              {jobPreferences.roleLevel && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Role Level
                  </Label>
                  <Badge variant="outline" className="text-sm">
                    {typeof jobPreferences.roleLevel === 'string' ? jobPreferences.roleLevel.charAt(0).toUpperCase() + jobPreferences.roleLevel.slice(1) : jobPreferences.roleLevel}
                  </Badge>
                </div>
              )}

              {/* Interview Preferences */}
              {(jobPreferences.preferredInterviewMode?.length > 0 || jobPreferences.interviewAvailability) && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Interview Preferences
                  </Label>
                  
                  {jobPreferences.preferredInterviewMode?.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Preferred Interview Mode</Label>
                      <div className="flex flex-wrap gap-2">
                        {jobPreferences.preferredInterviewMode.map((mode: string, index: number) => (
                          <Badge key={`interview-mode-${index}-${typeof mode === 'string' ? mode : JSON.stringify(mode)}`} variant="secondary" className="text-sm">
                            {typeof mode === 'string' ? mode.charAt(0).toUpperCase() + mode.slice(1) : mode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {jobPreferences.interviewAvailability && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Interview Availability</Label>
                      <div className="text-sm space-y-1">
                        {jobPreferences.interviewAvailability.days?.length > 0 && (
                          <p>Days: {jobPreferences.interviewAvailability.days.join(', ')}</p>
                        )}
                        {jobPreferences.interviewAvailability.timeSlots?.length > 0 && (
                          <p>Time Slots: {jobPreferences.interviewAvailability.timeSlots.join(', ')}</p>
                        )}
                        {jobPreferences.interviewAvailability.timezone && (
                          <p>Timezone: {jobPreferences.interviewAvailability.timezone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : !readOnly ? (
            // Editable form for preview mode
            <>
              {/* Work Type */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-4 w-4" />
                  Work Type Preferences
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {options?.workTypes?.map((type, index) => {
                    const typeValue = typeof type === 'object' ? type.value : type;
                    const typeLabel = typeof type === 'object' ? type.label : type;
                    return (
                      <div key={`work-type-option-${index}-${typeValue}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`work-type-${typeValue}`}
                          checked={(preferences.workType as string[])?.includes(typeValue) || false}
                          onCheckedChange={(checked) => handleArrayFieldChange('workType', typeValue, checked as boolean)}
                        />
                        <Label htmlFor={`work-type-${typeValue}`} className="text-sm">
                          {typeof typeLabel === 'string' ? typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1) : typeLabel}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Employment Type */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Employment Type
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {options?.employmentTypes?.map((type, index) => {
                    const typeValue = typeof type === 'object' ? type.value : type;
                    const typeLabel = typeof type === 'object' ? type.label : type;
                    return (
                      <div key={`employment-type-option-${index}-${typeValue}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employment-type-${typeValue}`}
                          checked={(preferences.employmentType as string[])?.includes(typeValue) || false}
                          onCheckedChange={(checked) => handleArrayFieldChange('employmentType', typeValue, checked as boolean)}
                        />
                        <Label htmlFor={`employment-type-${typeValue}`} className="text-sm">
                          {typeof typeLabel === 'string' ? typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1).replace('-', ' ') : typeLabel}
                        </Label>
                      </div>
                    );
                  })}
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
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {((preferences.preferredCountries as string[]) || []).map((country, index) => (
                          <Badge key={`pref-country-${index}-${typeof country === 'string' ? country : JSON.stringify(country)}`} variant="outline" className="text-xs">
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add country"
                          className="text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomLocation('preferredCountries', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* States */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Preferred States</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {((preferences.preferredStates as string[]) || []).map((state, index) => (
                          <Badge key={`pref-state-${index}-${typeof state === 'string' ? state : JSON.stringify(state)}`} variant="outline" className="text-xs">
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add state"
                          className="text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomLocation('preferredStates', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Preferred Cities</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {((preferences.preferredCities as string[]) || []).map((city, index) => (
                          <Badge key={`pref-city-${index}-${typeof city === 'string' ? city : JSON.stringify(city)}`} variant="outline" className="text-xs">
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add city"
                          className="text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomLocation('preferredCities', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Willing to Relocate */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="willing-to-relocate"
                    checked={preferences.willingToRelocate || false}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, willingToRelocate: checked as boolean }))}
                  />
                  <Label htmlFor="willing-to-relocate" className="text-sm">
                    Willing to relocate
                  </Label>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Availability
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Notice Period (days)</Label>
                    <Input
                      type="number"
                      value={preferences.noticePeriodDays || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, noticePeriodDays: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Last Working Day</Label>
                    <Input
                      type="date"
                      value={preferences.lastWorkingDay || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="immediate-availability"
                    checked={preferences.immediateAvailability || false}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, immediateAvailability: checked as boolean }))}
                  />
                  <Label htmlFor="immediate-availability" className="text-sm">
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Minimum Salary</Label>
                    <Input
                      type="number"
                      value={preferences.expectedSalaryMin || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, expectedSalaryMin: parseInt(e.target.value) || undefined }))}
                      placeholder="50000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Maximum Salary</Label>
                    <Input
                      type="number"
                      value={preferences.expectedSalaryMax || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, expectedSalaryMax: parseInt(e.target.value) || undefined }))}
                      placeholder="100000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Currency</Label>
                    <Select
                      value={preferences.salaryCurrency || 'USD'}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, salaryCurrency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="salary-negotiable"
                    checked={preferences.salaryNegotiable !== false}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, salaryNegotiable: checked as boolean }))}
                  />
                  <Label htmlFor="salary-negotiable" className="text-sm">
                    Salary is negotiable
                  </Label>
                </div>
              </div>

              {/* Industry Preferences */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Building className="h-4 w-4" />
                  Industry & Company Preferences
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Preferred Industries</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {options?.industries?.map((industry, index) => {
                        const industryValue = typeof industry === 'object' ? industry.value : industry;
                        const industryLabel = typeof industry === 'object' ? industry.label : industry;
                        return (
                          <div key={`industry-option-${index}-${industryValue}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`industry-${industryValue}`}
                              checked={(preferences.industryPreferences as string[])?.includes(industryValue) || false}
                              onCheckedChange={(checked) => handleArrayFieldChange('industryPreferences', industryValue, checked as boolean)}
                            />
                            <Label htmlFor={`industry-${industryValue}`} className="text-xs">
                              {industryLabel}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Company Size</Label>
                    <div className="space-y-2">
                      {options?.companySizes?.map((size, index) => {
                        const sizeValue = typeof size === 'object' ? size.value : size;
                        const sizeLabel = typeof size === 'object' ? size.label : size;
                        return (
                          <div key={`company-size-option-${index}-${sizeValue}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`company-size-${sizeValue}`}
                              checked={(preferences.companySizePreference as string[])?.includes(sizeValue) || false}
                              onCheckedChange={(checked) => handleArrayFieldChange('companySizePreference', sizeValue, checked as boolean)}
                            />
                            <Label htmlFor={`company-size-${sizeValue}`} className="text-xs">
                              {sizeLabel}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Level */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Role Level
                </Label>
                <Select
                  value={preferences.roleLevel || ''}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, roleLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role level" />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.roleLevels?.map((level, index) => {
                      const levelValue = typeof level === 'object' ? level.value : level;
                      const levelLabel = typeof level === 'object' ? level.label : level;
                      return (
                        <SelectItem key={`role-level-${index}-${levelValue}`} value={levelValue}>
                          {typeof levelLabel === 'string' ? levelLabel.charAt(0).toUpperCase() + levelLabel.slice(1) : levelLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Interview Preferences */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Interview Preferences
                </Label>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Preferred Interview Mode</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {options?.interviewModes?.map((mode, index) => {
                        const modeValue = typeof mode === 'object' ? mode.value : mode;
                        const modeLabel = typeof mode === 'object' ? mode.label : mode;
                        return (
                          <div key={`interview-mode-option-${index}-${modeValue}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`interview-mode-${modeValue}`}
                              checked={(preferences.preferredInterviewMode as string[])?.includes(modeValue) || false}
                              onCheckedChange={(checked) => handleArrayFieldChange('preferredInterviewMode', modeValue, checked as boolean)}
                            />
                            <Label htmlFor={`interview-mode-${modeValue}`} className="text-sm">
                              {typeof modeLabel === 'string' ? modeLabel.charAt(0).toUpperCase() + modeLabel.slice(1) : modeLabel}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t">
          {readOnly ? (
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}