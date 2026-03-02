import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CompanyProject } from "../../../shared/recruiterAuth";

interface ProjectsSectionProps {
  projects: CompanyProject[];
  onUpdate: (projects: CompanyProject[]) => void;
  isEditing?: boolean;
  viewOnly?: boolean;
}

export default function ProjectsSection({ projects, onUpdate, viewOnly = false }: ProjectsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image: '', technologies: '', link: '', date: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingProject, setEditingProject] = useState<CompanyProject | null>(null);

  useEffect(() => {
    if (projects.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % projects.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [projects.length]);

  const handleAdd = () => {
    if (editingProject) {
      const updatedProjects = projects.map(p =>
        p.id === editingProject.id
          ? { ...p, title: form.title, description: form.description, image: form.image, technologies: form.technologies.split(',').map(t => t.trim()).filter(Boolean), link: form.link, date: form.date }
          : p
      );
      onUpdate(updatedProjects);
      setEditingProject(null);
    } else {
      const newProject: CompanyProject = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description,
        image: form.image,
        technologies: form.technologies.split(',').map(t => t.trim()).filter(Boolean),
        link: form.link,
        date: form.date,
      };
      onUpdate([...projects, newProject]);
    }
    setForm({ title: '', description: '', image: '', technologies: '', link: '', date: '' });
    setIsOpen(false);
  };

  const handleEdit = (project: CompanyProject) => {
    setEditingProject(project);
    setForm({ 
      title: project.title, 
      description: project.description, 
      image: project.image || '', 
      technologies: project.technologies?.join(', ') || '', 
      link: project.link || '', 
      date: project.date || '' 
    });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Our Projects</h3>
        {!viewOnly && (
          <Button onClick={() => setIsOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No projects added yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className="group relative flex-shrink-0 w-full h-80 bg-slate-50 rounded-lg border border-slate-200 flex flex-col overflow-hidden"
                    >
                      {project.image && (
                        <div className="flex-shrink-0 h-32 w-full bg-white border-b border-slate-200">
                          <img 
                            src={project.image} 
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        <h4 className="font-bold mb-2 flex-shrink-0">{project.title}</h4>
                        <div className="flex-1 overflow-y-auto mb-2 px-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                          <p className="text-sm text-slate-600">{project.description}</p>
                        </div>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 flex-shrink-0">
                            {project.technologies.map(tech => <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>)}
                          </div>
                        )}
                      </div>
                      {!viewOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-white/80 hover:bg-white"
                            onClick={() => handleEdit(project)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => onUpdate(projects.filter(p => p.id !== project.id))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {projects.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {projects.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-blue-600 w-6' 
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to project ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditingProject(null);
          setForm({ title: '', description: '', image: '', technologies: '', link: '', date: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input 
                value={form.image} 
                onChange={e => setForm({...form, image: e.target.value})} 
                placeholder="https://example.com/project-image.png"
              />
            </div>
            <div>
              <Label>Technologies (comma-separated)</Label>
              <Input value={form.technologies} onChange={e => setForm({...form, technologies: e.target.value})} placeholder="React, Node.js" />
            </div>
            <div>
              <Label>Link</Label>
              <Input value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
            </div>
            <div>
              <Label>Date</Label>
              <Input value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="2024" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.title || !form.description}>
              {editingProject ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
