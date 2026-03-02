import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateFilters from './TemplateFilters';
import { TemplateFilters as TemplateFiltersType } from '@/services/templateService';

describe('TemplateFilters', () => {
  const mockFilters: TemplateFiltersType = {
    categories: [],
    experienceLevels: [],
    visualStyles: [],
    features: [],
    industries: [],
    atsOptimized: false,
    rating: 0
  };

  const mockProps = {
    filters: mockFilters,
    onFiltersChange: vi.fn(),
    onClearFilters: vi.fn(),
    isOpen: true,
    onClose: vi.fn()
  };

  it('should render filter modal when open', () => {
    render(<TemplateFilters {...mockProps} />);
    
    expect(screen.getByText('Filter Templates')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Experience Level')).toBeInTheDocument();
    expect(screen.getByText('Visual Style')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<TemplateFilters {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Filter Templates')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<TemplateFilters {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onClearFilters when clear all button is clicked', () => {
    const filtersWithData = {
      ...mockFilters,
      categories: ['technology'],
      atsOptimized: true
    };
    
    render(<TemplateFilters {...mockProps} filters={filtersWithData} />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(mockProps.onClearFilters).toHaveBeenCalled();
  });

  it('should show active filters summary when filters are applied', () => {
    const filtersWithData = {
      ...mockFilters,
      categories: ['technology'],
      experienceLevels: ['senior'],
      atsOptimized: true
    };
    
    render(<TemplateFilters {...mockProps} filters={filtersWithData} />);
    
    expect(screen.getByText('Active Filters:')).toBeInTheDocument();
    expect(screen.getByText('ATS Optimized')).toBeInTheDocument();
  });

  it('should handle category filter changes', () => {
    render(<TemplateFilters {...mockProps} />);
    
    const technologyCheckbox = screen.getByLabelText(/Technology/);
    fireEvent.click(technologyCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      categories: ['technology']
    });
  });

  it('should handle experience level badge clicks', () => {
    render(<TemplateFilters {...mockProps} />);
    
    const seniorBadge = screen.getByText('Senior Level');
    fireEvent.click(seniorBadge);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      experienceLevels: ['senior']
    });
  });

  it('should handle ATS optimized toggle', () => {
    render(<TemplateFilters {...mockProps} />);
    
    const atsCheckbox = screen.getByLabelText(/ATS Optimized Only/);
    fireEvent.click(atsCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      atsOptimized: true
    });
  });
});