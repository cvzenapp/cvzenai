import { useState, useEffect, startTransition } from 'react';
import { useDispatch } from 'react-redux';
import { X, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import RecruiterRegistrationForm from './RecruiterRegistrationForm';
import { loginStart, loginSuccess, loginFailure } from '../store/recruiterSlice';
import { AppDispatch } from '../store';

interface RecruiterLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
  // Additional props for CV shortlisting functionality
  resumeId?: string;
  shareToken?: string;
  shouldShortlistOnLogin?: boolean;
}

export default function RecruiterLoginModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Recruiter Login Required",
  message = "Please log in as a recruiter to perform this action.",
  resumeId,
  shareToken,
  shouldShortlistOnLogin = false
}: RecruiterLoginModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Force re-render when success state changes
  useEffect(() => {
    console.log('🔄 [RecruiterLoginModal] State update:', {
      isLogin,
      successMessage,
      error,
      emailPreFilled: loginData.email
    });
  }, [isLogin, successMessage, error, loginData.email]);


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await fetch('/api/recruiter/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await result.json();

      if (data.success) {
        console.log('✅ API SUCCESS - Starting state updates');
        
        try {
          // Store tokens in localStorage
          localStorage.setItem('recruiter_token', data.token);
          localStorage.setItem('recruiter_user', JSON.stringify(data.recruiter));
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.recruiter));
          console.log('💾 Tokens stored in localStorage');
          
          // Update Redux store
          dispatch(loginSuccess({
            user: data.recruiter,
            token: data.token
          }));
          console.log('💾 Redux store updated');
          
          // Update loading state
          setLoading(false);
          setSuccessMessage(`✅ Welcome ${data.recruiter.firstName}! You are now logged in.`);
          
          // Brief delay to show success message
          setTimeout(() => {
            onClose();
            onSuccess();
          }, 1500);
          
        } catch (error) {
          console.error('💥 ERROR in success handler:', error);
          dispatch(loginFailure('Login successful but session setup failed'));
          setError('Login successful but something went wrong');
          setLoading(false);
        }
        
      } else {
        setError(data.message || data.error || 'Invalid email or password. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleSignupSuccess = (registrationData?: any) => {
    console.log('FINAL FIX FOR HIS MEMORY - Registration success');
    
    // Store auth data if available
    if (registrationData?.token && registrationData?.recruiter) {
      localStorage.setItem('recruiter_token', registrationData.token);
      localStorage.setItem('recruiter_user', JSON.stringify(registrationData.recruiter));
      localStorage.setItem('authToken', registrationData.token);
      localStorage.setItem('user', JSON.stringify(registrationData.recruiter));
      
      // Update Redux store for immediate registration with auto-login
      dispatch(loginSuccess({
        user: registrationData.recruiter,
        token: registrationData.token
      }));
    }
    
    // Get email for pre-population
    const email = registrationData?.email || registrationData?.recruiter?.email || '';
    
    // Force all state updates immediately
    setError('');
    setLoading(false);
    setIsLogin(true);  // Switch to login tab
    setSuccessMessage('🎉 Registration successful! Please log in to continue with shortlisting.');
    setLoginData({ email: email, password: '' });
    
    console.log('STATE UPDATED - Tab should switch to login now');
  };
  
  const handleSignupError = (error: string) => {
    setError(error);
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  console.log('🎨 [RecruiterLoginModal] Rendering modal with isLogin:', isLogin, 'successMessage:', successMessage, 'error:', error);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle between Login/Signup */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              console.log('💆 [RecruiterLoginModal] Login tab clicked');
              setIsLogin(true);
              setError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              isLogin 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              console.log('💆 [RecruiterLoginModal] Sign Up tab clicked');
              setIsLogin(false);
              setError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              !isLogin 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <p className="text-sm text-green-600 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {isLogin ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData(prev => ({ ...prev, email: e.target.value }));
                      // Clear success message when user starts typing
                      if (successMessage) setSuccessMessage('');
                    }}
                    className="pl-10"
                    placeholder="recruiter@company.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData(prev => ({ ...prev, password: e.target.value }));
                      // Clear success message when user starts typing
                      if (successMessage) setSuccessMessage('');
                    }}
                    className="pl-10"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !loginData.email || !loginData.password}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Login & Start Shortlisting'
                )}
              </Button>
            </form>
          ) : (
            /* Reusable Signup Form */
            <RecruiterRegistrationForm
              onSuccess={handleSignupSuccess}
              onError={handleSignupError}
              compact={false}
              showSteps={true}
              className=""
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            By {isLogin ? 'logging in' : 'signing up'}, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
