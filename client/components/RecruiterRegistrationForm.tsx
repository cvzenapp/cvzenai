import { useState, useEffect } from "react";
import {
  ArrowRight,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { recruiterAuthApi } from "@/services/recruiterAuthApi";
import type {
  RecruiterRegisterRequest,
  CompanySearchResult,
} from "../../shared/recruiterAuth";
import {
  COMPANY_SIZE_RANGES,
  INDUSTRIES,
  JOB_TITLES,
} from "../../shared/recruiterAuth";

interface RecruiterRegistrationFormProps {
  onSuccess: (registrationData?: any) => void;
  onError?: (error: string) => void;
  className?: string;
  showSteps?: boolean;
  compact?: boolean;
}

const steps = [
  { id: "personal", title: "Personal Information", icon: User },
  { id: "company", title: "Company Details", icon: Building2 },
  { id: "verification", title: "Verify & Complete", icon: Check },
];

export default function RecruiterRegistrationForm({
  onSuccess,
  onError,
  className = "",
  showSteps = true,
  compact = false,
}: RecruiterRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RecruiterRegisterRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobTitle: "",
    phone: "",
    linkedinUrl: "",
    // companyName: "",
    // companyWebsite: "",
    // companyIndustry: "",
    // companySizeRange: "",
    // companyLocation: "",
    // companyDescription: "",
    acceptTerms: false,
    acceptPrivacyPolicy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [companySearchResults, setCompanySearchResults] = useState<
    CompanySearchResult[]
  >([]);

  const handleInputChange = (
    field: keyof RecruiterRegisterRequest,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Update password strength
    if (field === "password") {
      updatePasswordStrength(value);
    }
  };

  const updatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[@$!%*?&]/.test(password)) strength += 20;
    setPasswordStrength(Math.min(strength, 100));
  };

  const selectCompany = (company: CompanySearchResult) => {
    setFormData((prev) => ({
      ...prev,
      companyName: company.name,
      companyWebsite: company.website || "",
      companyIndustry: company.industry || "",
      companyLocation: company.location || "",
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Personal Information validation
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
        newErrors.password = "Password must contain uppercase, lowercase, number and special character";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
      if (!formData.jobTitle) newErrors.jobTitle = "Job title is required";
    } 
    // else if (step === 1) {
    //   // Company Information validation
    //   if (!formData.companyName)
    //     newErrors.companyName = "Company name is required";
    //   if (!formData.companySizeRange)
    //     newErrors.companySizeRange = "Company size is required";
    //   if (!formData.companyLocation)
    //     newErrors.companyLocation = "Company location is required";
    // } 
    else if (step === 2) {
      // Final validation
      if (!formData.acceptTerms)
        newErrors.acceptTerms = "You must accept the terms and conditions";
      if (!formData.acceptPrivacyPolicy)
        newErrors.acceptPrivacyPolicy = "You must accept the privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      // Clean up empty optional fields to avoid validation errors
      const cleanedFormData: any = {
        ...formData
      };
      
      // Remove empty optional fields completely
      if (!formData.phone?.trim()) delete cleanedFormData.phone;
      if (!formData.linkedinUrl?.trim()) delete cleanedFormData.linkedinUrl;
      // if (!formData.companyWebsite?.trim()) delete cleanedFormData.companyWebsite;
      // if (!formData.companyIndustry?.trim()) delete cleanedFormData.companyIndustry;
      // if (!formData.companyDescription?.trim()) delete cleanedFormData.companyDescription;
      
      const response = await recruiterAuthApi.register(cleanedFormData);
      
      console.log('🚀 [RecruiterRegistrationForm] API response:', JSON.stringify(response, null, 2));
      console.log('🚀 [RecruiterRegistrationForm] Response success:', response.success);
      console.log('🚀 [RecruiterRegistrationForm] Response has token:', !!response.token);
      console.log('🚀 [RecruiterRegistrationForm] Response has recruiter:', !!response.recruiter);
      
      if (response.success) {
        console.log('🎆 [RecruiterRegistrationForm] Calling onSuccess with:', response);
        onSuccess(response);
      } else {
        if (response.errors) {
          setErrors(response.errors);
        } else {
          const errorMsg = response.message || "Registration failed. Please try again.";
          setGeneralError(errorMsg);
          onError?.(errorMsg);
        }
      }
    } catch (error: any) {
      // If the error message contains JSON with success=true, it's actually a successful response
      if (error.message && error.message.includes('"success":true')) {
        try {
          const successData = JSON.parse(error.message);
          if (successData.success) {
            onSuccess(successData);
            return;
          }
        } catch {}
      }
      
      console.error("Registration error:", error);
      
      // Try to parse error response if it's a network error with JSON response
      let errorMsg = "An unexpected error occurred. Please try again.";
      let errorFields = {};
      
      if (error.message) {
        try {
          // Check if the error message contains JSON (from API error responses)
          const errorData = JSON.parse(error.message);
          if (errorData.errors) {
            errorFields = errorData.errors;
            setErrors(errorFields);
          }
          if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch {
          // If not JSON, use the error message as is
          errorMsg = error.message;
        }
      }
      
      setGeneralError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "bg-red-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Very Weak";
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  return (
    <div className={className}>
      {/* Progress Steps - only show if not compact */}
      {showSteps && !compact && (
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      index < currentStep ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {generalError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Personal Information */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className={`pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className={`pl-10 ${errors.lastName ? "border-red-500" : ""}`}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="recruiter@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1">
                <Progress value={passwordStrength} className="h-2" />
                <p className={`text-xs ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                  Password strength: {getPasswordStrengthText()}
                </p>
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Select
              value={formData.jobTitle}
              onValueChange={(value) => handleInputChange("jobTitle", value)}
            >
              <SelectTrigger className={errors.jobTitle ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TITLES.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.jobTitle && (
              <p className="text-sm text-red-600">{errors.jobTitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Company Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              {/* <Input
                id="companyName"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className={`pl-10 ${errors.companyName ? "border-red-500" : ""}`}
              /> */}
            </div>
            {errors.companyName && (
              <p className="text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="companySizeRange">Company Size *</Label>
            <Select
              value={formData.companySizeRange}
              onValueChange={(value) => handleInputChange("companySizeRange", value)}
            >
              <SelectTrigger className={errors.companySizeRange ? "border-red-500" : ""}>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZE_RANGES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companySizeRange && (
              <p className="text-sm text-red-600">{errors.companySizeRange}</p>
            )}
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="companyIndustry">Industry</Label>
            <Select
              value={formData.companyIndustry}
              onValueChange={(value) => handleInputChange("companyIndustry", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry (optional)" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="companyLocation">Company Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="companyLocation"
                placeholder="e.g., San Francisco, CA"
                value={formData.companyLocation}
                onChange={(e) => handleInputChange("companyLocation", e.target.value)}
                className={`pl-10 ${errors.companyLocation ? "border-red-500" : ""}`}
              />
            </div>
            {errors.companyLocation && (
              <p className="text-sm text-red-600">{errors.companyLocation}</p>
            )}
          </div> */}
        </div>
      )}

      {/* Step 3: Terms and Verification */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange("acceptTerms", checked)}
                className={errors.acceptTerms ? "border-red-500" : ""}
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-5">
                I accept the{" "}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and agree to abide by the platform guidelines. *
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600 ml-6">{errors.acceptTerms}</p>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptPrivacyPolicy"
                checked={formData.acceptPrivacyPolicy}
                onCheckedChange={(checked) => handleInputChange("acceptPrivacyPolicy", checked)}
                className={errors.acceptPrivacyPolicy ? "border-red-500" : ""}
              />
              <Label htmlFor="acceptPrivacyPolicy" className="text-sm leading-5">
                I accept the{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>{" "}
                and consent to data processing. *
              </Label>
            </div>
            {errors.acceptPrivacyPolicy && (
              <p className="text-sm text-red-600 ml-6">{errors.acceptPrivacyPolicy}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={currentStep === 0 ? "invisible" : ""}
        >
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
