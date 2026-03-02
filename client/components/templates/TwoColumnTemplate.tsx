import React from "react";
import { Resume } from "@shared/api";
import { TemplateConfig } from "@/services/templateService";

interface TemplateProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  upvotes: number;
  hasUpvoted: boolean;
  isShortlisted: boolean;
  onUpvote: () => void;
  onShortlist: () => void;
}

export default function TwoColumnTemplate(props: TemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-green-900">
          Two Column Template
        </h2>
        <p className="text-gray-600 mb-8">
          Efficient layout maximizing information density.
          <br />
          Features: Split header, left sidebar, compact spacing, information
          dense.
        </p>
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/80 border-2 border-green-200 rounded p-8 text-center">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Left Column
            </h3>
            <p className="text-green-700">Skills, Contact, etc.</p>
          </div>
          <div className="bg-white/80 border-2 border-blue-200 rounded p-8 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Right Column
            </h3>
            <p className="text-blue-700">Experience, Education, etc.</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-500">Two Column Template Implementation</p>
          <p className="text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
