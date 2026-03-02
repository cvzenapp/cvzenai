import React from "react";
import { getAllTemplates } from "@/services/templateService";
import ModernTechTemplate from "./templates/ModernTechTemplate";
import CreativeDesignerTemplate from "./templates/CreativeDesignerTemplate";
import ManagementTemplate from "./templates/ManagementTemplate";
import DevOpsTemplate from "./templates/DevOpsTemplate";
import MobileTemplate from "./templates/MobileTemplate";

interface TemplateGalleryProps {
  onTemplateSelect?: (templateId: string) => void;
}

export default function TemplateGallery({ onTemplateSelect }: TemplateGalleryProps) {
  const templates = getAllTemplates();

  const getTemplateComponent = (templateConfig: any) => {
    const commonProps = {
      resume: {
        personalInfo: { name: "Sample User", title: "Professional", email: "sample@example.com" },
        summary: "Sample summary",
        skills: [],
        experiences: [],
        education: [],
        projects: [],
      },
      templateConfig,
      activeTab: "card",
      setActiveTab: () => {},
      upvotes: 0,
      hasUpvoted: false,
      isShortlisted: false,
      onUpvote: () => {},
      onShortlist: () => {},
    };

    switch (templateConfig.category) {
      case "tech-modern":
        return <ModernTechTemplate {...commonProps} />;
      case "design":
        return <CreativeDesignerTemplate {...commonProps} />;
      case "management":
        return <ManagementTemplate {...commonProps} />;
      case "tech-devops":
        return <DevOpsTemplate {...commonProps} />;
      case "tech-mobile":
        return <MobileTemplate {...commonProps} />;
      default:
        return <ModernTechTemplate {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Modern Resume Templates
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose from our collection of professionally designed, ATS-optimized templates
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {templates.map((template) => (
            <div key={template.id} className="flex justify-center">
              {getTemplateComponent(template)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}