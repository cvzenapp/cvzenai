import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
// Template content initialization removed - using customization feature instead
// import { initializeTemplateContent } from "@/services/templateContentInitializer";
import { AuthProvider } from "@/contexts/AuthContext";

import LandingPage from "./pages/LandingPage";
import ResumeViewer from "./pages/ResumeViewer";
import ResumeBuilder from "./pages/ResumeBuilder";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import Templates from "./pages/Templates";
import Pricing from "./pages/Pricing";
import { InterviewsPage } from "./pages/InterviewsPage";
import { InterviewDemo } from "./pages/InterviewDemo";
import { InterviewJoinPage } from "./pages/InterviewJoinPage";
import StreamingChatDemo from "./pages/StreamingChatDemo";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import RecruiterLogin from "./pages/RecruiterLogin";
import RecruiterRegister from "./pages/RecruiterRegister";
import RecruiterForgotPassword from "./pages/RecruiterForgotPassword";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterSubscription from "./pages/RecruiterSubscription";
import RecruiterSubscriptionPlans from "./pages/RecruiterSubscriptionPlans";
import JobSeekerSubscription from "./pages/JobSeekerSubscription";
import JobSeekerSubscriptionPlans from "./pages/JobSeekerSubscriptionPlans";
import RefereeResponse from "./pages/RefereeResponse";
import CompanyProfile from "./pages/CompanyProfile";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Disclaimer from "./pages/Disclaimer";
import RefundPolicy from "./pages/RefundPolicy";
import RecruiterTermsOfService from "./pages/recruiter/RecruiterTermsOfService";
import RecruiterPrivacyPolicy from "./pages/recruiter/RecruiterPrivacyPolicy";
import RecruiterDisclaimer from "./pages/recruiter/RecruiterDisclaimer";
import RecruiterRefundPolicy from "./pages/recruiter/RecruiterRefundPolicy";
import RecruiterLanding from "./pages/recruiter/RecruiterLanding";
import SetupPassword from "./pages/SetupPassword";
import { JobSearch } from "./pages/JobSearch";
import FakeJobDetectorPublic from "./pages/FakeJobDetectorPublic";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import NotFound from "./pages/NotFound";

// Create queryClient outside component to prevent re-creation on every render
const queryClient = new QueryClient();

const App = () => {
  // Template content initialization removed - using customization feature instead
  // useEffect(() => {
  //   initializeTemplateContent();
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/resume/:id?" element={<ResumeViewer />} />
              <Route path="/builder" element={<ResumeBuilder />} />
              <Route path="/builder/*" element={<ResumeBuilder />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Dashboard />} />
              <Route path="/setup-password" element={<SetupPassword />} />
              <Route path="/job-search" element={<JobSearch />} />
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/interview/:interviewId/join" element={<InterviewJoinPage />} />
              <Route path="/interview-demo" element={<InterviewDemo />} />
              <Route path="/streaming-chat-demo" element={<StreamingChatDemo />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
  
              {/* Recruiter Routes */}
              <Route path="/recruiter" element={<RecruiterLanding />} />
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route path="/recruiter/register" element={<RecruiterRegister />} />
              <Route
                path="/recruiter/forgot-password"
                element={<RecruiterForgotPassword />}
              />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/recruiter/subscription" element={<RecruiterSubscription />} />
              <Route path="/recruiter/subscription/plans" element={<RecruiterSubscriptionPlans />} />
              
              {/* Job Seeker Subscription */}
              <Route path="/subscription" element={<JobSeekerSubscription />} />
              <Route path="/subscription/plans" element={<JobSeekerSubscriptionPlans />} />

              {/* Recruiter Legal Pages */}
              <Route path="/recruiter/terms-of-service" element={<RecruiterTermsOfService />} />
              <Route path="/recruiter/privacy-policy" element={<RecruiterPrivacyPolicy />} />
              <Route path="/recruiter/disclaimer" element={<RecruiterDisclaimer />} />
              <Route path="/recruiter/refund-policy" element={<RecruiterRefundPolicy />} />
  
              {/* Referral Routes */}
              <Route path="/referral/:token" element={<RefereeResponse />} />
  
              {/* Shared Resume Routes */}
              <Route path="/shared/resume/:shareToken" element={<ResumeViewer />} />
  
              {/* Company Profile Routes */}
              <Route path="/company/:slug" element={<CompanyProfile />} />

              {/* Public Tools */}
              <Route path="/tools/fake-job-detector" element={<FakeJobDetectorPublic />} />

              {/* Payment Routes */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />

              {/* Legal Pages */}
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
