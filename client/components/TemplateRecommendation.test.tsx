/**
 * Unit tests for TemplateRecommendation component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateRecommendation from './TemplateRecommendation';
import { TemplateRecommendation as TemplateRecommendationType } from '../services/templateService';

describe('TemplateRecommendation', () => {
  const mockRecommendation: TemplateRecommendationType = {
    template: {
      id: "tech-template-1",
      name: "Modern Tech Professional",
      category: "technology",
      description: "Perfect for software engineers and tech professionals",
      industry: "Technology",
      colors: {
        primary: "#3b82f6",
        secondary: "#1e40af",
        accent: "#06b6d4",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#6b7280"
      },
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
        codeFont: "JetBrains Mono"
      },
      layout: {
        headerStyle: "tech-focused",
        sidebarPosition: "left",
        sectionPriority: ["skills", "experience", "projects"],
        cardStyle: "code-blocks"
      },
      sections: {
        required: ["contact", "summary", "experience", "skills"],
        optional: ["projects", "education"],
        industrySpecific: ["techStack", "github", "portfolio"]
      },
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false
      }
    },
    score: 95,
    reasons: [
      "Perfect match for technology professionals",
      "Highlights your technical skills effectively",
      "Optimized for Applicant Tracking Systems (ATS)"
    ],
    category: "perfect-match"
  };

  const mockOnSelect = vi.fn();
  const mockOnPreview = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnPreview.mockClear();
  });

  describe('rendering', () => {
    it('should render template recommendation correctly', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Modern Tech Professional')).toBeInTheDocument();
      expect(screen.getByText('Technology • Perfect for software engineers and tech professionals')).toBeInTheDocument();
      expect(screen.getByText('Perfect Match')).toBeInTheDocument();
      expect(screen.getByText('95% match')).toBeInTheDocument();
    });

    it('should render recommendation reasons', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          showReasons={true}
        />
      );

      expect(screen.getByText('Why this template?')).toBeInTheDocument();
      expect(screen.getByText('Perfect match for technology professionals')).toBeInTheDocument();
      expect(screen.getByText('Highlights your technical skills effectively')).toBeInTheDocument();
      expect(screen.getByText('Optimized for Applicant Tracking Systems (ATS)')).toBeInTheDocument();
    });

    it('should hide reasons when showReasons is false', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          showReasons={false}
        />
      );

      expect(screen.queryByText('Why this template?')).not.toBeInTheDocument();
    });

    it('should render template features', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Tech Stack')).toBeInTheDocument();
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Certifications')).toBeInTheDocument();
    });

    it('should render compact version correctly', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          compact={true}
        />
      );

      expect(screen.getByText('Modern Tech Professional')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      
      // Should not show full description in compact mode
      expect(screen.queryByText('Why this template?')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelect when Use Template button is clicked', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
        />
      );

      const useTemplateButton = screen.getByText('Use Template');
      fireEvent.click(useTemplateButton);

      expect(mockOnSelect).toHaveBeenCalledWith('tech-template-1');
    });

    it('should call onPreview when Preview button is clicked', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
        />
      );

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledWith('tech-template-1');
    });

    it('should call onPreview when template preview is clicked', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
        />
      );

      const templatePreview = screen.getByRole('generic', { name: /template preview/i });
      if (templatePreview) {
        fireEvent.click(templatePreview);
        expect(mockOnPreview).toHaveBeenCalledWith('tech-template-1');
      }
    });

    it('should call onSelect when compact card is clicked', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
          compact={true}
        />
      );

      const card = screen.getByText('Modern Tech Professional').closest('[role="button"]') || 
                   screen.getByText('Modern Tech Professional').closest('div');
      
      if (card) {
        fireEvent.click(card);
        expect(mockOnSelect).toHaveBeenCalledWith('tech-template-1');
      }
    });
  });

  describe('category styling', () => {
    it('should apply correct styling for perfect-match category', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
        />
      );

      const badge = screen.getByText('Perfect Match');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('should apply correct styling for good-fit category', () => {
      const goodFitRecommendation = {
        ...mockRecommendation,
        category: 'good-fit' as const,
        score: 75
      };

      render(
        <TemplateRecommendation
          recommendation={goodFitRecommendation}
          onSelect={mockOnSelect}
        />
      );

      const badge = screen.getByText('Good Fit');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should apply correct styling for alternative category', () => {
      const alternativeRecommendation = {
        ...mockRecommendation,
        category: 'alternative' as const,
        score: 60
      };

      render(
        <TemplateRecommendation
          recommendation={alternativeRecommendation}
          onSelect={mockOnSelect}
        />
      );

      const badge = screen.getByText('Alternative');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });
  });

  describe('score display', () => {
    it('should display score with correct color for high scores', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
        />
      );

      const scoreElement = screen.getByText('95% match');
      expect(scoreElement).toHaveClass('text-green-600');
    });

    it('should display score with correct color for medium scores', () => {
      const mediumScoreRecommendation = {
        ...mockRecommendation,
        score: 75
      };

      render(
        <TemplateRecommendation
          recommendation={mediumScoreRecommendation}
          onSelect={mockOnSelect}
        />
      );

      const scoreElement = screen.getByText('75% match');
      expect(scoreElement).toHaveClass('text-yellow-600');
    });

    it('should display score with correct color for low scores', () => {
      const lowScoreRecommendation = {
        ...mockRecommendation,
        score: 60
      };

      render(
        <TemplateRecommendation
          recommendation={lowScoreRecommendation}
          onSelect={mockOnSelect}
        />
      );

      const scoreElement = screen.getByText('60% match');
      expect(scoreElement).toHaveClass('text-gray-600');
    });
  });

  describe('edge cases', () => {
    it('should handle recommendation with no reasons', () => {
      const noReasonsRecommendation = {
        ...mockRecommendation,
        reasons: []
      };

      render(
        <TemplateRecommendation
          recommendation={noReasonsRecommendation}
          onSelect={mockOnSelect}
          showReasons={true}
        />
      );

      expect(screen.queryByText('Why this template?')).not.toBeInTheDocument();
    });

    it('should handle missing onPreview prop', () => {
      render(
        <TemplateRecommendation
          recommendation={mockRecommendation}
          onSelect={mockOnSelect}
        />
      );

      // Should not show preview button if onPreview is not provided
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });

    it('should handle template with no features', () => {
      const noFeaturesRecommendation = {
        ...mockRecommendation,
        template: {
          ...mockRecommendation.template,
          features: {
            showTechStack: false,
            showPortfolio: false,
            showMetrics: false,
            showPublications: false,
            showCampaigns: false,
            showTeamSize: false,
            showGithub: false,
            showDesignTools: false,
            showCertifications: false,
            showLanguages: false
          }
        }
      };

      render(
        <TemplateRecommendation
          recommendation={noFeaturesRecommendation}
          onSelect={mockOnSelect}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Modern Tech Professional')).toBeInTheDocument();
    });
  });
});