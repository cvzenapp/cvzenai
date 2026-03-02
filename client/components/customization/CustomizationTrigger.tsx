import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { CustomizationPanel } from './CustomizationPanel';
import './customization.css';

interface CustomizationTriggerProps {
  userId?: string | number;
  resumeId?: number;
}

export const CustomizationTrigger: React.FC<CustomizationTriggerProps> = ({ userId, resumeId }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        className="customization-trigger"
        onClick={() => setIsPanelOpen(true)}
        title="Customize template"
      >
        <Palette size={24} />
      </button>

      <CustomizationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        userId={userId}
        resumeId={resumeId}
      />
    </>
  );
};
