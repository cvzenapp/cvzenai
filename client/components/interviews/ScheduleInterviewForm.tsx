import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, User, Briefcase, Brain, Sparkles, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import { CandidateSelector } from './CandidateSelector';
import { EvaluationMetricsEditor, type EvaluationMetric } from './EvaluationMetricsEditor';
import type { CreateInterviewRequest } from '@shared/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  resumeId: number;
  resumeTitle: string;
  source: 'shortlist' | 'application' | 'search';
  avatar?: string;
  skills?: string[];
  experience?: string;
  upvotes?: number;
  isGuest?: boolean;
  guestName?: string;
  guestEmail?: string;
}

interface ScheduleInterviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedCandidate?: {
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    resumeId: number;
    resumeTitle: string;
    isGuest?: boolean;
    guestName?: string;
    guestEmail?: string;
    jobPostingId?: number;
    applicationId?: number;
    currentRound?: number;
  };
  editingInterview?: {
    id?: string;
    title?: string;
    description?: string;
    interviewType?: string;
    interviewRoundType?: string;
    proposedDatetime?: string;
    durationMinutes?: number;
    timezone?: string;
    meetingLink?: string;
    meetingLocation?: string;
    meetingInstructions?: string;
    recruiterNotes?: string;
  } | null;
}

const interviewTypes = [
  { value: 'video_call', label: 'Video Call', icon: Video, description: 'Online meeting via video platform' },
  { value: 'phone', label: 'Phone Call', icon: Phone, description: 'Voice call interview' },
  { value: 'in_person', label: 'In Person', icon: MapPin, description: 'Face-to-face meeting at office' }
] as const;

