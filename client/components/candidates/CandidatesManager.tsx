import { useState, useEffect } from "react";
import { Search, Filter, Users, X, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CandidateCard from "./CandidateCard";
import { candidatesApi, type Candidate, type CandidateFilters } from "@/services/candidatesApi";
import { shortlistApi } from "@/services/shortlistApi";
import { AIScreeningModal } from "@/components/recruiter/AIScreeningModal";

export default function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [displayedCandidates, setDisplayedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [shortlistFilter, setShortlistFilter] = useState<string>('all'); // all, shortlisted, not-shortlisted
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(20); // Show 20 candidates initially
  const [showAIScreening, setShowAIScreening] = useState(false);

  useEffect(() => {
    loadCandidates();
    loadShortlistedIds();
  }, []);

  useEffect(() => {
    filterCandidates();
    // Reset display count when filters change
    setDisplayCount(20);
  }, [candidates, searchQuery, locationFilter, experienceFilter, availabilityFilter, selectedSkills, shortlistFilter, shortlistedIds]);

  useEffect(() => {
    // Update displayed candidates when filtered list or display count changes
    setDisplayedCandidates(filteredCandidates.slice(0, displayCount));
  }, [filteredCandidates, displayCount]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading candidates...');
      const response = await candidatesApi.getCandidates();
      console.log('📊 Candidates response:', response);
      if (response.success) {
        // Deduplicate candidates by ID
        const uniqueCandidates = Array.from(
          new Map(response.candidates.map(c => [c.id, c])).values()
        );
        console.log('✅ Loaded candidates:', uniqueCandidates.length, '(deduplicated from', response.candidates.length, ')');
        setCandidates(uniqueCandidates);
        extractAvailableSkills(uniqueCandidates);
      } else {
        console.warn('⚠️ Response not successful:', response);
      }
    } catch (error) {
      console.error('❌ Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShortlistedIds = async () => {
    try {
      console.log('🔍 Loading shortlisted candidates...');
      const response = await shortlistApi.getMyShortlist();
      if (response.success && response.data) {
        // Convert candidate IDs to strings to match the Candidate interface
        const ids = new Set(
          response.data
            .filter(item => item.candidate && item.candidate.id) // Filter out null/undefined
            .map(item => item.candidate.id.toString())
        );
        console.log('✅ Loaded shortlisted IDs:', Array.from(ids));
        setShortlistedIds(ids);
      }
    } catch (error) {
      console.error('❌ Failed to load shortlisted candidates:', error);
    }
  };

  const extractAvailableSkills = (candidates: Candidate[]) => {
    const skillsSet = new Set<string>();
    candidates.forEach(candidate => {
      candidate.skills?.forEach(skill => skillsSet.add(skill));
    });
    setAvailableSkills(Array.from(skillsSet).sort());
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(candidate =>
        candidate.firstName.toLowerCase().includes(query) ||
        candidate.lastName.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        candidate.title?.toLowerCase().includes(query) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(candidate =>
        candidate.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (experienceFilter !== 'all') {
      filtered = filtered.filter(candidate =>
        candidate.experience?.toLowerCase().includes(experienceFilter.toLowerCase())
      );
    }

    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(candidate =>
        candidate.availability === availabilityFilter
      );
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(candidate =>
        selectedSkills.every(skill =>
          candidate.skills?.some(s => s.toLowerCase() === skill.toLowerCase())
        )
      );
    }

    // Filter by shortlist status
    if (shortlistFilter === 'shortlisted') {
      filtered = filtered.filter(candidate => shortlistedIds.has(candidate.id));
    } else if (shortlistFilter === 'not-shortlisted') {
      filtered = filtered.filter(candidate => !shortlistedIds.has(candidate.id));
    }

    setFilteredCandidates(filtered);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setExperienceFilter('all');
    setAvailabilityFilter('all');
    setShortlistFilter('all');
    setSelectedSkills([]);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const hasActiveFilters = searchQuery || locationFilter !== 'all' || experienceFilter !== 'all' || 
                          availabilityFilter !== 'all' || shortlistFilter !== 'all' || selectedSkills.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-normal text-slate-900">Registered Candidates</h2>
          <p className="text-slate-600">Browse and filter candidates</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowAIScreening(true)}
            disabled={filteredCandidates.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Screen with AI
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg" title="Total Candidates">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-normal text-blue-900">{candidates.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg" title="Shortlisted">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm font-normal text-amber-900">{shortlistedIds.size}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg" title="Filtered Results">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-normal text-green-900">{filteredCandidates.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg" title="Available Immediately">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-normal text-purple-900">
                {candidates.filter(c => c.availability === 'immediate').length}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span>Total</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Shortlisted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>Filtered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>Immediate</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, title, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={shortlistFilter} onValueChange={setShortlistFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Shortlist Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Candidates</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="not-shortlisted">Not Shortlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Experience</SelectItem>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Availability</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="two-weeks">2 Weeks</SelectItem>
                    <SelectItem value="one-month">1 Month</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <div>
                  <Button variant="outline" size="default" onClick={handleResetFilters} className="w-full">
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>

            {availableSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-normal text-slate-700">Filter by Skills:</span>
                  {selectedSkills.length > 0 && (
                    <span className="text-xs text-slate-500">({selectedSkills.length} selected)</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.slice(0, 15).map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                      {selectedSkills.includes(skill) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-normal text-slate-900 mb-2">
              {hasActiveFilters ? 'No candidates found' : 'No candidates yet'}
            </h3>
            <p className="text-slate-600 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'Candidates will appear here once they register'}
            </p>
            {hasActiveFilters && (
              <Button onClick={handleResetFilters}>
                Reset Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 420px)' }}>
            <AnimatePresence mode="popLayout">
              {displayedCandidates.map((candidate) => (
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate}
                  isShortlisted={shortlistedIds.has(candidate.id)}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {displayedCandidates.length < filteredCandidates.length && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => setDisplayCount(prev => prev + 20)}
                variant="outline"
                className="w-full max-w-md"
              >
                Load More ({filteredCandidates.length - displayedCandidates.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* AI Screening Modal */}
      <AIScreeningModal
        isOpen={showAIScreening}
        onClose={() => setShowAIScreening(false)}
        candidates={filteredCandidates}
        onScreeningComplete={(results) => {
          console.log('AI Screening results:', results);
          // Optionally filter or sort candidates based on results
        }}
      />
    </div>
  );
}
