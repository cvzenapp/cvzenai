import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unifiedAuthService } from "@/services/unifiedAuthService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Debug modal open state
  // useEffect(() => {
  //   console.log('🔓 AuthModal isOpen changed:', isOpen);
  //   if (isOpen) {
  //     setDebugInfo('Modal opened');
  //   }
  // }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 AuthModal: Form submitted', { mode, email });
    setDebugInfo(`Submitting ${mode}...`);
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        console.log('🔐 AuthModal: Calling login API...');
        setDebugInfo('Calling login API...');
        
        const result = await unifiedAuthService.login({ email, password });
        console.log('🔐 AuthModal: Login result:', result);
        console.log('🔐 AuthModal: Token from result:', result.token);
        console.log('🔐 AuthModal: User from result:', result.user);
        setDebugInfo(`Login result: ${result.success ? 'success' : 'failed'}`);
        
        if (!result.success) {
          console.error('❌ AuthModal: Login failed:', result.message);
          setError(result.message || 'Login failed');
          setDebugInfo(`Login failed: ${result.message}`);
          setLoading(false);
          return;
        }
        
        // Verify token was stored
        const storedToken = localStorage.getItem('authToken');
        console.log('🔐 AuthModal: Token stored in localStorage:', storedToken);
        
        console.log('✅ AuthModal: Login successful');
        setDebugInfo('Login successful!');
      } else {
        console.log('🔐 AuthModal: Calling register API...');
        setDebugInfo('Calling register API...');
        
        // Split name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        
        console.log('📝 AuthModal: Register data:', { firstName, lastName, email });
        
        const result = await unifiedAuthService.register({
          firstName,
          lastName,
          email,
          password,
          confirmPassword: password,
          acceptTerms: true
        });
        
        console.log('🔐 AuthModal: Register result:', result);
        setDebugInfo(`Register result: ${result.success ? 'success' : 'failed'}`);
        
        if (!result.success) {
          console.error('❌ AuthModal: Registration failed:', result.message);
          setError(result.message || 'Registration failed');
          setDebugInfo(`Registration failed: ${result.message}`);
          setLoading(false);
          return;
        }
        
        console.log('✅ AuthModal: Registration successful');
        setDebugInfo('Registration successful!');
      }
      
      // Success - close modal and call onSuccess
      console.log('✅ AuthModal: Calling onSuccess callback');
      setDebugInfo('Calling onSuccess...');
      onSuccess();
    } catch (err: any) {
      console.error('❌ AuthModal: Exception caught:', err);
      setError(err.message || 'Authentication failed');
      setDebugInfo(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-brand-background text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'login' ? 'Welcome Back to CVZen' : 'Create Account'}
                </h2>
                <p className="text-brand-auxiliary-1 text-sm">
                  {mode === 'login' ? 'Sign in to build your digital CV' : 'Sign up to start building'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {debugInfo && (
                <div className="bg-brand-auxiliary-1/20 border border-brand-main/30 text-brand-main px-4 py-2 rounded-lg text-xs">
                  Debug: {debugInfo}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-brand-main transition-colors"
                      placeholder="Alex Morgan"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-brand-main transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-brand-main transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="bg-brand-main hover:bg-brand-main/90 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError('');
                  }}
                  className="text-sm text-brand-main hover:text-brand-main/80 font-medium transition-colors"
                >
                  {mode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
