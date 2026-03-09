import React from 'react';
import { Resume } from '@shared/api';

interface SkillsBarChartProps {
  skills: Resume['skills'];
  title: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
}

export const SkillsBarChart: React.FC<SkillsBarChartProps> = ({
  skills,
  title,
  primaryColor = 'var(--template-primary-color, #2563eb)',
  accentColor = 'var(--template-accent-color, #3b82f6)',
  backgroundColor
}) => {
  const [containerWidth, setContainerWidth] = React.useState(1200);
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

  // Get the proficiency value (support both 'level' and 'proficiency' fields)
  // Updated: Fixed to properly handle 0 values and prefer proficiency
  const getSkillLevel = (skill: Resume['skills'][0] | string) => {
    // Handle string skills (legacy format)
    if (typeof skill === 'string') {
      return 70; // Default proficiency for string skills
    }
    
    // Prefer proficiency over level, fallback to 70 if both are missing or 0
    const proficiency = skill.proficiency || skill.level;
    return proficiency && proficiency > 0 ? proficiency : 70;
  };

  // Handle both string array (legacy) and skill object array formats
  const normalizedSkills = skills.map(skill => {
    if (typeof skill === 'string') {
      return { id: skill, name: skill, proficiency: 70, category: 'Other', isCore: false, level: 70 };
    }
    return skill;
  });

  // Sort skills by proficiency (highest first)
  const sortedSkills = [...normalizedSkills].sort((a, b) => getSkillLevel(b) - getSkillLevel(a));

  return (
    <div 
      ref={containerRef}
      className="rounded-lg p-2 sm:p-4 hover:shadow-sm transition-shadow"
         style={{ 
           backgroundColor: 'var(--template-background-color, #ffffff)',
           border: '1px solid var(--template-border-color, #e5e7eb)'
         }}>
      {/* Chart Title */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div 
          className="w-1 h-4 sm:h-5 rounded-full" 
          style={{ backgroundColor: primaryColor }}
        />
        <h3 
          className="text-sm sm:text-base font-bold" 
          style={{ 
            color: primaryColor,
            fontFamily: 'var(--template-font-family)',
            fontWeight: 'var(--template-heading-weight)'
          }}
        >
          {containerWidth < 768 && title.length > 10 ? title.substring(0, 8) + '...' : title}
        </h3>
      </div>
      
      {/* Chart Container with Y-axis */}
      <div className="flex gap-1 sm:gap-3">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between text-xs py-1 flex-shrink-0" 
             style={{ height: containerWidth < 768 ? '120px' : '180px', color: 'var(--template-text-muted, #9ca3af)' }}>
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
        
        {/* Chart Area with horizontal scroll on mobile */}
        <div className="flex-1 overflow-hidden">
          <div className={`${containerWidth < 768 ? 'overflow-x-auto' : ''}`}>
            {/* Grid Lines */}
            <div className="relative" style={{ 
              height: containerWidth < 768 ? '120px' : '180px',
              minWidth: containerWidth < 768 ? `${sortedSkills.length * 55}px` : 'auto'
            }}>
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="border-t" 
                       style={{ borderColor: 'var(--template-border-color, #f1f5f9)' }} />
                ))}
              </div>
              
              {/* Bars */}
              <div className="relative h-full flex items-end gap-2 sm:gap-2 px-2 sm:px-2" 
                   style={{ 
                     minWidth: containerWidth < 768 ? `${sortedSkills.length * 70}px` : 'auto',
                     justifyContent: containerWidth < 768 ? 'flex-start' : 'space-around'
                   }}>
                {sortedSkills.map((skill, index) => {
                  const skillLevel = getSkillLevel(skill);
                  const barHeight = containerWidth < 768 ? skillLevel * 1.2 : skillLevel * 1.8;
                  return (
                    <div key={skill.id || index} className="flex flex-col items-center gap-1" 
                         style={{ 
                           width: containerWidth < 768 ? '60px' : 'auto',
                           flex: containerWidth < 768 ? '0 0 60px' : '1',
                           maxWidth: containerWidth < 768 ? '60px' : '70px'
                         }}>
                      {/* Bar */}
                      <div 
                        className="relative w-full rounded-t-lg overflow-hidden"
                        style={{ 
                          height: `${barHeight}px`,
                          backgroundColor: 'var(--template-border-color, #f1f5f9)'
                        }}
                      >
                        <div 
                          className="w-full h-full transition-all duration-700 ease-out"
                          style={{ 
                            background: skill.isCore 
                              ? `linear-gradient(180deg, ${accentColor}, ${primaryColor})`
                              : `linear-gradient(180deg, var(--template-secondary-color, #64748b), ${primaryColor})`
                          }}
                        />
                        {/* Percentage on bar */}
                        <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2">
                          <span className={`font-bold text-white drop-shadow ${containerWidth < 768 ? 'text-[10px]' : 'text-xs'}`}>
                            {skillLevel}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* X-Axis Labels */}
            <div className="flex items-start gap-2 sm:gap-2 px-2 sm:px-2 mt-1 sm:mt-2" 
                 style={{ 
                   minWidth: containerWidth < 768 ? `${sortedSkills.length * 70}px` : 'auto',
                   justifyContent: containerWidth < 768 ? 'flex-start' : 'space-around'
                 }}>
              {sortedSkills.map((skill, index) => (
                <div key={skill.id || index} className="text-center" 
                     style={{ 
                       width: containerWidth < 768 ? '60px' : 'auto',
                       flex: containerWidth < 768 ? '0 0 60px' : '1',
                       maxWidth: containerWidth < 768 ? '60px' : '70px'
                     }}>
                  <span 
                    className={`font-medium block ${containerWidth < 768 ? 'text-[10px]' : 'text-xs'}`}
                    style={{ color: 'var(--template-text-color, #1f2937)' }}
                  >
                    {containerWidth < 768 && skill.name.length > 6 
                      ? skill.name.substring(0, 5) + '.' 
                      : skill.name
                    }
                  </span>
                  {skill.isCore && (
                    <span 
                      className="text-[8px] font-semibold" 
                      style={{ color: primaryColor }}
                    >
                      Core
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile scroll indicator */}
          {containerWidth < 768 && sortedSkills.length > 5 && (
            <div className="flex justify-center mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-4m0 0l4-4m-4 4v12" />
                </svg>
                <span>Scroll to see all skills</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsBarChart;
