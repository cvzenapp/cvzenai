import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, Video, Phone, MapPin, Monitor, 
  CheckCircle, XCircle, AlertCircle, User, Building, 
  Filter, Search, ChevronDown, RefreshCw, Download,
  ArrowUpDown, ArrowUp, ArrowDown, Edit
} from 'lucide-react';
import { interviewApi } from '../../services/interviewApi';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import { InterviewResponseModal } from './InterviewResponseModal';
import { VideoCallLauncher } from '../video/VideoCallLauncher';
import { ScheduleInterviewForm } from './ScheduleInterviewForm';
import type { InterviewInvitation } from '@shared/api';

interface EnterpriseInterviewManagerProps {
  userType: 'recruiter' | 'job_seeker';
}

interface FilterState {
  status: string[];
  interviewType: string[];
  dateRange: {
    start: string;
    end: string;
  };
  candidateSearch: string;
  sortBy: 'date' | 'status' | 'candidate' | 'type';
  sortOrder: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 10;

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'accepted', label: 'Accepted', color: 'green' },
  { value: 'declined', label: 'Declined', color: 'red' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'gray' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' }
];

const interviewTypeOptions = [
  { value: 'video_call', label: 'Video Call', icon: Video },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'in_person', label: 'In Person', icon: MapPin },
  { value: 'technical', label: 'Technical', icon: Monitor }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  rescheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
};

const statusIcons = {
  pending: AlertCircle,
  accepted: CheckCircle,
  declined: XCircle,
  rescheduled: Calendar,
  completed: CheckCircle,
  cancelled: XCircle
};

