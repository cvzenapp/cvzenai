/**
 * Authentication Context Tests
 * Tests for authentication state management across page navigation
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { unifiedAuthService } from '../services/unifiedAuthService';

import { vi } from 'vitest';

// Mock the unified auth service
vi.mock('../services/unifiedAuthService', () => ({
  unifiedAuthService: {
    onAuthStateChange: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

const mockUnifiedAuthService = unifiedAuthService as any;

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-state">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-name">{user?.name || 'no-user'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the onAuthStateChange to immediately call with initial state
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return vi.fn(); // Return unsubscribe function
    });
  });

  it('should provide initial authentication state', async () => {
    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
    });
  });

  it('should update state when user logs in', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    mockUnifiedAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      token: 'test-token',
    });

    // Mock state change after login
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      // Initial state
      callback({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Simulate login state change
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

    renderWithProviders(<TestComponent />);
    
    const loginButton = screen.getByText('Login');
    act(() => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  it('should handle logout correctly', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    // Start with authenticated state
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback({
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
      });
      return vi.fn();
    });

    mockUnifiedAuthService.logout.mockResolvedValue();

    renderWithProviders(<TestComponent />);
    
    // Initially authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
    });

    // Mock logout state change
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return vi.fn();
    });

    const logoutButton = screen.getByText('Logout');
    act(() => {
      logoutButton.click();
    });

    await waitFor(() => {
      expect(mockUnifiedAuthService.logout).toHaveBeenCalled();
    });
  });

  it('should show loading state during initialization', async () => {
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
      });
      return vi.fn();
    });

    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('auth-state')).toHaveTextContent('loading');
  });

  it('should handle authentication state persistence', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    // Simulate restored authentication state from storage
    mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback({
        user: mockUser,
        token: 'stored-token',
        isAuthenticated: true,
        isLoading: false,
      });
      return vi.fn();
    });

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });
});