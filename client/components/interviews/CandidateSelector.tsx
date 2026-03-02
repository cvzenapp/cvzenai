import React, { useState, useEffect } from 'react';
import { Search, User, Star, Briefcase, ChevronDown } from 'lucide-react';
import { shortlistApi, type ShortlistedResume } from '../../services/shortlistApi';

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
}

interface CandidateSelectorProps {
  selectedCandidate: Candidate | null;
  onCandidateSelect: (candidate: Candidate) => void;
  placeholder?: string;
}

export const CandidateSelector: React.FC<CandidateSelectorProps> = ({
  selectedCandidate,
  onCandidateSelect,
  placeholder = "Choose a candidate"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'shortlist' | 'applications' | 'all'>('shortlist');

  useEffect(() => {
    loadCandidates();
  }, [activeTab]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading candidates for tab:', activeTab);
      
      if (activeTab === 'shortlist') {
        console.log('📡 Calling shortlistApi.getMyShortlist()...');
        const response = await shortlistApi.getMyShortlist();
        console.log('📋 Shortlist API response:', response);
        
        if (response.success && response.data) {
          const shortlistedCandidates: Candidate[] = response.data.map((resume: ShortlistedResume) => ({
            id: resume.candidate.id,
            name: resume.candidate.name,
            email: resume.candidate.email,
            resumeId: resume.resumeId,
            resumeTitle: resume.title,
            source: 'shortlist' as const,
            upvotes: resume.upvotes,
            experience: resume.summary?.substring(0, 100) + '...' || 'No summary available'
          }));
          console.log('✅ Mapped candidates:', shortlistedCandidates);
          setCandidates(shortlistedCandidates);
        } else {
          console.warn('⚠️ Shortlist API returned no data or failed:', response);
          setCandidates([]);
        }
      } else {
        // For now, we'll show shortlisted candidates for all tabs
        // In a real implementation, you'd fetch from different endpoints
        setCandidates([]);
      }
    } catch (error) {
      console.error('❌ Failed to load candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.resumeTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCandidateSelect = (candidate: Candidate) => {
    onCandidateSelect(candidate);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'shortlist':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'application':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'shortlist':
        return 'Shortlisted';
      case 'application':
        return 'Applied';
      default:
        return 'Candidate';
    }
  };

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedCandidate ? (
            <>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedCandidate.name}</p>
                <p className="text-sm text-gray-500">{selectedCandidate.email}</p>
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'shortlist', label: 'Shortlisted', count: candidates.length },
              { key: 'applications', label: 'Applications', count: 0 },
              { key: 'all', label: 'All Candidates', count: 0 }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label} {count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Candidates List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading candidates...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-4 text-center">
                <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'No candidates match your search' : 
                   activeTab === 'shortlist' ? 'No shortlisted candidates yet' :
                   'No candidates available'}
                </p>
                {activeTab === 'shortlist' && !searchTerm && (
                  <p className="text-xs text-gray-400 mt-1">
                    Shortlist candidates from resumes to schedule interviews
                  </p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredCandidates.map((candidate) => (
                  <button
                    key={`${candidate.id}-${candidate.resumeId}`}
                    onClick={() => handleCandidateSelect(candidate)}
                    className="w-full px-3 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{candidate.name}</p>
                          {getSourceIcon(candidate.source)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{candidate.email}</p>
                        <p className="text-sm text-gray-500 truncate">{candidate.resumeTitle}</p>
                        {candidate.experience && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{candidate.experience}</p>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            candidate.source === 'shortlist' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : candidate.source === 'application'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getSourceLabel(candidate.source)}
                          </span>
                          {candidate.upvotes !== undefined && candidate.upvotes > 0 && (
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <Star className="w-3 h-3 text-yellow-400 mr-1" />
                              {candidate.upvotes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Select a candidate to schedule an interview
            </p>
          </div>
        </div>
      )}
    </div>
  );
};