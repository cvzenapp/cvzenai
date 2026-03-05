import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, X, Loader2, Plus, Trash2, Edit } from "lucide-react";
import { Skill } from "@shared/api";

interface SkillsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkills: Skill[];
  onSave: (newSkills: Skill[]) => void;
  resumeData?: any; // For AI context
}

export function SkillsEditModal({
  isOpen,
  onClose,
  currentSkills,
  onSave,
  resumeData
}: SkillsEditModalProps) {
  const [skills, setSkills] = useState<Skill[]>(currentSkills || []);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing/adding skills
  const [formData, setFormData] = useState({
    name: "",
    level: 70,
    category: "Technical Skills",
    isCore: false
  });

  const categories = [
    "Programming Languages",
    "Frameworks & Libraries", 
    "Databases",
    "Cloud & DevOps",
    "Development Tools",
    "Testing & QA",
    "Operating Systems",
    "Soft Skills",
    "Methodologies",
    "Technical Skills"
  ];

  const handleSkillSelect = (index: number) => {
    const skill = skills[index];
    setSelectedSkillIndex(index);
    setFormData({
      name: skill.name,
      level: skill.level || 70,
      category: skill.category || "Technical Skills",
      isCore: skill.isCore || false
    });
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedSkillIndex(null);
    setFormData({
      name: "",
      level: 70,
      category: "Technical Skills",
      isCore: false
    });
  };

  const handleSaveSkill = () => {
    const skillData: Skill = {
      id: isAddingNew ? `skill-${Date.now()}` : skills[selectedSkillIndex!].id,
      name: formData.name,
      level: formData.level,
      category: formData.category,
      proficiency: formData.level,
      isCore: formData.isCore
    };

    if (isAddingNew) {
      setSkills([...skills, skillData]);
    } else if (selectedSkillIndex !== null) {
      const updatedSkills = [...skills];
      updatedSkills[selectedSkillIndex] = skillData;
      setSkills(updatedSkills);
    }

    // Reset form
    setIsAddingNew(false);
    setSelectedSkillIndex(null);
    setFormData({
      name: "",
      level: 70,
      category: "Technical Skills",
      isCore: false
    });
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
    if (selectedSkillIndex === index) {
      setSelectedSkillIndex(null);
      setIsAddingNew(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!resumeData) return;
    
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          experiences: resumeData.experiences,
          education: resumeData.education,
          currentSkills: skills
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSkills(result.data.skills);
        }
      }
    } catch (error) {
      console.error('Error generating AI skills:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(skills);
      onClose();
    } catch (error) {
      console.error('Error saving skills:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const canSaveSkill = formData.name.trim() && (isAddingNew || selectedSkillIndex !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Skills
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Skills List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Current Skills ({skills.length})
              </Label>
              <Button
                onClick={handleAddNew}
                size="sm"
                className="brand-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Skill
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {skills.map((skill, index) => (
                <div
                  key={skill.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSkillIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSkillSelect(index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        {skill.isCore && (
                          <Badge variant="secondary" className="text-xs">
                            Core
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {skill.category} • {skill.level}%
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSkill(index);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {skills.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No skills added yet</p>
                  <p className="text-xs">Click "Add Skill" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Edit Form */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              {isAddingNew ? 'Add New Skill' : selectedSkillIndex !== null ? 'Edit Skill' : 'Select a skill to edit'}
            </Label>

            {(isAddingNew || selectedSkillIndex !== null) && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="skillName">Skill Name</Label>
                  <Input
                    id="skillName"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter skill name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proficiency">
                    Proficiency Level: {formData.level}%
                  </Label>
                  <Slider
                    id="proficiency"
                    min={0}
                    max={100}
                    step={5}
                    value={[formData.level]}
                    onValueChange={(value) => setFormData({...formData, level: value[0]})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                    <span>Expert</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCore"
                    checked={formData.isCore}
                    onCheckedChange={(checked) => setFormData({...formData, isCore: !!checked})}
                  />
                  <Label htmlFor="isCore" className="text-sm">
                    Mark as core skill (will be highlighted)
                  </Label>
                </div>

                <Button
                  onClick={handleSaveSkill}
                  disabled={!canSaveSkill}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isAddingNew ? 'Add Skill' : 'Update Skill'}
                </Button>
              </div>
            )}

            {!isAddingNew && selectedSkillIndex === null && (
              <div className="text-center py-8 text-gray-500">
                <Edit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a skill from the list to edit</p>
                <p className="text-xs">or click "Add Skill" to create a new one</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
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
            {isGeneratingAI ? 'Generating...' : 'Suggest Skills with AI'}
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