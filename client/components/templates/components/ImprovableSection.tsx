import { ReactNode } from 'react';
import { ShimmerWrapper } from '@/components/ui/shimmer';
import { SectionImproveButton } from '@/components/SectionImproveButton';

interface ImprovableSectionProps {
  children: ReactNode;
  sectionType: 'summary' | 'objective' | 'experience' | 'education' | 'project' | 'skills';
  sectionIndex?: number;
  onImprove?: () => void;
  isImproving?: boolean;
  showImproveButton?: boolean;
  className?: string;
}

/**
 * Wrapper component for resume sections that can be improved with AI
 * Adds shimmer effect during improvement and optional improve button
 */
export function ImprovableSection({
  children,
  sectionType,
  sectionIndex,
  onImprove,
  isImproving = false,
  showImproveButton = false,
  className = ''
}: ImprovableSectionProps) {
  return (
    <div className={`relative group ${className}`}>
      {/* Improve Button - Shows on hover */}
      {showImproveButton && onImprove && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <SectionImproveButton
            onClick={onImprove}
            isImproving={isImproving}
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
          />
        </div>
      )}

      {/* Section Content with Shimmer Effect */}
      <ShimmerWrapper isLoading={isImproving} className="w-full">
        {children}
      </ShimmerWrapper>
    </div>
  );
}
