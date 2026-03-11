import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Shield, Zap, X, Settings, Eye } from "lucide-react";
import ResumeParsingAnalysis from "./dashboard/ResumeParsingAnalysis";
import ConfettiEffect from "./ConfettiEffect";

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'signup' | 'job-application';
  jobTitle?: string;
  companyName?: string;
  onJobApplication?: (data: { 
    name: string; 
    email: string; 
    resumeFile: File;
    userId?: string;
    resumeId?: number;
    shareToken?: string;
    resumeUrl?: string;
    coverLetter?: string; // Add cover letter to the interface
  }) => Promise<void>;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  resume?: string;
}

export default function QuickSignupModal({ isOpen, onClose, mode = 'signup', jobTitle, companyName, onJobApplication }: QuickSignupModalProps) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [step, setStep] = useState<"form" | "uploading" | "analysis" | "success">("form");
  const [touched, setTouched] = useState({ fullName: false, email: false, resume: false });
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [scanningTimer, setScanningTimer] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const generateCoverLetter = async () => {
    if (!uploadResult || mode !== 'job-application') return;

    setGeneratingCoverLetter(true);
    try {
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];
      const jobIdMatch = slug.match(/-(\d+)$/);
      const jobId = jobIdMatch ? parseInt(jobIdMatch[1]) : null;

      if (!jobId) {
        throw new Error('Could not determine job ID');
      }

      console.log('🔍 Cover letter generation data:', {
        jobId,
        jobTitle,
        companyName,
        hasUploadResult: !!uploadResult,
        hasParsedData: !!uploadResult.parsedData,
        parsedDataKeys: uploadResult.parsedData ? Object.keys(uploadResult.parsedData) : [],
        skillsCount: uploadResult.parsedData?.skills?.length || 0,
        experienceCount: uploadResult.parsedData?.experience?.length || 0
      });

      const response = await fetch('/api/cover-letter/generate-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeData: uploadResult.parsedData, // Use the actual parsed data
          jobId: jobId,
          jobTitle: jobTitle,
          companyName: companyName,
          candidateName: fullName.trim() // Add candidate name for proper signature
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const result = await response.json();
      
      if (result.success) {
        setCoverLetter(result.coverLetter);
        setShowCoverLetter(true);
      } else {
        throw new Error(result.error || 'Failed to generate cover letter');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate cover letter');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const handleJobApplicationSubmit = async () => {
    if (!uploadResult || !onJobApplication) return;

    setLoading(true);
    try {
      await onJobApplication({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        resumeFile: resumeFile!,
        userId: uploadResult.userId,
        resumeId: uploadResult.resumeId,
        shareToken: uploadResult.shareToken,
        resumeUrl: uploadResult.resumeUrl,
        coverLetter: showCoverLetter ? coverLetter : undefined // Include cover letter if generated
      });

      setStep("success");
    } catch (error: any) {
      setError(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFullName("");
      setEmail("");
      setResumeFile(null);
      setError("");
      setValidationErrors({});
      setStep("form");
      setTouched({ fullName: false, email: false, resume: false });
      setUploadResult(null);
      setScanningTimer(0);
      setShowConfetti(false);
    }
  }, [isOpen]);

  // Timer effect for scanning screen
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "uploading") {
      setScanningTimer(0);
      interval = setInterval(() => {
        setScanningTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step]);

  // Confetti effect when analysis step is reached
  useEffect(() => {
    if (step === "analysis" && uploadResult) {
      setShowConfetti(true);
      // Hide confetti after 3 seconds
      const timeout = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [step, uploadResult]);

  // Real-time validation
  const validateFullName = (name: string): string | undefined => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (name.trim().length > 100) return "Name must be less than 100 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return undefined;
  };

  const validateEmail = (emailValue: string): string | undefined => {
    if (!emailValue.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) return "Please enter a valid email address";
    if (emailValue.length > 255) return "Email must be less than 255 characters";
    return undefined;
  };

  const validateResume = (file: File | null): string | undefined => {
    if (!file) return "Resume is required";
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, DOC, and DOCX files are allowed";
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }
    
    return undefined;
  };

  // Update validation on field changes
  useEffect(() => {
    if (touched.fullName) {
      const error = validateFullName(fullName);
      setValidationErrors(prev => ({ ...prev, fullName: error }));
    }
  }, [fullName, touched.fullName]);

  useEffect(() => {
    if (touched.email) {
      const error = validateEmail(email);
      setValidationErrors(prev => ({ ...prev, email: error }));
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.resume) {
      const error = validateResume(resumeFile);
      setValidationErrors(prev => ({ ...prev, resume: error }));
    }
  }, [resumeFile, touched.resume]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTouched(prev => ({ ...prev, resume: true }));
    
    if (file) {
      const error = validateResume(file);
      if (error) {
        setValidationErrors(prev => ({ ...prev, resume: error }));
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
      setValidationErrors(prev => ({ ...prev, resume: undefined }));
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setValidationErrors(prev => ({ ...prev, resume: "Resume is required" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Mark all fields as touched
    setTouched({ fullName: true, email: true, resume: true });

    // Validate all fields
    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const resumeError = validateResume(resumeFile);

    const errors: ValidationErrors = {
      fullName: nameError,
      email: emailError,
      resume: resumeError
    };

    setValidationErrors(errors);

    // Check if there are any errors
    if (nameError || emailError || resumeError) {
      setError("Please fix the errors above before continuing");
      return;
    }

    setLoading(true);
    setStep("uploading");

    try {
      if (mode === 'job-application' && onJobApplication) {
        // Handle job application flow
        const formData = new FormData();
        formData.append('resume', resumeFile!);
        formData.append('name', fullName.trim());
        formData.append('email', email.trim().toLowerCase());

        const parseResponse = await fetch('/api/guest/resume/parse', {
          method: 'POST',
          body: formData
        });

        if (!parseResponse.ok) {
          const errorData = await parseResponse.json();
          throw new Error(errorData.error || 'Failed to parse resume');
        }

        const parseResult = await parseResponse.json();

        if (!parseResult.success) {
          throw new Error(parseResult.error || 'Failed to parse resume');
        }

        console.log('🔍 Guest resume parse result:', parseResult.data);
        setUploadResult(parseResult.data);
        setStep("analysis");

        // Don't call onJobApplication here - wait for user to submit from analysis step
      } else {
        // Handle signup flow
        const formData = new FormData();
        formData.append("fullName", fullName.trim());
        formData.append("email", email.trim().toLowerCase());
        formData.append("resume", resumeFile!);

        const response = await fetch("/api/auth/quick-signup", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Signup failed. Please try again.");
        }

        // Store auth token securely
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userId", data.userId);

        // Store upload result for analysis display
        setUploadResult(data);
        
        // Show analysis if parsedData is available
        if (data.parsedData && data.resumeId) {
          setStep("analysis");
        } else {
          setStep("success");
          // Only redirect automatically if no analysis is available
          setTimeout(() => {
            if (data.resumeId) {
              navigate(`/resume/${data.resumeId}`);
            } else {
              navigate('/dashboard');
            }
            onClose();
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInBuilder = () => {
    if (uploadResult?.resumeId) {
      navigate(`/builder/${uploadResult.resumeId}`);
      onClose();
    }
  };

  const handlePreview = () => {
    if (uploadResult?.resumeId) {
      navigate(`/resume/${uploadResult.resumeId}`);
      onClose();
    }
  };

  const isFormValid = !validationErrors.fullName && 
                      !validationErrors.email && 
                      !validationErrors.resume &&
                      fullName.trim() &&
                      email.trim() &&
                      resumeFile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[95vh] flex flex-col border-brand-main/30 p-0 [&>button]:hidden">
        <DialogHeader className="pb-2 bg-gradient-to-r from-brand-background to-brand-background/95 px-6 pt-6 mb-4 rounded-t-lg flex-shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <DialogTitle className="text-lg font-bold text-brand-auxiliary-1 pr-12">
            {mode === 'job-application' ? `Apply for ${jobTitle}` : 'Get Started Free'}
          </DialogTitle>
          <DialogDescription className="text-sm text-brand-auxiliary-1/80 pr-12">
            {mode === 'job-application' 
              ? `at ${companyName}` 
              : 'Create your account in seconds and start building your professional resume'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">

        {step === "form" && (
          <>
            {/* Process Flow */}
            <div className="relative py-3 border-y border-brand-main/40">
              <div className="flex items-center justify-between px-4">
                {/* Step 1: Upload Resume */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-8 w-8 rounded-full bg-brand-main/20 flex items-center justify-center mb-1 border border-brand-main/30">
                    <Upload className="h-4 w-4 text-brand-main" />
                  </div>
                  <p className="text-xs text-slate-600">Upload</p>
                </div>

                {/* Progress line 1 with scanning animation */}
                <div className="flex-1 mx-2 relative">
                  <div className="h-0.5 bg-brand-main/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-main/60 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
                  </div>
                  {/* Scanning icon animation */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center animate-pulse shadow-sm">
                      <Settings className="h-3 w-3 text-brand-main animate-spin" />
                    </div>
                  </div>
                </div>

                {/* Step 2: AI Analysis */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-8 w-8 rounded-full bg-brand-main/20 flex items-center justify-center mb-1 border border-brand-main/30">
                    <Zap className="h-4 w-4 text-brand-main" />
                  </div>
                  <p className="text-xs text-slate-600">AI Analysis</p>
                </div>

                {/* Progress line 2 with resume icon */}
                <div className="flex-1 mx-2 relative">
                  <div className="h-0.5 bg-brand-main/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-main via-brand-main/60 to-transparent bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  {/* Resume shimmering icon */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <FileText className="h-3 w-3 text-brand-main animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Step 3: Ready */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-8 w-8 rounded-full bg-brand-main/20 flex items-center justify-center mb-1 border border-brand-main/30">
                    <CheckCircle className="h-4 w-4 text-brand-main" />
                  </div>
                  <p className="text-xs text-slate-600">Ready</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                  disabled={loading}
                  className={validationErrors.fullName && touched.fullName ? "border-red-500 focus-visible:ring-red-500 h-10" : "border-brand-main/30 focus-visible:ring-brand-main h-10"}
                  aria-invalid={!!validationErrors.fullName && touched.fullName}
                  aria-describedby={validationErrors.fullName && touched.fullName ? "fullName-error" : undefined}
                />
                {validationErrors.fullName && touched.fullName && (
                  <p id="fullName-error" className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  disabled={loading}
                  className={validationErrors.email && touched.email ? "border-red-500 focus-visible:ring-red-500" : "border-brand-main/30 focus-visible:ring-brand-main"}
                  aria-invalid={!!validationErrors.email && touched.email}
                  aria-describedby={validationErrors.email && touched.email ? "email-error" : undefined}
                  autoComplete="email"
                />
                {validationErrors.email && touched.email && (
                  <p id="email-error" className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Resume Upload Field */}
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-sm font-medium">
                  Upload CV <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {!resumeFile ? (
                    <div className="relative">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={loading}
                        className={`cursor-pointer ${validationErrors.resume && touched.resume ? "border-red-500" : "border-brand-main/30 focus-visible:ring-brand-main"}`}
                        aria-invalid={!!validationErrors.resume && touched.resume}
                        aria-describedby={validationErrors.resume && touched.resume ? "resume-error" : "resume-help"}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="h-10 w-10 rounded-lg bg-brand-main/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-brand-main" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{resumeFile.name}</p>
                        <p className="text-xs text-slate-600">
                          {(resumeFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={loading}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {validationErrors.resume && touched.resume && (
                    <p id="resume-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {validationErrors.resume}
                    </p>
                  )}
                  {!validationErrors.resume && (
                    <p id="resume-help" className="text-xs text-slate-500">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Global Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Auto-login Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 text-center">
                  You'll be automatically logged in and receive a setup password email
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-brand-main hover:bg-brand-main/90 text-white border-0"
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Create Free Account
                  </>
                )}
              </Button>

              {/* Privacy Notice */}
              <div className="pt-1 space-y-1">
                <p className="text-xs text-slate-500 text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <Shield className="h-3 w-3" />
                  <span>Your data is encrypted and secure</span>
                </div>
              </div>
            </form>
          </>
        )}

        {step === "uploading" && (
          <div className="py-8 text-center space-y-6 relative">
            {/* Document Scanning Animation */}
            <div className="relative mx-auto w-32 h-40">
              {/* Document Background with enhanced styling */}
              <div className="absolute inset-0 bg-white border-2 border-brand-main/30 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
                {/* Document Lines with animated loading */}
                <div className="p-4 space-y-2">
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded animate-pulse"></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-4/5 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-3/4 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-2/3 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-4/5 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-3/4 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  <div className="h-2 bg-gradient-to-r from-slate-200 to-brand-main/20 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
                </div>
              </div>
              
              {/* Scanning Line with enhanced effect */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-brand-main to-transparent opacity-90 animate-scan-down shadow-lg"></div>
              </div>
              
              {/* Scanning Glow Effect with brand colors */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-main/20 via-transparent to-brand-background/10 rounded-lg animate-pulse"></div>
              
              {/* Corner badge */}
              <div className="absolute -top-2 -right-2 bg-brand-main text-white text-xs px-2 py-1 rounded-full shadow-lg">
                AI
              </div>
            </div>

            {/* Prominent Timer Display */}
            <div className="bg-gradient-to-r from-brand-main via-brand-background to-brand-main rounded-2xl p-6 mx-4 shadow-xl border border-white/20">
              <div className="text-center space-y-3">
                <div className="text-5xl font-bold text-white tabular-nums tracking-wider drop-shadow-lg">
                  {Math.floor(scanningTimer / 60).toString().padStart(2, '0')}:
                  {(scanningTimer % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-white/90 text-sm font-medium uppercase tracking-wide">
                  AI Processing Time
                </div>
                <div className="flex items-center justify-center gap-2 text-white/80 text-xs">
                  <Zap className="h-3 w-3" />
                  <span>Powered by CVZen AI</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Scanning Your CV</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Our AI is analyzing your cv structure, extracting key information, and preparing your digital profile...
              </p>
            </div>

            {/* Enhanced Progress Shimmer Bar */}
            <div className="w-64 mx-auto">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-brand-main via-brand-background to-brand-main bg-[length:200%_100%] animate-shimmer rounded-full shadow-sm"></div>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-slate-500 font-medium">Processing your resume...</span>
              </div>
            </div>
          </div>
        )}

        {step === "analysis" && uploadResult && (
          <div className="flex-1 overflow-y-auto">
            {/* Confetti Effect */}
            <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

            {mode === 'signup' ? (
              uploadResult.parsedData && uploadResult.resumeId ? (
                <ResumeParsingAnalysis
                  parsedData={uploadResult.parsedData}
                  resumeId={uploadResult.resumeId}
                  onContinue={handleEditInBuilder}
                  onPreview={handlePreview}
                  onCancel={onClose}
                />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-600">Resume data not available</p>
                </div>
              )
            ) : (
              // Job application analysis view
              <div className="py-6 space-y-6">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center mb-4 animate-pulse">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 bg-gradient-to-r from-brand-main to-brand-background bg-clip-text text-transparent">
                    🎉 Resume Processed Successfully!
                  </h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto mt-2">
                    Your resume has been analyzed and is ready for your job application.
                  </p>
                </div>

                {/* Resume Analysis Summary - Show if parsedData is available */}
                {uploadResult.parsedData && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Resume Analysis Summary</h4>
                    <ResumeParsingAnalysis
                      parsedData={uploadResult.parsedData}
                      resumeId={uploadResult.resumeId}
                      onContinue={() => {}} // No action needed in job application mode
                      onPreview={() => {}} // No action needed in job application mode
                      onCancel={() => {}} // No action needed in job application mode
                      hideButtons={true} // Hide buttons in job application mode
                    />
                  </div>
                )}

                {/* Resume Preview and Share URLs */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Your Resume
                  </h4>
                  {uploadResult.shareToken && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between bg-white rounded p-2">
                        <span className="text-slate-600">Shared Resume:</span>
                        <a 
                          href={`/shared/resume/${uploadResult.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-main hover:underline flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Your shared resume with cover letter will be sent to the recruiter. 
                      Meanwhile, you can modify your resume by logging in to CVZen using the password activation link sent to your email.
                    </p>
                  </div>
                </div>
                
                {/* Cover Letter Generation */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Cover Letter (Optional)</h4>
                  {!showCoverLetter ? (
                    <button
                      onClick={generateCoverLetter}
                      disabled={generatingCoverLetter}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generatingCoverLetter ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating AI Cover Letter...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Generate AI Cover Letter
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-slate-900">Generated Cover Letter</h5>
                        <button
                          onClick={() => setShowCoverLetter(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          className="w-full h-32 sm:h-40 p-3 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                          placeholder="Your cover letter will appear here..."
                        />
                        <p className="text-xs text-slate-500">
                          You can edit the cover letter above before submitting your application.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJobApplicationSubmit}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-brand-main text-white rounded-lg hover:bg-brand-main/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              {mode === 'job-application' ? (
                <>
                  <h3 className="text-lg font-semibold text-slate-900">Application Submitted!</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Your application for {jobTitle} at {companyName} has been submitted successfully. The recruiter will review your application and get back to you soon.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-slate-900">Welcome to CVZen!</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Your account has been created successfully. Check your email to set up your password and access all features.
                  </p>
                </>
              )}
            </div>
            {mode === 'signup' && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting to your dashboard...</span>
              </div>
            )}
            {mode === 'job-application' && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-brand-main text-white rounded-lg hover:bg-brand-main/90"
              >
                Close
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
