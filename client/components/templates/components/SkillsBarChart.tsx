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
    <div className="rounded-lg p-6 hover:shadow-sm transition-shadow"
         style={{ 
           backgroundColor: 'var(--template-background-color, #ffffff)',
           border: '1px solid var(--template-border-color, #e5e7eb)'
         }}>
      {/* Chart Title */}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-1 h-6 rounded-full" 
          style={{ backgroundColor: primaryColor }}
        />
        <h3 
          className="text-lg font-bold" 
          style={{ 
            color: primaryColor,
            fontFamily: 'var(--template-font-family)',
            fontWeight: 'var(--template-heading-weight)'
          }}
        >
          {title}
        </h3>
      </div>
      
      {/* Chart Container with Y-axis */}
      <div className="flex gap-4">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between text-xs py-2" 
             style={{ height: '200px', color: 'var(--template-text-muted, #9ca3af)' }}>
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
        
        {/* Chart Area */}
        <div className="flex-1">
          {/* Grid Lines */}
          <div className="relative" style={{ height: '200px' }}>
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-t" 
                     style={{ borderColor: 'var(--template-border-color, #f1f5f9)' }} />
              ))}
            </div>
            
            {/* Bars */}
            <div className="relative h-full flex items-end justify-around gap-2 px-2">
              {sortedSkills.map((skill, index) => {
                const skillLevel = getSkillLevel(skill);
                return (
                  <div key={skill.id || index} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                    {/* Bar */}
                    <div 
                      className="relative w-full rounded-t-lg overflow-hidden"
                      style={{ 
                        height: `${skillLevel * 2}px`,
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
                      <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs font-bold text-white drop-shadow">
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
          <div className="flex items-start justify-around gap-2 px-2 mt-3">
            {sortedSkills.map((skill, index) => (
              <div key={skill.id || index} className="flex-1 max-w-[80px] text-center">
                <span 
                  className="text-xs font-medium block" 
                  style={{ color: 'var(--template-text-color, #1f2937)' }}
                >
                  {skill.name}
                </span>
                {skill.isCore && (
                  <span 
                    className="text-[10px] font-semibold" 
                    style={{ color: primaryColor }}
                  >
                    Core
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsBarChart;
