import React from "react";
import { TemplateConfig } from "@/services/templateService";
import ModernTechTemplate from "./templates/ModernTechTemplate";
import CreativeDesignerTemplate from "./templates/CreativeDesignerTemplate";
import DevOpsTemplate from "./templates/DevOpsTemplate";
import CEOTemplate from "./templates/CEOTemplate";

interface TemplateCardProps {
  template: TemplateConfig;
  onUpvote?: () => void;
  onShortlist?: () => void;
}

export default function TemplateCard({ template, onUpvote, onShortlist }: TemplateCardProps) {
  // Create a sample resume for the template preview
  const sampleResume = {
    personalInfo: { 
      name: "Sample User", 
      title: "Professional", 
      email: "sample@example.com",
      phone: "+1 (555) 123-4567",
      location: "Your Location"
    },
    summary: "Sample professional summary",
    skills: [
      { id: "1", name: "Sample Skill", level: 85, category: "Core Skills" }
    ],
    experiences: [
      {
        id: "1",
        company: "Sample Company",
        position: "Sample Position",
        startDate: "2020-01",
        endDate: null,
        description: "Sample description"
      }
    ],
    education: [
      {
        id: "1",
        institution: "Sample University",
        degree: "Sample Degree",
        field: "Sample Field",
        startDate: "2016-09",
        endDate: "2020-05"
      }
    ],
    projects: [
      {
        id: "1",
        name: "Sample Project",
        description: "Sample project description",
        technologies: ["React", "Node.js"]
      }
    ],
  };

  const commonProps = {
    resume: sampleResume,
    templateConfig: template,
    activeTab: "card",
    setActiveTab: () => {},
    upvotes: 0,
    hasUpvoted: false,
    isShortlisted: false,
    onUpvote: onUpvote || (() => {}),
    onShortlist: onShortlist || (() => {}),
  };

  // Render the appropriate template component based on category and template ID
  switch (template.category) {
    case "tech-modern":
    case "design":
    case "management":
      // Use different leadership templates based on template ID
      if (template.id === "ceo-executive-1") {
      } else if (template.id === "project-manager-1") {
      } else if (template.id === "team-lead-1") {
      } else {
      }
    case "tech-devops":
    case "tech-mobile":
    case "technology":
    case "tech-minimal":
    case "tech-senior":
    case "tech-fullstack":
    case "academic":
    case "marketing":
    case "sales":
    default:
      return '';
  }
}