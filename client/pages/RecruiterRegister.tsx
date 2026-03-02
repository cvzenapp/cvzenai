import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { recruiterAuthApi } from "@/services/recruiterAuthApi";
import { toast } from "@/hooks/use-toast";
import type {
  RecruiterRegisterRequest,
  CompanySearchResult,
} from "../../shared/recruiterAuth";
import {
  COMPANY_SIZE_RANGES,
  INDUSTRIES,
  JOB_TITLES,
} from "../../shared/recruiterAuth";

const steps = [
  { id: "personal", title: "Personal Information", icon: User },
  { id: "verification", title: "Verify & Complete", icon: Check },
];

export default function RecruiterRegister() {
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
    acceptTerms: false,
    acceptPrivacyPolicy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (recruiterAuthApi.isAuthenticated()) {
      navigate("/recruiter/dashboard", { replace: true });
    }
  }, [navigate]);

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
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[@$!%*?&]/.test(password)) strength += 25;
    setPasswordStrength(Math.min(strength, 100));
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
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
      if (!formData.jobTitle) newErrors.jobTitle = "Job title is required";
    } else if (step === 1) {
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
      const response = await recruiterAuthApi.register(formData);

      if (response.success) {
        toast({
          title: "Registration successful!",
          description: `Welcome to the platform, ${response.recruiter?.firstName}!`,
        });
        navigate("/recruiter/dashboard", { replace: true });
      } else {
        if (response.errors) {
          setErrors(response.errors);
        } else {
          setGeneralError(
            response.message || "Registration failed. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/recruiter/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Join as a Recruiter
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Register your company and start connecting with top talent. Build
            your hiring pipeline with our comprehensive recruitment platform.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    index <= currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index < currentStep ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {steps.length}:{" "}
              {steps[currentStep].title}
            </Badge>
          </div>
        </div>

        {/* Main Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 0 && "Tell us about yourself and your role"}
              {currentStep === 1 && "Review and complete your registration"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
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
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getPasswordStrengthColor()}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {getPasswordStrengthText()}
                          </span>
                        </div>
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
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Select
                    value={formData.jobTitle}
                    onValueChange={(value) =>
                      handleInputChange("jobTitle", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.jobTitle ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select your job title" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedinUrl}
                        onChange={(e) =>
                          handleInputChange("linkedinUrl", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Verification & Terms */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900">
                    Registration Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Name</p>
                      <p className="font-medium">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Job Title</p>
                      <p className="font-medium">{formData.jobTitle}</p>
                    </div>
                   
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) =>
                        handleInputChange("acceptTerms", checked === true)
                      }
                      className={errors.acceptTerms ? "border-red-500" : ""}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="acceptTerms"
                        className="text-sm leading-5"
                      >
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/recruiter-terms"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Recruiter Agreement
                        </Link>
                      </Label>
                      {errors.acceptTerms && (
                        <p className="text-sm text-red-600">
                          {errors.acceptTerms}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptPrivacyPolicy"
                      checked={formData.acceptPrivacyPolicy}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          "acceptPrivacyPolicy",
                          checked === true,
                        )
                      }
                      className={
                        errors.acceptPrivacyPolicy ? "border-red-500" : ""
                      }
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="acceptPrivacyPolicy"
                        className="text-sm leading-5"
                      >
                        I acknowledge that I have read and agree to the{" "}
                        <Link
                          to="/privacy"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Privacy Policy
                        </Link>
                      </Label>
                      {errors.acceptPrivacyPolicy && (
                        <p className="text-sm text-red-600">
                          {errors.acceptPrivacyPolicy}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Your account will be reviewed and activated within 24 hours.
                    You'll receive an email confirmation once approved.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>

          {/* Navigation Buttons */}
          <div className="border-t p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/recruiter/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
