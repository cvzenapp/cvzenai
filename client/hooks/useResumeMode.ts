/**
 * Custom hook for managing resume creation mode and state
 * Handles detection of new vs edit modes and localStorage management
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ResumeMode, 
  getResumeMode, 
  clearResumeSession,
  ResumeInitializationConfig 
} from '@/services/emptyStateService';
import { ResumeCreationContext } from '@/types/resumeBuilder';

interface UseResumeModeReturn {
  mode: ResumeMode;
  isNewResume: boolean;
  resumeId: string | null;
  context: ResumeCreationContext;
  clearSession: () => void;
  switchToNewMode: () => void;
  switchToEditMode: (resumeId: string) => void;
}

/**
 * Hook for managing resume creation mode
 */
export const useResumeMode = (): UseResumeModeReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Determine mode from URL parameters
  const mode = getResumeMode(searchParams);
  const resumeId = searchParams.get('resumeId') || '1'; // Default to '1' for backward compatibility
  const isNewResume = mode === ResumeMode.NEW;

  // Create context object
  const context: ResumeCreationContext = {
    isNewResume,
    resumeId: isNewResume ? null : resumeId,
    mode: mode as 'new' | 'edit' | 'duplicate',
    dataLoaded
  };

  /**
   * Clear current resume session data
   */
  const clearSession = useCallback(() => {
    if (isNewResume) {
      // Clear all resume data for new resume
      clearResumeSession();
    } else {
      // Clear specific resume data
      clearResumeSession(resumeId);
    }
  }, [isNewResume, resumeId]);

  /**
   * Switch to new resume mode
   */
  const switchToNewMode = useCallback(() => {
    setSearchParams({ mode: 'new' });
    clearResumeSession(); // Clear all data when switching to new mode
  }, [setSearchParams]);

  /**
   * Switch to edit mode for specific resume
   */
  const switchToEditMode = useCallback((targetResumeId: string) => {
    setSearchParams({ 
      mode: 'edit', 
      resumeId: targetResumeId 
    });
  }, [setSearchParams]);

  /**
   * Initialize session based on mode
   */
  useEffect(() => {
    if (isNewResume) {
      // For new resumes, clear any existing session data
      clearResumeSession();
      console.log('🆕 New resume mode: cleared existing session data');
    } else {
      console.log(`✏️ Edit mode for resume: ${resumeId}`);
    }
    
    setDataLoaded(true);
  }, [mode, resumeId, isNewResume]);

  /**
   * Log mode changes for debugging
   */
  useEffect(() => {
    console.log(`Resume mode changed: ${mode}`, {
      isNewResume,
      resumeId,
      dataLoaded
    });
  }, [mode, isNewResume, resumeId, dataLoaded]);

  return {
    mode,
    isNewResume,
    resumeId: isNewResume ? null : resumeId,
    context,
    clearSession,
    switchToNewMode,
    switchToEditMode
  };
};

/**
 * Hook for getting resume initialization configuration
 */
export const useResumeInitialization = (): ResumeInitializationConfig => {
  const { mode, resumeId, isNewResume } = useResumeMode();

  return {
    mode,
    resumeId: resumeId || undefined,
    clearExistingData: isNewResume
  };
};