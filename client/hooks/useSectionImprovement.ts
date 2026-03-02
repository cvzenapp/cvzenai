import { useState, useCallback } from 'react';
import { atsApi } from '@/services/atsApi';
import { Resume, Experience, Education, Project } from '@shared/api';

interface SectionImprovementState {
  [key: string]: {
    isImproving: boolean;
    error: string | null;
  };
}

export function useSectionImprovement(resumeId: number, resume: Resume, onResumeUpdate?: () => void) {
  const [improvementState, setImprovementState] = useState<SectionImprovementState>({});
  const [improvedData, setImprovedData] = useState<Partial<Resume>>({});

  const improveSection = useCallback(async (
    sectionType: 'summary' | 'objective' | 'experience' | 'education' | 'project' | 'skills',
    sectionData: any,
    sectionIndex?: number
  ) => {
    const stateKey = sectionIndex !== undefined 
      ? `${sectionType}-${sectionIndex}` 
      : sectionType;

    // Set loading state
    setImprovementState(prev => ({
      ...prev,
      [stateKey]: { isImproving: true, error: null }
    }));

    try {
      const result = await atsApi.improveSection(resumeId, sectionType, sectionData, sectionIndex);

      if (result.success && result.data) {
        // Update improved data
        setImprovedData(prev => {
          const updated = { ...prev };
          
          if (sectionType === 'summary' || sectionType === 'objective') {
            // Simple string replacement
            updated[sectionType] = result.data.improved;
          } else if (sectionType === 'skills') {
            // Array replacement
            updated.skills = result.data.improved;
          } else if (sectionIndex !== undefined) {
            // Array item replacement (experience, education, projects)
            if (sectionType === 'experience') {
              const currentArray = (prev.experiences || resume.experiences || []) as Experience[];
              const newArray = [...currentArray];
              newArray[sectionIndex] = result.data.improved;
              updated.experiences = newArray;
            } else if (sectionType === 'education') {
              const currentArray = (prev.education || resume.education || []) as Education[];
              const newArray = [...currentArray];
              newArray[sectionIndex] = result.data.improved;
              updated.education = newArray;
            } else if (sectionType === 'project') {
              const currentArray = (prev.projects || resume.projects || []) as Project[];
              const newArray = [...currentArray];
              newArray[sectionIndex] = result.data.improved;
              updated.projects = newArray;
            }
          }
          
          return updated;
        });

        // Clear loading state
        setImprovementState(prev => ({
          ...prev,
          [stateKey]: { isImproving: false, error: null }
        }));

        // Trigger resume reload if callback provided
        if (onResumeUpdate) {
          onResumeUpdate();
        }

        return { success: true, changes: result.data.changes };
      } else {
        const errorMsg = typeof result.error === 'string' ? result.error : 'Failed to improve section';
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || 'Failed to improve section');
      
      setImprovementState(prev => ({
        ...prev,
        [stateKey]: { isImproving: false, error: errorMessage }
      }));

      return { success: false, error: errorMessage };
    }
  }, [resumeId, resume, onResumeUpdate]);

  const isImprovingSection = useCallback((
    sectionType: string,
    sectionIndex?: number
  ) => {
    const stateKey = sectionIndex !== undefined 
      ? `${sectionType}-${sectionIndex}` 
      : sectionType;
    return improvementState[stateKey]?.isImproving || false;
  }, [improvementState]);

  const getSectionError = useCallback((
    sectionType: string,
    sectionIndex?: number
  ) => {
    const stateKey = sectionIndex !== undefined 
      ? `${sectionType}-${sectionIndex}` 
      : sectionType;
    return improvementState[stateKey]?.error || null;
  }, [improvementState]);

  const getImprovedResume = useCallback(() => {
    return {
      ...resume,
      ...improvedData
    };
  }, [resume, improvedData]);

  return {
    improveSection,
    isImprovingSection,
    getSectionError,
    getImprovedResume,
    hasImprovements: Object.keys(improvedData).length > 0
  };
}
