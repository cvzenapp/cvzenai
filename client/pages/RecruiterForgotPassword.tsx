import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Loader2, CheckCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { recruiterAuthApi } from "@/services/recruiterAuthApi";

export default function RecruiterForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await recruiterAuthApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold">
                Check Your Email
              </CardTitle>
              <CardDescription>
                We've sent password reset instructions to {email}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-slate-600">
                If an account with this email exists, you will receive an email
                with instructions to reset your password within a few minutes.
              </p>
              <p className="text-sm text-slate-600">
                Don't see the email? Check your spam folder or try again.
              </p>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button asChild className="w-full">
                <Link to="/recruiter/login">Back to Login</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
              >
                Try Different Email
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
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
            <h1 className="text-2xl font-bold text-slate-900">
              Reset Password
            </h1>
          </div>
          <p className="text-slate-600">
            Enter your email address and we'll send you instructions to reset
            your password
          </p>
        </div>

        {/* Reset Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">
              Forgot Password
            </CardTitle>
            <CardDescription>
              We'll send reset instructions to your registered email
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="recruiter@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Instructions...
                  </>
                ) : (
                  "Send Reset Instructions"
                )}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Remember your password?{" "}
                <Link
                  to="/recruiter/login"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
