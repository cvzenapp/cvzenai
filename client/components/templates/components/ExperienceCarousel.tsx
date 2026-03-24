import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, Calendar, MapPin, Building2 } from 'lucide-react';
import { Resume } from '@shared/api';
import { formatDateRange } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
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
                {/* {showImproveButtons && improveSection && (
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
                )} */}
              </div>
              <p className="experience-company">
                <Building2 size={18} />
                {exp.company}
              </p>
            </div>
            <span className="experience-dates">
              <Calendar size={16} />
              {formatDateRange(exp.startDate, exp.endDate)}
            </span>
          </div>
          
          {exp.location && (
            <p className="experience-location">
              <MapPin size={16} />
              {exp.location}
            </p>
          )}
          
          {exp.description && (
            <div className="experience-description">
              <ReactMarkdown>
                {exp.is_optimized && exp.description_optimized 
                  ? exp.description_optimized 
                  : exp.description}
              </ReactMarkdown>
            </div>
          )}

          {/* Responsibilities Section */}
          {((exp.is_optimized && exp.responsibilities_optimized && exp.responsibilities_optimized.length > 0) || 
            (exp.responsibilities && exp.responsibilities.length > 0)) && (
            <div className="experience-responsibilities">
              <h4 className="responsibilities-title">Key Responsibilities</h4>
              <ul className="responsibilities-list">
                {(exp.is_optimized && exp.responsibilities_optimized 
                  ? exp.responsibilities_optimized 
                  : exp.responsibilities)?.map((responsibility, index) => (
                  <li key={index} className="responsibility-item">
                    {responsibility}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements Section */}
          {((exp.is_optimized && exp.achievements_optimized && exp.achievements_optimized.length > 0) || 
            (exp.achievements && exp.achievements.length > 0)) && (
            <div className="experience-achievements">
              <h4 className="achievements-title">Key Achievements</h4>
              <ul className="achievements-list">
                {(exp.is_optimized && exp.achievements_optimized 
                  ? exp.achievements_optimized 
                  : exp.achievements)?.map((achievement, index) => (
                  <li key={index} className="achievement-item">
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Metrics Section */}
          {exp.keyMetrics && exp.keyMetrics.length > 0 && (
            <div className="experience-metrics">
              <h4 className="metrics-title">Key Metrics</h4>
              <div className="metrics-grid">
                {exp.keyMetrics.map((metric, index) => (
                  <div key={index} className="metric-item">
                    <span className="metric-value">{metric.value}</span>
                    <span className="metric-label">{metric.metric}</span>
                    {metric.description && (
                      <span className="metric-description">{metric.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employment Type */}
          {exp.employmentType && (
            <div className="employment-type">
              <span className="employment-type-badge">
                {exp.employmentType}
              </span>
            </div>
          )}

          {/* Technologies Section */}
          {exp.technologies && exp.technologies.length > 0 && (
            <div className="experience-technologies">
              <h4 className="technologies-title">Technologies Used</h4>
              <div className="technologies-tags">
                {exp.technologies.map((tech, techIndex) => (
                  <span key={techIndex} className="technology-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {exp.skills && exp.skills.length > 0 && (
            <div className="experience-skills">
              <h4 className="skills-title">Skills Applied</h4>
              <div className="skills-tags">
                {exp.skills.map((skill, skillIndex) => (
                  <span key={skillIndex} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company Links */}
          {(exp.companyUrl || exp.companyLogo) && (
            <div className="company-info">
              {exp.companyUrl && (
                <a 
                  href={exp.companyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="company-link"
                >
                  Visit Company Website
                </a>
              )}
              {exp.companyLogo && (
                <img 
                  src={exp.companyLogo} 
                  alt={`${exp.company} logo`}
                  className="company-logo"
                />
              )}
            </div>
          )}

          {/* Optimization Status */}
          {exp.is_optimized && (
            <div className="optimization-status">
              <span className="optimization-badge">✨ Optimized</span>
            </div>
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
                  {/* {showImproveButtons && improveSection && (
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
                  )} */}
                </div>
                <p className="experience-company">
                  <Building2 size={18} />
                  {currentExp.company}
                </p>
              </div>
              <span className="experience-dates">
                <Calendar size={16} />
                {formatDateRange(currentExp.startDate, currentExp.endDate)}
              </span>
            </div>
            
            {currentExp.location && (
              <p className="experience-location">
                <MapPin size={16} />
                {currentExp.location}
              </p>
            )}
            
            {currentExp.description && (
              <div className="experience-description">
                <ReactMarkdown>
                  {currentExp.is_optimized && currentExp.description_optimized 
                    ? currentExp.description_optimized 
                    : currentExp.description}
                </ReactMarkdown>
              </div>
            )}

            {/* Responsibilities Section */}
            {((currentExp.is_optimized && currentExp.responsibilities_optimized && currentExp.responsibilities_optimized.length > 0) || 
              (currentExp.responsibilities && currentExp.responsibilities.length > 0)) && (
              <div className="experience-responsibilities">
                <h4 className="responsibilities-title">Key Responsibilities</h4>
                <ul className="responsibilities-list">
                  {(currentExp.is_optimized && currentExp.responsibilities_optimized 
                    ? currentExp.responsibilities_optimized 
                    : currentExp.responsibilities)?.map((responsibility, index) => (
                    <li key={index} className="responsibility-item">
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Achievements Section */}
            {((currentExp.is_optimized && currentExp.achievements_optimized && currentExp.achievements_optimized.length > 0) || 
              (currentExp.achievements && currentExp.achievements.length > 0)) && (
              <div className="experience-achievements">
                <h4 className="achievements-title">Key Achievements</h4>
                <ul className="achievements-list">
                  {(currentExp.is_optimized && currentExp.achievements_optimized 
                    ? currentExp.achievements_optimized 
                    : currentExp.achievements)?.map((achievement, index) => (
                    <li key={index} className="achievement-item">
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Metrics Section */}
            {currentExp.keyMetrics && currentExp.keyMetrics.length > 0 && (
              <div className="experience-metrics">
                <h4 className="metrics-title">Key Metrics</h4>
                <div className="metrics-grid">
                  {currentExp.keyMetrics.map((metric, index) => (
                    <div key={index} className="metric-item">
                      <span className="metric-value">{metric.value}</span>
                      <span className="metric-label">{metric.metric}</span>
                      {metric.description && (
                        <span className="metric-description">{metric.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employment Type */}
            {currentExp.employmentType && (
              <div className="employment-type">
                <span className="employment-type-badge">
                  {currentExp.employmentType}
                </span>
              </div>
            )}

            {/* Technologies Section */}
            {currentExp.technologies && currentExp.technologies.length > 0 && (
              <div className="experience-technologies">
                <h4 className="technologies-title">Technologies Used</h4>
                <div className="technologies-tags">
                  {currentExp.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className="technology-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            {currentExp.skills && currentExp.skills.length > 0 && (
              <div className="experience-skills">
                <h4 className="skills-title">Skills Applied</h4>
                <div className="skills-tags">
                  {currentExp.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company Links */}
            {(currentExp.companyUrl || currentExp.companyLogo) && (
              <div className="company-info">
                {currentExp.companyUrl && (
                  <a 
                    href={currentExp.companyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="company-link"
                  >
                    Visit Company Website
                  </a>
                )}
                {currentExp.companyLogo && (
                  <img 
                    src={currentExp.companyLogo} 
                    alt={`${currentExp.company} logo`}
                    className="company-logo"
                  />
                )}
              </div>
            )}

            {/* Optimization Status */}
            {currentExp.is_optimized && (
              <div className="optimization-status">
                <span className="optimization-badge">✨ Optimized</span>
              </div>
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
