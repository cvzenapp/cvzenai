import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, X, Loader2 } from "lucide-react";

interface CareerObjectiveEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentObjective: string;
  onSave: (newObjective: string) => void;
  resumeData?: any; // For AI context
}

export function CareerObjectiveEditModal({
  isOpen,
  onClose,
  currentObjective,
  onSave,
  resumeData
}: CareerObjectiveEditModalProps) {
  const [objective, setObjective] = useState(currentObjective || "");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAIGenerate = async () => {
    if (!resumeData) return;
    
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-objective', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          experiences: resumeData.experiences,
          education: resumeData.education,
          skills: resumeData.skills,
          currentObjective: objective
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setObjective(result.data.objective);
        }
      }
    } catch (error) {
      console.error('Error generating AI objective:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(objective);
      onClose();
    } catch (error) {
      console.error('Error saving objective:', error);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Career Objective
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Career Objective
            </label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Write your career objective..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {objective.length} characters
            </p>
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
              {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}