import { useState } from "react";
import { Plus, Trash2, Heart, Target, Zap, Users, Star, Shield, Lightbulb, Award, Globe, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CultureValue {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface CultureManagerProps {
  values: CultureValue[];
  onUpdate: (values: CultureValue[]) => void;
}

const iconOptions = [
  { value: "heart", label: "Heart", icon: Heart, description: "Passion & Care" },
  { value: "target", label: "Target", icon: Target, description: "Focus & Goals" },
  { value: "zap", label: "Lightning", icon: Zap, description: "Energy & Speed" },
  { value: "users", label: "Team", icon: Users, description: "Collaboration" },
  { value: "star", label: "Star", icon: Star, description: "Excellence" },
  { value: "shield", label: "Shield", icon: Shield, description: "Trust & Security" },
  { value: "lightbulb", label: "Innovation", icon: Lightbulb, description: "Creativity" },
  { value: "award", label: "Award", icon: Award, description: "Achievement" },
  { value: "globe", label: "Global", icon: Globe, description: "Diversity" },
  { value: "rocket", label: "Rocket", icon: Rocket, description: "Growth" },
];

const getIcon = (iconName: string) => {
  const option = iconOptions.find((opt) => opt.value === iconName);
  return option?.icon || Heart;
};

const getIconOption = (iconName: string) => {
  return iconOptions.find((opt) => opt.value === iconName) || iconOptions[0];
};

export default function CultureManager({ values, onUpdate }: CultureManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CultureValue>>({ icon: "heart" });

  // Ensure values is always an array
  const safeValues = Array.isArray(values) ? values : [];

  const handleAdd = () => {
    if (!formData.title || !formData.description) return;

    const newValue: CultureValue = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      icon: formData.icon || "heart",
    };

    onUpdate([...safeValues, newValue]);
    setFormData({ icon: "heart" });
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(safeValues.filter((v) => v.id !== id));
  };

  const resetForm = () => {
    setFormData({ icon: "heart" });
    setIsOpen(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#cfe2f3' }}>
              <Heart className="h-5 w-5" style={{ color: '#0a0a37' }} />
            </div>
            <div>
              <h3 className="text-xl font-normal text-slate-900">Culture & Values</h3>
              <p className="text-sm text-slate-500">Define what makes your company unique</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#0a0a37', color: 'white' }} className="hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Value
              </Button>
            </DialogTrigger>
            
            {/* Enhanced Add Culture Value Modal */}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-slate-900">Add Culture Value</DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">Define a core principle that guides your company</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column - Value Details */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Value Information
                      </h3>
                      
                      {/* Value Title */}
                      <div className="space-y-2">
                        <Label htmlFor="value-title" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Value Title *
                        </Label>
                        <Input
                          id="value-title"
                          value={formData.title || ""}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Innovation First, Customer Obsession, Team Excellence"
                          className="h-11 text-base border-slate-200 focus:border-rose-500 focus:ring-rose-500"
                        />
                      </div>

                      {/* Value Description */}
                      <div className="space-y-2">
                        <Label htmlFor="value-description" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Description *
                        </Label>
                        <Textarea
                          id="value-description"
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe what this value means to your company and how it guides your decisions..."
                          rows={4}
                          className="text-base border-slate-200 focus:border-rose-500 focus:ring-rose-500 resize-none"
                        />
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Explain how this value is lived out in your company</span>
                          <span className={`${(formData.description || '').length > 200 ? 'text-amber-600' : ''}`}>
                            {(formData.description || '').length}/300
                          </span>
                        </div>
                      </div>

                      {/* Icon Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="value-icon" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                          </svg>
                          Representative Icon
                        </Label>
                        <Select
                          value={formData.icon || "heart"}
                          onValueChange={(value) => setFormData({ ...formData, icon: value })}
                        >
                          <SelectTrigger id="value-icon" className="h-11 border-slate-200 focus:border-rose-500 focus:ring-rose-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-3">
                                  <option.icon className="h-4 w-4 text-rose-600" />
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-slate-500">{option.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Choose an icon that best represents this value</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Preview & Examples */}
                  <div className="space-y-6">
                    {/* Value Preview Card */}
                    {(formData.title || formData.description) && (
                      <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700">Preview</span>
                        </div>
                        <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              {(() => {
                                const IconComponent = getIcon(formData.icon || "heart");
                                return <IconComponent className="h-6 w-6 text-rose-600" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 mb-2">
                                {formData.title || 'Value Title'}
                              </h4>
                              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                {formData.description || 'Value description will appear here...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Culture Building Tips */}
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-rose-900 mb-2">Culture Value Tips</h4>
                          <ul className="text-sm text-rose-700 space-y-1">
                            <li>• Make it actionable and specific</li>
                            <li>• Use language that resonates with your team</li>
                            <li>• Focus on behaviors, not just ideals</li>
                            <li>• Keep it authentic to your company</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Value Examples */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Examples
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-rose-600" />
                            Innovation First
                          </div>
                          <div className="text-slate-600 mt-1">We embrace new ideas, experiment boldly, and learn from failures to drive continuous improvement.</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <Users className="h-4 w-4 text-rose-600" />
                            Team Excellence
                          </div>
                          <div className="text-slate-600 mt-1">We support each other, celebrate wins together, and believe that diverse perspectives make us stronger.</div>
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
                  disabled={!formData.title?.trim() || !formData.description?.trim()}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Value
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Empty State */}
        {safeValues.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl mx-auto flex items-center justify-center">
                  <Heart className="h-10 w-10 text-rose-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-100 border-2 border-white rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Define Your Culture</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Share the core values and principles that guide your company and make it a great place to work.
              </p>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Attracts aligned talent</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Builds company identity</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Differentiates your brand</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Culture Value Cards */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeValues.map((value) => {
              const IconComponent = getIcon(value.icon);
              const iconOption = getIconOption(value.icon);
              return (
                <div
                  key={value.id}
                  className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:border-rose-200 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm"
                    onClick={() => handleDelete(value.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>

                  {/* Value Content */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ backgroundColor: '#cfe2f3' }}>
                      <IconComponent className="h-6 w-6" style={{ color: '#0a0a37' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-normal text-slate-900 mb-2 line-clamp-2">
                        {value.title}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                        {value.description}
                      </p>
                      <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        <span>{iconOption.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Culture Badge */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 bg-rose-100 border-2 border-white rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
