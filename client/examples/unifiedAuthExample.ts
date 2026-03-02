/**
 * Unified Authentication System Usage Example
 * Demonstrates how to use the unified authentication system
 */

import { unifiedAuthService } from '../services/unifiedAuthService';
import { resumeApi } from '../services/resumeApi';

/**
 * Example: Complete authentication flow
 */
export async function demonstrateAuthFlow() {
  console.log('🔐 Unified Authentication System Demo');
  
  try {
    // 1. Login user
    console.log('1. Logging in user...');
    const loginResult = await unifiedAuthService.login({
      email: 'demo@example.com',
      password: 'password123'
    });
    
    if (loginResult.success) {
      console.log('✅ Login successful:', loginResult.user?.email);
      console.log('🎫 Token received:', loginResult.token?.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed:', loginResult.message);
      return;
    }
    
    // 2. Check authentication state
    console.log('\n2. Checking authentication state...');
    const authState = unifiedAuthService.getAuthState();
    console.log('🔍 Is authenticated:', authState.isAuthenticated);
    console.log('👤 Current user:', authState.user?.email);
    
    // 3. Make authenticated API call to resume service
    console.log('\n3. Making authenticated resume API call...');
    const resumesResult = await resumeApi.getUserResumes();
    
    if (resumesResult.success) {
      console.log('✅ Resume API call successful');
      console.log('📄 Found resumes:', resumesResult.data?.length || 0);
    } else {
      console.log('❌ Resume API call failed:', resumesResult.error);
    }
    
    // 4. Demonstrate state management
    console.log('\n4. Demonstrating state management...');
    const unsubscribe = unifiedAuthService.onAuthStateChange((state) => {
      console.log('🔄 Auth state changed:', {
        isAuthenticated: state.isAuthenticated,
        userEmail: state.user?.email,
        isLoading: state.isLoading
      });
    });
    
    // 5. Logout
    console.log('\n5. Logging out...');
    await unifiedAuthService.logout();
    console.log('✅ Logout successful');
    
    // Cleanup
    unsubscribe();
    
  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

/**
 * Example: Error handling and token refresh
 */
export async function demonstrateErrorHandling() {
  console.log('\n🛡️ Error Handling Demo');
  
  try {
    // Simulate expired token scenario
    console.log('1. Simulating expired token scenario...');
    
    // This would normally trigger automatic token refresh
    const resumesResult = await resumeApi.getUserResumes();
    
    if (!resumesResult.success) {
      console.log('⚠️ API call failed (expected with expired token)');
      console.log('🔄 System should automatically handle token refresh');
    }
    
    // Demonstrate manual token refresh
    console.log('\n2. Manual token refresh...');
    const refreshResult = await unifiedAuthService.refreshToken();
    
    if (refreshResult.success) {
      console.log('✅ Token refresh successful');
    } else {
      console.log('❌ Token refresh failed:', refreshResult.message);
    }
    
  } catch (error) {
    console.error('❌ Error handling demo error:', error);
  }
}

/**
 * Example: React component integration
 */
export const AuthExampleComponent = `
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthExample: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'demo@example.com',
      password: 'password123'
    });
    
    if (result.success) {
      console.log('Login successful!');
    } else {
      console.error('Login failed:', result.message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Welcome, {user?.name}!</h2>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <h2>Please log in</h2>
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
    </div>
  );
};
`;

/**
 * Key Benefits of the Unified Authentication System:
 * 
 * 1. **Consistent Token Handling**: All API services use the same authentication mechanism
 * 2. **Automatic Token Refresh**: 401 responses trigger automatic token refresh and retry
 * 3. **Centralized State Management**: Authentication state is managed in one place
 * 4. **Error Handling**: Consistent error handling across all services
 * 5. **React Integration**: Easy integration with React components via context
 * 6. **Backward Compatibility**: Maintains compatibility with existing code
 * 7. **Type Safety**: Full TypeScript support with proper interfaces
 * 8. **Testing**: Comprehensive test coverage for reliability
 */

export const UNIFIED_AUTH_BENEFITS = {
  consistency: 'All API calls use the same authentication headers and token handling',
  reliability: 'Automatic token refresh and retry mechanisms prevent authentication failures',
  maintainability: 'Centralized authentication logic makes the codebase easier to maintain',
  userExperience: 'Seamless authentication flow without interruptions',
  security: 'Proper token validation and secure storage practices',
  scalability: 'Easy to extend with new authentication features'
};

console.log('📚 Unified Authentication System Examples loaded');
console.log('💡 Run demonstrateAuthFlow() to see the system in action');
console.log('🛡️ Run demonstrateErrorHandling() to see error handling');