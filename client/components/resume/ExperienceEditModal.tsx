import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { unifiedAuthService } from '@/services/unifiedAuthService';

interface Experience {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  location?: string;
  responsibilities?: string[];
  technologies?: string[];
  companyLogo?: string;
  companyUrl?: string;
  employmentType?: string;
  achievements?: string[];
  keyMetrics?: {
    metric: string;
    value: string;
    description?: string;
  }[];
  skills?: string[];
  // Optimization fields
  is_optimized?: boolean;
  description_optimized?: string;
  responsibilities_optimized?: string[];
  achievements_optimized?: string[];
}

interface ExperienceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExperiences: Experience[];
  onSave: (experiences: Experience[]) => Promise<void>;
  resumeData?: any;
}

export function ExperienceEditModal({
  isOpen,
  onClose,
  currentExperiences,
  onSave,
  resumeData
}: ExperienceEditModalProps) {
  const [experiences, setExperiences] = useState<Experience[]>(currentExperiences);
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [combinedContent, setCombinedContent] = useState('');
  const [currentWorkToggle, setCurrentWorkToggle] = useState(false);

  // Initialize with current experiences when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Original experiences data:', currentExperiences);
      
      const experiencesWithIds = currentExperiences.map((exp, index) => {
        console.log(`Experience ${index} dates:`, { startDate: exp.startDate, endDate: exp.endDate });
        
        // Format dates for month input (YYYY-MM format)
        const formatDateForInput = (dateStr: string) => {
          if (!dateStr) return '';
          
          console.log('Formatting date:', dateStr);
          
          // Handle different date formats
          let date: Date;
          
          // Try parsing as ISO date first
          if (dateStr.includes('-') && dateStr.length >= 7) {
            // Already in YYYY-MM or YYYY-MM-DD format
            if (dateStr.length === 7) {
              console.log('Date already in YYYY-MM format:', dateStr);
              return dateStr; // Already YYYY-MM
            } else {
              const formatted = dateStr.substring(0, 7);
              console.log('Extracted YYYY-MM from YYYY-MM-DD:', formatted);
              return formatted; // Extract YYYY-MM from YYYY-MM-DD
            }
          }
          
          // Try parsing as "MMM YYYY" format (e.g., "Jul 2022")
          if (dateStr.includes(' ')) {
            const parts = dateStr.split(' ');
            if (parts.length === 2) {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthIndex = monthNames.indexOf(parts[0]);
              if (monthIndex !== -1) {
                const year = parts[1];
                const month = String(monthIndex + 1).padStart(2, '0');
                const formatted = `${year}-${month}`;
                console.log('Converted MMM YYYY to YYYY-MM:', dateStr, '->', formatted);
                return formatted;
              }
            }
          }
          
          // Try parsing as full date string
          try {
            date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const formatted = `${year}-${month}`;
              console.log('Parsed date string to YYYY-MM:', dateStr, '->', formatted);
              return formatted;
            }
          } catch (e) {
            console.warn('Could not parse date:', dateStr);
          }
          
          console.log('Could not format date, returning empty:', dateStr);
          return '';
        };

        const formatted = {
          ...exp,
          id: exp.id || `exp-${Date.now()}-${index}`,
          startDate: formatDateForInput(exp.startDate),
          endDate: formatDateForInput(exp.endDate),
          current: Boolean(exp.current) // Ensure current is properly converted to boolean
        };
        
        console.log(`Formatted experience ${index}:`, formatted);
        return formatted;
      });
      
      setExperiences(experiencesWithIds.length > 0 ? experiencesWithIds : [createNewExperience()]);
      setSelectedExperienceIndex(0);
      
      // Set combined content for the first experience
      if (experiencesWithIds.length > 0) {
        setCombinedContent(combineExperienceContent(experiencesWithIds[0]));
        setCurrentWorkToggle(experiencesWithIds[0]?.current || false);
      } else {
        setCombinedContent('');
        setCurrentWorkToggle(false);
      }
    }
  }, [isOpen, currentExperiences]);

  const createNewExperience = (): Experience => ({
    id: `exp-${Date.now()}`,
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    location: '',
    responsibilities: [],
    technologies: [],
    companyLogo: '',
    companyUrl: '',
    employmentType: '',
    achievements: [],
    keyMetrics: [],
    skills: [],
    is_optimized: false
  });

  // Function to combine all experience properties into a single text
  const combineExperienceContent = (exp: Experience): string => {
    let content = '';
    
    // Use optimized content if available
    const description = exp.is_optimized && exp.description_optimized 
      ? exp.description_optimized 
      : exp.description;
    
    const responsibilities = exp.is_optimized && exp.responsibilities_optimized 
      ? exp.responsibilities_optimized 
      : exp.responsibilities;
    
    const achievements = exp.is_optimized && exp.achievements_optimized 
      ? exp.achievements_optimized 
      : exp.achievements;

    if (description) {
      content += `DESCRIPTION:\n${description}\n\n`;
    }
    
    if (responsibilities && responsibilities.length > 0) {
      content += `RESPONSIBILITIES:\n${responsibilities.map(r => `• ${r}`).join('\n')}\n\n`;
    }
    
    if (achievements && achievements.length > 0) {
      content += `ACHIEVEMENTS:\n${achievements.map(a => `• ${a}`).join('\n')}\n\n`;
    }
    
    if (exp.technologies && exp.technologies.length > 0) {
      content += `TECHNOLOGIES:\n${exp.technologies.join(', ')}\n\n`;
    }
    
    if (exp.skills && exp.skills.length > 0) {
      content += `SKILLS:\n${exp.skills.join(', ')}\n\n`;
    }
    
    if (exp.keyMetrics && exp.keyMetrics.length > 0) {
      content += `KEY METRICS:\n${exp.keyMetrics.map(m => `• ${m.metric}: ${m.value}${m.description ? ` (${m.description})` : ''}`).join('\n')}\n\n`;
    }
    
    if (exp.employmentType) {
      content += `EMPLOYMENT TYPE:\n${exp.employmentType}\n\n`;
    }
    
    if (exp.companyUrl) {
      content += `COMPANY URL:\n${exp.companyUrl}\n\n`;
    }
    
    return content.trim();
  };

  // Function to parse combined content back into experience properties
  const parseCombinedContent = (content: string, baseExp: Experience): Experience => {
    const sections = content.split(/\n\n(?=[A-Z ]+:)/);
    const updatedExp = { ...baseExp };
    
    sections.forEach(section => {
      const lines = section.split('\n');
      const header = lines[0].replace(':', '').trim();
      const contentLines = lines.slice(1);
      
      switch (header) {
        case 'DESCRIPTION':
          const descContent = contentLines.join('\n').trim();
          if (updatedExp.is_optimized) {
            updatedExp.description_optimized = descContent;
          } else {
            updatedExp.description = descContent;
          }
          break;
        case 'RESPONSIBILITIES':
          const respContent = contentLines
            .map(line => line.replace(/^•\s*/, '').trim())
            .filter(line => line);
          if (updatedExp.is_optimized) {
            updatedExp.responsibilities_optimized = respContent;
          } else {
            updatedExp.responsibilities = respContent;
          }
          break;
        case 'ACHIEVEMENTS':
          const achContent = contentLines
            .map(line => line.replace(/^•\s*/, '').trim())
            .filter(line => line);
          if (updatedExp.is_optimized) {
            updatedExp.achievements_optimized = achContent;
          } else {
            updatedExp.achievements = achContent;
          }
          break;
        case 'TECHNOLOGIES':
          updatedExp.technologies = contentLines.join(' ')
            .split(',')
            .map(tech => tech.trim())
            .filter(tech => tech);
          break;
        case 'SKILLS':
          updatedExp.skills = contentLines.join(' ')
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill);
          break;
        case 'KEY METRICS':
          updatedExp.keyMetrics = contentLines
            .map(line => {
              const match = line.replace(/^•\s*/, '').match(/^([^:]+):\s*([^(]+)(?:\(([^)]+)\))?/);
              if (match) {
                return {
                  metric: match[1].trim(),
                  value: match[2].trim(),
                  description: match[3]?.trim() || ''
                };
              }
              return null;
            })
            .filter(metric => metric !== null) as { metric: string; value: string; description?: string; }[];
          break;
        case 'EMPLOYMENT TYPE':
          updatedExp.employmentType = contentLines.join(' ').trim();
          break;
        case 'COMPANY URL':
          updatedExp.companyUrl = contentLines.join(' ').trim();
          break;
      }
    });
    
    return updatedExp;
  };

  const handleExperienceChange = (field: keyof Experience, value: string | boolean) => {
    console.log(`Changing ${field} to:`, value);
    const updatedExperiences = [...experiences];
    updatedExperiences[selectedExperienceIndex] = {
      ...updatedExperiences[selectedExperienceIndex],
      [field]: value
    };
    console.log('Updated experience:', updatedExperiences[selectedExperienceIndex]);
    setExperiences(updatedExperiences);
    
    // Update toggle state for visual feedback
    if (field === 'current') {
      setCurrentWorkToggle(value as boolean);
    }
    
    // Update combined content when basic fields change
    if (['company', 'position', 'location', 'startDate', 'endDate', 'current'].includes(field as string)) {
      setCombinedContent(combineExperienceContent(updatedExperiences[selectedExperienceIndex]));
    }
  };

  const handleCombinedContentChange = (content: string) => {
    setCombinedContent(content);
    
    // Parse and update the experience
    const updatedExperiences = [...experiences];
    const currentExp = updatedExperiences[selectedExperienceIndex];
    updatedExperiences[selectedExperienceIndex] = parseCombinedContent(content, currentExp);
    setExperiences(updatedExperiences);
  };

  const handleExperienceSelect = (index: number) => {
    setSelectedExperienceIndex(index);
    setCombinedContent(combineExperienceContent(experiences[index]));
    setCurrentWorkToggle(experiences[index]?.current || false);
  };

  const addExperience = () => {
    const newExperience = createNewExperience();
    setExperiences([...experiences, newExperience]);
    setSelectedExperienceIndex(experiences.length);
    setCombinedContent(combineExperienceContent(newExperience));
  };

  const removeExperience = (index: number) => {
    if (experiences.length <= 1) return;
    
    const updatedExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(updatedExperiences);
    
    // Adjust selected index
    const newIndex = selectedExperienceIndex >= updatedExperiences.length 
      ? updatedExperiences.length - 1 
      : selectedExperienceIndex;
    setSelectedExperienceIndex(newIndex);
    setCombinedContent(combineExperienceContent(updatedExperiences[newIndex]));
  };

  const generateAIDescription = async () => {
    const currentExperience = experiences[selectedExperienceIndex];
    if (!currentExperience.company || !currentExperience.position) {
      alert('Please fill in company and position first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/ats/improve-section/${resumeData?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...unifiedAuthService.getAuthHeaders()
        },
        body: JSON.stringify({
          section: 'experience',
          content: `${currentExperience.position} at ${currentExperience.company}`,
          context: {
            company: currentExperience.company,
            position: currentExperience.position,
            location: currentExperience.location
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data?.improvedContent) {
        handleExperienceChange('description', result.data.improvedContent);
      } else {
        throw new Error(result.error || 'Failed to generate description');
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      alert('Failed to generate AI description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Filter out empty experiences with proper null checks
      const validExperiences = experiences.filter(exp => 
        exp.company?.trim() && exp.position?.trim()
      );
      
      // Convert dates back to the format expected by the backend
      const formattedExperiences = validExperiences.map(exp => {
        const formatDateForSave = (dateStr: string) => {
          if (!dateStr) return '';
          
          // If it's in YYYY-MM format, convert to a more readable format
          if (dateStr.match(/^\d{4}-\d{2}$/)) {
            const [year, month] = dateStr.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }
          
          return dateStr;
        };

        return {
          ...exp,
          startDate: formatDateForSave(exp.startDate),
          endDate: exp.current ? '' : formatDateForSave(exp.endDate)
        };
      });
      
      console.log('Saving experiences with formatted dates:', formattedExperiences);
      await onSave(formattedExperiences);
      onClose();
    } catch (error) {
      console.error('Error saving experiences:', error);
      alert('Failed to save experiences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedExperience = experiences[selectedExperienceIndex] || createNewExperience();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Professional Experience
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden px-6">
          {/* Left Panel - Experience List */}
          <div className="w-1/3 border-r border-gray-200 pr-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="font-medium text-gray-900">Experiences</h3>
              <Button
                onClick={addExperience}
                size="sm"
                className="brand-button"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
              {experiences.map((experience, index) => (
                <div
                  key={experience.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedExperienceIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleExperienceSelect(index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {experience.position || 'New Position'}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {experience.company || 'Company Name'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {experience.startDate} - {experience.current ? 'Present' : experience.endDate}
                      </p>
                    </div>
                    {experiences.length > 1 && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExperience(index);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Experience Details */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={selectedExperience.position}
                  onChange={(e) => handleExperienceChange('position', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={selectedExperience.company}
                  onChange={(e) => handleExperienceChange('company', e.target.value)}
                  placeholder="e.g., Tech Corp Inc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={selectedExperience.location || ''}
                onChange={(e) => handleExperienceChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Input
                id="employmentType"
                value={selectedExperience.employmentType || ''}
                onChange={(e) => handleExperienceChange('employmentType', e.target.value)}
                placeholder="e.g., Full-time, Part-time, Contract, Freelance, Internship"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="month"
                  value={selectedExperience.startDate}
                  onChange={(e) => handleExperienceChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="month"
                  value={selectedExperience.endDate}
                  onChange={(e) => handleExperienceChange('endDate', e.target.value)}
                  disabled={selectedExperience.current}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div
                onClick={() => {
                  const currentExp = experiences[selectedExperienceIndex];
                  const newValue = !currentWorkToggle;
                  console.log('Toggle clicked:', { current: currentWorkToggle, newValue });
                  handleExperienceChange('current', newValue);
                  if (newValue) {
                    handleExperienceChange('endDate', '');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors duration-200 ${
                  currentWorkToggle ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                style={{
                  backgroundColor: currentWorkToggle ? '#3b82f6' : '#e5e7eb'
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-lg"
                  style={{
                    transform: currentWorkToggle ? 'translateX(24px)' : 'translateX(4px)'
                  }}
                />
              </div>
              <label 
                onClick={() => {
                  const currentExp = experiences[selectedExperienceIndex];
                  const newValue = !currentWorkToggle;
                  console.log('Label clicked:', { current: currentWorkToggle, newValue });
                  handleExperienceChange('current', newValue);
                  if (newValue) {
                    handleExperienceChange('endDate', '');
                  }
                }}
                className="text-sm cursor-pointer select-none"
              >
                I currently work here {currentWorkToggle ? '(ON)' : '(OFF)'}
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="combinedContent">Complete Experience Details</Label>
                <Button
                  onClick={generateAIDescription}
                  disabled={isGenerating || !selectedExperience.company || !selectedExperience.position}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              <Textarea
                id="combinedContent"
                value={combinedContent}
                onChange={(e) => handleCombinedContentChange(e.target.value)}
                placeholder="DESCRIPTION:&#10;Describe your key responsibilities and role...&#10;&#10;RESPONSIBILITIES:&#10;• Managed team of 10 developers&#10;• Led architecture decisions&#10;• Implemented CI/CD pipelines&#10;&#10;ACHIEVEMENTS:&#10;• Increased team productivity by 40%&#10;• Reduced deployment time by 60%&#10;• Delivered 5 major features on time&#10;&#10;TECHNOLOGIES:&#10;React, Node.js, AWS, Docker&#10;&#10;SKILLS:&#10;Leadership, Project Management, Technical Architecture&#10;&#10;KEY METRICS:&#10;• Team Size: 10 developers&#10;• Projects Delivered: 15 (On-time delivery rate: 95%)&#10;• Performance Improvement: 40% increase in productivity&#10;&#10;EMPLOYMENT TYPE:&#10;Full-time&#10;&#10;COMPANY URL:&#10;https://company.com"
                rows={15}
                className="resize-none font-mono text-sm"
              />
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p>Edit all experience details in one place. Use the section headers (DESCRIPTION:, RESPONSIBILITIES:, etc.) to organize content.</p>
                <p>• Use bullet points for lists • Separate sections with blank lines • Include optimized content if available</p>
              </div>
            </div>
            </div>
            
            {/* Save Buttons - Fixed at bottom of right panel */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4 flex-shrink-0">
              <Button
                onClick={onClose}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="brand-button"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}