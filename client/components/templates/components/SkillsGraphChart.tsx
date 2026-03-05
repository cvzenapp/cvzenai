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
  title,
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

  // Separate core and non-core skills
  const coreSkills = skills.filter(skill => skill.isCore);
  const nonCoreSkills = skills.filter(skill => !skill.isCore);

  // Get proficiency value
  const getSkillLevel = (skill: Resume['skills'][0]) => {
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

  // Calculate total number of core skills
  const totalCoreSkills = coreSkills.length;

  // Chart dimensions - fully responsive to container width
  const chartHeight = 350;
  const chartPadding = { top: 20, right: 40, bottom: 100, left: 60 }; // Base padding for Y-axis labels
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  
  // Fixed buffer for consistent HFI-compliant spacing between Y-axis and bars
  const leftBuffer = 120; // Generous fixed spacing for optimal visibility regardless of bar count
  
  // Calculate available width for the chart content - use full container width
  const availableWidth = containerWidth - chartPadding.left - chartPadding.right - leftBuffer;
  
  // Distribute available width evenly across categories
  const categoryWidth = Math.max(100, availableWidth / Math.max(1, activeCategories.length));
  
  const chartWidth = containerWidth;
  
  // Calculate bar width based on number of skills in category and available space
  const getBarWidth = (skillCount: number) => {
    // Calculate available space per category
    const categorySpacing = 40; // Space between categories
    const availablePerCategory = categoryWidth - categorySpacing;
    
    // Distribute space among skills in the category
    const skillSpacing = 10;
    const totalSpacing = (skillCount - 1) * skillSpacing;
    const barWidth = (availablePerCategory - totalSpacing) / skillCount;
    
    // Ensure reasonable bar width limits
    return Math.max(25, Math.min(60, barWidth));
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
        className="rounded-lg p-2 hover:shadow-sm transition-shadow w-full"
           style={{ 
             backgroundColor: 'var(--template-background-color, #ffffff)',
           }}>
      {/* Chart Title */}
     

      {/* Legend - Core Skills Indicator */}
      {coreSkills.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm">
          <div 
            className="w-4 h-4 rounded" 
            style={{ backgroundColor: accentColor }}
          />
          <span style={{ 
            color: 'var(--template-text-color, #1f2937)',
            fontWeight: '500',
            fontFamily: 'var(--template-font-family)'
          }}>
            Core Skills
          </span>
        </div>
      )}

      {/* SVG Chart */}
      <svg 
        width="100%" 
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
      >
        {/* Grid lines (horizontal) */}
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={chartPadding.left + leftBuffer}
              y1={yScale(value)}
              x2={chartWidth - chartPadding.right}
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
                fontSize="13"
                fontWeight="600"
                fill="var(--template-text-color, #1f2937)"
                style={{ fontFamily: 'var(--template-font-family)' }}
              >
                {category}
              </text>

              {/* Skills in this category as vertical bars */}
              {categorySkills.map((skill, skillIndex) => {
                const level = getSkillLevel(skill);
                const barHeight = (level / 100) * plotHeight;
                const barX = startX + skillIndex * (barWidth + spacing);
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
                      fontSize="11"
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
                      fontSize="11"
                      fontWeight="600"
                      fill="white"
                      style={{ 
                        fontFamily: 'var(--template-font-family)',
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                      }}
                      transform={`rotate(180, ${barX + barWidth / 2}, ${barY + barHeight / 2})`}
                    >
                      {skill.name.length > 12 ? skill.name.substring(0, 10) + '...' : skill.name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={20}
          y={chartHeight / 2}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="var(--template-text-muted, #6b7280)"
          transform={`rotate(-90, 20, ${chartHeight / 2})`}
        >
          Proficiency Level
        </text>

        {/* X-axis label */}
        <text
          x={chartWidth / 2}
          y={chartHeight - 10}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="var(--template-text-muted, #6b7280)"
        >
          Skill Categories
        </text>
      </svg>

      {/* Non-Core Skills as Chips/Badges */}
      {nonCoreSkills.length > 0 && (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--template-border-color, #e5e7eb)' }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold flex items-center gap-2"
                style={{ 
                  color: 'var(--template-secondary-color, #64748b)',
                  fontFamily: 'var(--template-font-family)'
                }}>
              <span className="w-1 h-5 rounded-full" 
                    style={{ backgroundColor: 'var(--template-secondary-color, #64748b)' }}></span>
              Additional Skills
            </h4>
            
            {/* View More Button - Moved to the right */}
            {nonCoreSkills.length > 5 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 active:scale-95"
                style={{ 
                  backgroundColor: 'var(--template-primary-color, #3b82f6)',
                  color: 'white',
                  fontFamily: 'var(--template-font-family)'
                }}
              >
                {showAllSkills ? (
                  <>
                    <svg 
                      className="w-4 h-4 transition-transform duration-300" 
                      style={{ transform: showAllSkills ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    View Less
                  </>
                ) : (
                  <>
                    <svg 
                      className="w-4 h-4 transition-transform duration-300 animate-bounce-subtle" 
                      style={{ transform: showAllSkills ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    View More ({nonCoreSkills.length - 5})
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="relative">
            <div 
              className="flex flex-wrap gap-2 transition-all duration-500 ease-in-out"
              style={{
                maxHeight: showAllSkills ? '1000px' : '52px',
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
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:shadow-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1.5px solid',
                        borderColor: 'var(--template-secondary-color, #94a3b8)',
                        color: 'var(--template-text-color, #1f2937)',
                        fontFamily: 'var(--template-font-family)'
                      }}
                      title={`${skill.name}: ${level}%`}
                    >
                      {skill.name}
                      <span 
                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
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
            {!showAllSkills && nonCoreSkills.length > 5 && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
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
