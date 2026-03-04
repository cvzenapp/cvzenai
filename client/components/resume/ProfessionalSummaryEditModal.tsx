import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, X, Loader2 } from "lucide-react";

interface ProfessionalSummaryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSummary: string;
  onSave: (newSummary: string) => void;
  resumeData?: any; // For AI context
}

export function ProfessionalSummaryEditModal({
  isOpen,
  onClose,
  currentSummary,
  onSave,
  resumeData
}: ProfessionalSummaryEditModalProps) {
  const [summary, setSummary] = useState(currentSummary);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAIGenerate = async () => {
    if (!resumeData) return;
    
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          experiences: resumeData.experiences,
          skills: resumeData.skills,
          education: resumeData.education,
          currentSummary: summary
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSummary(result.data.summary);
        }
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(summary);
      onClose();
    } catch (error) {
      console.error('Error saving summary:', error);
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
            Edit Professional Summary
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Professional Summary
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
              className="min-h-[120px] resize-none"
              disabled={isGeneratingAI}
            />
            <p className="text-xs text-gray-500">
              {summary.length}/500 characters recommended
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleAIGenerate}
              disabled={isGeneratingAI || !resumeData}
              className="flex items-center gap-2"
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
                disabled={isSaving || summary.trim() === ''}
                className="bg-blue-600 hover:bg-blue-700"
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