export const EnterpriseInterviewManager: React.FC<EnterpriseInterviewManagerProps> = ({ userType }) => {
  const [interviews, setInterviews] = useState<InterviewInvitation[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<InterviewInvitation[]>([]);
  const [displayedInterviews, setDisplayedInterviews] = useState<InterviewInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewInvitation | null>(null);
  const [videoCallInterview, setVideoCallInterview] = useState<InterviewInvitation | null>(null);
  const [editingInterview, setEditingInterview] = useState<InterviewInvitation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    interviewType: [],
    dateRange: {
      start: '',
      end: ''
    },
    candidateSearch: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadInterviews();
  }, [userType]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [interviews, filters]);

  useEffect(() => {
    // Update displayed interviews based on pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedInterviews(filteredInterviews.slice(startIndex, endIndex));
  }, [filteredInterviews, currentPage]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiClient = userType === 'recruiter' ? recruiterInterviewApi : interviewApi;
      const data = await apiClient.getMyInterviews();
      
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading interviews:', err);
      setError(err.message || 'Failed to load interviews');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let result = [...interviews];

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(interview => filters.status.includes(interview.status));
    }

    // Apply interview type filter
    if (filters.interviewType.length > 0) {
      result = result.filter(interview => filters.interviewType.includes(interview.interviewType));
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      result = result.filter(interview => new Date(interview.proposedDatetime) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(interview => new Date(interview.proposedDatetime) <= endDate);
    }

    // Apply candidate search
    if (filters.candidateSearch.trim()) {
      const searchTerm = filters.candidateSearch.toLowerCase();
      result = result.filter(interview => {
        const candidateName = userType === 'recruiter' 
          ? interview.candidate?.name?.toLowerCase() || ''
          : interview.recruiter?.name?.toLowerCase() || '';
        const candidateEmail = userType === 'recruiter'
          ? interview.candidate?.email?.toLowerCase() || ''
          : interview.recruiter?.email?.toLowerCase() || '';
        const title = interview.title?.toLowerCase() || '';
        
        return candidateName.includes(searchTerm) || 
               candidateEmail.includes(searchTerm) ||
               title.includes(searchTerm);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.proposedDatetime).getTime() - new Date(b.proposedDatetime).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'candidate':
          const nameA = userType === 'recruiter' ? a.candidate?.name || '' : a.recruiter?.name || '';
          const nameB = userType === 'recruiter' ? b.candidate?.name || '' : b.recruiter?.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'type':
          comparison = a.interviewType.localeCompare(b.interviewType);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredInterviews(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [interviews, filters, userType]);

  const toggleFilter = (filterType: 'status' | 'interviewType', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      interviewType: [],
      dateRange: { start: '', end: '' },
      candidateSearch: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const handleSort = (sortBy: FilterState['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleEditInterview = (interview: InterviewInvitation) => {
    setEditingInterview(interview);
  };

  const handleEditSuccess = () => {
    setEditingInterview(null);
    loadInterviews(); // Reload interviews to get updated data
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    if (isToday) dateStr = 'Today';
    else if (isTomorrow) dateStr = 'Tomorrow';
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    return { dateStr, timeStr, isPast: date < now };
  };

  const getStatusCounts = () => {
    return statusOptions.reduce((acc, status) => {
      acc[status.value] = interviews.filter(i => i.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();
  const totalPages = Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadInterviews}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Interview Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredInterviews.length} of {interviews.length} interviews
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadInterviews}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {(filters.status.length > 0 || filters.interviewType.length > 0 || filters.candidateSearch) && (
              <span className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-medium">
                {filters.status.length + filters.interviewType.length + (filters.candidateSearch ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search {userType === 'recruiter' ? 'Candidates' : 'Recruiters'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.candidateSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, candidateSearch: e.target.value }))}
                placeholder="Search by name, email, or title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => toggleFilter('status', status.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.status.includes(status.value)
                      ? `bg-${status.color}-100 text-${status.color}-800 border-${status.color}-300 border-2`
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                  {statusCounts[status.value] > 0 && (
                    <span className="ml-1.5 text-xs">({statusCounts[status.value]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type
            </label>
            <div className="flex flex-wrap gap-2">
              {interviewTypeOptions.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleFilter('interviewType', type.value)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filters.interviewType.includes(type.value)
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          {[
            { value: 'date', label: 'Date' },
            { value: 'status', label: 'Status' },
            { value: 'candidate', label: userType === 'recruiter' ? 'Candidate' : 'Recruiter' },
            { value: 'type', label: 'Type' }
          ].map(sort => (
            <button
              key={sort.value}
              onClick={() => handleSort(sort.value as FilterState['sortBy'])}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.sortBy === sort.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{sort.label}</span>
              {filters.sortBy === sort.value && (
                filters.sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Interviews List */}
      {displayedInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No interviews found
          </h3>
          <p className="text-gray-500">
            {filters.status.length > 0 || filters.interviewType.length > 0 || filters.candidateSearch
              ? 'Try adjusting your filters to see more results.'
              : userType === 'recruiter'
              ? 'Schedule interviews with candidates to get started.'
              : 'Interview invitations will appear here when recruiters schedule them.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedInterviews.map((interview) => {
            const { dateStr, timeStr, isPast } = formatDateTime(interview.proposedDatetime);
            const StatusIcon = statusIcons[interview.status];
            const InterviewIcon = interviewTypeOptions.find(t => t.value === interview.interviewType)?.icon || Video;
            
            return (
              <div
                key={interview.id}
                className={`bg-white border rounded-lg p-6 hover:shadow-md transition-all ${
                  isPast && interview.status !== 'completed' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start space-x-3 mb-3">
                      <InterviewIcon className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {interview.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {interviewTypeOptions.find(t => t.value === interview.interviewType)?.label}
                        </p>
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${statusColors[interview.status]}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </div>
                    </div>

                    {/* Participant Info */}
                    <div className="flex items-center space-x-6 mb-3">
                      {userType === 'recruiter' ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">
                            {interview.candidate?.name} ({interview.candidate?.email})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Building className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">
                            {interview.recruiter?.name}
                            {interview.recruiter?.company && ` • ${interview.recruiter.company}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">{dateStr}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{timeStr} • {interview.durationMinutes}min</span>
                      </div>
                    </div>

                    {/* Description */}
                    {interview.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {interview.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col space-y-2">
                    {/* Edit button for recruiters - Always show for testing */}
                    <button
                      onClick={() => handleEditInterview(interview)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center space-x-2 whitespace-nowrap"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit ({userType})</span>
                    </button>
                    
                    {userType === 'job_seeker' && interview.status === 'pending' && (
                      <button
                        onClick={() => setSelectedInterview(interview)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                      > <span>Join Call</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Load More ({filteredInterviews.length - displayedInterviews.length} remaining)
              </button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="text-center text-sm text-gray-600">
            Showing {displayedInterviews.length} of {filteredInterviews.length} interviews
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedInterview && (
        <InterviewResponseModal
          isOpen={true}
          onClose={() => setSelectedInterview(null)}
          interview={selectedInterview}
          onSuccess={() => {
            loadInterviews();
            setSelectedInterview(null);
          }}
        />
      )}

      {videoCallInterview && (
        <VideoCallLauncher
          interview={videoCallInterview}
          userType={userType === 'recruiter' ? 'recruiter' : 'candidate'}
          onClose={() => setVideoCallInterview(null)}
        />
      )}
    </div>
  );
};
