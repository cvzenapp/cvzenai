import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, Calendar, MapPin, Building2 } from 'lucide-react';
import { Resume } from '@shared/api';
import './ExperienceCarousel.css';

interface ExperienceCarouselProps {
  experiences: Resume['experiences'];
  className?: string;
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

export const ExperienceCarousel: React.FC<ExperienceCarouselProps> = ({
  experiences,
  className = '',
  improveSection,
  isImprovingSection,
  showImproveButtons = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!experiences || experiences.length === 0) {
    return null;
  }

  // Show all if only one experience item
  if (experiences.length === 1) {
    const exp = experiences[0];
    const isImproving = isImprovingSection?.('experience', 0);
    return (
      <div className={`experience-single ${className}`}>
        <div className={`experience-card relative ${isImproving ? 'animate-pulse' : ''}`}>
          {isImproving && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none rounded-xl"></div>
          )}
          <div className="experience-card-header">
            <div className="experience-title-group">
              <div className="flex items-center justify-between gap-2 w-full">
                <h3 className="experience-position flex items-center gap-2">
                  <Briefcase size={20} />
                  {exp.position}
                </h3>
                {/* Improve Button */}
                {showImproveButtons && improveSection && (
                  <button
                    onClick={() => improveSection('experience', exp, 0)}
                    disabled={isImproving}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    style={{
                      background: `linear-gradient(to right, var(--template-primary-color, #3b82f6), var(--template-accent-color, #8b5cf6))`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <svg className={`w-3 h-3 ${isImproving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {isImproving ? 'Improving...' : 'Improve'}
                  </button>
                )}
              </div>
              <p className="experience-company">
                <Building2 size={18} />
                {exp.company}
              </p>
            </div>
            <span className="experience-dates">
              <Calendar size={16} />
              {exp.startDate} - {exp.endDate || 'Present'}
            </span>
          </div>
          
          {exp.location && (
            <p className="experience-location">
              <MapPin size={16} />
              {exp.location}
            </p>
          )}
          
          {exp.description && (
            <p className="experience-description">{exp.description}</p>
          )}
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? experiences.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === experiences.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const currentExp = experiences[currentIndex];
  const isImproving = isImprovingSection?.('experience', currentIndex);

  return (
    <div className={`experience-carousel ${className}`}>
      {/* Carousel Container */}
      <div className="carousel-container">
        {/* Experience Card with Navigation Inside */}
        <div className="carousel-content">
          <div className={`experience-card relative ${isImproving ? 'animate-pulse' : ''}`} key={currentIndex}>
            {isImproving && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none rounded-xl"></div>
            )}
            {/* Previous Arrow - Inside Card */}
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={handlePrevious}
              aria-label="Previous experience"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Card Content */}
            <div className="experience-card-header">
              <div className="experience-title-group">
                <div className="flex items-center justify-between gap-2 w-full">
                  <h3 className="experience-position flex items-center gap-2">
                    <Briefcase size={20} />
                    {currentExp.position}
                  </h3>
                  {/* Improve Button */}
                  {showImproveButtons && improveSection && (
                    <button
                      onClick={() => improveSection('experience', currentExp, currentIndex)}
                      disabled={isImproving}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      style={{
                        background: `linear-gradient(to right, var(--template-primary-color, #3b82f6), var(--template-accent-color, #8b5cf6))`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      <svg className={`w-3 h-3 ${isImproving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      {isImproving ? 'Improving...' : 'Improve'}
                    </button>
                  )}
                </div>
                <p className="experience-company">
                  <Building2 size={18} />
                  {currentExp.company}
                </p>
              </div>
              <span className="experience-dates">
                <Calendar size={16} />
                {currentExp.startDate} - {currentExp.endDate || 'Present'}
              </span>
            </div>
            
            {currentExp.location && (
              <p className="experience-location">
                <MapPin size={16} />
                {currentExp.location}
              </p>
            )}
            
            {currentExp.description && (
              <p className="experience-description">{currentExp.description}</p>
            )}

            {/* Next Arrow - Inside Card */}
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={handleNext}
              aria-label="Next experience"
            >
              <ChevronRight size={24} />
            </button>

            {/* Bottom Navigation Dots - Inside Card */}
            <div className="carousel-dots">
              {experiences.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Go to experience ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter - Inside Card */}
            <div className="carousel-counter">
              {currentIndex + 1} / {experiences.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
