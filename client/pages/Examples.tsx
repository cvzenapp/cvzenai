import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, Download, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Examples() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const examples = [
    {
      id: 1,
      name: "Alex Thompson",
      title: "Senior Software Engineer",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      company: "Google",
      template: "Technology",
      category: "Technology",
      templateKey: "technology",
      rating: 4.9,
      likes: 234,
      preview:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop",
      featured: true,
    },
    {
      id: 2,
      name: "Sarah Chen",
      title: "UX/UI Designer",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      company: "Apple",
      template: "Creative Designer",
      category: "Design",
      templateKey: "creative",
      rating: 4.8,
      likes: 189,
      preview:
        "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=500&fit=crop",
    },
    {
      id: 3,
      name: "Marcus Rodriguez",
      title: "Product Manager",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      company: "Meta",
      template: "Executive",
      category: "Management",
      templateKey: "management",
      rating: 4.9,
      likes: 156,
      preview:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=500&fit=crop",
    },
    {
      id: 4,
      name: "Emily Johnson",
      title: "Data Scientist",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      company: "Netflix",
      template: "Technology",
      category: "Technology",
      templateKey: "technology",
      rating: 4.7,
      likes: 203,
      preview:
        "https://images.unsplash.com/photo-1586953208462-d35b73c5c6a8?w=400&h=500&fit=crop",
    },
    {
      id: 5,
      name: "David Park",
      title: "Marketing Director",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      company: "Spotify",
      template: "Marketing",
      category: "Marketing",
      templateKey: "marketing",
      rating: 4.8,
      likes: 178,
      preview:
        "https://images.unsplash.com/photo-1586953208499-f7e9b3d6b0d7?w=400&h=500&fit=crop",
    },
    {
      id: 6,
      name: "Lisa Wang",
      title: "Research Scientist",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      company: "Stanford University",
      template: "Academic",
      category: "Academic",
      templateKey: "academic",
      rating: 4.9,
      likes: 145,
      preview:
        "https://images.unsplash.com/photo-1554224154-26032fced8bd?w=400&h=500&fit=crop",
    },
  ];

  const categories = [
    "All",
    "Technology",
    "Design",
    "Management",
    "Academic",
    "Marketing",
  ];

  const filteredExamples =
    selectedCategory === "All"
      ? examples
      : examples.filter((example) => example.category === selectedCategory);

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
            Resume
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {" "}
              Examples
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get inspired by real resumes from professionals who landed their
            dream jobs
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredExamples.map((example) => (
            <Card
              key={example.id}
              className="group shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="relative">
                <img
                  src={example.preview}
                  alt={`${example.name}'s resume`}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {example.featured && (
                  <Badge className="absolute top-4 left-4 bg-primary">
                    Featured
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Link
                      to={`/resume/${example.id}?template=${example.templateKey}`}
                    >
                      <Button size="sm" variant="secondary" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Resume
                      </Button>
                    </Link>
                    <Link
                      to={`/templates?category=${example.category.toLowerCase()}`}
                    >
                      <Button size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Use Template
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={example.avatar} alt={example.name} />
                    <AvatarFallback>
                      {example.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {example.name}
                    </h3>
                    <p className="text-sm text-slate-600">{example.title}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Company:</span>
                    <span className="font-medium text-slate-900">
                      {example.company}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Template:</span>
                    <Badge variant="outline">{example.template}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {example.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{example.likes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button size="lg" className="mr-4">
              Create Your Resume
            </Button>
          </Link>
          <Link to="/templates">
            <Button size="lg" variant="outline">
              Browse Templates
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
