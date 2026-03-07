import { useState } from "react";
import { Plus, Trash2, Quote, Star, MessageSquare, User, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  photo?: string;
  rating?: number;
}

interface TestimonialManagerProps {
  testimonials: Testimonial[];
  onUpdate: (testimonials: Testimonial[]) => void;
}

export default function TestimonialManager({ testimonials, onUpdate }: TestimonialManagerProps) {
  const [activeModal, setActiveModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Testimonial>>({ rating: 5 });

  // Ensure testimonials is always an array
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];

  const handleAdd = () => {
    if (!formData.name || !formData.content || !formData.role) return;

    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      name: formData.name,
      role: formData.role,
      company: formData.company,
      content: formData.content,
      photo: formData.photo,
      rating: formData.rating || 5,
    };

    onUpdate([...safeTestimonials, newTestimonial]);
    setFormData({ rating: 5 });
    setActiveModal(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(safeTestimonials.filter((t) => t.id !== id));
  };

  const resetForm = () => {
    setFormData({ rating: 5 });
    setActiveModal(false);
  };

  return (
    <Card className="premium-card border-0 shadow-xl">
      <CardHeader className="premium-card-header">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-jakarta font-medium text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <span className="text-white">Client Testimonials</span>
              <p className="text-sm text-white/80 font-normal mt-0.5">Showcase what clients say about your work</p>
            </div>
          </CardTitle>
          <Button onClick={() => setActiveModal(true)} size="sm" className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </CardHeader>
      <CardContent className="premium-card-content">
        {safeTestimonials.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl mx-auto flex items-center justify-center">
                  <svg className="h-10 w-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-100 border-2 border-white rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Build Trust with Testimonials</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Share authentic feedback from clients and colleagues to build credibility and showcase your impact.
              </p>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Builds instant credibility</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Provides social proof</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Demonstrates real impact</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {safeTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:border-teal-200 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm"
                  onClick={() => handleDelete(testimonial.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                {/* Quote Icon */}
                <div className="absolute top-6 left-6 w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Quote className="h-4 w-4 text-teal-600" />
                </div>

                {/* Testimonial Content */}
                <div className="pt-8">
                  <blockquote className="text-slate-700 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Rating */}
                  {testimonial.rating && (
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating!
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-teal-100">
                      <AvatarImage src={testimonial.photo} alt={testimonial.name} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                        {testimonial.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{testimonial.role}</span>
                        {testimonial.company && (
                          <>
                            <span className="text-slate-400">•</span>
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>{testimonial.company}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-6 h-6 bg-teal-100 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Enhanced Add Testimonial Modal */}
      <Dialog open={activeModal} onOpenChange={setActiveModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-900">Add Testimonial</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Share authentic feedback from clients and colleagues</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Testimonial Details */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Person Information
                  </h3>
                  
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name *
                    </Label>
                    <Input
                      id="testimonial-name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sarah Johnson, Michael Chen, Alex Rodriguez"
                      className="h-11 text-base border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-role" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                      Job Title *
                    </Label>
                    <Input
                      id="testimonial-role"
                      value={formData.role || ""}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g., Senior Developer, Product Manager, CEO"
                      className="h-11 text-base border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-company" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Company
                      <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="testimonial-company"
                      value={formData.company || ""}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Google, Microsoft, Startup Inc."
                      className="h-11 text-base border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Photo URL */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-photo" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Profile Photo
                      <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="testimonial-photo"
                      value={formData.photo || ""}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      placeholder="https://example.com/profile-photo.jpg"
                      className="h-11 text-base border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                    <p className="text-xs text-slate-500">Professional headshot works best</p>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Rating & Feedback
                  </h3>

                  {/* Rating */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-rating" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Star Rating
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: i + 1 })}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                i < (formData.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 hover:text-amber-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-slate-600">
                        {formData.rating || 5} out of 5 stars
                      </span>
                    </div>
                  </div>

                  {/* Testimonial Content */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-content" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Testimonial Text *
                    </Label>
                    <Textarea
                      id="testimonial-content"
                      value={formData.content || ""}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Share the specific feedback, what made the experience great, and the impact of working together..."
                      rows={5}
                      className="text-base border-slate-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Focus on specific results and positive experiences</span>
                      <span className={`${(formData.content || '').length > 300 ? 'text-amber-600' : ''}`}>
                        {(formData.content || '').length}/400
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Preview & Tips */}
              <div className="space-y-6">
                {/* Testimonial Preview */}
                {(formData.name || formData.content) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm font-medium text-slate-700">Preview</span>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                      <div className="absolute top-2 left-2 w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Quote className="h-3 w-3 text-teal-600" />
                      </div>
                      <div className="pt-6">
                        <blockquote className="text-slate-700 mb-4 leading-relaxed italic text-sm">
                          "{formData.content || 'Testimonial content will appear here...'}"
                        </blockquote>
                        {formData.rating && (
                          <div className="flex gap-1 mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < formData.rating!
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-teal-100">
                            <AvatarImage src={formData.photo} alt={formData.name} />
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                              {(formData.name || 'N').split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm text-slate-900">
                              {formData.name || 'Name'}
                            </div>
                            <div className="text-xs text-slate-600">
                              {formData.role || 'Role'}
                              {formData.company && ` • ${formData.company}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Testimonial Tips */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-teal-900 mb-2">Great Testimonial Tips</h4>
                      <ul className="text-sm text-teal-700 space-y-1">
                        <li>• Include specific results and outcomes</li>
                        <li>• Mention what made the experience unique</li>
                        <li>• Use authentic, conversational language</li>
                        <li>• Focus on the value delivered</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Testimonial Examples */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Examples
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-slate-100">
                      <div className="font-medium text-slate-900">Client Project</div>
                      <div className="text-slate-600 mt-1">"The team delivered our e-commerce platform 2 weeks ahead of schedule and 15% under budget. Their attention to detail and proactive communication made all the difference."</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100">
                      <div className="font-medium text-slate-900">Team Collaboration</div>
                      <div className="text-slate-600 mt-1">"Working with Sarah was incredible. She not only solved our technical challenges but also mentored our junior developers. Our team's productivity increased by 40%."</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-3">
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!formData.name?.trim() || !formData.content?.trim() || !formData.role?.trim()}
              className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Testimonial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
