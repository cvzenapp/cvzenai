import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  Shield,
  ArrowLeft,
  Check,
  X,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "First name can only contain letters, spaces, hyphens, and apostrophes",
      ),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Last name can only contain letters, spaces, hyphens, and apostrophes",
      ),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(100, "Email must be less than 100 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /(?=.*[a-z])/,
        "Password must contain at least one lowercase letter",
      )
      .regex(
        /(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter",
      )
      .regex(/(?=.*\d)/, "Password must contain at least one number")
      .regex(
        /(?=.*[@$!%*?&])/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the terms and conditions",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character", test: (p) => /[@$!%*?&]/.test(p) },
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  // Don't redirect authenticated users from register page
  // Users may want to create a new account or the old token may be invalid
  // After successful registration, they will be redirected in the onSubmit handler

  // Calculate password strength
  const passwordStrength = passwordRequirements.reduce(
    (score, req) => score + (req.test(password || "") ? 1 : 0),
    0,
  );

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Very Weak";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Good";
    return "Strong";
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await register(data);

      if (response.success) {
        toast({
          title: "Account created successfully!",
          description:
            "Welcome to our platform. You can now start building your resume.",
        });
        navigate("/");
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    const currentValues = form.getValues();
    if (currentStep === 1) {
      // Validate personal info
      const firstNameValid = !!currentValues.firstName && currentValues.firstName.length >= 2;
      const lastNameValid = !!currentValues.lastName && currentValues.lastName.length >= 2;
      const emailValid =
        !!currentValues.email &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValues.email);
      if (firstNameValid && lastNameValid && emailValid) {
        setCurrentStep(2);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resume Platform
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create Account
            </h1>
          </div>
          <p className="text-muted-foreground">
            Join our platform to create and manage professional resumes
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of 2</span>
            <span>
              {currentStep === 1 ? "Personal Information" : "Security & Terms"}
            </span>
          </div>
          <Progress value={currentStep * 50} className="h-2" />
        </div>

        {/* Registration Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1
                ? "Tell us about yourself"
                : "Create a secure password and accept our terms"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert
                variant="destructive"
                className="animate-in slide-in-from-top-2 duration-300"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {currentStep === 1 && (
                  <>
                    {/* First Name Field */}
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John"
                              autoComplete="given-name"
                              disabled={isLoading}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Last Name Field */}
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Doe"
                              autoComplete="family-name"
                              disabled={isLoading}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email Field */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                              autoComplete="email"
                              disabled={isLoading}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full h-11"
                      disabled={isLoading}
                    >
                      Continue
                    </Button>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Password Field */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                                disabled={isLoading}
                                className="h-11 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          {password && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Password strength:
                                </span>
                                <span
                                  className={`font-medium ${
                                    passwordStrength <= 2
                                      ? "text-red-600"
                                      : passwordStrength <= 3
                                        ? "text-yellow-600"
                                        : passwordStrength <= 4
                                          ? "text-blue-600"
                                          : "text-green-600"
                                  }`}
                                >
                                  {getPasswordStrengthText()}
                                </span>
                              </div>
                              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                  style={{
                                    width: `${(passwordStrength / 5) * 100}%`,
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                {passwordRequirements.map((req, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    {req.test(password) ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <X className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <span
                                      className={
                                        req.test(password)
                                          ? "text-green-600"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {req.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password Field */}
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                disabled={isLoading}
                                className="h-11 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                disabled={isLoading}
                                aria-label={
                                  showConfirmPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          {confirmPassword && confirmPassword === password && (
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <Check className="h-3 w-3" />
                              Passwords match
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Terms and Conditions */}
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I agree to the{" "}
                              <Link
                                to="/terms"
                                className="text-primary hover:underline"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                to="/privacy"
                                className="text-primary hover:underline"
                              >
                                Privacy Policy
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 h-11"
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-11"
                        disabled={isLoading}
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
                    </div>
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Protected by 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}
