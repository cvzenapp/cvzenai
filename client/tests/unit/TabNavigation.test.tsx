import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TabNavigation } from '@/components/templates/components/TabNavigation';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

// Mock template configuration
const mockTemplateConfig: TemplateConfig = {
  id: 'modern-professional',
  name: 'Modern Professional',
  category: 'technology',
  description: 'Clean, professional template',
  previewImage: '/templates/modern-professional-preview.jpg',
  isPremium: false
};

// Mock resume with all sections
const mockResumeComplete: Resume = {
  id: 'test-resume',
  personalInfo: {
    name: 'Alex Morgan',
    title: 'Software Engineer',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA'
  },
  experiences: [
    {
      id: '1',
      position: 'Senior Developer',
      company: 'Tech Corp',
      startDate: '2022-01-01',
      endDate: null,
      description: 'Leading development team',
      technologies: ['React', 'Node.js']
    }
  ],
  projects: [
    {
      id: '1',
      name: 'Project Alpha',
      description: 'Web application',
      technologies: ['React', 'TypeScript'],
      github: 'https://github.com/user/project',
      url: 'https://project.com'
    }
  ],
  education: [
    {
      id: '1',
      degree: 'Bachelor of Science',
      institution: 'University',
      field: 'Computer Science',
      startDate: '2018-08-01',
      endDate: '2022-05-15'
    }
  ],
  skills: [],
  summary: 'Experienced developer',
  objective: '',
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock resume with minimal sections
const mockResumeMinimal: Resume = {
  id: 'minimal-resume',
  personalInfo: {
    name: 'Jane Smith',
    title: 'Developer',
    email: 'jane@example.com',
    phone: '',
    location: ''
  },
  experiences: [],
  projects: [],
  education: [],
  skills: [],
  summary: 'Developer',
  objective: '',
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('TabNavigation Component', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  describe('Tab Rendering', () => {
    it('renders all tabs when resume has complete data', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /experience/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /projects/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /education/i })).toBeInTheDocument();
    });

    it('only renders overview tab when resume has minimal data', () => {
      render(
        <TabNavigation
          resume={mockResumeMinimal}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /experience/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /projects/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /education/i })).not.toBeInTheDocument();
    });

    it('shows active tab with correct styling', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="experience"
          onTabChange={mockOnTabChange}
        />
      );

      const activeTab = screen.getByRole('tab', { name: /experience/i });
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      expect(activeTab).toHaveClass('bg-background', 'text-foreground');
    });

    it('shows inactive tabs with correct styling', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="experience"
          onTabChange={mockOnTabChange}
        />
      );

      const inactiveTab = screen.getByRole('tab', { name: /overview/i });
      expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
      expect(inactiveTab).toHaveClass('text-muted-foreground');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('id');
        expect(tab).toHaveAttribute('aria-controls');
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-describedby');
      });
    });

    it('has proper navigation label', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Resume sections navigation');
    });

    it('includes screen reader descriptions for tabs', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Personal information, summary, and key skills')).toHaveClass('sr-only');
      expect(screen.getByText('Work history and professional achievements')).toHaveClass('sr-only');
      expect(screen.getByText('Portfolio projects and technical work')).toHaveClass('sr-only');
      expect(screen.getByText('Academic background and certifications')).toHaveClass('sr-only');
    });

    it('announces current section to screen readers', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="projects"
          onTabChange={mockOnTabChange}
        />
      );

      const announcement = screen.getByText('Currently viewing Projects section');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveClass('sr-only');
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles keyboard events without errors', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      
      // Test that keyboard events are handled without throwing errors
      expect(() => {
        fireEvent.keyDown(tablist, { key: 'ArrowRight' });
        fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
        fireEvent.keyDown(tablist, { key: 'ArrowUp' });
        fireEvent.keyDown(tablist, { key: 'ArrowDown' });
        fireEvent.keyDown(tablist, { key: 'Home' });
        fireEvent.keyDown(tablist, { key: 'End' });
        fireEvent.keyDown(tablist, { key: 'Enter' });
        fireEvent.keyDown(tablist, { key: ' ' });
      }).not.toThrow();
    });

    it('calls onTabChange when Enter is pressed', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      
      // Enter key should activate the current tab
      fireEvent.keyDown(tablist, { key: 'Enter' });
      expect(mockOnTabChange).toHaveBeenCalledWith('overview');
    });

    it('calls onTabChange when Space is pressed', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      
      // Space key should activate the current tab
      fireEvent.keyDown(tablist, { key: ' ' });
      expect(mockOnTabChange).toHaveBeenCalledWith('overview');
    });

    it('ignores non-navigation keys', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      
      // Test that non-navigation keys don't cause errors
      expect(() => {
        fireEvent.keyDown(tablist, { key: 'a' });
        fireEvent.keyDown(tablist, { key: 'Escape' });
        fireEvent.keyDown(tablist, { key: 'Tab' });
      }).not.toThrow();
      
      // onTabChange should not be called for non-navigation keys
      expect(mockOnTabChange).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Interaction', () => {
    it('activates tab when clicked', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const experienceTab = screen.getByRole('tab', { name: /experience/i });
      fireEvent.click(experienceTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('experience');
    });

    it('handles click events without errors', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tabs = screen.getAllByRole('tab');
      
      // Test that clicking all tabs works without errors
      expect(() => {
        tabs.forEach(tab => fireEvent.click(tab));
      }).not.toThrow();
    });
  });

  describe('Tab Management', () => {
    it('sets correct tabIndex for focused and unfocused tabs', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tabs = screen.getAllByRole('tab');
      
      // First tab should be focusable (tabIndex 0)
      expect(tabs[0]).toHaveAttribute('tabindex', '0');
      
      // Other tabs should not be focusable (tabIndex -1)
      for (let i = 1; i < tabs.length; i++) {
        expect(tabs[i]).toHaveAttribute('tabindex', '-1');
      }
    });

    it('manages tab focus state correctly', () => {
      const { rerender } = render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      let tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('tabindex', '0');
      
      // Change active tab
      rerender(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="experience"
          onTabChange={mockOnTabChange}
        />
      );
      
      tabs = screen.getAllByRole('tab');
      // The active tab should still have proper tabindex management
      expect(tabs.some(tab => tab.getAttribute('tabindex') === '0')).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('shows full labels on larger screens', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      const hiddenLabel = overviewTab.querySelector('.hidden.sm\\:inline');
      const visibleLabel = overviewTab.querySelector('.sm\\:hidden');
      
      expect(hiddenLabel).toBeInTheDocument();
      expect(visibleLabel).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
          className="custom-tab-nav"
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-tab-nav');
    });

    it('includes template config data attribute', () => {
      render(
        <TabNavigation
          resume={mockResumeComplete}
          templateConfig={mockTemplateConfig}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('data-template-config', 'modern-professional');
    });
  });
});