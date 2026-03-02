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
          {/* Project Image Thumbnail (if available) */}
          {currentProject.images && currentProject.images.length > 0 && (
            <div 
              className="mb-4 relative group cursor-pointer rounded-lg overflow-hidden border-2 border-slate-200 hover:border-slate-300 transition-colors"
              onClick={openImageModal}
            >
              <img 
                src={currentProject.images[0]} 
                alt={`${currentProject.title || currentProject.name} preview`}
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                  {currentProject.images.length > 1 && (
                    <span className="text-white text-sm font-medium drop-shadow-lg">
                      {currentProject.images.length} images
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Project Title */}
          <div className="mb-4 sticky top-0 pb-2 z-10" style={{ backgroundColor: 'var(--template-background-color, #ffffff)' }}>
            <div className="flex items-center justify-between gap-3">
              <h3 
                className="text-xl font-bold flex-1"
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
                  <Badge variant="secondary">
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
          <p className="leading-relaxed mb-4" style={{ color: 'var(--template-text-muted, #6b7280)' }}>
            {currentProject.description}
          </p>

          {/* Technologies */}
          {currentProject.technologies && currentProject.technologies.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {currentProject.technologies.map((tech, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline"
                    className="text-xs"
                    style={{ 
                      borderColor: 'var(--template-accent-color, ' + accentColor + ')',
                      color: 'var(--template-primary-color, ' + primaryColor + ')',
                      backgroundColor: 'var(--template-background-color, #ffffff)'
                    }}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {currentProject.link && (
              <a
                href={currentProject.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--template-primary-color, ' + primaryColor + ')' }}
              >
                View Project →
              </a>
            )}
            {currentProject.github && (
              <a
                href={currentProject.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--template-primary-color, ' + primaryColor + ')' }}
              >
                GitHub →
              </a>
            )}
            {currentProject.url && !currentProject.link && (
              <a
                href={currentProject.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--template-primary-color, ' + primaryColor + ')' }}
              >
                Live Demo →
              </a>
            )}
          </div>

          {/* Date Range */}
          {(currentProject.startDate || currentProject.endDate) && (
            <div className="mt-4 text-sm" style={{ color: 'var(--template-text-muted, #9ca3af)' }}>
              {currentProject.startDate} {currentProject.startDate && currentProject.endDate && '→'} {currentProject.endDate || 'Present'}
            </div>
          )}
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
