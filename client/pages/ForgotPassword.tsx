import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, Shield, ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { authApi } from "@/services/authApi";
import { toast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.requestPasswordReset(data);

      if (response.success) {
        setIsSubmitted(true);
        toast({
          title: "Reset link sent!",
          description: "Check your email for password reset instructions.",
        });
      } else {
        setError(
          response.message || "Failed to send reset email. Please try again.",
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error sending reset email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Check Your Email
              </h1>
            </div>
            <p className="text-muted-foreground">
              We've sent password reset instructions to your email address
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Please check your email inbox and follow the instructions to
                    reset your password. The link will expire in 1 hour for
                    security reasons.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      form.reset();
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Reset Password
            </h1>
          </div>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {/* Reset Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center">
              We'll email you instructions to reset your password
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
                          placeholder="Enter your email address"
                          autoComplete="email"
                          disabled={isLoading}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                For security, the reset link will expire in 1 hour
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Actions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
