import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecruiterAuthModal from '../RecruiterAuthModal';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RecruiterAuthModal', () => {
  const mockProps = {
    isOpen: true,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
    message: 'Test message',
  };

  it('renders when isOpen is true', () => {
    render(<RecruiterAuthModal {...mockProps} />);
    
    // Check if the modal content is rendered by looking for unique elements
    expect(screen.getByText('Recruiter Sign In')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<RecruiterAuthModal {...mockProps} isOpen={false} />);
    
    // Check that modal content is not rendered
    expect(screen.queryByText('Recruiter Sign In')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Sign In' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Sign Up' })).not.toBeInTheDocument();
  });

  it('displays custom message when provided', () => {
    const customMessage = 'Please sign in to continue';
    render(<RecruiterAuthModal {...mockProps} message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });
});