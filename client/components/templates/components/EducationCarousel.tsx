import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Calendar, Award, BookOpen, Star } from 'lucide-react';
import { Resume } from '@shared/api';
import './EducationCarousel.css';

interface EducationCarouselProps {
  education: Resume['education'];
  className?: string;
}

export const EducationCarousel: React.FC<EducationCarouselProps> = ({
  education,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper function to determine if GPA is a percentage
  const isPercentage = (gpa: string): boolean => {
    if (gpa.includes('%')) return true;
    const numericValue = parseFloat(gpa);
    // If value is greater than 10, it's likely a percentage
    return !isNaN(numericValue) && numericValue > 10;
  };

  if (!education || education.length === 0) {
    return null;
  }

  // Show all if only one education item
  if (education.length === 1) {
    const edu = education[0];
    return (
      <div className={`education-single ${className}`}>
        <div className="education-card">
          <div className="education-card-header">
            <h3 className="education-institution">
              <GraduationCap size={20} />
              {edu.institution}
            </h3>
            <span className="education-dates">
              <Calendar size={16} />
              {edu.startDate} - {edu.endDate || 'Present'}
            </span>
          </div>
          {/* Degree, Field, and GPA in a row */}
          <div className="education-details-row">
            <div className="education-text-content">
              <p className="education-degree">
                <Award size={18} />
                {edu.degree}
              </p>
              {edu.field && (
                <p className="education-field">
                  <BookOpen size={16} />
                  {edu.field}
                </p>
              )}
            </div>
            {edu.gpa && (
              <div className="education-gpa">
                <span className="gpa-label">{isPercentage(edu.gpa) ? '%' : 'GPA'}</span>
                <span className="gpa-value">{edu.gpa}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? education.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === education.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const currentEdu = education[currentIndex];

  return (
    <div className={`education-carousel ${className}`}>
      {/* Carousel Container */}
      <div className="carousel-container">
        {/* Education Card with Navigation Inside */}
        <div className="carousel-content">
          <div className="education-card" key={currentIndex}>
            {/* Previous Arrow - Inside Card */}
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={handlePrevious}
              aria-label="Previous education"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Card Content */}
            <div className="education-card-header">
              <h3 className="education-institution">
                <GraduationCap size={20} />
                {currentEdu.institution}
              </h3>
              <span className="education-dates">
                <Calendar size={16} />
                {currentEdu.startDate} - {currentEdu.endDate || 'Present'}
              </span>
            </div>
            {/* Degree, Field, and GPA in a row */}
            <div className="education-details-row">
              <div className="education-text-content">
                <p className="education-degree">
                  <Award size={18} />
                  {currentEdu.degree}
                </p>
                {currentEdu.field && (
                  <p className="education-field">
                    <BookOpen size={16} />
                    {currentEdu.field}
                  </p>
                )}
              </div>
              {currentEdu.gpa && (
                <div className="education-gpa">
                  <span className="gpa-label">{isPercentage(currentEdu.gpa) ? '%' : 'GPA'}</span>
                  <span className="gpa-value">{currentEdu.gpa}</span>
                </div>
              )}
            </div>

            {/* Next Arrow - Inside Card */}
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={handleNext}
              aria-label="Next education"
            >
              <ChevronRight size={24} />
            </button>

            {/* Bottom Navigation Dots - Inside Card */}
            <div className="carousel-dots">
              {education.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Go to education ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter - Inside Card */}
            <div className="carousel-counter">
              {currentIndex + 1} / {education.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
