import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Star,
  Users,
  Download,
  CheckCircle,
  FileText,
  Briefcase,
  Eye,
  Share2,
  Zap,
  Shield,
  Sparkles,
  Menu,
  X,
  Target,
  TrendingUp,
  Upload,
  Leaf,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { authApi } from "@/services/authApi";
import { SustainabilityPledgeModal } from "@/components/SustainabilityPledgeModal";
import QuickSignupModal from "@/components/QuickSignupModal";
import AuthModal from "@/components/AuthModal";
import RecruiterAuthModal from "@/components/RecruiterAuthModal";
import CVZenLogo from "@/components/CVZenLogo";
import AITrainingInfoModal from "@/components/AITrainingInfoModal";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pledgeModalOpen, setPledgeModalOpen] = useState(true);
  const [quickSignupModalOpen, setQuickSignupModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [recruiterAuthModalOpen, setRecruiterAuthModalOpen] = useState(false);
  const [aiTrainingModalOpen, setAiTrainingModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  const features: Feature[] = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI-Powered Resume Builder",
      description:
        "Intelligent resume creation with AI suggestions, ATS optimization, and real-time scoring",
      highlight: true,
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Smart Resume Parsing",
      description: "Upload existing cvs and let AI extract and structure your information automatically",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "ATS Score & Optimization",
      description: "Get instant ATS compatibility scores with AI-powered improvement suggestions",
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Professional Resume Sharing",
      description: "Share resumes with custom links, track views, and collect upvotes from recruiters",
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Job Matching Engine",
      description: "AI-powered job recommendations based on your skills and experience",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Fake Job Detection",
      description: "Protect yourself with AI-powered fraud detection for job postings",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Recruiter Portal",
      description: "Dedicated platform for recruiters to post jobs, screen candidates, and manage applications",
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "AI Resume Screening",
      description: "Automated candidate screening with intelligent matching and ranking",
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Multiple Export Formats",
      description: "Download professional PDFs or share with custom branded links",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      avatar:"",
      content:
        "This platform helped me land my dream job at Google. The templates are professional and the builder is intuitive.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Product Manager",
      company: "Meta",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content:
        "I've tried many resume builders, but this one stands out. The AI suggestions saved me hours of work.",
      rating: 5,
    },
    {
      name: "Emily Johnson",
      role: "UX Designer",
      company: "Apple",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content:
        "The design templates are beautiful and modern. Got 3x more interview calls after switching to this platform.",
      rating: 5,
    },
  ];

  const stats: Stat[] = [
    {
      value: "100K+",
      label: "Resumes Created",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      value: "50K+",
      label: "Job Offers",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      value: "98%",
      label: "Success Rate",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      value: "4.9/5",
      label: "User Rating",
      icon: <Star className="h-5 w-5" />,
    },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/builder");
    } else {
      setQuickSignupModalOpen(true);
    }
  };

  const handleJobSeekerAuth = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      setAuthModalMode('signup');
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    setIsAuthenticated(true);
    navigate("/builder");
  };

  const handleRecruiterAuthSuccess = () => {
    setRecruiterAuthModalOpen(false);
    navigate("/recruiter/dashboard");
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthModalMode('signup');
    setAuthModalOpen(true);
  };

  const openRecruiterModal = () => {
    setRecruiterAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-background border-b border-brand-main/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <CVZenLogo className="h-10 sm:h-12 md:h-14 w-auto" showCaption={true} />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/features"
                className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
              >
                Pricing
              </Link>
              <button
                onClick={() => setPledgeModalOpen(true)}
                className="text-brand-main hover:text-brand-auxiliary-1 transition-colors flex items-center gap-1 font-normal"
              >
                <Leaf className="h-4 w-4" />
                Take Pledge
              </button>
              {/* {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
                >
                  Dashboard
                </Link>
              )} */}
              {/* {!isAuthenticated && (
                <>
                  <button
                    onClick={openLoginModal}
                    className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
                  >
                    Login
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
                  >
                    Register
                  </button>
                </>
              )} */}
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="bg-brand-main hover:bg-brand-main/90">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={openRecruiterModal}
                    className="border-brand-auxiliary-1 bg-transparent text-brand-auxiliary-1 hover:bg-brand-auxiliary-1 hover:text-brand-background"
                  >
                    For Recruiters
                  </Button>
                  <Button onClick={handleJobSeekerAuth} className="bg-brand-main hover:bg-brand-main/90">Job Seeker</Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:text-brand-main"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-brand-main/20 bg-brand-background">
              <div className="flex flex-col gap-4">
                <Link
                  to="/features"
                  className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className="text-brand-auxiliary-1 hover:text-brand-main transition-colors font-normal"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {!isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openLoginModal();
                      }}
                      className="text-brand-auxiliary-1 hover:text-brand-main transition-colors text-left font-normal"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openSignupModal();
                      }}
                      className="text-brand-auxiliary-1 hover:text-brand-main transition-colors text-left font-normal"
                    >
                      Register
                    </button>
                  </>
                )}
                <Separator className="bg-brand-main/20" />
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/builder"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full border-brand-main/30 text-brand-auxiliary-1 h-12">
                        Resume Builder
                      </Button>
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button className="w-full bg-brand-main hover:bg-brand-main/90 h-12">Dashboard</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openRecruiterModal();
                      }}
                      variant="outline"
                      className="w-full border-brand-auxiliary-1 bg-transparent text-brand-auxiliary-1 hover:bg-brand-auxiliary-1 hover:text-brand-background h-12"
                    >
                      For Recruiters
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleJobSeekerAuth();
                      }}
                      className="w-full bg-brand-main hover:bg-brand-main/90 h-12"
                    >
                      Job Seeker - Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* AI Training Data Highlight Banner */}
      <button
        onClick={() => setAiTrainingModalOpen(true)}
        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 cursor-pointer"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-white text-sm sm:text-base font-normal flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 animate-pulse" />
            Built on purpose-specific training data for fake job detection, job descriptions, CV parsing, bias-free screening, and ATS scoring.
          </p>
        </div>
      </button>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-background">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-background via-brand-background to-brand-main/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-brand-main/20 text-brand-auxiliary-1 border-brand-main/30"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Enterprise AI-Powered Platform
                </Badge>
                <h1 className="hero-title text-3xl sm:text-4xl lg:text-6xl tracking-tight text-white leading-tight">
                  We went visceral on{" "}
                  <span className="text-brand-main">
                    hiring
                  </span>{" "}
                  so you don't have to
                </h1>
                <p className="text-lg sm:text-xl text-brand-auxiliary-1 leading-relaxed">
                  Rebuilding hiring with structured digital profiles that at every step of the hire
                </p>
              </div>

              <div className="flex flex-row gap-4 items-end justify-center lg:justify-start">
                <div className="flex flex-col flex-1 max-w-xs">
                  <div className="bg-brand-auxiliary-1 text-brand-background px-4 py-2 rounded-t-lg text-sm font-medium text-center">
                    Get Digital CV
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="group h-12 px-4 sm:px-6 lg:px-8 bg-brand-main hover:bg-brand-main/90 text-white rounded-t-none border-t-0 w-full text-xs sm:text-sm lg:text-base"
                  >
                    Start for Free
                    <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                <div className="flex flex-col flex-1 max-w-xs">
                  <div className="bg-green-600 text-white px-4 py-2 rounded-t-lg text-sm font-medium text-center">
                   Go Paperless
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setPledgeModalOpen(true)}
                    className="h-12 px-4 sm:px-6 lg:px-8 group border-brand-main text-brand-background hover:bg-brand-main/10 hover:text-brand-auxiliary-1 rounded-t-none border-t-0 w-full text-xs sm:text-sm lg:text-base"
                  >
                    <Sparkles className="mr-1 sm:mr-2 h-4 w-4" />
                    Take the Pledge
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                      <div className="text-brand-main">{stat.icon}</div>
                      <div className="text-xl sm:text-2xl text-white font-semibold">
                        {stat.value}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-brand-auxiliary-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modern Enterprise Workflow Visualization */}
            <div className="relative">
              {/* TODO: Can reuse Alex Thompson card later for testimonials or team section */}
              {/* Commented out for potential reuse in testimonials
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="..." alt="Alex Thompson" />
                    <AvatarFallback>AT</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl text-slate-900">Alex Thompson</h3>
                    <p className="text-slate-600">Senior Software Engineer</p>
                  </div>
                </div>
              </div>
              */}

              {/* Ambient Background Orbs - Removed */}
              
              {/* Modern Floating Workflow Cards */}
              <div className="relative z-10 space-y-8">
                {/* Job Seeker Flow - Compact Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {/* Step 1: Upload */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/20 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/20 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main to-brand-main/80 flex items-center justify-center shadow-lg shadow-brand-main/30">
                            <Upload className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            1
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">Upload</h4>
                      </div>
                    </div>
                    {/* Shimmering connector line */}
                    <div className="hidden lg:block absolute top-1/2 left-full w-6 h-0.5 -translate-y-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-auxiliary-1 to-brand-main bg-[length:200%_100%] animate-shimmer opacity-40" />
                    </div>
                  </div>

                  {/* Step 2: AI Processing */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/20 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/20 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main to-brand-main/80 flex items-center justify-center shadow-lg shadow-brand-main/30">
                            <Sparkles className="h-7 w-7 lg:h-8 lg:w-8 text-white animate-pulse" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            2
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">AI Process</h4>
                      </div>
                    </div>
                    {/* Shimmering connector line */}
                    <div className="hidden lg:block absolute top-1/2 left-full w-6 h-0.5 -translate-y-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-auxiliary-1 to-brand-main bg-[length:200%_100%] animate-shimmer opacity-40" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>

                  {/* Step 3: Digital CV */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/20 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/20 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main to-brand-main/80 flex items-center justify-center shadow-lg shadow-brand-main/30">
                            <FileText className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            3
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">Digital CV</h4>
                      </div>
                    </div>
                    {/* Shimmering connector line */}
                    <div className="hidden lg:block absolute top-1/2 left-full w-6 h-0.5 -translate-y-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-auxiliary-1 to-brand-main bg-[length:200%_100%] animate-shimmer opacity-40" style={{ animationDelay: '0.6s' }} />
                    </div>
                  </div>

                  {/* Step 4: Share */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/20 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/20 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main to-brand-main/80 flex items-center justify-center shadow-lg shadow-brand-main/30">
                            <Share2 className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            4
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">Share</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Divider - Modern */}
                <div className="relative py-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-main/40 to-transparent" />
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-3xl px-8 py-4 rounded-full border border-brand-main/30 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-brand-main rounded-full animate-pulse" />
                        <span className="text-base text-brand-main font-medium">Recruiter Pipeline</span>
                        <div className="w-3 h-3 bg-brand-main rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recruiter Flow - Compact Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {/* Step 5: Search */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/15 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/15 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main/90 to-brand-main/70 flex items-center justify-center shadow-lg shadow-brand-main/20">
                            <Target className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            5
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">AI Search</h4>
                      </div>
                    </div>
                    {/* Shimmering connector line */}
                    <div className="hidden lg:block absolute top-1/2 left-full w-6 h-0.5 -translate-y-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-auxiliary-1 to-brand-main bg-[length:200%_100%] animate-shimmer opacity-30" style={{ animationDelay: '0.9s' }} />
                    </div>
                  </div>

                  {/* Step 6: Screen */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/15 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/15 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main/90 to-brand-main/70 flex items-center justify-center shadow-lg shadow-brand-main/20">
                            <Eye className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            6
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">AI Screening</h4>
                      </div>
                    </div>
                    {/* Shimmering connector line */}
                    <div className="hidden lg:block absolute top-1/2 left-full w-6 h-0.5 -translate-y-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-auxiliary-1 to-brand-main bg-[length:200%_100%] animate-shimmer opacity-30" style={{ animationDelay: '1.2s' }} />
                    </div>
                  </div>

                  {/* Step 7: Shortlist */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-main/15 to-brand-main/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-brand-main/20 shadow-xl hover:shadow-brand-main/15 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-brand-main/90 to-brand-main/70 flex items-center justify-center shadow-lg shadow-brand-main/20">
                            <Star className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-brand-auxiliary-1 rounded-full flex items-center justify-center text-xs text-brand-background shadow-md font-semibold">
                            7
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">Shortlist</h4>
                      </div>
                    </div>
                    {/* Shimmering connector line */}
                    <div className="hidden lg:block absolute top-1/2 left-full w-6 h-0.5 -translate-y-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-green-400 to-green-500 bg-[length:200%_100%] animate-shimmer opacity-30" style={{ animationDelay: '1.5s' }} />
                    </div>
                  </div>

                  {/* Step 8: Hired */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 to-green-400/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl p-4 border-2 border-green-500/20 shadow-xl hover:shadow-green-500/20 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <CheckCircle className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-100 to-white rounded-full flex items-center justify-center text-xs text-green-900 shadow-md font-semibold">
                            ✓
                          </div>
                        </div>
                        <h4 className="text-xs lg:text-sm text-brand-background font-normal">Hired!</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Badge - Modern */}
                <div className="flex justify-center pt-8">
                  <Badge className="bg-gradient-to-r from-brand-main to-brand-main/90 text-white border-0 px-8 py-4 text-lg shadow-2xl shadow-brand-main/40 hover:scale-105 transition-transform duration-300">
                    <Zap className="h-5 w-5 mr-2" />
                    End-to-End Hiring Automation
                  </Badge>
                </div>

                {/* Remove old background circles - now using ambient orbs */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="bg-brand-main/10 text-brand-main border-brand-main/20 mb-4"
            >
              Enterprise Features
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-normal text-brand-background mb-6">
              Everything you need to{" "}
              <span className="text-brand-main">succeed</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive AI-powered tools for job seekers and recruiters, built for the modern hiring landscape.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  feature.highlight
                    ? "ring-2 ring-brand-main/20 bg-gradient-to-br from-brand-main/5 to-brand-auxiliary-1/20"
                    : "hover:shadow-lg"
                }`}
              >
                <CardHeader>
                  <div
                    className={`inline-flex p-3 rounded-lg mb-4 ${
                      feature.highlight
                        ? "bg-brand-main/10 text-brand-main"
                        : "bg-slate-100 text-slate-600 group-hover:bg-brand-main/10 group-hover:text-brand-main"
                    } transition-colors`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-brand-auxiliary-1/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-normal text-brand-background mb-6">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our streamlined process gets you from zero to interview-ready in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Build or Upload",
                description:
                  "Start from scratch with our AI builder or upload your existing resume for instant parsing",
                icon: <FileText className="h-8 w-8" />,
              },
              {
                step: "02",
                title: "Optimize with AI",
                description:
                  "Get real-time ATS scores and AI-powered suggestions to improve your resume",
                icon: <Sparkles className="h-8 w-8" />,
              },
              {
                step: "03",
                title: "Share & Apply",
                description: "Export as PDF, share with custom links, or apply directly to matched jobs",
                icon: <Share2 className="h-8 w-8" />,
              },
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="inline-flex p-6 bg-white rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow border-2 border-brand-main/10">
                    <div className="text-brand-main">{step.icon}</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-main rounded-full flex items-center justify-center text-white text-sm">
                    {step.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-brand-main/50 to-transparent transform -translate-y-1/2" />
                  )}
                </div>
                <h3 className="text-xl text-brand-background mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-brand-auxiliary-1/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="secondary"
              className="bg-brand-main/10 text-brand-main border-brand-main/20 mb-4"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-normal text-brand-background mb-6">
              Trusted by Top Professionals
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Join thousands of job seekers who accelerated their careers with CVZen's AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all border-brand-main/10 hover:border-brand-main/30"
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="ring-2 ring-brand-main/20">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                      <AvatarFallback className="bg-brand-main/10 text-brand-main">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-brand-background">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-brand-main text-brand-main"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-brand-background to-brand-main">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-normal text-white mb-6">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xl text-brand-auxiliary-1 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals using CVZen's AI-powered platform to land their dream jobs faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleGetStarted}
              className="group h-12 px-6 sm:px-8 bg-white text-brand-background hover:bg-brand-auxiliary-1 w-full sm:flex-1 text-sm sm:text-base"
            >
              Start for Free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link to="/tools/fake-job-detector" className="w-full sm:flex-1">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 sm:px-8 bg-transparent border-white/20 text-white hover:bg-white/10 w-full text-sm sm:text-base"
              >
                <Shield className="mr-2 h-4 w-4" />
                Try JD Trust Score
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-background text-white py-16 border-t border-brand-main/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <CVZenLogo className="h-6 sm:h-7 md:h-8 w-auto" showCaption={true} />
              </Link>
              <p className="text-brand-auxiliary-1">
                AI-powered platform for building professional resumes and accelerating your career.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-4">Product</h4>
              <div className="space-y-2">
                <Link
                  to="/features"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Features
                </Link>
                
                <Link
                  to="/pricing"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white mb-4">Company</h4>
              <div className="space-y-2">
                <Link
                  to="/about"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/blog"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Blog
                </Link>
                <Link
                  to="/careers"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Careers
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white mb-4">Support</h4>
              <div className="space-y-2">
                <Link
                  to="/help"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  to="/contact"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white mb-4">Legal</h4>
              <div className="space-y-2">
                <Link
                  to="/privacy-policy"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms-of-service"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/disclaimer"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Disclaimer
                </Link>
                <Link
                  to="/refund-policy"
                  className="block text-brand-auxiliary-1 hover:text-brand-main transition-colors"
                >
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-brand-main/20" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-brand-auxiliary-1">
              © 2026 CVZen. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Link
                to="/privacy-policy"
                className="text-brand-auxiliary-1 hover:text-brand-main transition-colors text-sm"
              >
                Privacy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-brand-auxiliary-1 hover:text-brand-main transition-colors text-sm"
              >
                Terms
              </Link>
              <Link
                to="/disclaimer"
                className="text-brand-auxiliary-1 hover:text-brand-main transition-colors text-sm"
              >
                Disclaimer
              </Link>
              <Link
                to="/refund-policy"
                className="text-brand-auxiliary-1 hover:text-brand-main transition-colors text-sm"
              >
                Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Sustainability Pledge Modal */}
      <SustainabilityPledgeModal 
        isOpen={pledgeModalOpen} 
        onClose={() => setPledgeModalOpen(false)} 
      />

      {/* Quick Signup Modal */}
      <QuickSignupModal
        isOpen={quickSignupModalOpen}
        onClose={() => setQuickSignupModalOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultMode={authModalMode}
      />

      {/* Recruiter Auth Modal */}
      <RecruiterAuthModal
        isOpen={recruiterAuthModalOpen}
        onCancel={() => setRecruiterAuthModalOpen(false)}
        onSuccess={handleRecruiterAuthSuccess}
      />

      {/* AI Training Info Modal */}
      <AITrainingInfoModal
        isOpen={aiTrainingModalOpen}
        onClose={() => setAiTrainingModalOpen(false)}
      />
    </div>
  );
}
