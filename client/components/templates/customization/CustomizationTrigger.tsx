import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Palette, 
  Type, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface CustomizationTriggerProps {
  onOpenCustomization: () => void;
  hasCustomizations?: boolean;
  isCustomizationOpen?: boolean;
  variant?: 'floating' | 'inline' | 'minimal';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

/**
 * Customization trigger button that can be positioned anywhere in the template
 * Provides visual feedback about customization status and easy access to the panel
 */
export const CustomizationTrigger: React.FC<CustomizationTriggerProps> = ({
  onOpenCustomization,
  hasCustomizations = false,
  isCustomizationOpen = false,
  variant = 'floating',
  position = 'top-right',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPositionClasses = () => {
    if (variant !== 'floating') return '';
    
    switch (position) {
      case 'top-right':
        return 'fixed top-20 right-4 z-50';
      case 'top-left':
        return 'fixed top-20 left-4 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50';
      default:
        return 'fixed top-20 right-4 z-50';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return 'shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0';
      case 'inline':
        return 'shadow-sm hover:shadow-md transition-all duration-200';
      case 'minimal':
        return 'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200';
      default:
        return '';
    }
  };

  if (variant === 'floating') {
    return (
      <TooltipProvider>
        <div className={`${getPositionClasses()} ${className}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOpenCustomization}
                size={variant === 'minimal' ? 'sm' : 'default'}
                className={`
                  relative group
                  ${getVariantClasses()}
                  ${isCustomizationOpen ? 'ring-2 ring-primary' : ''}
                `}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="flex items-center gap-2">
                  {isCustomizationOpen ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  
                  <span className="hidden sm:inline">
                    {isCustomizationOpen ? 'Close' : 'Customize'}
                  </span>
                </div>

                {/* Customization indicator */}
                {hasCustomizations && !isCustomizationOpen && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 w-3 h-3 p-0 rounded-full bg-primary text-white flex items-center justify-center"
                  >
                    <Sparkles className="w-2 h-2" />
                  </Badge>
                )}

                {/* Hover effect */}
                {isHovered && (
                  <div className="absolute inset-0 bg-white/10 rounded-md -z-10" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="text-sm">
                <div className="font-medium">
                  {isCustomizationOpen ? 'Close Customization Panel' : 'Customize Template'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Change colors, fonts, and layout
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  if (variant === 'inline') {
    return (
      <Button
        onClick={onOpenCustomization}
        variant="outline"
        size="sm"
        className={`
          relative group
          ${getVariantClasses()}
          ${isCustomizationOpen ? 'ring-2 ring-primary' : ''}
          ${className}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span>Customize</span>
          
          {/* Quick indicators */}
          <div className="flex items-center gap-1 ml-2">
            <Palette className="w-3 h-3 text-muted-foreground" />
            <Type className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Customization indicator */}
        {hasCustomizations && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 w-3 h-3 p-0 rounded-full bg-primary text-white flex items-center justify-center"
          >
            <Sparkles className="w-2 h-2" />
          </Badge>
        )}
      </Button>
    );
  }

  // Minimal variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onOpenCustomization}
            variant="ghost"
            size="sm"
            className={`
              relative group h-8 w-8 p-0
              ${getVariantClasses()}
              ${isCustomizationOpen ? 'bg-primary/10 text-primary' : ''}
              ${className}
            `}
          >
            <Settings className="w-4 h-4" />
            
            {/* Customization indicator */}
            {hasCustomizations && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">Customize Template</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CustomizationTrigger;