import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { ProfessionalSummaryEditModal } from "./ProfessionalSummaryEditModal";
import { resumeUpdateApi } from "@/services/resumeUpdateApi";

interface EditableResumeSectionProps {
  sectionType: 'summary' | 'objective' | 'personalInfo' | 'skills' | 'experiences' | 'education' | 'projects';
  resumeId: string | number;
  currentData: any;
  onUpdate: (updatedData: any) => void;
  children: React.ReactNode;
  resumeData?: any; // For AI context
  isOwner?: boolean; // Only show edit buttons for resume owner
}

export function EditableResumeSection({
  sectionType,
  resumeId,
  currentData,
  onUpdate,
  children,
  resumeData,
  isOwner = false
}: EditableResumeSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSave = async (newData: any) => {
    try {
      let updatePayload: any = {};
      
      switch (sectionType) {
        case 'summary':
          updatePayload = { summary: newData };
          break;
        case 'objective':
          updatePayload = { objective: newData };
          break;
        case 'personalInfo':
          updatePayload = { personalInfo: newData };
          break;
        case 'skills':
          updatePayload = { skills: newData };
          break;
        case 'experiences':
          updatePayload = { experiences: newData };
          break;
        case 'education':
          updatePayload = { education: newData };
          break;
        case 'projects':
          updatePayload = { projects: newData };
          break;
        default:
          throw new Error(`Unsupported section type: ${sectionType}`);
      }

      const result = await resumeUpdateApi.updateResumeSection(resumeId, updatePayload);
      
      if (result.success) {
        onUpdate(result.data);
      } else {
        throw new Error(result.error || 'Failed to update resume section');
      }
    } catch (error) {
      console.error('Error saving resume section:', error);
      throw error;
    }
  };

  const renderEditModal = () => {
    switch (sectionType) {
      case 'summary':
        return (
          <ProfessionalSummaryEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            currentSummary={currentData}
            onSave={handleSave}
            resumeData={resumeData}
          />
        );
      // Add more modals for other sections as needed
      default:
        return null;
    }
  };

  return (
    <div className="relative group">
      {children}
      
      {isOwner && (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit3 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      )}
      
      {renderEditModal()}
    </div>
  );
}