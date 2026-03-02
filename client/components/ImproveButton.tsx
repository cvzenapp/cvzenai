import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImproveButtonProps {
  onImprove: () => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function ImproveButton({ 
  onImprove, 
  disabled = false, 
  size = 'sm',
  variant = 'outline',
  className = ''
}: ImproveButtonProps) {
  const [isImproving, setIsImproving] = useState(false);

  const handleImprove = async () => {
    setIsImproving(true);
    try {
      await onImprove();
      toast.success('Content improved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to improve content');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleImprove}
      disabled={disabled || isImproving}
      className={`gap-2 ${className}`}
    >
      {isImproving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Improving...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Improve with AI
        </>
      )}
    </Button>
  );
}
