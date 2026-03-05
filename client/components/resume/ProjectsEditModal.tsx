import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Loader2, Plus, Trash2, Briefcase, Sparkles, Upload, Image as ImageIcon } from "lucide-react";
import { Project } from "@shared/api";

// Helper function to format date for HTML month input (YYYY-MM)
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  
  // If it's already in YYYY-MM format, return as is
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it's in YYYY-MM-DD format, extract YYYY-MM
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString.substring(0, 7);
  }
  
  // Try to parse and format other date formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
  } catch (error) {
    console.warn('Invalid date format:', dateString);
  }
  
  return "";
};

interface ProjectsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjects: Project[];
  onSave: (newProjects: Project[]) => void;
  resumeId?: string | number;
}

export function ProjectsEditModal({
  isOpen,
  onClose,
  currentProjects,
  onSave,
  resumeId
}: ProjectsEditModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state for editing/adding projects
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    technologies: "",
    startDate: "",
    endDate: "",
    github: "",
    url: "",
    images: [] as string[]
  });

  // Debug form data changes
  useEffect(() => {
    console.log('🔍 Form data updated:', formData);
  }, [formData]);

  // Initialize form data with first project if available
  useEffect(() => {
    if (isOpen && currentProjects && currentProjects.length > 0) {
      const firstProject = currentProjects[0];
      console.log('🔍 Loading first project:', firstProject);
      console.log('🔍 Project dates:', { startDate: firstProject.startDate, endDate: firstProject.endDate });
      
      setProjects(currentProjects);
      setSelectedProjectIndex(0);
      setFormData({
        name: firstProject.name || "",
        description: firstProject.description || "",
        technologies: Array.isArray(firstProject.technologies) ? firstProject.technologies.join(', ') : "",
        startDate: formatDateForInput(firstProject.startDate),
        endDate: formatDateForInput(firstProject.endDate),
        github: firstProject.github || "",
        url: firstProject.url || firstProject.link || "",
        images: firstProject.images || []
      });
    } else if (isOpen) {
      setProjects(currentProjects || []);
      setSelectedProjectIndex(null);
    }
  }, [isOpen, currentProjects]);

  const handleProjectSelect = (index: number) => {
    const project = projects[index];
    console.log('🔍 Selecting project:', project);
    console.log('🔍 Project dates:', { startDate: project.startDate, endDate: project.endDate });
    
    setSelectedProjectIndex(index);
    setFormData({
      name: project.name || "",
      description: project.description || "",
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : "",
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate),
      github: project.github || "",
      url: project.url || project.link || "",
      images: project.images || []
    });
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedProjectIndex(null);
    setFormData({
      name: "",
      description: "",
      technologies: "",
      startDate: "",
      endDate: "",
      github: "",
      url: "",
      images: []
    });
  };

  const handleSaveProject = () => {
    console.log('🔍 Saving project with form data:', formData);
    
    const projectData: Project = {
      id: isAddingNew ? `project-${Date.now()}` : projects[selectedProjectIndex!].id,
      name: formData.name,
      title: formData.name,
      description: formData.description,
      technologies: formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      github: formData.github || "",
      url: formData.url || "",
      link: formData.url || "",
      images: formData.images || []
    };

    console.log('🔍 Created project data:', projectData);
    console.log('🔍 Project dates:', { startDate: projectData.startDate, endDate: projectData.endDate });

    if (isAddingNew) {
      const newProjects = [...projects, projectData];
      setProjects(newProjects);
      // Select the newly added project
      setSelectedProjectIndex(newProjects.length - 1);
    } else if (selectedProjectIndex !== null) {
      const updatedProjects = [...projects];
      updatedProjects[selectedProjectIndex] = projectData;
      setProjects(updatedProjects);
    }

    setIsAddingNew(false);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
    if (selectedProjectIndex === index) {
      setSelectedProjectIndex(null);
      setIsAddingNew(false);
    }
  };

  const generateProjectDescription = async () => {
    if (!formData.name.trim()) return;
    
    setIsGenerating(true);
    try {
      // Get resume ID from props or context
      const currentResumeId = resumeId || 45; // Fallback to 45 if not provided
      
      // Get auth headers
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/ats/improve-section/${currentResumeId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sectionType: 'project',
          sectionData: {
            name: formData.name,
            title: formData.name,
            description: formData.description,
            technologies: formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
            startDate: formData.startDate,
            endDate: formData.endDate,
            github: formData.github,
            url: formData.url
          },
          sectionIndex: selectedProjectIndex
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('AI improvement result:', result);
        if (result.success && result.data?.improved) {
          // The improved data contains the entire improved project object
          const improvedProject = result.data.improved;
          setFormData(prev => ({ 
            ...prev, 
            description: improvedProject.description || prev.description,
            name: improvedProject.name || prev.name,
            technologies: Array.isArray(improvedProject.technologies) 
              ? improvedProject.technologies.join(', ') 
              : prev.technologies
          }));
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error generating project description:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      // Get auth headers
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      // Note: Don't set Content-Type for FormData, let browser set it with boundary

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers,
          body: formData,
        });

        console.log('Upload response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Upload result:', result);
          return result.url || result.data?.url;
        } else {
          const errorText = await response.text();
          console.error('Upload error:', response.status, errorText);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);
      
      console.log('Valid uploaded URLs:', validUrls);
      
      if (validUrls.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, ...validUrls] 
        }));
      } else {
        console.error('No valid URLs returned from upload');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be uploaded again
      event.target.value = '';
    }
  };

  const removeImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const handleSave = async () => {
    console.log('🔍 Saving projects:', projects);
    console.log('🔍 Projects with dates:', projects.map(p => ({ 
      name: p.name, 
      startDate: p.startDate, 
      endDate: p.endDate 
    })));
    
    setIsSaving(true);
    try {
      await onSave(projects);
      onClose();
    } catch (error) {
      console.error('Error saving projects:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSaveProject = formData.name.trim() && (isAddingNew || selectedProjectIndex !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Edit Projects
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[70vh] gap-6">
          {/* Left Panel - Project List */}
          <div className="w-1/3 border-r pr-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-gray-600">Projects ({projects.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNew}
                className="h-8 px-3 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div key={1} className="space-y-2 max-h-[calc(70vh-8rem)] overflow-y-auto">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProjectIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleProjectSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {project.name || 'Untitled Project'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.technologies.slice(0, 2).join(', ')}
                        {project.technologies.length > 2 && ` +${project.technologies.length - 2}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProject(index);
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <p className="text-xs">Click "Add" to create your first project</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Project Details */}
          <div className="flex-1 overflow-y-auto">
            {(selectedProjectIndex !== null || isAddingNew) ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., E-commerce Platform"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologies">Technologies</Label>
                  <Input
                    id="technologies"
                    value={formData.technologies}
                    onChange={(e) => setFormData(prev => ({ ...prev, technologies: e.target.value }))}
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateProjectDescription}
                      disabled={isGenerating || !formData.name.trim()}
                      className="h-6 px-2 text-xs"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      AI Generate
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project, its features, and your role..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="month"
                      value={formData.startDate}
                      onChange={(e) => {
                        const newFormData = { ...formData, startDate: e.target.value };
                        setFormData(newFormData);
                        
                        // Auto-save the project when date changes
                        if (selectedProjectIndex !== null) {
                          const projectData: Project = {
                            id: projects[selectedProjectIndex].id,
                            name: newFormData.name,
                            title: newFormData.name,
                            description: newFormData.description,
                            technologies: newFormData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
                            startDate: newFormData.startDate || "",
                            endDate: newFormData.endDate || "",
                            github: newFormData.github || "",
                            url: newFormData.url || "",
                            images: newFormData.images || []
                          };
                          
                          const updatedProjects = [...projects];
                          updatedProjects[selectedProjectIndex] = projectData;
                          setProjects(updatedProjects);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="month"
                      value={formData.endDate}
                      onChange={(e) => {
                        const newFormData = { ...formData, endDate: e.target.value };
                        setFormData(newFormData);
                        
                        // Auto-save the project when date changes
                        if (selectedProjectIndex !== null) {
                          const projectData: Project = {
                            id: projects[selectedProjectIndex].id,
                            name: newFormData.name,
                            title: newFormData.name,
                            description: newFormData.description,
                            technologies: newFormData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
                            startDate: newFormData.startDate || "",
                            endDate: newFormData.endDate || "",
                            github: newFormData.github || "",
                            url: newFormData.url || "",
                            images: newFormData.images || []
                          };
                          
                          const updatedProjects = [...projects];
                          updatedProjects[selectedProjectIndex] = projectData;
                          setProjects(updatedProjects);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub URL</Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/username/project"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">Demo URL</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://project-demo.com"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Project Images</Label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        className="h-8 px-3 text-xs"
                      >
                        {isUploading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Upload className="h-3 w-3 mr-1" />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload Images'}
                      </Button>
                    </div>
                  </div>

                  {/* Image Preview Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((imageUrl, index) => (
                      <div key={`image-${index}-${imageUrl}`} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Project ${formData.name} - Image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(imageUrl)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Empty state for images */}
                    {formData.images.length === 0 && (
                      <div className="col-span-3 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">No images uploaded</p>
                        <p className="text-xs text-gray-400">Upload images to showcase your project</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Project Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveProject}
                    disabled={!canSaveProject}
                    className="w-full brand-button"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isAddingNew ? 'Add Project' : 'Update Project'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a project to edit</p>
                  <p className="text-sm">or add a new project to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
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
            disabled={isSaving}
            className="brand-button"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}