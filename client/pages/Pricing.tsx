import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';
import { subscriptionApi } from '@/services/subscriptionApi';
import { paymentApi } from '@/services/paymentApi';
import type { SubscriptionPlan } from '@shared/subscription';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import RecruiterAuthModal from '@/components/RecruiterAuthModal';
import CVZenLogo from '@/components/CVZenLogo';

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'candidate' | 'recruiter'>('candidate');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRecruiterAuthModal, setShowRecruiterAuthModal] = useState(false);
  const [selectedPlanForAuth, setSelectedPlanForAuth] = useState<string | null>(null);

  useEffect(() => {
    // Check for user without using auth context
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    loadPlans();
  }, [userType]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/subscriptions/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const allPlans = data.success ? data.data : data;
        
        // Filter plans by userType on frontend
        const filteredPlans = allPlans.filter(plan => plan.userType === userType);
        
        // Sort plans: for recruiters, put Enterprise last
        if (userType === 'recruiter') {
          const sortedPlans = filteredPlans.sort((a, b) => {
            if (a.name === 'enterprise') return 1;
            if (b.name === 'enterprise') return -1;
            return a.priceMonthly - b.priceMonthly;
          });
          setPlans(sortedPlans);
        } else {
          setPlans(filteredPlans);
        }
      } else {
        console.error('Failed to load plans:', response.status);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInPaise: number) => {
    if (priceInPaise === 0) return 'Free';
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`;
  };

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      // Store the selected plan and show appropriate auth modal
      setSelectedPlanForAuth(planName);
      if (userType === 'recruiter') {
        setShowRecruiterAuthModal(true);
      } else {
        setShowAuthModal(true);
      }
      return;
    }
    
    // User is authenticated, proceed with plan selection
    await proceedWithPlanSelection(planName);
  };

  const proceedWithPlanSelection = async (planName: string) => {
    if (planName === 'free') {
      return; // Already on free plan
    }
    
    if (planName === 'enterprise') {
      return; // Coming soon
    }
    
    // Find the selected plan
    const selectedPlan = plans.find(p => p.name === planName);
    if (!selectedPlan) {
      console.error('Plan not found');
      return;
    }
    
    try {
      setLoading(true);
      
      // Initiate payment
      const response = await paymentApi.initiatePayment(selectedPlan.id, 'monthly');
      
      if (response.success && response.redirectUrl) {
        // Redirect to payment gateway
        window.location.href = response.redirectUrl;
      } else {
        console.error('Payment initiation failed:', response.error);
        alert('Payment initiation failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    // Close modals
    setShowAuthModal(false);
    setShowRecruiterAuthModal(false);
    
    // Proceed with the selected plan if one was stored
    if (selectedPlanForAuth) {
      proceedWithPlanSelection(selectedPlanForAuth);
      setSelectedPlanForAuth(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background">
      {/* Public Header */}
      <header className="bg-brand-background border-b border-brand-main/20 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-2">
            <CVZenLogo className="h-10 sm:h-12 md:h-14 w-auto" showCaption={true} />
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard')}
                    className="text-white hover:text-brand-main"
                  >
                    Dashboard
                  </Button>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if (userType === 'recruiter') {
                        setShowRecruiterAuthModal(true);
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                    className="text-white hover:text-brand-main"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => {
                      if (userType === 'recruiter') {
                        setShowRecruiterAuthModal(true);
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                    className="bg-brand-main hover:bg-blue-700 text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-jakarta font-semibold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl font-jakarta text-brand-auxiliary-1 mb-8">
            Select the perfect plan for your needs
          </p>

          {/* User Type Toggle */}
          <div className="inline-flex rounded-lg border border-brand-main/30 p-1 bg-white/10 backdrop-blur-sm">
            <button
              onClick={() => setUserType('candidate')}
              className={`px-6 py-3 rounded-md transition-colors font-jakarta font-medium ${
                userType === 'candidate'
                  ? 'bg-brand-main text-white'
                  : 'text-brand-auxiliary-1 hover:text-white'
              }`}
            >
              For Candidates
            </button>
            <button
              onClick={() => setUserType('recruiter')}
              className={`px-6 py-3 rounded-md transition-colors font-jakarta font-medium ${
                userType === 'recruiter'
                  ? 'bg-brand-main text-white'
                  : 'text-brand-auxiliary-1 hover:text-white'
              }`}
            >
              For Recruiters
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main mx-auto"></div>
          </div>
        ) : (
          <div className={`grid gap-8 ${
            userType === 'candidate' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'
          } max-w-6xl mx-auto`}>
            {plans.map((plan) => {
              const isPopular = plan.name === 'pro' || plan.name === 'growth';
              const isFree = plan.priceMonthly === 0;
              const isEnterprise = plan.name === 'enterprise';
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${
                    isPopular ? 'ring-2 ring-brand-main scale-105' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-main text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                        <Zap size={12} />
                        Popular
                      </span>
                    </div>
                  )}
                  
                  {isEnterprise && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-slate-600 text-white px-3 py-1 rounded-full text-xs">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-jakarta font-semibold text-brand-background mb-2">
                      {plan.displayName}
                    </h3>
                    <div className="text-3xl md:text-4xl font-jakarta font-bold text-brand-main mb-1">
                      {formatPrice(plan.priceMonthly)}
                    </div>
                    {!isFree && !isEnterprise && (
                      <div className="text-slate-500 text-sm font-jakarta">/month</div>
                    )}
                  </div>

                  {/* Top 5 Key Features */}
                  <ul className="space-y-2 mb-6 min-h-[120px]">
                    {/* Show limits first for recruiter plans */}
                    {userType === 'recruiter' && plan.limits.job_postings && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm font-jakarta leading-tight">
                          {plan.limits.job_postings === -1 ? 'Unlimited' : plan.limits.job_postings} active job postings
                        </span>
                      </li>
                    )}
                    {userType === 'recruiter' && plan.limits.ai_screening_monthly && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm font-jakarta leading-tight">
                          {plan.limits.ai_screening_monthly === -1 ? 'Unlimited' : `${plan.limits.ai_screening_monthly} candidates/mo`} AI screening
                        </span>
                      </li>
                    )}
                    {userType === 'recruiter' && plan.limits.jd_generation_monthly !== undefined && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm font-jakarta leading-tight">
                          {plan.limits.jd_generation_monthly === -1 ? 'Unlimited' : `${plan.limits.jd_generation_monthly} JDs/mo`} job descriptions
                        </span>
                      </li>
                    )}
                    {userType === 'recruiter' && plan.limits.resume_parsing_monthly && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm font-jakarta leading-tight">
                          {plan.limits.resume_parsing_monthly === -1 ? 'Unlimited' : `${plan.limits.resume_parsing_monthly}/mo`} resume parsing
                        </span>
                      </li>
                    )}
                    
                    {/* Show key features */}
                    {Object.entries(plan.features).slice(0, userType === 'recruiter' ? 2 : 5).map(([key, value]) => {
                      if (typeof value === 'boolean' && value) {
                        // Skip features already shown in limits
                        if (userType === 'recruiter' && ['active_job_postings', 'ai_candidate_screening', 'ai_jd_generation', 'resume_parsing'].includes(key)) {
                          return null;
                        }
                        
                        const displayName = key
                          .replace(/_/g, ' ')
                          .replace(/([A-Z])/g, ' $1')
                          .trim();
                        
                        return (
                          <li key={key} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700 text-sm font-jakarta leading-tight capitalize">
                              {displayName}
                            </span>
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`w-full text-sm font-jakarta font-medium py-3 ${
                      isPopular
                        ? 'bg-brand-main hover:bg-blue-700'
                        : 'bg-brand-background hover:bg-slate-800'
                    }`}
                    disabled={isFree && !!user || isEnterprise}
                  >
                    {isFree ? 'Current Plan' : isEnterprise ? 'Coming Soon' : 'Get Started'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Enterprise CTA */}
        {userType === 'recruiter' && (
          <div className="mt-12 text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-jakarta font-semibold text-brand-background mb-4">
                Need Enterprise Features?
              </h3>
              <p className="text-slate-600 font-jakarta text-base mb-6">
                Private deployment, custom integrations, SLA, and dedicated support
              </p>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-brand-main hover:bg-blue-700 text-white font-jakarta font-medium"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setSelectedPlanForAuth(null);
        }}
        onSuccess={handleAuthSuccess}
        defaultMode="signup"
      />

      <RecruiterAuthModal
        isOpen={showRecruiterAuthModal}
        onCancel={() => {
          setShowRecruiterAuthModal(false);
          setSelectedPlanForAuth(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
