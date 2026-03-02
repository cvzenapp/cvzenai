import React from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

export interface HeaderProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  onDownload?: () => void;
  onContact?: () => void;
  onShare?: () => void;
  className?: string;
}

export interface TemplateAction {
  type: 'download' | 'contact' | 'shortlist' | 'upvote' | 'share';
  data?: any;
}

/**
 * Header component implementing Tier 1 of the three-tier hierarchy
 * Contains identity, contact information, and primary CTAs
 * Optimized for recruiter scanning patterns
 */
export const Header: React.FC<HeaderProps> = ({
  resume,
  templateConfig: _templateConfig,
  onDownload,
  onContact,
  onShare,
  className = ''
}) => {
  // Calculate total years of experience
  const calculateTotalExperience = (experiences: Resume['experiences']): number => {
    if (!experiences || experiences.length === 0) return 0;
    
    const totalMonths = experiences.reduce((acc, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return acc + Math.max(0, months);
    }, 0);
    
    return Math.floor(totalMonths / 12);
  };

  const totalExperience = calculateTotalExperience(resume.experiences);

  // Generate initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header 
      className={`header-component bg-background border-b border-border ${className}`}
      role="banner"
      aria-label="Candidate Header Information"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Identity Section - Spans 2 columns on desktop */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-muted overflow-hidden border-2 border-primary/20 shadow-sm">
                  {resume.personalInfo.avatar ? (
                    <img 
                      src={resume.personalInfo.avatar} 
                      alt={`${resume.personalInfo.name} profile picture`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-lg lg:text-xl">
                      {getInitials(resume.personalInfo.name)}
                    </div>
                  )}
                </div>
              </div>

              {/* Identity Information */}
              <div className="flex-1 min-w-0 space-y-3">
                
                {/* Name and Title */}
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground break-words leading-tight">
                    {resume.personalInfo.name}
                  </h1>
                  <h2 className="text-lg sm:text-xl lg:text-2xl text-primary font-medium break-words leading-tight">
                    {resume.personalInfo.title}
                  </h2>
                </div>
                
                {/* Location and Experience Level */}
                <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-muted-foreground">
                  {resume.personalInfo.location && (
                    <div className="flex items-center gap-2">
                      <svg 
                        className="w-4 h-4 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{resume.personalInfo.location}</span>
                    </div>
                  )}
                  
                  {totalExperience > 0 && (
                    <div className="flex items-center gap-2">
                      <svg 
                        className="w-4 h-4 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {totalExperience} year{totalExperience !== 1 ? 's' : ''} experience
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Information - All in one line for better PDF alignment */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base">
                  {resume.personalInfo.email && (
                    <a 
                      href={`mailto:${resume.personalInfo.email}`}
                      className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded whitespace-nowrap"
                      aria-label={`Email ${resume.personalInfo.name}`}
                    >
                      {resume.personalInfo.email}
                    </a>
                  )}
                  
                  {resume.personalInfo.phone && (
                    <a 
                      href={`tel:${resume.personalInfo.phone}`}
                      className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded whitespace-nowrap"
                      aria-label={`Call ${resume.personalInfo.name}`}
                    >
                      {resume.personalInfo.phone}
                    </a>
                  )}
                  
                  {resume.personalInfo.location && (
                    <span className="text-muted-foreground whitespace-nowrap">
                      {resume.personalInfo.location}
                    </span>
                  )}
                </div>

                {/* Professional Links - All in one line for better PDF alignment */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base">
                  {resume.personalInfo.website && (
                    <a 
                      href={resume.personalInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded whitespace-nowrap"
                      aria-label={`Visit ${resume.personalInfo.name}'s portfolio website`}
                    >
                      {resume.personalInfo.website}
                    </a>
                  )}
                  
                  {resume.personalInfo.linkedin && (
                    <a 
                      href={resume.personalInfo.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded whitespace-nowrap"
                      aria-label={`View ${resume.personalInfo.name}'s LinkedIn profile`}
                    >
                      {resume.personalInfo.linkedin}
                    </a>
                  )}
                  
                  {resume.personalInfo.github && (
                    <a 
                      href={resume.personalInfo.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded whitespace-nowrap"
                      aria-label={`View ${resume.personalInfo.name}'s GitHub profile`}
                    >
                      {resume.personalInfo.github}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Actions - Spans 1 column on desktop */}
          <div className="lg:col-span-1">
            <div className="flex flex-col gap-3 lg:gap-4">
              
              {/* Download Resume Button */}
              <button
                onClick={onDownload}
                className="btn-primary w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download Resume PDF"
                type="button"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg 
                    className="w-5 h-5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Resume</span>
                </div>
              </button>
              
              {/* Contact Me Button */}
              <button
                onClick={onContact}
                className="btn-secondary w-full py-3 px-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 focus:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Contact Candidate"
                type="button"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg 
                    className="w-5 h-5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Contact Me</span>
                </div>
              </button>

              {/* Share Profile Button (Optional) */}
              {onShare && (
                <button
                  onClick={onShare}
                  className="btn-tertiary w-full py-2 px-4 border border-border rounded-lg font-medium hover:bg-muted focus:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Share Profile"
                  type="button"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg 
                      className="w-4 h-4 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;