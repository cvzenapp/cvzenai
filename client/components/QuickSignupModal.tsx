import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Shield, Zap, X, Settings } from "lucide-react";
import ResumeParsingAnalysis from "./dashboard/ResumeParsingAnalysis";

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  resume?: string;
}

export function QuickSignupModal({ isOpen, onClose }: QuickSignupModalProps) {
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
    }
  }, [isOpen]);

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
        // Redirect after short delay
        setTimeout(() => {
          if (data.resumeId) {
            navigate(`/resume/${data.resumeId}`);
          } else {
            navigate('/dashboard');
          }
          onClose();
        }, 2000);
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
      <DialogContent className="sm:max-w-lg max-h-[95vh] overflow-hidden border-brand-main/30">
        <DialogHeader className="pb-2 bg-gradient-to-r from-brand-background to-brand-background/95 -mx-6 -mt-6 px-6 pt-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-lg font-bold text-brand-auxiliary-1">Get Started Free</DialogTitle>
          <DialogDescription className="text-sm text-brand-auxiliary-1/80">
            Create your account in seconds and start building your professional resume
          </DialogDescription>
        </DialogHeader>

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
                  Upload Resume <span className="text-red-500">*</span>
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
          <div className="py-8 text-center space-y-6">
            {/* Document Scanning Animation */}
            <div className="relative mx-auto w-32 h-40">
              {/* Document Background */}
              <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-lg shadow-lg">
                {/* Document Lines */}
                <div className="p-4 space-y-2">
                  <div className="h-2 bg-slate-100 rounded"></div>
                  <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                  <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                  <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                </div>
              </div>
              
              {/* Scanning Line with Shimmer Effect */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-brand-main to-transparent opacity-80 animate-scan-down"></div>
              </div>
              
              {/* Scanning Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-main/10 via-transparent to-transparent rounded-lg animate-pulse"></div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Scanning Your Resume</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Our AI is analyzing your resume structure, extracting key information, and preparing your digital profile...
              </p>
            </div>

            {/* Progress Shimmer Bar */}
            <div className="w-48 mx-auto">
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-main via-brand-main/60 to-brand-main bg-[length:200%_100%] animate-shimmer rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {step === "analysis" && uploadResult?.parsedData && uploadResult?.resumeId && (
          <div className="max-h-[60vh] overflow-y-auto">
            <ResumeParsingAnalysis
              parsedData={uploadResult.parsedData}
              resumeId={uploadResult.resumeId}
              onContinue={handleEditInBuilder}
              onPreview={handlePreview}
              onCancel={onClose}
            />
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Welcome to CVZen!</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Your account has been created successfully. Check your email to set up your password and access all features.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to your dashboard...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
