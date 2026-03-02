import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

export interface TabNavigationProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export interface TabConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isVisible: (resume: Resume) => boolean;
}

/**
 * Accessible Tab Navigation Component
 * 
 * Provides keyboard-navigable tabs for resume sections following WCAG guidelines.
 * Supports Overview, Experience, Projects, and Education sections with proper
 * ARIA labels and focus management.
 * 
 * Features:
 * - Keyboard navigation (Arrow keys, Home, End, Enter, Space)
 * - Screen reader compatibility with ARIA labels
 * - Smooth transitions between sections
 * - Conditional tab visibility based on resume content
 * - Focus management and visual indicators
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  resume,
  templateConfig,
  activeTab,
  onTabChange,
  className = ''
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  const [focusedTabIndex, setFocusedTabIndex] = useState(0);

  // Define available tabs with visibility conditions
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      description: 'Personal information, summary, and key skills',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      isVisible: () => true // Always visible
    },
    {
      id: 'experience',
      label: 'Experience',
      description: 'Work history and professional achievements',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      isVisible: (resume) => resume.experiences && resume.experiences.length > 0
    },
    {
      id: 'projects',
      label: 'Projects',
      description: 'Portfolio projects and technical work',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      isVisible: (resume) => resume.projects && resume.projects.length > 0
    },
    {
      id: 'education',
      label: 'Education',
      description: 'Academic background and certifications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      isVisible: (resume) => resume.education && resume.education.length > 0
    }
  ];

  // Filter tabs based on resume content
  const visibleTabs = tabs.filter(tab => tab.isVisible(resume));

  // Update focused tab index when active tab changes
  useEffect(() => {
    const activeIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
    if (activeIndex !== -1) {
      setFocusedTabIndex(activeIndex);
    }
  }, [activeTab, visibleTabs]);

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    let newIndex = focusedTabIndex;

    switch (key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = focusedTabIndex > 0 ? focusedTabIndex - 1 : visibleTabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = focusedTabIndex < visibleTabs.length - 1 ? focusedTabIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = visibleTabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onTabChange(visibleTabs[focusedTabIndex].id);
        return;
      default:
        return;
    }

    setFocusedTabIndex(newIndex);
    
    // Focus the new tab button after state update
    setTimeout(() => {
      const tabButtons = tabListRef.current?.querySelectorAll('[role="tab"]');
      if (tabButtons && tabButtons[newIndex]) {
        (tabButtons[newIndex] as HTMLElement).focus();
      }
    }, 0);
  };

  // Handle tab click
  const handleTabClick = (tabId: string, index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    setFocusedTabIndex(index);
    onTabChange(tabId);
    
    // Ensure the clicked tab receives focus
    (event.currentTarget as HTMLElement).focus();
  };

  return (
    <nav 
      className={`tab-navigation ${className}`}
      aria-label="Resume sections navigation"
      data-template-config={templateConfig.id}
    >
      <div 
        ref={tabListRef}
        className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border border-border"
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
      >
        {visibleTabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isFocused = index === focusedTabIndex;
          
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`tabpanel-${tab.id}`}
              aria-selected={isActive}
              aria-describedby={`tab-${tab.id}-description`}
              tabIndex={isFocused ? 0 : -1}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                ${isActive 
                  ? 'bg-background text-foreground shadow-sm border border-border' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
                ${isFocused && !isActive ? 'ring-2 ring-primary/50' : ''}
              `}
              onClick={(event) => handleTabClick(tab.id, index, event)}
              onFocus={() => setFocusedTabIndex(index)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
              
              {/* Screen reader description */}
              <span 
                id={`tab-${tab.id}-description`}
                className="sr-only"
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab panels indicator for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Currently viewing {visibleTabs.find(tab => tab.id === activeTab)?.label} section
      </div>
    </nav>
  );
};

export default TabNavigation;