import React from "react";
import { Resume } from "@shared/api";
import { TemplateConfig } from "@/services/templateService";
import { formatDateRange } from "@/lib/utils";
import { Star, Heart, GitCompare, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DevOpsTemplateProps {
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

export default function DevOpsTemplate({
  resume,
  templateConfig,
  activeTab,
  setActiveTab,
  upvotes,
  hasUpvoted,
  isShortlisted,
  onUpvote,
  onShortlist,
}: DevOpsTemplateProps) {
  // If we're in template gallery mode, show the card preview
  if (activeTab === "card" || !activeTab) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm">
        {/* Red/Orange Gradient Header */}
        <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-red-700 text-white p-6">
          {/* Popular Badge and Rating */}
          <div className="flex justify-between items-start mb-4">
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full font-medium text-xs">
              🔥 Hot
            </Badge>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="font-semibold text-sm">4.7</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShortlist}
                className={`rounded-full p-1.5 ${
                  isShortlisted 
                    ? "bg-red-500/20 text-red-300" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Heart className={`w-4 h-4 ${isShortlisted ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full p-1.5 bg-white/10 text-white hover:bg-white/20"
              >
                <GitCompare className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Header Content Bars */}
          <div className="space-y-3">
            {/* Name/Title Bar */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 bg-white/40 rounded-full"></div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/60 rounded-lg w-3/4"></div>
                <div className="h-2 bg-white/40 rounded-lg w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Light Gray Content Section */}
        <div className="bg-gray-100 p-6">
          {/* Content Bars representing resume sections */}
          <div className="space-y-3">
            {/* Infrastructure Section */}
            <div className="space-y-2">
              <div className="h-3 bg-red-400 rounded-lg w-full"></div>
              <div className="h-2 bg-red-300 rounded-lg w-5/6"></div>
              <div className="h-2 bg-red-300 rounded-lg w-4/5"></div>
            </div>
            
            {/* Experience Section */}
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-orange-400 rounded-lg w-full"></div>
              <div className="h-2 bg-orange-300 rounded-lg w-11/12"></div>
              <div className="h-2 bg-orange-300 rounded-lg w-3/4"></div>
              <div className="h-2 bg-orange-300 rounded-lg w-5/6"></div>
            </div>

            {/* Tools Section */}
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-red-400 rounded-lg w-4/5"></div>
              <div className="h-2 bg-red-300 rounded-lg w-2/3"></div>
              <div className="h-2 bg-red-300 rounded-lg w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Template Info Section */}
        <div className="p-4 bg-white">
          {/* Template Title */}
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-5 h-5 text-red-700" />
            <h3 className="text-lg font-bold text-slate-900">DevOps Engineer</h3>
          </div>

          {/* Description */}
          <p className="text-slate-600 mb-4 text-sm">
            Infrastructure-focused template for DevOps professionals
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
              Cloud
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
              CI/CD
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
              Automation
            </Badge>
            <Badge variant="outline" className="border-red-200 text-red-700 text-xs">
              Advanced
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center mb-4 text-xs text-slate-500">
            <span>8.2K downloads</span>
            <span>DevOps</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-1 text-xs"
              onClick={() => {
                window.location.href = `/builder?template=tech-devops`;
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-xs"
              onClick={() => {
                window.location.href = `/builder?template=tech-devops`;
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Use Template
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full resume layout for preview mode
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Resume Header */}
          <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-700 text-white p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {resume.personalInfo?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {resume.personalInfo?.name || "Your Name"}
                </h1>
                <p className="text-xl text-red-100">
                  {resume.personalInfo?.title || "DevOps Engineer"}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span>{resume.personalInfo?.email || "your.email@example.com"}</span>
                  <span>{resume.personalInfo?.phone || "+1 (555) 123-4567"}</span>
                  <span>{resume.personalInfo?.location || "Your Location"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Content */}
          <div className="p-8 space-y-8">
            {/* Professional Summary */}
            {resume.summary && (
              <section>
                <h2 className="text-xl font-bold text-red-900 mb-4 border-b-2 border-red-200 pb-2">
                  Technical Summary
                </h2>
                <p className="text-slate-700 leading-relaxed">{resume.summary}</p>
              </section>
            )}

            {/* Technical Skills */}
            {resume.skills && resume.skills.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-red-900 mb-4 border-b-2 border-red-200 pb-2">
                  Technical Expertise
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resume.skills.map((skill, index) => (
                    <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-100">
                      <div className="font-medium text-red-900">{skill.name}</div>
                      <div className="text-sm text-red-600">{skill.category}</div>
                      <div className="mt-2 bg-red-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full"
                          style={{ width: `${skill.level || 70}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Professional Experience */}
            {resume.experiences && resume.experiences.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-red-900 mb-4 border-b-2 border-red-200 pb-2">
                  Professional Experience
                </h2>
                <div className="space-y-6">
                  {resume.experiences.map((exp, index) => (
                    <div key={index} className="border-l-4 border-red-600 pl-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-red-900">{exp.position}</h3>
                          <p className="text-red-600 font-medium">{exp.company}</p>
                        </div>
                        <span className="text-sm text-slate-500">
                          {formatDateRange(exp.startDate, exp.endDate)}
                        </span>
                      </div>
                      <p className="text-slate-700 mb-3">
                        {exp.is_optimized && exp.description_optimized ? exp.description_optimized : exp.description}
                      </p>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                          {(exp.is_optimized && exp.achievements_optimized ? exp.achievements_optimized : exp.achievements).map((achievement, achIndex) => (
                            <li key={achIndex}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Infrastructure Projects */}
            {resume.projects && resume.projects.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-red-900 mb-4 border-b-2 border-red-200 pb-2">
                  Infrastructure Projects
                </h2>
                <div className="grid gap-6">
                  {resume.projects.map((project, index) => (
                    <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-100">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">{project.name}</h3>
                      <p className="text-slate-700 mb-3">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <Badge key={techIndex} variant="secondary" className="bg-red-100 text-red-800">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {resume.education && resume.education.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-red-900 mb-4 border-b-2 border-red-200 pb-2">
                  Education & Certifications
                </h2>
                <div className="space-y-4">
                  {resume.education.map((edu, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-red-900">
                          {edu.degree} in {edu.field}
                        </h3>
                        <p className="text-red-600">{edu.institution}</p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}