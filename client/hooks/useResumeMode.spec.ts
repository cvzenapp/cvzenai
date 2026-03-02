/**
 * Tests for useResumeMode hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResumeMode, useResumeInitialization } from './useResumeMode';
import { ResumeMode } from '@/services/emptyStateService';

// Mock react-router-dom
const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams]
  };
});

// Mock the empty state service
vi.mock('@/services/emptyStateService', async () => {
  const actual = await vi.importActual('@/services/emptyStateService');
  return {
    ...actual,
    clearResumeSession: vi.fn(),
    getResumeMode: vi.fn()
  };
});

import { clearResumeSession, getResumeMode } from '@/services/emptyStateService';

describe('useResumeMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSearchParams.delete('mode');
    mockSearchParams.delete('resumeId');
  });

  describe('mode detection', () => {
    it('should detect new resume mode', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.NEW);
      
      const { result } = renderHook(() => useResumeMode());
      
      expect(result.current.mode).toBe(ResumeMode.NEW);
      expect(result.current.isNewResume).toBe(true);
      expect(result.current.resumeId).toBeNull();
    });

    it('should detect edit resume mode', () => {
      mockSearchParams.set('mode', 'edit');
      mockSearchParams.set('resumeId', '123');
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
      
      const { result } = renderHook(() => useResumeMode());
      
      expect(result.current.mode).toBe(ResumeMode.EDIT);
      expect(result.current.isNewResume).toBe(false);
      expect(result.current.resumeId).toBe('123');
    });

    it('should detect duplicate resume mode', () => {
      mockSearchParams.set('mode', 'duplicate');
      mockSearchParams.set('resumeId', '456');
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.DUPLICATE);
      
      const { result } = renderHook(() => useResumeMode());
      
      expect(result.current.mode).toBe(ResumeMode.DUPLICATE);
      expect(result.current.isNewResume).toBe(false);
      expect(result.current.resumeId).toBe('456');
    });
  });

  describe('context object', () => {
    it('should provide correct context for new resume', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.NEW);
      
      const { result } = renderHook(() => useResumeMode());
      
      expect(result.current.context).toEqual({
        isNewResume: true,
        resumeId: null,
        mode: 'new',
        dataLoaded: true
      });
    });

    it('should provide correct context for edit resume', () => {
      mockSearchParams.set('resumeId', '789');
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
      
      const { result } = renderHook(() => useResumeMode());
      
      expect(result.current.context).toEqual({
        isNewResume: false,
        resumeId: '789',
        mode: 'edit',
        dataLoaded: true
      });
    });
  });

  describe('session management', () => {
    it('should clear all sessions for new resume mode', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.NEW);
      
      renderHook(() => useResumeMode());
      
      expect(clearResumeSession).toHaveBeenCalledWith();
    });

    it('should not clear sessions for edit mode during initialization', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
      
      renderHook(() => useResumeMode());
      
      // Should not call clearResumeSession during initialization for edit mode
      expect(clearResumeSession).not.toHaveBeenCalled();
    });

    it('should clear session when clearSession is called', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.NEW);
      
      const { result } = renderHook(() => useResumeMode());
      
      act(() => {
        result.current.clearSession();
      });
      
      expect(clearResumeSession).toHaveBeenCalledWith();
    });

    it('should clear specific resume session for edit mode', () => {
      mockSearchParams.set('resumeId', '123');
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
      
      const { result } = renderHook(() => useResumeMode());
      
      act(() => {
        result.current.clearSession();
      });
      
      expect(clearResumeSession).toHaveBeenCalledWith('123');
    });
  });

  describe('mode switching', () => {
    it('should switch to new mode', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
      
      const { result } = renderHook(() => useResumeMode());
      
      act(() => {
        result.current.switchToNewMode();
      });
      
      expect(mockSetSearchParams).toHaveBeenCalledWith({ mode: 'new' });
      expect(clearResumeSession).toHaveBeenCalledWith();
    });

    it('should switch to edit mode', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.NEW);
      
      const { result } = renderHook(() => useResumeMode());
      
      act(() => {
        result.current.switchToEditMode('456');
      });
      
      expect(mockSetSearchParams).toHaveBeenCalledWith({ 
        mode: 'edit', 
        resumeId: '456' 
      });
    });
  });

  describe('default resume ID', () => {
    it('should use default resume ID when none provided', () => {
      vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
      // No resumeId in search params
      
      const { result } = renderHook(() => useResumeMode());
      
      expect(result.current.resumeId).toBe('1'); // Default fallback
    });
  });
});

describe('useResumeInitialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('mode');
    mockSearchParams.delete('resumeId');
  });

  it('should return initialization config for new resume', () => {
    vi.mocked(getResumeMode).mockReturnValue(ResumeMode.NEW);
    
    const { result } = renderHook(() => useResumeInitialization());
    
    expect(result.current).toEqual({
      mode: ResumeMode.NEW,
      resumeId: undefined,
      clearExistingData: true
    });
  });

  it('should return initialization config for edit resume', () => {
    mockSearchParams.set('resumeId', '789');
    vi.mocked(getResumeMode).mockReturnValue(ResumeMode.EDIT);
    
    const { result } = renderHook(() => useResumeInitialization());
    
    expect(result.current).toEqual({
      mode: ResumeMode.EDIT,
      resumeId: '789',
      clearExistingData: false
    });
  });
});