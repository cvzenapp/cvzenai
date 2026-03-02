import { useState, useCallback } from 'react';

export interface DisclosureState {
  [key: string]: boolean;
}

export interface UseProgressiveDisclosureReturn {
  /** Current state of all disclosures */
  disclosureState: DisclosureState;
  /** Check if a specific disclosure is expanded */
  isExpanded: (key: string) => boolean;
  /** Toggle a specific disclosure */
  toggle: (key: string) => void;
  /** Expand a specific disclosure */
  expand: (key: string) => void;
  /** Collapse a specific disclosure */
  collapse: (key: string) => void;
  /** Expand all disclosures */
  expandAll: () => void;
  /** Collapse all disclosures */
  collapseAll: () => void;
  /** Set multiple disclosure states at once */
  setMultiple: (states: Partial<DisclosureState>) => void;
}

/**
 * Hook for managing multiple progressive disclosure states
 * 
 * Provides centralized state management for multiple collapsible sections
 * within a component, with utilities for bulk operations and individual control.
 * 
 * @param initialState - Initial state for disclosures
 * @returns Object with state and control functions
 */
export const useProgressiveDisclosure = (
  initialState: DisclosureState = {}
): UseProgressiveDisclosureReturn => {
  const [disclosureState, setDisclosureState] = useState<DisclosureState>(initialState);

  const isExpanded = useCallback((key: string): boolean => {
    return disclosureState[key] ?? false;
  }, [disclosureState]);

  const toggle = useCallback((key: string) => {
    setDisclosureState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const expand = useCallback((key: string) => {
    setDisclosureState(prev => ({
      ...prev,
      [key]: true
    }));
  }, []);

  const collapse = useCallback((key: string) => {
    setDisclosureState(prev => ({
      ...prev,
      [key]: false
    }));
  }, []);

  const expandAll = useCallback(() => {
    setDisclosureState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key] = true;
      });
      return newState;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setDisclosureState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  const setMultiple = useCallback((states: Partial<DisclosureState>) => {
    setDisclosureState(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  return {
    disclosureState,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    setMultiple
  };
};