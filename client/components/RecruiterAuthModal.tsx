import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, X, Mail, Lock, User, Building } from "lucide-react";

interface RecruiterAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  message?: string;
}

export default function RecruiterAuthModal({ isOpen, onSuccess, onCancel, message }: RecruiterAuthModalProps) {
  const [activeTab, setActiveTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobTitle: "",
    phone: "",
    linkedinUrl: "",
    companyName: "",
    companyWebsite: "",
    companyIndustry: "",
    companySizeRange: "",
    companyLocation: "",
    companyDescription: "",
    acceptTerms: false,
    acceptPrivacyPolicy: false
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recruiter/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signInData),
      });

      const result = await response.json();

      if (result.success) {
        // Store recruiter auth token (both formats for compatibility)
        localStorage.setItem("recruiter_token", result.token);
        localStorage.setItem("recruiterUser", JSON.stringify(result.recruiter));
        
        // Also store in format expected by recruiterAuthApi
        localStorage.setItem("recruiter_token", result.token);
        localStorage.setItem("recruiter_user", JSON.stringify(result.recruiter));
        
        console.log("✅ Recruiter signed in successfully");
        onSuccess();
      } else {
        setError(result.error || "Sign in failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!signUpData.firstName.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }

    if (!signUpData.lastName.trim()) {
      setError("Last name is required");
      setLoading(false);
      return;
    }

    if (!signUpData.companyName.trim()) {
      setError("Company name is required");
      setLoading(false);
      return;
    }

    if (!signUpData.jobTitle.trim()) {
      setError("Job title is required");
      setLoading(false);
      return;
    }

    if (!signUpData.companySizeRange) {
      setError("Company size is required");
      setLoading(false);
      return;
    }

    if (!signUpData.companyLocation.trim()) {
      setError("Company location is required");
      setLoading(false);
      return;
    }

    if (!signUpData.acceptTerms) {
      setError("You must accept the terms and conditions");
      setLoading(false);
      return;
    }

    if (!signUpData.acceptPrivacyPolicy) {
      setError("You must accept the privacy policy");
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (signUpData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/recruiter/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: signUpData.firstName,
          lastName: signUpData.lastName,
          email: signUpData.email,
          password: signUpData.password,
          confirmPassword: signUpData.confirmPassword,
          jobTitle: signUpData.jobTitle,
          phone: signUpData.phone,
          linkedinUrl: signUpData.linkedinUrl,
          companyName: signUpData.companyName,
          companyWebsite: signUpData.companyWebsite,
          companyIndustry: signUpData.companyIndustry,
          companySizeRange: signUpData.companySizeRange,
          companyLocation: signUpData.companyLocation,
          companyDescription: signUpData.companyDescription,
          acceptTerms: signUpData.acceptTerms,
          acceptPrivacyPolicy: signUpData.acceptPrivacyPolicy
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store recruiter auth token (both formats for compatibility)
        localStorage.setItem("recruiter_token", result.token);
        localStorage.setItem("recruiterUser", JSON.stringify(result.recruiter));
        
        // Also store in format expected by recruiterAuthApi
        localStorage.setItem("recruiter_token", result.token);
        localStorage.setItem("recruiter_user", JSON.stringify(result.recruiter));
        
        console.log("✅ Recruiter signed up successfully");
        onSuccess();
      } else {
        setError(result.error || "Sign up failed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setError("Network error. Please try again.");
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
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden max-h-[90vh] flex flex-col transition-all duration-300 ${
              activeTab === 'signup' ? 'max-w-4xl' : 'max-w-md'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-background via-slate-800 to-brand-background text-white p-6 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold">
                  {activeTab === 'signin' ? 'Recruiter Sign In' : 'Recruiter Sign Up'}
                </h2>
                <p className="text-brand-auxiliary-1 text-sm">
                  {activeTab === 'signin' ? 'Access your recruiter dashboard' : 'Create your recruiter account'}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {message && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{message}</p>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="recruiter@company.com"
                  value={signInData.email || ""}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={signInData.password || ""}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-firstName"
                      type="text"
                      placeholder="John"
                      value={signUpData.firstName || ""}
                      onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-lastName"
                      type="text"
                      placeholder="Doe"
                      value={signUpData.lastName || ""}
                      onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="recruiter@company.com"
                      value={signUpData.email || ""}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-sm font-medium text-slate-700">Phone (Optional)</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={signUpData.phone || ""}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-jobTitle" className="text-sm font-medium text-slate-700">Job Title</Label>
                  <Input
                    id="signup-jobTitle"
                    type="text"
                    placeholder="HR Manager"
                    value={signUpData.jobTitle || ""}
                    onChange={(e) => setSignUpData({ ...signUpData, jobTitle: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-linkedin" className="text-sm font-medium text-slate-700">LinkedIn URL (Optional)</Label>
                  <Input
                    id="signup-linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={signUpData.linkedinUrl || ""}
                    onChange={(e) => setSignUpData({ ...signUpData, linkedinUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Company Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-companyName" className="text-sm font-medium text-slate-700">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-companyName"
                      type="text"
                      placeholder="Tech Corp"
                      value={signUpData.companyName || ""}
                      onChange={(e) => setSignUpData({ ...signUpData, companyName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-companyWebsite" className="text-sm font-medium text-slate-700">Company Website (Optional)</Label>
                  <Input
                    id="signup-companyWebsite"
                    type="url"
                    placeholder="https://company.com"
                    value={signUpData.companyWebsite || ""}
                    onChange={(e) => setSignUpData({ ...signUpData, companyWebsite: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-companyLocation" className="text-sm font-medium text-slate-700">Company Location</Label>
                  <Input
                    id="signup-companyLocation"
                    type="text"
                    placeholder="San Francisco, CA"
                    value={signUpData.companyLocation || ""}
                    onChange={(e) => setSignUpData({ ...signUpData, companyLocation: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-companySizeRange" className="text-sm font-medium text-slate-700">Company Size</Label>
                  <select
                    id="signup-companySizeRange"
                    value={signUpData.companySizeRange || ""}
                    onChange={(e) => setSignUpData({ ...signUpData, companySizeRange: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select size</option>
                    <option value="1-10 employees">1-10</option>
                    <option value="11-50 employees">11-50</option>
                    <option value="51-200 employees">51-200</option>
                    <option value="201-500 employees">201-500</option>
                    <option value="501-1000 employees">501-1000</option>
                    <option value="1001-5000 employees">1001-5000</option>
                    <option value="5001-10000 employees">5001-10000</option>
                    <option value="10000+ employees">10000+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-companyIndustry" className="text-sm font-medium text-slate-700">Industry (Optional)</Label>
                <select
                  id="signup-companyIndustry"
                  value={signUpData.companyIndustry || ""}
                  onChange={(e) => setSignUpData({ ...signUpData, companyIndustry: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-companyDescription" className="text-sm font-medium text-slate-700">Company Description (Optional)</Label>
                <textarea
                  id="signup-companyDescription"
                  placeholder="Brief description of your company..."
                  value={signUpData.companyDescription || ""}
                  onChange={(e) => setSignUpData({ ...signUpData, companyDescription: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Account Security</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signUpData.password || ""}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">At least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signUpData.confirmPassword || ""}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={signUpData.acceptTerms}
                  onChange={(e) => setSignUpData({ ...signUpData, acceptTerms: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  I accept the <a href="/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acceptPrivacyPolicy"
                  checked={signUpData.acceptPrivacyPolicy}
                  onChange={(e) => setSignUpData({ ...signUpData, acceptPrivacyPolicy: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <Label htmlFor="acceptPrivacyPolicy" className="text-sm">
                  I accept the <a href="/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                </Label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Recruiter Account"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}