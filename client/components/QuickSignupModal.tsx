import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Shield, Zap, X } from "lucide-react";
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Get Started Free</DialogTitle>
          <DialogDescription className="text-slate-600">
            Create your account in seconds and start building your professional resume
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <>
            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-200">
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600">Instant Setup</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-slate-600">Secure & Private</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-xs text-slate-600">AI-Powered</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
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
                  className={validationErrors.fullName && touched.fullName ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                  className={validationErrors.email && touched.email ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                        className={`cursor-pointer ${validationErrors.resume && touched.resume ? "border-red-500" : ""}`}
                        aria-invalid={!!validationErrors.resume && touched.resume}
                        aria-describedby={validationErrors.resume && touched.resume ? "resume-error" : "resume-help"}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-green-600" />
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
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
              <div className="pt-2 space-y-2">
                <p className="text-xs text-slate-500 text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Your data is encrypted and secure</span>
                </div>
              </div>
            </form>
          </>
        )}

        {step === "uploading" && (
          <div className="py-12 text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 mx-auto">
                <Loader2 className="h-20 w-20 animate-spin text-brand-main" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Processing Your Resume</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Our AI is analyzing your resume and setting up your account. This will take just a moment...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-main animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 rounded-full bg-brand-main animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 rounded-full bg-brand-main animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {step === "analysis" && uploadResult?.parsedData && uploadResult?.resumeId && (
          <ResumeParsingAnalysis
            parsedData={uploadResult.parsedData}
            resumeId={uploadResult.resumeId}
            onEditInBuilder={handleEditInBuilder}
            onPreview={handlePreview}
            onCancel={onClose}
          />
        )}

        {step === "success" && (
          <div className="py-12 text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Welcome to CVZen!</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Your account has been created successfully. Check your email for your temporary password.
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
