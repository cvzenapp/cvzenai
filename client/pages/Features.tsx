import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Zap,
  Share2,
  Eye,
  Shield,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Features() {
  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Professional Templates",
      description:
        "Choose from dozens of ATS-friendly templates designed by experts",
      details:
        "Our templates are crafted by professional designers and optimized for Applicant Tracking Systems to ensure your resume gets noticed.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered Builder",
      description: "Smart suggestions and auto-completion to build faster",
      details:
        "Our AI analyzes your input and provides intelligent suggestions for content, formatting, and improvements.",
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "Easy Sharing",
      description: "Share your resume with a simple link or download as PDF",
      details:
        "Generate shareable links or download high-quality PDFs with a single click.",
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Real-time Preview",
      description: "See changes instantly as you build your resume",
      details:
        "Watch your resume come to life with instant preview updates as you make changes.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy First",
      description: "Your data is secure and never shared without permission",
      details:
        "We use industry-standard encryption and never sell or share your personal information.",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "ATS Optimized",
      description: "Designed to pass Applicant Tracking Systems",
      details:
        "Our templates are specifically designed to be parsed correctly by ATS software used by employers.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {" "}
              Professional Resumes
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Everything you need to create standout resumes that get you hired
            faster
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all"
            >
              <CardHeader>
                <div className="text-primary mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">{feature.description}</p>
                <p className="text-slate-700 text-sm">{feature.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button size="lg" className="mr-4">
              Get Started Free
            </Button>
          </Link>
          <Link to="/templates">
            <Button size="lg" variant="outline">
              View Templates
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