// Helper function to parse AI-generated internal notes into evaluation metrics
const parseInternalNotesToMetrics = (internalNotes: string, candidateName: string): EvaluationMetric[] => {
  const lines = internalNotes.split('\n').filter(line => line.trim());
  const metrics: EvaluationMetric[] = [];
  let id = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Look for bullet points or evaluation criteria
    if (trimmedLine.startsWith('*') || trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      const metric = trimmedLine.replace(/^[*•-]\s*/, '').trim();
      if (metric && metric.length > 10) { // Only add meaningful metrics
        metrics.push({
          id: id++,
          metric: metric,
          score: null,
          checked: true
        });
      }
    }
  }

  // If no metrics found, use default ones
  if (metrics.length === 0) {
    const defaultMetrics = [
      `Technical expertise in frontend development (JavaScript frameworks, HTML/CSS, responsive design principles)`,
      `Experience with frontend build tools, UI component libraries, and accessibility standards`,
      `Ability to work with cross-functional teams and meet business objectives`,
      `Problem-solving skills and attention to detail`
    ];

    return defaultMetrics.map((metric, index) => ({
      id: index + 1,
      metric: metric.replace(/the candidate/gi, candidateName),
      score: null,
      checked: true
    }));
  }

  return metrics;
};
export const ScheduleInterviewForm: React.FC<ScheduleInterviewFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedCandidate,
  editingInterview
}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState<'basic' | 'details'>(editingInterview ? 'details' : 'basic');
  
  // Basic interview details (Step 1)
  const [basicDetails, setBasicDetails] = useState({
    interviewType: (editingInterview?.interviewType as 'video_call' | 'phone' | 'in_person') || 'video_call',
    interviewRoundType: editingInterview?.interviewRoundType || '',
    proposedDatetime: editingInterview?.proposedDatetime ? 
      new Date(editingInterview.proposedDatetime).toISOString().slice(0, 16) : '',
    durationMinutes: editingInterview?.durationMinutes || 60,
    timezone: editingInterview?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    preSelectedCandidate ? {
      id: preSelectedCandidate.candidateId,
      name: preSelectedCandidate.candidateName,
      email: preSelectedCandidate.candidateEmail,
      resumeId: preSelectedCandidate.resumeId,
      resumeTitle: preSelectedCandidate.resumeTitle,
      source: 'shortlist' as const,
      isGuest: preSelectedCandidate.isGuest,
      guestName: preSelectedCandidate.guestName,
      guestEmail: preSelectedCandidate.guestEmail
    } : null
  );

  const [formData, setFormData] = useState<Omit<CreateInterviewRequest, 'candidateId' | 'resumeId'>>({
    title: editingInterview?.title || '',
    description: editingInterview?.description || '',
    interviewType: basicDetails.interviewType,
    proposedDatetime: basicDetails.proposedDatetime,
    durationMinutes: basicDetails.durationMinutes,
    timezone: basicDetails.timezone,
    meetingLink: editingInterview?.meetingLink || '',
    meetingLocation: editingInterview?.meetingLocation || '',
    meetingInstructions: editingInterview?.meetingInstructions || '',
    recruiterNotes: editingInterview?.recruiterNotes || ''
  });

  // Evaluation metrics state
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetric[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  
  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
    place_id: string | number;
  }>>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    mapUrl: string;
    placeId?: string;
  } | null>(null);
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Update title when candidate is selected
  React.useEffect(() => {
    if (selectedCandidate && !formData.title) {
      const currentRound = preSelectedCandidate?.currentRound || 0;
      const nextRound = currentRound + 1;
      
      setFormData(prev => ({
        ...prev,
        title: `Round ${nextRound} Interview with ${selectedCandidate.name}`
      }));
    }
  }, [selectedCandidate, preSelectedCandidate]);

  const proceedToAIGeneration = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    if (!basicDetails.proposedDatetime || !basicDetails.interviewType) {
      setError('Please fill in all required fields');
      return;
    }

    if (basicDetails.interviewType === 'in_person' && !selectedLocation) {
      setError('Please select a meeting location for in-person interviews');
      return;
    }

    // Update form data with basic details
    setFormData(prev => ({
      ...prev,
      interviewType: basicDetails.interviewType,
      proposedDatetime: basicDetails.proposedDatetime,
      durationMinutes: basicDetails.durationMinutes,
      timezone: basicDetails.timezone,
      meetingLocation: selectedLocation ? `${selectedLocation.address}\n\nGoogle Maps: ${selectedLocation.mapUrl}` : ''
    }));

    // Generate AI content if this is a new interview
    if (!editingInterview && preSelectedCandidate?.jobPostingId) {
      await generateAIContent();
    }

    setCurrentStep('details');
  };

  const generateAIContent = async () => {
    if (!selectedCandidate || !preSelectedCandidate?.jobPostingId) return;

    setIsGeneratingAI(true);
    setAiProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAiProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const aiContent = await recruiterInterviewApi.generateAIPreparation(
        preSelectedCandidate.jobPostingId,
        selectedCandidate.isGuest ? undefined : selectedCandidate.id,
        selectedCandidate.resumeId,
        basicDetails.interviewType,
        basicDetails.interviewType, // interviewMode same as interviewType
        basicDetails.proposedDatetime,
        basicDetails.durationMinutes
      );

      clearInterval(progressInterval);
      setAiProgress(100);

      // Replace generic "Candidate" with actual candidate name
      const personalizedContent = {
        description: aiContent.description
          .replace(/\bCandidate\b/g, selectedCandidate.name)
          .replace(/\bthe candidate\b/gi, selectedCandidate.name)
          .replace(/\bHello Candidate\b/gi, `Hello ${selectedCandidate.name}`),
        instructions: aiContent.instructions
          .replace(/\bCandidate\b/g, selectedCandidate.name)
          .replace(/\bthe candidate\b/gi, 'you')
          .replace(/\bHello Candidate\b/gi, `Hello ${selectedCandidate.name}`),
        internalNotes: aiContent.internalNotes
          .replace(/\bCandidate\b/g, selectedCandidate.name)
          .replace(/\bthe candidate\b/gi, selectedCandidate.name)
      };

      // Parse internal notes into evaluation metrics
      const metrics = parseInternalNotesToMetrics(personalizedContent.internalNotes, selectedCandidate.name);
      setEvaluationMetrics(metrics);

      // Update form with AI-generated content
      setFormData(prev => ({
        ...prev,
        description: personalizedContent.description,
        meetingInstructions: personalizedContent.instructions,
        recruiterNotes: '' // Clear recruiter notes as we're using evaluation metrics now
      }));

      setTimeout(() => {
        setIsGeneratingAI(false);
        setAiProgress(0);
        
        // Show success message briefly
        setError('✨ AI interview preparation completed successfully!');
        setTimeout(() => setError(null), 3000);
      }, 500);

    } catch (err: any) {
      console.error('❌ AI generation failed:', err);
      
      // Provide fallback content if AI fails
      const fallbackContent = {
        description: `This interview will assess the candidate's qualifications for the position. We'll discuss their experience, technical skills, and cultural fit through a collaborative conversation.`,
        instructions: `Please prepare by:\n• Reviewing the job description and company information\n• Preparing examples of relevant experience with specific details\n• Having thoughtful questions ready about the role and company culture\n• Ensuring stable internet connection for video calls\n• Being authentic and honest - this is a mutual evaluation process\n• Avoiding any form of misrepresentation or dishonesty\n• Remember: this is a professional conversation, not an interrogation\n• Feel comfortable to ask for clarification if needed`,
        internalNotes: `Focus areas:\n• Technical competency assessment\n• Cultural fit evaluation\n• Communication skills and authenticity\n• Problem-solving approach\n• Create a welcoming, collaborative atmosphere\n• Encourage open dialogue rather than one-sided questioning\n• Assess genuine interest and motivation\n• Questions about role expectations and growth opportunities`
      };

      // Parse fallback internal notes into evaluation metrics
      const fallbackMetrics = parseInternalNotesToMetrics(fallbackContent.internalNotes, selectedCandidate.name);
      setEvaluationMetrics(fallbackMetrics);

      setFormData(prev => ({
        ...prev,
        description: fallbackContent.description,
        meetingInstructions: fallbackContent.instructions,
        recruiterNotes: '' // Clear recruiter notes as we're using evaluation metrics now
      }));

      setError(`AI preparation unavailable. Using standard template instead.`);
      setIsGeneratingAI(false);
      setAiProgress(0);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    if (!formData.title || !formData.proposedDatetime) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingInterview?.id) {
        // Update existing interview
        const updateRequest: Partial<CreateInterviewRequest> = {
          title: formData.title,
          description: formData.description,
          interviewType: formData.interviewType,
          interviewRoundType: basicDetails.interviewRoundType || undefined,
          proposedDatetime: formData.proposedDatetime,
          durationMinutes: formData.durationMinutes,
          timezone: formData.timezone,
          meetingLink: formData.meetingLink,
          meetingLocation: formData.meetingLocation,
          meetingInstructions: formData.meetingInstructions,
          recruiterNotes: formData.recruiterNotes
        };

        console.log('🔄 Updating interview:', editingInterview.id, updateRequest);
        const result = await recruiterInterviewApi.updateInterview(editingInterview.id, updateRequest);
        console.log('✅ Interview updated successfully:', result);
        
        onSuccess?.();
        onClose();
      } else {
        // Create new interview
        const request: CreateInterviewRequest = selectedCandidate.isGuest ? {
          // Guest candidate
          guestCandidateName: selectedCandidate.guestName,
          guestCandidateEmail: selectedCandidate.guestEmail,
          jobPostingId: preSelectedCandidate?.jobPostingId,
          applicationId: preSelectedCandidate?.applicationId,
          interviewRoundType: basicDetails.interviewRoundType || undefined,
          evaluationMetrics: evaluationMetrics,
          ...formData
        } : {
          // Registered candidate
          candidateId: selectedCandidate.id,
          resumeId: selectedCandidate.resumeId,
          jobPostingId: preSelectedCandidate?.jobPostingId,
          applicationId: preSelectedCandidate?.applicationId,
          interviewRoundType: basicDetails.interviewRoundType || undefined,
          evaluationMetrics: evaluationMetrics,
          ...formData
        };

        console.log('🎯 Submitting interview request:', request);
        const result = await recruiterInterviewApi.createInterview(request);
        console.log('✅ Interview created successfully:', result);
        
        onSuccess?.();
        onClose();
      }
      
      // Reset form
      if (!editingInterview) {
        setSelectedCandidate(preSelectedCandidate ? selectedCandidate : null);
        setCurrentStep('basic');
        setBasicDetails({
          interviewType: 'video_call',
          interviewRoundType: '',
          proposedDatetime: '',
          durationMinutes: 60,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        setFormData({
          title: '',
          description: '',
          interviewType: 'video_call',
          proposedDatetime: '',
          durationMinutes: 60,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          meetingLink: '',
          meetingLocation: '',
          meetingInstructions: '',
          recruiterNotes: ''
        });
      }
    } catch (err: any) {
      console.error('❌ Interview scheduling failed:', err);
      
      // Handle different types of errors
      if (err.type === 'SETUP_IN_PROGRESS' || err.message?.includes('being set up')) {
        setError('🚧 Interview system is being set up. Database tables are being created. Please try again in a few minutes.');
      } else if (err.type === 'SERVER_ERROR') {
        setError('Server error occurred. This might be due to database connectivity issues. Please try again later or contact support.');
      } else if (err.type === 'UNAUTHORIZED') {
        setError('Authentication required. Please refresh the page and try again.');
      } else if (err.type === 'VALIDATION_ERROR') {
        setError('Please check your input and try again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to schedule interview. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBasicDetailsChange = (field: keyof typeof basicDetails, value: any) => {
    setBasicDetails(prev => ({ ...prev, [field]: value }));
    
    // Clear location when switching away from in_person
    if (field === 'interviewType' && value !== 'in_person') {
      setSelectedLocation(null);
      setLocationSearch('');
    }
  };

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocations(true);
    try {
      // Use our server endpoint to avoid CORS issues
      const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setLocationSuggestions(data);
      } else {
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocations(false);
    }
  };

  const debouncedSearchLocations = (query: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      searchLocations(query);
    }, 300); // 300ms delay
    
    setSearchTimeout(timeout);
  };

  const selectLocationFromSuggestion = (suggestion: any) => {
    const address = suggestion.display_name;
    const lat = suggestion.lat;
    const lon = suggestion.lon;
    
    // Create Google Maps URL - use coordinates if available, otherwise search by name
    let mapUrl;
    if (lat !== '0' && lon !== '0') {
      // Use coordinates for better accuracy
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    } else {
      // Fallback to text search
      const searchQuery = encodeURIComponent(address.replace(' (Search Location)', '').replace(' (Manual Entry)', ''));
      mapUrl = `https://www.google.com/maps/search/${searchQuery}`;
    }
    
    setSelectedLocation({
      address: address.replace(' (Search Location)', '').replace(' (Manual Entry)', ''),
      mapUrl: mapUrl,
      placeId: String(suggestion.place_id || '')
    });
    
    // Update form data with the location and map URL
    const cleanAddress = address.replace(' (Search Location)', '').replace(' (Manual Entry)', '');
    setFormData(prev => ({
      ...prev,
      meetingLocation: `${cleanAddress}\n\nGoogle Maps: ${mapUrl}`
    }));
    
    setLocationSearch(cleanAddress);
    setLocationSuggestions([]);
  };

  const handleLocationSearch = () => {
    if (!locationSearch.trim()) return;
    
    // Create Google Maps search URL
    const searchQuery = encodeURIComponent(locationSearch.trim());
    const mapUrl = `https://www.google.com/maps/search/${searchQuery}`;
    
    setSelectedLocation({
      address: locationSearch.trim(),
      mapUrl: mapUrl
    });
    
    // Update form data with the location and map URL
    setFormData(prev => ({
      ...prev,
      meetingLocation: `${locationSearch.trim()}\n\nGoogle Maps: ${mapUrl}`
    }));
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setLocationSearch('');
    setLocationSuggestions([]);
    setFormData(prev => ({
      ...prev,
      meetingLocation: ''
    }));
  };

  // Get minimum datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-brand-main to-brand-background flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white font-jakarta">
              {editingInterview ? 'Reschedule Interview' : 'Schedule Interview'}
            </h2>
            <p className="text-sm text-white/90 mt-1 font-jakarta">
              {currentStep === 'basic' 
                ? 'Step 1: Basic interview details' 
                : editingInterview 
                  ? 'Update interview details and reschedule' 
                  : 'Step 2: AI-generated interview preparation'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI Loading Overlay */}
        {isGeneratingAI && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-brand-main/20"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-brand-main border-t-transparent animate-spin"
                  style={{ 
                    background: `conic-gradient(from 0deg, transparent, transparent ${aiProgress * 3.6}deg, #1891db ${aiProgress * 3.6}deg)`
                  }}
                ></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-brand-main font-jakarta">{aiProgress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 font-jakarta">
                🤖 AI Preparing Interview Details
              </h3>
              <p className="text-sm text-slate-600 font-jakarta">
                Analyzing job requirements, candidate profile, and interview preferences to generate contextual content...
              </p>
              <div className="mt-4 w-64 bg-slate-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-gradient-to-r from-brand-main to-brand-background h-2 rounded-full transition-all duration-300"
                  style={{ width: `${aiProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {currentStep === 'basic' ? (
            // Step 1: Basic Details - Optimized
            <div className="p-6 space-y-4 bg-gradient-to-br from-slate-50 to-white">
              {error && (
                <div className={`border rounded-lg p-3 ${
                  error.startsWith('✨') 
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <p className="text-sm font-jakarta">{error}</p>
                </div>
              )}

              {/* Selected Candidate Display (Read-only) */}
              {selectedCandidate && (
                <div className="p-3 bg-gradient-to-r from-brand-main/10 to-brand-background/10 border border-brand-main/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-main to-brand-background rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 font-jakarta text-sm">{selectedCandidate.name}</p>
                      <p className="text-xs text-slate-600 font-jakarta">{selectedCandidate.email}</p>
                    </div>
                    {preSelectedCandidate?.currentRound !== undefined && (
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        R{(preSelectedCandidate.currentRound || 0) + 1}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interview Round Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 font-jakarta">
                  Interview Round Type
                </label>
                <input
                  type="text"
                  value={basicDetails.interviewRoundType}
                  onChange={(e) => handleBasicDetailsChange('interviewRoundType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta text-sm"
                  placeholder="Technical, HR, Coding, Final, etc."
                />
              </div>

              {/* Interview Mode - Compact */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-jakarta">
                  Interview Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {interviewTypes.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleBasicDetailsChange('interviewType', value)}
                      className={`flex flex-col items-center p-3 border rounded-lg transition-all text-center hover:shadow-sm ${
                        basicDetails.interviewType === value
                          ? 'border-brand-main bg-brand-main/5 text-brand-main'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs font-medium font-jakarta">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time - Compact */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-jakarta">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={basicDetails.proposedDatetime}
                    onChange={(e) => handleBasicDetailsChange('proposedDatetime', e.target.value)}
                    min={getMinDateTime()}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-jakarta">
                    Duration
                  </label>
                  <select
                    value={basicDetails.durationMinutes}
                    onChange={(e) => handleBasicDetailsChange('durationMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta text-sm"
                  >
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>1h</option>
                    <option value={90}>1.5h</option>
                    <option value={120}>2h</option>
                  </select>
                </div>
              </div>

              {/* Location Selector for In-Person Interviews */}
              {basicDetails.interviewType === 'in_person' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-jakarta">
                    Meeting Location *
                  </label>
                  
                  {!selectedLocation ? (
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => {
                            setLocationSearch(e.target.value);
                            debouncedSearchLocations(e.target.value);
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta text-sm"
                          placeholder="Search for office address or meeting location..."
                        />
                        <button
                          type="button"
                          onClick={handleLocationSearch}
                          disabled={!locationSearch.trim() || isSearchingLocations}
                          className="px-3 py-2 bg-brand-main text-white rounded-lg hover:bg-brand-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSearchingLocations ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      {/* Location Suggestions Dropdown */}
                      {locationSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {locationSuggestions.map((suggestion, index) => {
                            const placeId = String(suggestion.place_id || '');
                            const isLocal = placeId.startsWith('local_');
                            const isFallback = placeId.startsWith('fallback_') || placeId.startsWith('manual_');
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectLocationFromSuggestion(suggestion)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-start space-x-2">
                                  {isLocal ? (
                                    <div className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0">🏙️</div>
                                  ) : isFallback ? (
                                    <div className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0">📍</div>
                                  ) : (
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 font-jakarta truncate">
                                      {suggestion.display_name.split(',')[0]}
                                    </p>
                                    <p className="text-xs text-slate-500 font-jakarta truncate">
                                      {suggestion.display_name.includes('(') 
                                        ? suggestion.display_name.split(',').slice(1).join(',').trim()
                                        : suggestion.display_name.split(',').slice(1).join(',').trim()
                                      }
                                      {isLocal && <span className="ml-1 text-blue-500">• Popular</span>}
                                      {isFallback && <span className="ml-1 text-orange-500">• Manual</span>}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 font-jakarta">Selected Location</span>
                          </div>
                          <p className="text-sm text-green-700 font-jakarta mb-2">{selectedLocation.address}</p>
                          <a
                            href={selectedLocation.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-brand-main hover:text-brand-background transition-colors font-jakarta"
                          >
                            <span>View on Google Maps</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={clearLocation}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 mt-1 font-jakarta">
                    Search and select the interview location. A Google Maps link will be included in the invitation.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-jakarta font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={proceedToAIGeneration}
                  disabled={!selectedCandidate || !basicDetails.proposedDatetime || (basicDetails.interviewType === 'in_person' && !selectedLocation)}
                  className="px-6 py-2 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-jakarta font-medium flex items-center space-x-2 text-sm"
                >
                  <span>Prepare with AI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Detailed Form with AI Content
            <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-white">
              {error && (
                <div className={`border rounded-lg p-4 ${
                  error.startsWith('✨') 
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <p className="text-sm font-jakarta">{error}</p>
                </div>
              )}

              {/* Selected Details Summary */}
              <div className="bg-gradient-to-r from-brand-main/5 to-brand-background/5 border border-brand-main/20 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3 font-jakarta">Interview Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 font-jakarta">Candidate</p>
                    <p className="font-semibold text-slate-900 font-jakarta">{selectedCandidate?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-jakarta">Mode</p>
                    <p className="font-semibold text-slate-900 font-jakarta">
                      {interviewTypes.find(t => t.value === basicDetails.interviewType)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-jakarta">Date</p>
                    <p className="font-semibold text-slate-900 font-jakarta">
                      {basicDetails.proposedDatetime ? new Date(basicDetails.proposedDatetime).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-jakarta">Duration</p>
                    <p className="font-semibold text-slate-900 font-jakarta">{basicDetails.durationMinutes} min</p>
                  </div>
                </div>
                {!editingInterview && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('basic')}
                    className="mt-3 flex items-center space-x-1 text-sm text-brand-main hover:text-brand-background transition-colors font-jakarta"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Edit basic details</span>
                  </button>
                )}
              </div>

              {/* Interview Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-jakarta">
                  Interview Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta"
                  placeholder="e.g., Technical Interview - Frontend Developer"
                  required
                />
              </div>

              {/* Meeting Details */}
              {basicDetails.interviewType === 'video_call' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-jakarta">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink || ''}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  />
                  <p className="text-xs text-slate-500 mt-2 font-jakarta">
                    Provide the video call link (Zoom, Google Meet, Teams, etc.)
                  </p>
                </div>
              )}

              {basicDetails.interviewType === 'in_person' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-jakarta">
                    Meeting Location
                  </label>
                  
                  {selectedLocation ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 font-jakarta">Selected Location</span>
                          </div>
                          <p className="text-sm text-green-700 font-jakarta mb-3">{selectedLocation.address}</p>
                          <div className="flex items-center space-x-3">
                            <a
                              href={selectedLocation.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-main text-white rounded-lg hover:bg-brand-background transition-colors text-xs font-jakarta"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>View on Google Maps</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <button
                              type="button"
                              onClick={() => setCurrentStep('basic')}
                              className="text-xs text-slate-600 hover:text-slate-800 transition-colors font-jakarta"
                            >
                              Change location
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={formData.meetingLocation || ''}
                      onChange={(e) => handleInputChange('meetingLocation', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta"
                      rows={2}
                      placeholder="Office address or meeting location"
                    />
                  )}
                </div>
              )}
              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                    Interview Description
                  </label>
                  {formData.description && !editingInterview && (
                    <div className="flex items-center space-x-1 text-xs text-purple-600 font-jakarta">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Generated</span>
                    </div>
                  )}
                </div>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta"
                  rows={3}
                  placeholder="Brief description of what to expect in this interview..."
                />
              </div>

              {/* Meeting Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                    Instructions for Candidate
                  </label>
                  {formData.meetingInstructions && !editingInterview && (
                    <div className="flex items-center space-x-1 text-xs text-purple-600 font-jakarta">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Generated</span>
                    </div>
                  )}
                </div>
                <textarea
                  value={formData.meetingInstructions || ''}
                  onChange={(e) => handleInputChange('meetingInstructions', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta"
                  rows={3}
                  placeholder="Any special instructions, preparation requirements, or what to bring..."
                />
              </div>

              {/* Evaluation Metrics */}
              <EvaluationMetricsEditor
                value={evaluationMetrics}
                onChange={setEvaluationMetrics}
                candidateName={selectedCandidate?.name}
                jobTitle={preSelectedCandidate?.jobPostingId ? 'Position' : undefined}
                isAIGenerated={!editingInterview && evaluationMetrics.length > 0}
              />

              {/* Confirmation */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="reviewConfirmation"
                    className="w-4 h-4 text-brand-main bg-gray-100 border-gray-300 rounded focus:ring-brand-main focus:ring-2 mt-0.5"
                    required
                  />
                  <label htmlFor="reviewConfirmation" className="text-sm text-amber-800 font-jakarta">
                    I confirm that I have reviewed all interview details and they meet the scheduling requirements.
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-slate-200">
                {!editingInterview && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('basic')}
                    className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-jakarta font-medium flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-jakarta font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedCandidate}
                    className="px-8 py-3 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-jakarta font-medium"
                  >
                    {isSubmitting 
                      ? (editingInterview ? 'Rescheduling...' : 'Scheduling...') 
                      : (editingInterview ? 'Reschedule Interview' : 'Schedule Interview')
                    }
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};