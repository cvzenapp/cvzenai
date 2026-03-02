/**
 * Token Debugger - Intercepts localStorage operations to catch invalid token writes
 * This helps identify where the token is being set to "null" string
 */

// Store original localStorage methods
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
const originalClear = localStorage.clear.bind(localStorage);

// Track token changes
let lastValidToken: string | null = null;

/**
 * Initialize token debugger
 * Wraps localStorage methods to log and validate token operations
 */
export function initTokenDebugger() {
  console.log('🔍 Token Debugger initialized');
  
  // Get initial token state
  lastValidToken = localStorage.getItem('authToken');
  console.log('🔍 Initial token state:', {
    hasToken: !!lastValidToken,
    tokenPrefix: lastValidToken?.substring(0, 20) + '...',
    isValid: lastValidToken && lastValidToken !== 'null' && lastValidToken !== 'undefined'
  });

  // Intercept setItem
  localStorage.setItem = function(key: string, value: string) {
    if (key === 'authToken') {
      console.log('🔍 localStorage.setItem("authToken") called:', {
        value: value,
        valueType: typeof value,
        valueLength: value?.length,
        isNull: value === 'null',
        isUndefined: value === 'undefined',
        isEmpty: value === '',
        looksLikeJWT: value?.includes('.') && value?.split('.').length === 3,
        stackTrace: new Error().stack
      });

      // Validate token before storing
      if (value === 'null' || value === 'undefined' || value === '' || !value) {
        console.error('🚨 INVALID TOKEN DETECTED - Preventing storage of invalid token:', {
          value: value,
          type: typeof value,
          stackTrace: new Error().stack
        });
        
        // Don't store invalid tokens - remove instead
        console.log('🧹 Removing invalid token instead of storing it');
        originalRemoveItem('authToken');
        originalRemoveItem('user');
        return;
      }

      // Check if token looks like a JWT
      if (!value.includes('.') || value.split('.').length !== 3) {
        console.warn('⚠️ Token does not look like a JWT:', {
          value: value.substring(0, 50) + '...',
          parts: value.split('.').length
        });
      }

      lastValidToken = value;
    }
    
    originalSetItem(key, value);
  };

  // Intercept removeItem
  localStorage.removeItem = function(key: string) {
    if (key === 'authToken') {
      console.log('🔍 localStorage.removeItem("authToken") called:', {
        hadToken: !!lastValidToken,
        stackTrace: new Error().stack
      });
      lastValidToken = null;
    }
    
    originalRemoveItem(key);
  };

  // Intercept clear
  localStorage.clear = function() {
    console.log('🔍 localStorage.clear() called - all auth data will be removed:', {
      hadToken: !!lastValidToken,
      stackTrace: new Error().stack
    });
    lastValidToken = null;
    
    originalClear();
  };
}

/**
 * Get the last valid token that was stored
 */
export function getLastValidToken(): string | null {
  return lastValidToken;
}

/**
 * Validate current token in localStorage
 */
export function validateCurrentToken(): boolean {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.log('🔍 No token in localStorage');
    return false;
  }

  if (token === 'null' || token === 'undefined' || token === '') {
    console.error('🚨 Invalid token in localStorage:', token);
    return false;
  }

  if (!token.includes('.') || token.split('.').length !== 3) {
    console.warn('⚠️ Token does not look like a JWT');
    return false;
  }

  console.log('✅ Token validation passed');
  return true;
}

/**
 * Clean up invalid tokens from localStorage
 */
export function cleanupInvalidTokens(): void {
  const token = localStorage.getItem('authToken');
  
  if (token === 'null' || token === 'undefined' || token === '') {
    console.log('🧹 Cleaning up invalid token from localStorage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}
