import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Project {
  name: string;
  title?: string;
  description: string;
  technologies?: string[];
  link?: string;
  github?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  images?: string[];
}

interface ProjectsCarouselProps {
  projects: Project[];
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingWeight?: string;
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

export function ProjectsCarousel({
  projects,
  primaryColor = '#3b82f6',
  accentColor = '#60a5fa',
  fontFamily = 'inherit',
  headingWeight = '700',
  improveSection,
  isImprovingSection,
  showImproveButtons = false
}: ProjectsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No projects to display
      </div>
    );
  }

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  const goToProject = (index: number) => {
    setCurrentIndex(index);
  };

  const openImageModal = () => {
    setModalImageIndex(0);
    setIsModalOpen(true);
  };

  const nextModalImage = () => {
    if (currentProject.images) {
      setModalImageIndex((prev) => (prev + 1) % currentProject.images!.length);
    }
  };

  const prevModalImage = () => {
    if (currentProject.images) {
      setModalImageIndex((prev) => (prev - 1 + currentProject.images!.length) % currentProject.images!.length);
    }
  };

  const currentProject = projects[currentIndex];
  const isImproving = isImprovingSection?.('project', currentIndex);

  return (
    <div className="relative">
      {/* Project Card with Fixed Height and Internal Scroll */}
      <Card 
        className={`group shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative ${isImproving ? 'animate-pulse' : ''}`}
        style={{ 
          backgroundColor: 'var(--template-background-color, #ffffff)',
          border: '1px solid var(--template-border-color, #e5e7eb)',
          height: '320px'
        }}
      >
        {isImproving && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none rounded-xl z-10"></div>
        )}
        
        {/* Navigation Arrows - Only show if multiple projects */}
        {projects.length > 1 && (
          <>
            <button
              onClick={prevProject}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-20 shadow-md border border-slate-200"
              style={{
                color: 'var(--template-primary-color, ' + primaryColor + ')'
              }}
              aria-label="Previous project"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextProject}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-20 shadow-md border border-slate-200"
              style={{
                color: 'var(--template-primary-color, ' + primaryColor + ')'
              }}
              aria-label="Next project"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        <CardContent className="p-6 h-full overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `var(--template-accent-color, ${accentColor}) #f1f5f9`
        }}>
          {/* Full Width Project Details */}
          <div className="flex flex-col h-full">
            {/* Project Title */}
              <div className="mb-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 
                    className="text-lg font-bold flex-1"
                    style={{ 
                      fontFamily: 'var(--template-font-family, ' + fontFamily + ')',
                      fontWeight: 'var(--template-heading-weight, ' + headingWeight + ')',
                      color: 'var(--template-primary-color, ' + primaryColor + ')'
                    }}
                  >
                    {currentProject.title || currentProject.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentProject.status && (
                      <Badge variant="secondary" className="text-xs">
                        {currentProject.status}
                      </Badge>
                    )}
                    {/* Improve Button */}
                    {showImproveButtons && improveSection && (
                      <button
                        onClick={() => improveSection('project', currentProject, currentIndex)}
                        disabled={isImproving}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: `linear-gradient(to right, var(--template-primary-color, ${primaryColor}), var(--template-accent-color, ${accentColor}))`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <svg className={`w-3 h-3 ${isImproving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        {isImproving ? 'Improving...' : 'Improve'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div className="flex-1 mb-3">
                <p className="leading-relaxed text-sm" style={{ color: 'var(--template-text-muted, #6b7280)' }}>
                  {currentProject.description}
                </p>
              </div>

              {/* Bottom Row: Date, Links, Images */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Date Range */}
                  {(currentProject.startDate || currentProject.endDate) && (
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded-md" style={{ color: 'var(--template-text-muted, #6b7280)' }}>
                      {currentProject.startDate} {currentProject.startDate && currentProject.endDate && '→'} {currentProject.endDate || 'Present'}
                    </span>
                  )}
                  
                  {/* Project Links */}
                  {currentProject.link && (
                    <a
                      href={currentProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border transition-colors hover:shadow-sm"
                      style={{ 
                        borderColor: 'var(--template-primary-color, ' + primaryColor + ')',
                        color: 'var(--template-primary-color, ' + primaryColor + ')',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--template-primary-color, ' + primaryColor + ')';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--template-primary-color, ' + primaryColor + ')';
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Demo
                    </a>
                  )}
                  {currentProject.github && (
                    <a
                      href={currentProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border transition-colors hover:shadow-sm"
                      style={{ 
                        borderColor: 'var(--template-primary-color, ' + primaryColor + ')',
                        color: 'var(--template-primary-color, ' + primaryColor + ')',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--template-primary-color, ' + primaryColor + ')';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--template-primary-color, ' + primaryColor + ')';
                      }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                  )}
                  {currentProject.url && !currentProject.link && (
                    <a
                      href={currentProject.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border transition-colors hover:shadow-sm"
                      style={{ 
                        borderColor: 'var(--template-primary-color, ' + primaryColor + ')',
                        color: 'var(--template-primary-color, ' + primaryColor + ')',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--template-primary-color, ' + primaryColor + ')';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--template-primary-color, ' + primaryColor + ')';
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Demo
                    </a>
                  )}
                </div>

                {/* View Images Link */}
                {currentProject.images && currentProject.images.length > 0 && (
                  <button
                    onClick={openImageModal}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all hover:shadow-sm"
                    style={{ 
                      backgroundColor: 'var(--template-primary-color, ' + primaryColor + ')',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <Maximize2 className="w-3 h-3" />
                    View Images ({currentProject.images.length})
                  </button>
                )}
              </div>

              {/* Technologies */}
              {currentProject.technologies && currentProject.technologies.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {currentProject.technologies.slice(0, 4).map((tech, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline"
                        className="text-xs px-2 py-0"
                        style={{ 
                          borderColor: 'var(--template-accent-color, ' + accentColor + ')',
                          color: 'var(--template-primary-color, ' + primaryColor + ')',
                          backgroundColor: 'var(--template-background-color, #ffffff)'
                        }}
                      >
                        {tech}
                      </Badge>
                    ))}
                    {currentProject.technologies.length > 4 && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        +{currentProject.technologies.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Dots Indicator */}
      {projects.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {projects.map((_, index) => (
            <button
              key={index}
              onClick={() => goToProject(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8' 
                  : 'w-2 hover:w-4'
              }`}
              style={{
                backgroundColor: index === currentIndex 
                  ? 'var(--template-primary-color, ' + primaryColor + ')' 
                  : 'var(--template-border-color, #d1d5db)'
              }}
              aria-label={`Go to project ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Keyboard Navigation Hint */}
      {projects.length > 1 && (
        <div className="text-center mt-4 text-xs" style={{ color: 'var(--template-text-muted, #9ca3af)' }}>
          Use arrow buttons or dots to navigate between projects
        </div>
      )}

      {/* Image Modal with Slider */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative bg-black">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image Display */}
            {currentProject.images && currentProject.images.length > 0 && (
              <div className="relative">
                <img
                  src={currentProject.images[modalImageIndex]}
                  alt={`${currentProject.title || currentProject.name} - Image ${modalImageIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />

                {/* Navigation Arrows (only if multiple images) */}
                {currentProject.images.length > 1 && (
                  <>
                    <button
                      onClick={prevModalImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={nextModalImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {currentProject.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {modalImageIndex + 1} / {currentProject.images.length}
                  </div>
                )}

                {/* Dot Indicators */}
                {currentProject.images.length > 1 && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                    {currentProject.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setModalImageIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === modalImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Title in Modal */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg max-w-md">
              <h3 className="font-bold text-lg">{currentProject.title || currentProject.name}</h3>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
