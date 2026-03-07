import { useState } from "react";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CompanyClient, CompanyProject, CompanyAward, CompanyAchievement } from "../../../shared/recruiterAuth";

interface PortfolioManagerProps {
  clients: CompanyClient[];
  projects: CompanyProject[];
  awards: CompanyAward[];
  achievements: CompanyAchievement[];
  onUpdate: (data: {
    clients?: CompanyClient[];
    projects?: CompanyProject[];
    awards?: CompanyAward[];
    achievements?: CompanyAchievement[];
  }) => void;
}

export function PortfolioManager({ clients, projects, awards, achievements, onUpdate }: PortfolioManagerProps) {
  const [activeModal, setActiveModal] = useState<'client' | 'project' | 'award' | 'achievement' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Client form state
  const [clientForm, setClientForm] = useState({ name: '', logo: '', description: '' });
  
  // Project form state
  const [projectForm, setProjectForm] = useState({ 
    title: '', description: '', image: '', technologies: '', link: '', date: '' 
  });
  
  // Award form state
  const [awardForm, setAwardForm] = useState({ 
    title: '', issuer: '', date: '', description: '', image: '' 
  });
  
  // Achievement form state
  const [achievementForm, setAchievementForm] = useState({ 
    title: '', description: '', metric: '', date: '' 
  });

  const handleAddClient = () => {
    const newClient: CompanyClient = {
      id: Date.now().toString(),
      name: clientForm.name,
      logo: clientForm.logo,
      description: clientForm.description,
    };
    onUpdate({ clients: [...clients, newClient] });
    setClientForm({ name: '', logo: '', description: '' });
    setActiveModal(null);
  };

  const handleDeleteClient = (id: string) => {
    onUpdate({ clients: clients.filter(c => c.id !== id) });
  };

  const handleAddProject = () => {
    const newProject: CompanyProject = {
      id: Date.now().toString(),
      title: projectForm.title,
      description: projectForm.description,
      image: projectForm.image,
      technologies: projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean),
      link: projectForm.link,
      date: projectForm.date,
    };
    onUpdate({ projects: [...projects, newProject] });
    setProjectForm({ title: '', description: '', image: '', technologies: '', link: '', date: '' });
    setActiveModal(null);
  };

  const handleDeleteProject = (id: string) => {
    onUpdate({ projects: projects.filter(p => p.id !== id) });
  };

  const handleAddAward = () => {
    const newAward: CompanyAward = {
      id: Date.now().toString(),
      title: awardForm.title,
      issuer: awardForm.issuer,
      date: awardForm.date,
      description: awardForm.description,
      image: awardForm.image,
    };
    onUpdate({ awards: [...awards, newAward] });
    setAwardForm({ title: '', issuer: '', date: '', description: '', image: '' });
    setActiveModal(null);
  };

  const handleDeleteAward = (id: string) => {
    onUpdate({ awards: awards.filter(a => a.id !== id) });
  };

  const handleAddAchievement = () => {
    const newAchievement: CompanyAchievement = {
      id: Date.now().toString(),
      title: achievementForm.title,
      description: achievementForm.description,
      metric: achievementForm.metric,
      date: achievementForm.date,
    };
    onUpdate({ achievements: [...achievements, newAchievement] });
    setAchievementForm({ title: '', description: '', metric: '', date: '' });
    setActiveModal(null);
  };

  const handleDeleteAchievement = (id: string) => {
    onUpdate({ achievements: achievements.filter(a => a.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Clients Section */}
      <Card className="premium-card border-0 shadow-xl">
        <CardHeader className="premium-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-jakarta font-medium text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              Trusted Clients
            </CardTitle>
            <Button onClick={() => setActiveModal('client')} size="sm" className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="premium-card-content">
          {clients.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="max-w-sm mx-auto">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl mx-auto flex items-center justify-center">
                    <svg className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-100 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-normal text-slate-900 mb-2">Build Trust with Client Showcase</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Display logos of companies you've worked with to build credibility and showcase your experience to potential clients.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Builds instant credibility</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Showcases your expertise</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Attracts similar clients</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clients.map(client => (
                <div key={client.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 hover:-translate-y-1">
                  {/* Client Logo */}
                  {client.logo && (
                    <div className="h-16 flex items-center justify-center mb-4 bg-slate-50 rounded-lg p-2">
                      <img 
                        src={client.logo} 
                        alt={client.name} 
                        className="max-h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300" 
                      />
                    </div>
                  )}
                  
                  {/* Client Name */}
                  <h4 className="font-normal text-slate-900 text-center mb-2 group-hover:text-indigo-600 transition-colors">
                    {client.name}
                  </h4>
                  
                  {/* Client Description */}
                  {client.description && (
                    <p className="text-xs text-slate-500 text-center line-clamp-3 leading-relaxed">
                      {client.description}
                    </p>
                  )}
                  
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  
                  {/* Trusted Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-indigo-100 border-2 border-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card className="premium-card border-0 shadow-xl">
        <CardHeader className="premium-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-jakarta font-medium text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <span className="text-white">Featured Projects</span>
                <p className="text-sm text-white/80 font-normal mt-0.5">Showcase your technical expertise</p>
              </div>
            </CardTitle>
            <Button onClick={() => setActiveModal('project')} size="sm" className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="premium-card-content">
          {projects.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="max-w-sm mx-auto">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl mx-auto flex items-center justify-center">
                    <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-100 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-normal text-slate-900 mb-2">Showcase Your Best Work</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Display your most impressive projects to demonstrate your technical skills and problem-solving abilities.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Demonstrates technical expertise</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Shows problem-solving skills</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Attracts relevant opportunities</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <div key={project.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1">
                  {/* Project Image */}
                  {project.image && (
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  )}
                  
                  {/* Project Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-normal text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {project.title}
                      </h4>
                      {project.date && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                          {project.date}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                    
                    {/* Technologies */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.technologies.slice(0, 3).map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                            +{project.technologies.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Project Link */}
                    {project.link && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="truncate">View Project</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  
                  {/* Featured Badge */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 bg-emerald-100 border-2 border-white rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Awards Section */}
      <Card className="premium-card border-0 shadow-xl">
        <CardHeader className="premium-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-jakarta font-medium text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <span className="text-white">Awards & Recognition</span>
                <p className="text-sm text-white/80 font-normal mt-0.5">Highlight your achievements and accolades</p>
              </div>
            </CardTitle>
            <Button onClick={() => setActiveModal('award')} size="sm" className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
              <Plus className="h-4 w-4 mr-2" />
              Add Award
            </Button>
          </div>
        </CardHeader>
        <CardContent className="premium-card-content">
          {awards.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="max-w-sm mx-auto">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl mx-auto flex items-center justify-center">
                    <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-100 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-normal text-slate-900 mb-2">Showcase Your Recognition</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Display awards, certifications, and recognition to build credibility and demonstrate your expertise.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Builds professional credibility</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Demonstrates industry recognition</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Validates your achievements</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {awards.map(award => (
                <div key={award.id} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-1">
                  {/* Award Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {award.image ? (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border-2 border-amber-100">
                        <img 
                          src={award.image} 
                          alt={award.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                        <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-normal text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-tight">
                        {award.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                        <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{award.issuer}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{award.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Award Description */}
                  {award.description && (
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {award.description}
                    </p>
                  )}
                  
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm"
                    onClick={() => handleDeleteAward(award.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  
                  {/* Excellence Badge */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 bg-amber-100 border-2 border-white rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="premium-card border-0 shadow-xl">
        <CardHeader className="premium-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-jakarta font-medium text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <span className="text-white">Key Achievements</span>
                <p className="text-sm text-white/80 font-normal mt-0.5">Highlight your measurable accomplishments</p>
              </div>
            </CardTitle>
            <Button onClick={() => setActiveModal('achievement')} size="sm" className="bg-white/20 text-white hover:bg-white hover:text-brand-background">
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="premium-card-content">
          {achievements.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="max-w-sm mx-auto">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mx-auto flex items-center justify-center">
                    <svg className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-100 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-normal text-slate-900 mb-2">Showcase Your Impact</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Display your key accomplishments with measurable results to demonstrate your value and impact.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Demonstrates measurable impact</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Shows problem-solving abilities</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Highlights your value proposition</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map(achievement => (
                <div key={achievement.id} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:border-purple-200 transition-all duration-300 hover:-translate-y-1">
                  {/* Achievement Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                      {achievement.metric ? (
                        <div className="text-center">
                          <div className="text-lg font-normal text-purple-600 leading-tight">{achievement.metric}</div>
                        </div>
                      ) : (
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-normal text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                        {achievement.title}
                      </h4>
                      {achievement.date && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                          <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{achievement.date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Achievement Description */}
                  <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                    {achievement.description}
                  </p>
                  
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm"
                    onClick={() => handleDeleteAchievement(achievement.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  
                  {/* Success Badge */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 bg-purple-100 border-2 border-white rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Client Modal */}
      <Dialog open={activeModal === 'client'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-normal text-slate-900">Add Trusted Client</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Showcase companies you've successfully worked with</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {/* Client Name Section */}
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Client Name *
              </Label>
              <Input 
                id="client-name"
                value={clientForm.name} 
                onChange={e => setClientForm({...clientForm, name: e.target.value})} 
                placeholder="e.g., Microsoft, Google, Apple"
                className="h-11 text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500">Enter the official company name</p>
            </div>

            {/* Logo Section with Enhanced Preview */}
            <div className="space-y-3">
              <Label htmlFor="client-logo" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Company Logo
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input 
                    id="client-logo"
                    value={clientForm.logo} 
                    onChange={e => setClientForm({...clientForm, logo: e.target.value})} 
                    placeholder="https://company.com/logo.png"
                    className="h-11 text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <svg className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Paste the URL of the client's logo image. For best results, use a square logo with transparent background.</span>
                  </div>
                </div>
                
                {/* Logo Preview */}
                <div className="flex items-center justify-center">
                  {clientForm.logo ? (
                    <div className="relative group">
                      <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-indigo-300 group-hover:bg-indigo-50">
                        <img 
                          src={clientForm.logo} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-200" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }} 
                        />
                        <div className="hidden items-center justify-center text-slate-400">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-100 border-2 border-white rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="h-8 w-8 text-slate-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-slate-400">Preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <Label htmlFor="client-description" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Project Description
                <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                id="client-description"
                value={clientForm.description} 
                onChange={e => setClientForm({...clientForm, description: e.target.value})} 
                placeholder="Brief description of the work done for this client or the relationship..."
                rows={4}
                className="text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Describe the project scope, duration, or key achievements</span>
                <span className={`${clientForm.description.length > 200 ? 'text-amber-600' : ''}`}>
                  {clientForm.description.length}/300
                </span>
              </div>
            </div>

            {/* Preview Card */}
            {(clientForm.name || clientForm.logo) && (
              <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-normal text-slate-700">Preview</span>
                </div>
                <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                  {clientForm.logo && (
                    <div className="h-12 flex items-center justify-center mb-3">
                      <img src={clientForm.logo} alt={clientForm.name} className="max-h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all" />
                    </div>
                  )}
                  <p className="font-normal text-sm text-center text-slate-900">{clientForm.name || 'Client Name'}</p>
                  {clientForm.description && (
                    <p className="text-xs text-slate-500 text-center mt-2 line-clamp-2">{clientForm.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveModal(null);
                setClientForm({ name: '', logo: '', description: '' });
              }}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddClient} 
              disabled={!clientForm.name.trim()}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Project Modal */}
      <Dialog open={activeModal === 'project'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-normal text-slate-900">Add Project</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Showcase your best work and technical achievements</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Project Details */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Project Information
                  </h3>
                  
                  {/* Project Title */}
                  <div className="space-y-2">
                    <Label htmlFor="project-title" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Project Title *
                    </Label>
                    <Input 
                      id="project-title"
                      value={projectForm.title} 
                      onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                      placeholder="e.g., E-commerce Platform, Mobile App, AI Dashboard"
                      className="h-11 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Project Description */}
                  <div className="space-y-2">
                    <Label htmlFor="project-description" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description *
                    </Label>
                    <Textarea 
                      id="project-description"
                      value={projectForm.description} 
                      onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                      placeholder="Describe the project scope, challenges solved, and key features..."
                      rows={4}
                      className="text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Highlight the problem solved and your role</span>
                      <span className={`${projectForm.description.length > 400 ? 'text-amber-600' : ''}`}>
                        {projectForm.description.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Technologies */}
                  <div className="space-y-2">
                    <Label htmlFor="project-technologies" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Technologies Used
                    </Label>
                    <Input 
                      id="project-technologies"
                      value={projectForm.technologies} 
                      onChange={e => setProjectForm({...projectForm, technologies: e.target.value})}
                      placeholder="React, Node.js, PostgreSQL, AWS, Docker"
                      className="h-11 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-slate-500">Separate technologies with commas</p>
                    {projectForm.technologies && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {projectForm.technologies.split(',').map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tech.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Links & Date */}
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Links & Timeline
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Project Link */}
                    <div className="space-y-2">
                      <Label htmlFor="project-link" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Demo / Repository
                      </Label>
                      <Input 
                        id="project-link"
                        value={projectForm.link} 
                        onChange={e => setProjectForm({...projectForm, link: e.target.value})}
                        placeholder="https://project-demo.com or https://github.com/..."
                        className="h-11 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Project Date */}
                    <div className="space-y-2">
                      <Label htmlFor="project-date" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Completion Date
                      </Label>
                      <Input 
                        id="project-date"
                        value={projectForm.date} 
                        onChange={e => setProjectForm({...projectForm, date: e.target.value})}
                        placeholder="2024 or Q1 2024 or Jan 2024"
                        className="h-11 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Image & Preview */}
              <div className="space-y-6">
                {/* Project Image */}
                <div className="space-y-3">
                  <Label htmlFor="project-image" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Project Screenshot
                  </Label>
                  <Input 
                    id="project-image"
                    value={projectForm.image} 
                    onChange={e => setProjectForm({...projectForm, image: e.target.value})}
                    placeholder="https://example.com/project-screenshot.png"
                    className="h-11 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500">Add a screenshot or mockup of your project</p>
                  
                  {/* Image Preview */}
                  <div className="relative">
                    {projectForm.image ? (
                      <div className="relative group">
                        <div className="aspect-video border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden transition-all duration-200 group-hover:border-emerald-300 group-hover:bg-emerald-50">
                          <img 
                            src={projectForm.image} 
                            alt="Project preview" 
                            className="w-full h-full object-cover transition-all duration-200" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }} 
                          />
                          <div className="hidden w-full h-full items-center justify-center text-slate-400">
                            <div className="text-center">
                              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm">Invalid image URL</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-100 border-2 border-white rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-slate-400">Project Screenshot</p>
                          <p className="text-xs text-slate-300 mt-1">16:9 aspect ratio recommended</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Preview Card */}
                {(projectForm.title || projectForm.description) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm font-normal text-slate-700">Preview</span>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                      {projectForm.image && (
                        <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-slate-100">
                          <img src={projectForm.image} alt={projectForm.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h4 className="font-normal text-slate-900 mb-2">{projectForm.title || 'Project Title'}</h4>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{projectForm.description || 'Project description will appear here...'}</p>
                      {projectForm.technologies && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {projectForm.technologies.split(',').slice(0, 3).map((tech, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tech.trim()}
                            </Badge>
                          ))}
                          {projectForm.technologies.split(',').length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{projectForm.technologies.split(',').length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      {projectForm.date && (
                        <p className="text-xs text-slate-500">{projectForm.date}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveModal(null);
                setProjectForm({ title: '', description: '', image: '', technologies: '', link: '', date: '' });
              }}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProject} 
              disabled={!projectForm.title.trim() || !projectForm.description.trim()}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Award Modal */}
      <Dialog open={activeModal === 'award'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-normal text-slate-900">Add Award</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Highlight your achievements and industry recognition</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Award Details */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Award Information
                  </h3>
                  
                  {/* Award Title */}
                  <div className="space-y-2">
                    <Label htmlFor="award-title" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Award Title *
                    </Label>
                    <Input 
                      id="award-title"
                      value={awardForm.title} 
                      onChange={e => setAwardForm({...awardForm, title: e.target.value})}
                      placeholder="e.g., Best Innovation Award, Employee of the Year, Industry Excellence"
                      className="h-11 text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  {/* Award Issuer */}
                  <div className="space-y-2">
                    <Label htmlFor="award-issuer" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Issuing Organization *
                    </Label>
                    <Input 
                      id="award-issuer"
                      value={awardForm.issuer} 
                      onChange={e => setAwardForm({...awardForm, issuer: e.target.value})}
                      placeholder="e.g., Google, Microsoft, Industry Association, Company Name"
                      className="h-11 text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  {/* Award Date */}
                  <div className="space-y-2">
                    <Label htmlFor="award-date" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date Received *
                    </Label>
                    <Input 
                      id="award-date"
                      value={awardForm.date} 
                      onChange={e => setAwardForm({...awardForm, date: e.target.value})}
                      placeholder="2024 or March 2024 or Q1 2024"
                      className="h-11 text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  {/* Award Description */}
                  <div className="space-y-2">
                    <Label htmlFor="award-description" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description
                      <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Textarea 
                      id="award-description"
                      value={awardForm.description} 
                      onChange={e => setAwardForm({...awardForm, description: e.target.value})}
                      placeholder="Describe what this award recognizes, the criteria, or your achievement..."
                      rows={4}
                      className="text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500 resize-none"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Explain the significance of this recognition</span>
                      <span className={`${awardForm.description.length > 300 ? 'text-amber-600' : ''}`}>
                        {awardForm.description.length}/400
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Image & Preview */}
              <div className="space-y-6">
                {/* Award Image */}
                <div className="space-y-3">
                  <Label htmlFor="award-image" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Award Certificate/Badge
                  </Label>
                  <Input 
                    id="award-image"
                    value={awardForm.image} 
                    onChange={e => setAwardForm({...awardForm, image: e.target.value})}
                    placeholder="https://example.com/certificate.png"
                    className="h-11 text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <p className="text-xs text-slate-500">Add an image of the certificate, badge, or trophy</p>
                  
                  {/* Image Preview */}
                  <div className="relative">
                    {awardForm.image ? (
                      <div className="relative group">
                        <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden transition-all duration-200 group-hover:border-amber-300 group-hover:bg-amber-50 max-w-xs mx-auto">
                          <img 
                            src={awardForm.image} 
                            alt="Award preview" 
                            className="w-full h-full object-cover transition-all duration-200" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }} 
                          />
                          <div className="hidden w-full h-full items-center justify-center text-slate-400">
                            <div className="text-center">
                              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm">Invalid image URL</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-100 border-2 border-white rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center max-w-xs mx-auto">
                        <div className="text-center">
                          <svg className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <p className="text-sm text-slate-400">Award Image</p>
                          <p className="text-xs text-slate-300 mt-1">Square format recommended</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Award Preview Card */}
                {(awardForm.title || awardForm.issuer) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm font-normal text-slate-700">Preview</span>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        {awardForm.image && (
                          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                            <img src={awardForm.image} alt={awardForm.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-normal text-slate-900 mb-1">{awardForm.title || 'Award Title'}</h4>
                          <p className="text-sm text-slate-600 mb-2">
                            {awardForm.issuer || 'Issuing Organization'} • {awardForm.date || 'Date'}
                          </p>
                          {awardForm.description && (
                            <p className="text-sm text-slate-500 line-clamp-2">{awardForm.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveModal(null);
                setAwardForm({ title: '', issuer: '', date: '', description: '', image: '' });
              }}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddAward} 
              disabled={!awardForm.title.trim() || !awardForm.issuer.trim() || !awardForm.date.trim()}
              className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Achievement Modal */}
      <Dialog open={activeModal === 'achievement'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-normal text-slate-900">Add Achievement</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Showcase your key accomplishments and milestones</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Achievement Details */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Achievement Information
                  </h3>
                  
                  {/* Achievement Title */}
                  <div className="space-y-2">
                    <Label htmlFor="achievement-title" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Achievement Title *
                    </Label>
                    <Input 
                      id="achievement-title"
                      value={achievementForm.title} 
                      onChange={e => setAchievementForm({...achievementForm, title: e.target.value})}
                      placeholder="e.g., Revenue Growth, Team Leadership, Process Improvement"
                      className="h-11 text-base border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  {/* Achievement Description */}
                  <div className="space-y-2">
                    <Label htmlFor="achievement-description" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description *
                    </Label>
                    <Textarea 
                      id="achievement-description"
                      value={achievementForm.description} 
                      onChange={e => setAchievementForm({...achievementForm, description: e.target.value})}
                      placeholder="Describe what you accomplished, the impact, and how you achieved it..."
                      rows={4}
                      className="text-base border-slate-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Focus on measurable results and impact</span>
                      <span className={`${achievementForm.description.length > 300 ? 'text-amber-600' : ''}`}>
                        {achievementForm.description.length}/400
                      </span>
                    </div>
                  </div>

                  {/* Achievement Metric */}
                  <div className="space-y-2">
                    <Label htmlFor="achievement-metric" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      Key Metric
                      <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Input 
                      id="achievement-metric"
                      value={achievementForm.metric} 
                      onChange={e => setAchievementForm({...achievementForm, metric: e.target.value})}
                      placeholder="e.g., 150%, $2M+, 500 users, 99.9%"
                      className="h-11 text-base border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-500">Add a standout number that represents your achievement</p>
                  </div>

                  {/* Achievement Date */}
                  <div className="space-y-2">
                    <Label htmlFor="achievement-date" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date Achieved
                      <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Input 
                      id="achievement-date"
                      value={achievementForm.date} 
                      onChange={e => setAchievementForm({...achievementForm, date: e.target.value})}
                      placeholder="2024 or Q1 2024 or March 2024"
                      className="h-11 text-base border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="space-y-6">
                {/* Achievement Preview Card */}
                {(achievementForm.title || achievementForm.description) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm font-normal text-slate-700">Preview</span>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                          {achievementForm.metric ? (
                            <div className="text-center">
                              <div className="text-lg font-normal text-purple-600 leading-tight">{achievementForm.metric}</div>
                            </div>
                          ) : (
                            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-normal text-slate-900 mb-2">{achievementForm.title || 'Achievement Title'}</h4>
                          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                            {achievementForm.description || 'Achievement description will appear here...'}
                          </p>
                          {achievementForm.date && (
                            <p className="text-xs text-slate-500 mt-2">{achievementForm.date}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Achievement Tips */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-normal text-purple-900 mb-2">Tips for Great Achievements</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Use specific numbers and percentages</li>
                        <li>• Focus on business impact and results</li>
                        <li>• Mention the challenge you overcame</li>
                        <li>• Keep it concise but compelling</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Achievement Examples */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-normal text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Examples
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-slate-100">
                      <div className="font-normal text-slate-900">Revenue Growth</div>
                      <div className="text-slate-600 mt-1">Increased quarterly revenue by 45% through strategic partnerships and process optimization</div>
                      <div className="text-purple-600 font-normal mt-1">45%</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100">
                      <div className="font-normal text-slate-900">Team Leadership</div>
                      <div className="text-slate-600 mt-1">Led cross-functional team of 12 to deliver project 2 weeks ahead of schedule</div>
                      <div className="text-purple-600 font-normal mt-1">12 people</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveModal(null);
                setAchievementForm({ title: '', description: '', metric: '', date: '' });
              }}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddAchievement} 
              disabled={!achievementForm.title.trim() || !achievementForm.description.trim()}
              className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
