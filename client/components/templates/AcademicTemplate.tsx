import React from "react";
import { Resume } from "@shared/api";
import { TemplateConfig } from "@/services/templateService";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen } from "lucide-react";

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

export default function AcademicTemplate(props: TemplateProps) {
  return (
    <div id="resume-template-container" className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 text-blue-900 font-serif">
            Academic Researcher Template
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            Comprehensive CV format for researchers, professors, and academics.
            <br />
            Features: Publication lists, research focus, grants, teaching
            experience, academic service.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() =>
                window.open(
                  `/builder?template=${props.templateConfig.category}`,
                  "_blank",
                )
              }
            >
              <GraduationCap className="h-4 w-4" />
              Use Academic Template
            </Button>
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Preview CV
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 font-serif">
              Research & Publications
            </h3>
            <ul className="text-blue-700 space-y-2 text-sm">
              <li>• Peer-reviewed publications</li>
              <li>• Conference presentations</li>
              <li>• Research projects</li>
              <li>• Citations & impact</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3 font-serif">
              Teaching & Supervision
            </h3>
            <ul className="text-red-700 space-y-2 text-sm">
              <li>• Course development</li>
              <li>• Student supervision</li>
              <li>• Teaching evaluations</li>
              <li>• Curriculum design</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3 font-serif">
              Grants & Service
            </h3>
            <ul className="text-green-700 space-y-2 text-sm">
              <li>• Research funding</li>
              <li>• Editorial boards</li>
              <li>• Academic committees</li>
              <li>• Professional societies</li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-500 font-serif">
            Academic Template Implementation
          </p>
          <p className="text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
