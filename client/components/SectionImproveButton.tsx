import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface SectionImproveButtonProps {
  onClick: () => void;
  isImproving: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function SectionImproveButton({
  onClick,
  isImproving,
  disabled = false,
  size = 'sm',
  variant = 'ghost',
  className = ''
}: SectionImproveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isImproving}
      size={size}
      variant={variant}
      className={`gap-1 ${isImproving ? 'animate-pulse' : ''} ${className}`}
      title="Improve this section with AI"
    >
      <Sparkles className={`w-4 h-4 ${isImproving ? 'animate-spin' : ''}`} />
      {isImproving ? 'Improving...' : 'Improve'}
    </Button>
  );
}
