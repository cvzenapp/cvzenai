import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Building2,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { recruiterAuthApi } from "@/services/recruiterAuthApi";
import { toast } from "@/hooks/use-toast";
import type { RecruiterLoginRequest } from "../../shared/recruiterAuth";

export default function RecruiterLogin() {
  const [formData, setFormData] = useState<RecruiterLoginRequest>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/recruiter/dashboard";

  // Demo accounts for testing
  const demoAccounts = [
    {
      email: "sarah.chen@google.com",
      company: "Google",
      role: "Senior Technical Recruiter",
    },
    {
      email: "alex.johnson@microsoft.com",
      company: "Microsoft",
      role: "Talent Acquisition Manager",
    },
  ];

  useEffect(() => {
    // Redirect if already authenticated
    if (recruiterAuthApi.isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleInputChange = (
    field: keyof RecruiterLoginRequest,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleDemoLogin = (email: string) => {
    setFormData((prev) => ({ ...prev, email, password: "demo123456" }));
    setErrors({});
    setGeneralError("");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      const response = await recruiterAuthApi.login(formData);

      if (response.success) {
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${response.recruiter?.firstName} ${response.recruiter?.lastName}`,
        });
        navigate(from, { replace: true });
      } else {
        // Check if this is a user type mismatch (job seeker trying to login as recruiter)
        if ((response as any).redirectTo) {
          setGeneralError(response.message || "Wrong login page");
          toast({
            title: "Wrong Login Page",
            description: response.message,
            variant: "destructive",
          });
          // Redirect to correct login page after 2 seconds
          setTimeout(() => {
            navigate((response as any).redirectTo);
          }, 2000);
        } else if (response.errors) {
          setErrors(response.errors);
        } else {
          setGeneralError(
            response.message || "Login failed. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Recruiter Portal
            </h1>
          </div>
          <p className="text-slate-600">
            Access your talent acquisition dashboard
          </p>
        </div>

        {/* Demo Accounts */}
        <div className="space-y-3">
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Quick Demo Access
            </Badge>
          </div>
          <div className="grid gap-2">
            {demoAccounts.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleDemoLogin(account.email)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-1.5 bg-blue-50 rounded">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {account.company}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {account.role}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your recruiter dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {generalError && (
                <Alert variant="destructive">
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="recruiter@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    autoComplete="current-password"
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
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      handleInputChange("rememberMe", checked === true)
                    }
                  />
                  <Label htmlFor="rememberMe" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/recruiter/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Don't have a recruiter account?{" "}
                <Link
                  to="/recruiter/register"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Register your company
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">
            Looking for a job?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              Job seeker login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
