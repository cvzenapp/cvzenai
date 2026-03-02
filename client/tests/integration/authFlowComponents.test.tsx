/**
 * Authentication Flow Component Integration Tests
 * Tests authentication flows with React components and routing
 * Tests authentication state persistence across component navigation
 * Tests error handling in component context
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { unifiedAuthService } from '../../services/unifiedAuthService';
import { resumeApi } from '../../services/resumeApi';

// Mock the services
vi.mock('../../services/unifiedAuthService', () => ({
  unifiedAuthService: {
    onAuthStateChange: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    clearAuth: vi.fn(),
    isAuthenticated: vi.fn(),
    getStoredUser: vi.fn(),
    ensureAuthState: vi.fn(),
    isTokenExpired: vi.fn(),
    getTokenExpiration: vi.fn(),
    ensureValidToken: vi.fn(),
  },
}));

vi.mock('../../services/resumeApi', () => ({
  resumeApi: {
    getUserResumes: vi.fn(),
    getResume: vi.fn(),
    createResume: vi.fn(),
    updateResume: vi.fn(),
  },
}));

const mockUnifiedAuthService = unifiedAuthService as any;
const mockResumeApi = resumeApi as any;

// Mock components for testing
const MockDashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [resumes, setResumes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadResumes = async () => {
      if (!isAuthenticated || isLoading) return;
      
      try {
        setLoading(true);
        const result = await resumeApi.getUserResumes();
        
        if (result.success) {
          setResumes(result.data);
        } else {
          setError(result.error || 'Failed to load resumes');
        }
      } catch (err) {
        setError('Network error loading resumes');
      } finally {
        setLoading(false);
      }
    };

    loadResumes();
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div data-testid="dashboard-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div data-testid="dashboard-unauthenticated">Please log in</div>;
  }

  if (error) {
    return <div data-testid="dashboard-error">{error}</div>;
  }

  return (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
      <div data-testid="user-name">{user?.name}</div>
      <div data-testid="resume-count">{resumes.length} resumes</div>
      {resumes.map(resume => (
        <div key={resume.id} data-testid={`resume-${resume.id}`}>
          <span>{resume.title}</span>
          <button 
            onClick={() => navigate(`/resume-builder/${resume.id}`)}
            data-testid={`edit-resume-${resume.id}`}
          >
            Edit
          </button>
        </div>
      ))}
      <button 
        onClick={() => navigate('/resume-builder/new')}
        data-testid="create-resume"
      >
        Create New Resume
      </button>
    </div>
  );
};

const MockResumeBuilder = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [resume, setResume] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const navigate = useNavigate();
  
  // Get resume ID from URL (simplified)
  const resumeId = window.location.pathname.split('/').pop();
  const isNewResume = resumeId === 'new';

  React.useEffect(() => {
    const loadResume = async () => {
      if (!isAuthenticated || isLoading) return;
      
      try {
        setLoading(true);
        
        if (isNewResume) {
          // Create new resume
          const result = await resumeApi.createResume({
            title: 'New Resume',
            personalInfo: {
              firstName: user?.name?.split(' ')[0] || '',
              lastName: user?.name?.split(' ').slice(1).join(' ') || '',
              email: user?.email || '',
            },
          });
          
          if (result.success) {
            setResume(result.data);
          } else {
            setError(result.error || 'Failed to create resume');
          }
        } else {
          // Load existing resume
          const result = await resumeApi.getResume(resumeId!);
          
          if (result.success) {
            setResume(result.data);
          } else {
            setError(result.error || 'Failed to load resume');
          }
        }
      } catch (err) {
        setError('Network error loading resume');
      } finally {
        setLoading(false);
      }
    };

    loadResume();
  }, [isAuthenticated, isLoading, resumeId, isNewResume, user]);

  const handleSave = async () => {
    if (!resume) return;
    
    try {
      setSaving(true);
      const result = await resumeApi.updateResume(resume.id, {
        ...resume,
        updatedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        setResume(result.data);
      } else {
        setError(result.error || 'Failed to save resume');
      }
    } catch (err) {
      setError('Network error saving resume');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div data-testid="resume-builder-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div data-testid="resume-builder-unauthenticated">Please log in</div>;
  }

  if (error) {
    return <div data-testid="resume-builder-error">{error}</div>;
  }

  if (!resume) {
    return <div data-testid="resume-builder-no-data">No resume data</div>;
  }

  return (
    <div data-testid="resume-builder">
      <h1>Resume Builder</h1>
      <div data-testid="resume-title">{resume.title}</div>
      <div data-testid="resume-id">{resume.id}</div>
      <input
        data-testid="title-input"
        value={resume.title}
        onChange={(e) => setResume({ ...resume, title: e.target.value })}
      />
      <button 
        onClick={handleSave}
        disabled={saving}
        data-testid="save-resume"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button 
        onClick={() => navigate('/dashboard')}
        data-testid="back-to-dashboard"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

const MockLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await login({ email, password });
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login">
      <h1>Login</h1>
      {error && <div data-testid="login-error">{error}</div>}
      <form onSubmit={handleLogin}>
        <input
          data-testid="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          data-testid="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button 
          type="submit" 
          disabled={loading}
          data-testid="login-button"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

const TestApp = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<MockLogin />} />
          <Route path="/dashboard" element={<MockDashboard />} />
          <Route path="/resume-builder/:id" element={<MockResumeBuilder />} />
          <Route path="/" element={<MockDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return vi.fn(); // Return unsubscribe function
    });
    
    mockUnifiedAuthService.isAuthenticated.mockReturnValue(false);
    mockUnifiedAuthService.getStoredUser.mockReturnValue(null);
    mockUnifiedAuthService.ensureAuthState.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Authentication Flow with Components', () => {
    it('should handle complete login → dashboard → resume builder → dashboard flow', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        emailVerified: true,
      };

      // Mock login success
      mockUnifiedAuthService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'test-token',
        message: 'Login successful',
      });

      // Mock dashboard data
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [
          {
            id: '1',
            title: 'Software Engineer Resume',
            status: 'draft',
            createdAt: '2023-01-01T00:00:00Z',
          },
          {
            id: '2',
            title: 'Senior Developer Resume',
            status: 'published',
            createdAt: '2023-01-02T00:00:00Z',
          }
        ],
        total: 2,
      });

      // Mock resume builder data
      mockResumeApi.getResume.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          title: 'Software Engineer Resume',
          status: 'draft',
          personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
          },
        },
      });

      // Mock resume update
      mockResumeApi.updateResume.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          title: 'Updated Software Engineer Resume',
          status: 'draft',
          personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
          },
          updatedAt: '2023-01-01T12:00:00Z',
        },
      });

      // Start at login page
      render(<TestApp />);
      
      // Navigate to login
      window.history.pushState({}, '', '/login');
      
      // Wait for login form to render
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });

      // Fill in login form
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });

      // Submit login
      fireEvent.click(screen.getByTestId('login-button'));

      // Mock auth state change after login
      act(() => {
        const callback = mockUnifiedAuthService.onAuthStateChange.mock.calls[0][0];
        callback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Should navigate to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Verify dashboard shows user data
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('resume-count')).toHaveTextContent('2 resumes');

      // Click edit on first resume
      fireEvent.click(screen.getByTestId('edit-resume-1'));

      // Should navigate to resume builder
      await waitFor(() => {
        expect(screen.getByTestId('resume-builder')).toBeInTheDocument();
      });

      // Verify resume builder shows resume data
      expect(screen.getByTestId('resume-title')).toHaveTextContent('Software Engineer Resume');
      expect(screen.getByTestId('resume-id')).toHaveTextContent('1');

      // Update resume title
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Updated Software Engineer Resume' }
      });

      // Save resume
      fireEvent.click(screen.getByTestId('save-resume'));

      // Wait for save to complete
      await waitFor(() => {
        expect(mockResumeApi.updateResume).toHaveBeenCalledWith('1', expect.objectContaining({
          title: 'Updated Software Engineer Resume',
        }));
      });

      // Navigate back to dashboard
      fireEvent.click(screen.getByTestId('back-to-dashboard'));

      // Should be back at dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Verify all API calls were made
      expect(mockUnifiedAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockResumeApi.getUserResumes).toHaveBeenCalled();
      expect(mockResumeApi.getResume).toHaveBeenCalledWith('1');
      expect(mockResumeApi.updateResume).toHaveBeenCalled();
    });

    it('should handle new resume creation flow', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Setup authenticated state
      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Mock dashboard data
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });

      // Mock new resume creation
      mockResumeApi.createResume.mockResolvedValue({
        success: true,
        data: {
          id: '3',
          title: 'New Resume',
          status: 'draft',
          personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
          },
          createdAt: '2023-01-01T15:00:00Z',
        },
      });

      render(<TestApp />);

      // Should start at dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Click create new resume
      fireEvent.click(screen.getByTestId('create-resume'));

      // Should navigate to resume builder for new resume
      await waitFor(() => {
        expect(screen.getByTestId('resume-builder')).toBeInTheDocument();
      });

      // Verify new resume was created
      expect(mockResumeApi.createResume).toHaveBeenCalledWith({
        title: 'New Resume',
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      });

      // Verify resume builder shows new resume
      expect(screen.getByTestId('resume-title')).toHaveTextContent('New Resume');
      expect(screen.getByTestId('resume-id')).toHaveTextContent('3');
    });
  });

  describe('Authentication State Persistence in Components', () => {
    it('should maintain authentication state across component navigation', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      let authStateCallback: any;

      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        callback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Mock API responses
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [{ id: '1', title: 'Test Resume' }],
        total: 1,
      });

      mockResumeApi.getResume.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'Test Resume' },
      });

      render(<TestApp />);

      // Should start authenticated at dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      // Navigate to resume builder
      fireEvent.click(screen.getByTestId('edit-resume-1'));

      await waitFor(() => {
        expect(screen.getByTestId('resume-builder')).toBeInTheDocument();
      });

      // Navigate back to dashboard
      fireEvent.click(screen.getByTestId('back-to-dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      // Authentication state should be maintained throughout
      expect(mockUnifiedAuthService.onAuthStateChange).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication state changes during navigation', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      let authStateCallback: any;

      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        // Start unauthenticated
        callback({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(false);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(null);

      render(<TestApp />);

      // Should show unauthenticated state
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-unauthenticated')).toBeInTheDocument();
      });

      // Simulate authentication state change (e.g., from another tab)
      act(() => {
        mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
        mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);
        
        authStateCallback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
      });

      // Mock API response for authenticated state
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });

      // Should now show authenticated dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });
    });
  });

  describe('Error Handling in Component Context', () => {
    it('should handle API errors gracefully in dashboard', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Mock API error
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: false,
        error: 'Failed to load resumes',
        data: [],
        total: 0,
      });

      render(<TestApp />);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-error')).toHaveTextContent('Failed to load resumes');
      });
    });

    it('should handle authentication errors during API calls', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      let authStateCallback: any;

      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        callback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Mock authentication error
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: false,
        error: 'Authentication required',
        data: [],
        total: 0,
      });

      render(<TestApp />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
      });

      // Simulate auth state change to unauthenticated
      act(() => {
        mockUnifiedAuthService.isAuthenticated.mockReturnValue(false);
        mockUnifiedAuthService.getStoredUser.mockReturnValue(null);
        
        authStateCallback({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });

      // Should show unauthenticated state
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-unauthenticated')).toBeInTheDocument();
      });
    });

    it('should handle network errors with retry capability', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        callback({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
        });
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Mock network error first, then success
      mockResumeApi.getUserResumes
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: '1', title: 'Test Resume' }],
          total: 1,
        });

      render(<TestApp />);

      // Should eventually show successful data after retry
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('resume-count')).toHaveTextContent('1 resumes');
      }, { timeout: 3000 });
    });

    it('should handle loading states properly', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        // Start with loading state
        callback({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: true,
        });
        
        // Then transition to authenticated
        setTimeout(() => {
          callback({
            user: mockUser,
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
          });
        }, 100);
        
        return vi.fn();
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(false);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(null);

      // Mock slow API response
      mockResumeApi.getUserResumes.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              data: [],
              total: 0,
            });
          }, 200);
        })
      );

      render(<TestApp />);

      // Should show loading state initially
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();

      // Update mocks for authenticated state
      act(() => {
        mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
        mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);
      });

      // Should eventually show dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});