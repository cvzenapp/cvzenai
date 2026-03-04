import React from 'react';

interface CVZenLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showCaption?: boolean;
}

export const CVZenLogo: React.FC<CVZenLogoProps> = ({ 
  className = "h-8 sm:h-9 md:h-10 w-auto", // Restored to original height
  width,
  height,
  showCaption = true
}) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <img 
        src="/assets/cvzen_cap.svg" 
        alt="CVZen Logo" 
        className={className}
        width={width}
        height={height}
      />
      {showCaption && (
        <span className="text-xs sm:text-sm text-brand-auxiliary-1 font-jakarta font-normal tracking-wide">
          Intelligent Hiring Enzen
        </span>
      )}
    </div>
  );
};

export default CVZenLogo;