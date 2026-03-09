import React, { useState } from 'react';
import { Resume } from '@shared/api';
import { normalizeCategory, SKILL_CATEGORIES } from '@shared/skillCategories';

interface SkillsGraphChartProps {
  skills: Resume['skills'];
  title: string;
  primaryColor?: string;
  accentColor?: string;
}

export const SkillsGraphChart: React.FC<SkillsGraphChartProps> = ({
  skills,
  primaryColor = 'var(--template-primary-color, #2563eb)',
  accentColor = 'var(--template-accent-color, #3b82f6)',
}) => {
  const [containerWidth, setContainerWidth] = React.useState(1200);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Measure container width on mount and resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!skills || skills.length === 0) return null;

  // Handle both string array (legacy) and skill object array formats
  const normalizedSkills = skills.map(skill => {
    if (typeof skill === 'string') {
      return { id: skill, name: skill, proficiency: 70, category: 'Other', isCore: false, level: 70 };
    }
    return skill;
  });

  // Separate core and non-core skills
  const coreSkills = normalizedSkills.filter(skill => skill.isCore);
  const nonCoreSkills = normalizedSkills.filter(skill => !skill.isCore);

  // Get proficiency value
  const getSkillLevel = (skill: Resume['skills'][0] | { id: string; name: string; proficiency: number; category: string; isCore: boolean; level: number }) => {
    const proficiency = skill.proficiency || skill.level;
    return proficiency && proficiency > 0 ? proficiency : 70;
  };

  // Group ONLY core skills by category for the graph
  const skillsByCategory = coreSkills.reduce((acc, skill) => {
    const category = skill.category ? normalizeCategory(skill.category) : 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Resume['skills']>);

  // Get categories that have skills
  const activeCategories = Object.keys(skillsByCategory).sort((a, b) => {
    const indexA = SKILL_CATEGORIES.indexOf(a as any);
    const indexB = SKILL_CATEGORIES.indexOf(b as any);
    return indexA - indexB;
  });

  // Chart dimensions - fully responsive to container width
  const chartHeight = containerWidth < 768 ? 200 : 320; // Much smaller height on mobile
  const chartPadding = { 
    top: 15, 
    right: containerWidth < 768 ? 15 : 30, // Less padding on mobile
    bottom: containerWidth < 768 ? 60 : 80, // Less bottom padding on mobile
    left: containerWidth < 768 ? 30 : 50 // Less left padding on mobile
  };
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  
  // Responsive buffer for Y-axis spacing
  const leftBuffer = containerWidth < 768 ? 40 : 80; // Smaller buffer on mobile
  
  // Calculate available width for the chart content - use full container width
  const availableWidth = containerWidth - chartPadding.left - chartPadding.right - leftBuffer;
  
  // Distribute available width evenly across categories
  const categoryWidth = Math.max(containerWidth < 768 ? 100 : 120, availableWidth / Math.max(1, activeCategories.length));
  
  const chartWidth = containerWidth;
  
  // Calculate bar width based on number of skills in category and available space
  const getBarWidth = (skillCount: number) => {
    // Calculate available space per category
    const categorySpacing = containerWidth < 768 ? 30 : 40; // Better spacing on mobile
    const availablePerCategory = categoryWidth - categorySpacing;
    
    // Distribute space among skills in the category
    const skillSpacing = containerWidth < 768 ? 8 : 12; // Better spacing on mobile
    const totalSpacing = (skillCount - 1) * skillSpacing;
    const barWidth = (availablePerCategory - totalSpacing) / skillCount;
    
    // Ensure reasonable bar width limits - better sizing on mobile
    const minWidth = containerWidth < 768 ? 25 : 30;
    const maxWidth = containerWidth < 768 ? 50 : 65;
    return Math.max(minWidth, Math.min(maxWidth, barWidth));
  };

  // Y-axis scale (0-100%)
  const yScale = (value: number) => {
    return chartPadding.top + plotHeight - (value / 100) * plotHeight;
  };

  // X-axis position for each category
  const xScale = (index: number) => {
    return chartPadding.left + leftBuffer + (index * categoryWidth) + (categoryWidth / 2);
  };

  return (
    <>
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s ease-in-out infinite;
        }
      `}</style>
      <div 
        ref={containerRef}
        className="rounded-lg p-2 sm:p-4 hover:shadow-sm transition-shadow w-full"
           style={{ 
             backgroundColor: 'var(--template-background-color, #ffffff)',
           }}>
      {/* Chart Title - Only show on desktop */}
      {containerWidth >= 768 && (
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-1 h-5 rounded-full" 
            style={{ backgroundColor: primaryColor }}
          />
          <h3 
            className="text-base font-bold" 
            style={{ 
              color: primaryColor,
              fontFamily: 'var(--template-font-family)',
              fontWeight: 'var(--template-heading-weight)'
            }}
          >
            Core Skills
          </h3>
        </div>
      )}

      {/* Legend - Core Skills Indicator */}
      {coreSkills.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm">
          <div 
            className="w-3 h-3 sm:w-4 sm:h-4 rounded" 
            style={{ backgroundColor: accentColor }}
          />
          <span style={{ 
            color: 'var(--template-text-color, #1f2937)',
            fontWeight: '500',
            fontFamily: 'var(--template-font-family)'
          }}>
            {containerWidth < 768 ? "Core Skills" : "Core Skills"}
          </span>
        </div>
      )}

      {/* SVG Chart */}
      <div className={`${containerWidth < 768 ? 'overflow-x-auto' : ''}`}>
        <svg 
          width={containerWidth < 768 ? Math.max(chartWidth, activeCategories.length * 140) : "100%"}
          height={chartHeight}
          viewBox={`0 0 ${containerWidth < 768 ? Math.max(chartWidth, activeCategories.length * 140) : chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minWidth: containerWidth < 768 ? `${activeCategories.length * 140}px` : 'auto' }}
        >
        {/* Grid lines (horizontal) */}
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={chartPadding.left + leftBuffer}
              y1={yScale(value)}
              x2={containerWidth < 768 ? Math.max(chartWidth, activeCategories.length * 140) - chartPadding.right : chartWidth - chartPadding.right}
              y2={yScale(value)}
              stroke="var(--template-border-color, #e5e7eb)"
              strokeWidth="1"
              strokeDasharray={value === 0 ? "0" : "4 4"}
            />
            <text
              x={chartPadding.left + 10}
              y={yScale(value)}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize="12"
              fill="var(--template-text-muted, #9ca3af)"
            >
              {value}%
            </text>
          </g>
        ))}

        {/* Category sections and skills */}
        {activeCategories.map((category, categoryIndex) => {
          const categorySkills = skillsByCategory[category];
          const xPos = xScale(categoryIndex);
          const barWidth = getBarWidth(categorySkills.length);
          const spacing = 10; // Consistent spacing between bars
          const totalWidth = categorySkills.length * barWidth + (categorySkills.length - 1) * spacing;
          const startX = xPos - totalWidth / 2;
          
          return (
            <g key={category}>
              {/* Category label */}
              <text
                x={xPos}
                y={chartHeight - chartPadding.bottom + 20}
                textAnchor="middle"
                fontSize={containerWidth < 768 ? "11" : "13"}
                fontWeight="600"
                fill="var(--template-text-color, #1f2937)"
                style={{ fontFamily: 'var(--template-font-family)' }}
              >
                {containerWidth < 768 && category.length > 8 ? category.substring(0, 6) + '...' : category}
              </text>

              {/* Skills in this category as vertical bars */}
              {categorySkills.map((skill, skillIndex) => {
                const level = getSkillLevel(skill);
                const barHeight = (level / 100) * plotHeight;
                const barX = startX + skillIndex * (barWidth + 12); // Better spacing
                const barY = chartPadding.top + plotHeight - barHeight;

                return (
                  <g key={skill.id || skillIndex}>
                    {/* Vertical Bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={`url(#gradient-${categoryIndex}-${skillIndex})`}
                      className="transition-all hover:opacity-90"
                    >
                      <title>{`${skill.name}: ${level}% (Core)`}</title>
                    </rect>

                    {/* Gradient definition */}
                    <defs>
                      <linearGradient
                        id={`gradient-${categoryIndex}-${skillIndex}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.9" />
                      </linearGradient>
                    </defs>

                    {/* Percentage on top of bar */}
                    <text
                      x={barX + barWidth / 2}
                      y={barY - 5}
                      textAnchor="middle"
                      fontSize={containerWidth < 768 ? "10" : "11"}
                      fontWeight="700"
                      fill={accentColor}
                      style={{ fontFamily: 'var(--template-font-family)' }}
                    >
                      {level}%
                    </text>

                    {/* Skill name on the bar (vertical text) */}
                    <text
                      x={barX + barWidth / 2}
                      y={barY + barHeight / 2}
                      textAnchor="middle"
                      fontSize={containerWidth < 768 ? "8" : "10"}
                      fontWeight="600"
                      fill="white"
                      style={{ 
                        fontFamily: 'var(--template-font-family)',
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                      }}
                      transform={`rotate(180, ${barX + barWidth / 2}, ${barY + barHeight / 2})`}
                    >
                      {containerWidth < 768 && skill.name.length > 6 
                        ? skill.name.substring(0, 4) + '.' 
                        : skill.name.length > 10 
                          ? skill.name.substring(0, 8) + '.' 
                          : skill.name
                      }
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={15}
          y={chartHeight / 2}
          textAnchor="middle"
          fontSize={containerWidth < 768 ? "10" : "12"}
          fontWeight="600"
          fill="var(--template-text-muted, #6b7280)"
          transform={`rotate(-90, 15, ${chartHeight / 2})`}
        >
          {containerWidth < 768 ? "Level" : "Proficiency Level"}
        </text>

        {/* X-axis label */}
        <text
          x={containerWidth < 768 ? Math.max(chartWidth, activeCategories.length * 140) / 2 : chartWidth / 2}
          y={chartHeight - 10}
          textAnchor="middle"
          fontSize={containerWidth < 768 ? "10" : "12"}
          fontWeight="600"
          fill="var(--template-text-muted, #6b7280)"
        >
          {containerWidth < 768 ? "Skills" : "Skill Categories"}
        </text>
      </svg>

      {/* Mobile scroll indicator */}
      {containerWidth < 768 && activeCategories.length > 2 && (
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-4m0 0l4-4m-4 4v12" />
            </svg>
            <span>Scroll to see all categories</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      )}
      </div>

      {/* Non-Core Skills as Chips/Badges */}
      {nonCoreSkills.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--template-border-color, #e5e7eb)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2"
                style={{ 
                  color: 'var(--template-secondary-color, #64748b)',
                  fontFamily: 'var(--template-font-family)'
                }}>
              <span className="w-1 h-4 sm:h-5 rounded-full" 
                    style={{ backgroundColor: 'var(--template-secondary-color, #64748b)' }}></span>
              {containerWidth < 768 ? "Other Skills" : "Additional Skills"}
            </h4>
            
            {/* View More Button - Moved to the right */}
            {nonCoreSkills.length > (containerWidth < 768 ? 3 : 5) && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center gap-1 sm:gap-2 active:scale-95"
                style={{ 
                  backgroundColor: 'var(--template-primary-color, #3b82f6)',
                  color: 'white',
                  fontFamily: 'var(--template-font-family)'
                }}
              >
                {showAllSkills ? (
                  <>
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300" 
                      style={{ transform: showAllSkills ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {containerWidth < 768 ? "Less" : "View Less"}
                  </>
                ) : (
                  <>
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 animate-bounce-subtle" 
                      style={{ transform: showAllSkills ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {containerWidth < 768 ? `+${nonCoreSkills.length - 3}` : `View More (${nonCoreSkills.length - 5})`}
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="relative">
            <div 
              className="flex flex-wrap gap-1 sm:gap-2 transition-all duration-500 ease-in-out"
              style={{
                maxHeight: showAllSkills ? '1000px' : containerWidth < 768 ? '40px' : '52px',
                overflow: 'hidden'
              }}
            >
              {nonCoreSkills
                .sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0))
                .map((skill, index) => {
                  const level = getSkillLevel(skill);
                  return (
                    <span 
                      key={skill.id || index}
                      className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all hover:shadow-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1.5px solid',
                        borderColor: 'var(--template-secondary-color, #94a3b8)',
                        color: 'var(--template-text-color, #1f2937)',
                        fontFamily: 'var(--template-font-family)'
                      }}
                      title={`${skill.name}: ${level}%`}
                    >
                      {containerWidth < 768 && skill.name.length > 8 
                        ? skill.name.substring(0, 6) + '...'
                        : skill.name
                      }
                      <span 
                        className="text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--template-secondary-color, #94a3b8)',
                          color: 'white'
                        }}
                      >
                        {level}%
                      </span>
                    </span>
                  );
                })}
            </div>
            
            {/* Gradient fade effect when collapsed */}
            {!showAllSkills && nonCoreSkills.length > (containerWidth < 768 ? 3 : 5) && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, transparent, white)'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty state for no core skills */}
      {coreSkills.length === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--template-text-muted, #9ca3af)' }}>
          <p>No core skills marked. Mark skills as "Core" to display them in the graph.</p>
        </div>
      )}
    </div>
    </>
  );
};

export default SkillsGraphChart;
