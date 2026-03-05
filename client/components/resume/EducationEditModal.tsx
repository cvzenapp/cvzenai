import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, X, Loader2, Plus, Trash2, Edit } from "lucide-react";
import { Education } from "@shared/api";

interface EducationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEducation: Education[];
  onSave: (newEducation: Education[]) => void;
  resumeData?: any; // For AI context
}

export function EducationEditModal({
  isOpen,
  onClose,
  currentEducation,
  onSave,
  resumeData
}: EducationEditModalProps) {
  const [education, setEducation] = useState<Education[]>(currentEducation || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    gpa: "",
    description: "",
    location: ""
  });

  // Initialize with first education if available
  useEffect(() => {
    if (isOpen && currentEducation && currentEducation.length > 0) {
      setEducation(currentEducation);
      setEditingIndex(0);
      const firstEdu = currentEducation[0];
      setFormData({
        institution: firstEdu.institution || "",
        degree: firstEdu.degree || "",
        field: firstEdu.field || "",
        startDate: firstEdu.startDate || "",
        endDate: firstEdu.endDate || "",
        gpa: firstEdu.gpa || "",
        description: firstEdu.description || "",
        location: firstEdu.location || ""
      });
    } else if (isOpen) {
      setEducation(currentEducation || []);
      setEditingIndex(null);
    }
  }, [isOpen, currentEducation]);

  const handleAddEducation = () => {
    const newEducation: Education = {
      id: `education-${Date.now()}`,
      institution: formData.institution,
      degree: formData.degree,
      field: formData.field,
      startDate: formData.startDate,
      endDate: formData.endDate,
      gpa: formData.gpa,
      description: formData.description,
      location: formData.location,
      achievements: []
    };

    if (editingIndex !== null) {
      const updatedEducation = [...education];
      updatedEducation[editingIndex] = newEducation;
      setEducation(updatedEducation);
      setEditingIndex(null);
    } else {
      setEducation([...education, newEducation]);
    }

    setFormData({
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
      location: ""
    });
  };

  const handleEditEducation = (index: number) => {
    const edu = education[index];
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      gpa: edu.gpa || "",
      description: edu.description || "",
      location: edu.location || ""
    });
    setEditingIndex(index);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleAIGenerate = async () => {
    if (!resumeData) return;
    
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          experiences: resumeData.experiences,
          currentEducation: education
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEducation(result.data.education);
        }
      }
    } catch (error) {
      console.error('Error generating AI education:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    console.log('🔍 handleSave clicked');
    console.log('🔍 Saving education:', education);
    console.log('🔍 onSave function:', onSave);
    setIsSaving(true);
    try {
      console.log('🔍 Calling onSave...');
      await onSave(education);
      console.log('🔍 onSave completed successfully');
      onClose();
    } catch (error) {
      console.error('🔍 Error saving education:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Education
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[70vh] gap-6">
          {/* Left Panel - Education List */}
          <div className="w-1/3 border-r pr-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-gray-600">Education ({education.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingIndex(null);
                  setFormData({
                    institution: "",
                    degree: "",
                    field: "",
                    startDate: "",
                    endDate: "",
                    gpa: "",
                    description: "",
                    location: ""
                  });
                }}
                className="h-8 px-3 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[calc(70vh-8rem)] overflow-y-auto">
              {education.map((edu, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    editingIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleEditEducation(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {edu.degree} in {edu.field}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {edu.institution}
                      </p>
                      <p className="text-xs text-gray-400">
                        {edu.startDate} - {edu.endDate}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEducation(index);
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {education.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Edit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No education yet</p>
                  <p className="text-xs">Click "Add" to create your first entry</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Education Details */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <h3 className="font-medium">
                {editingIndex !== null ? 'Edit Education' : 'Add New Education'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institution *</label>
                  <Input
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    placeholder="University name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Degree *</label>
                  <Input
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value})}
                    placeholder="Bachelor's, Master's, PhD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field of Study *</label>
                  <Input
                    value={formData.field}
                    onChange={(e) => setFormData({...formData, field: e.target.value})}
                    placeholder="Computer Science, Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({...formData, startDate: e.target.value});
                      // Auto-save if editing existing education
                      if (editingIndex !== null) {
                        const updatedEducation = [...education];
                        updatedEducation[editingIndex] = {
                          ...updatedEducation[editingIndex],
                          startDate: e.target.value
                        };
                        setEducation(updatedEducation);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData({...formData, endDate: e.target.value});
                      // Auto-save if editing existing education
                      if (editingIndex !== null) {
                        const updatedEducation = [...education];
                        updatedEducation[editingIndex] = {
                          ...updatedEducation[editingIndex],
                          endDate: e.target.value
                        };
                        setEducation(updatedEducation);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GPA</label>
                  <Input
                    value={formData.gpa}
                    onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                    placeholder="3.8/4.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Relevant coursework, achievements, honors, or activities..."
                  rows={4}
                />
              </div>

              {/* Save Education Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleAddEducation} 
                  disabled={!formData.institution.trim() || !formData.degree.trim()}
                  className="w-full brand-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingIndex !== null ? 'Update Education' : 'Add Education'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleAIGenerate}
            disabled={isGeneratingAI || !resumeData}
            className="brand-button-outline flex items-center gap-2"
          >
            {isGeneratingAI ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGeneratingAI ? 'Generating...' : 'Enhance with AI'}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="brand-button"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}