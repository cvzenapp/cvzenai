import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { SocialShareModal } from './SocialShareModal';
import { Resume } from '@shared/api';
import { unifiedAuthService } from '@/services/unifiedAuthService';

interface EnhancedShareButtonProps {
  resume: Resume;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const EnhancedShareButton: React.FC<EnhancedShareButtonProps> = ({
  resume,
  className = '',
  variant = 'default',
  size = 'default'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateAndShowModal = async () => {
    if (!resume?.id) {
      console.error('❌ No resume data available for sharing');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log('🔗 Generating share link for resume:', resume.id);
      
      // Get auth headers
      const headers = unifiedAuthService.getAuthHeaders();
      
      const response = await fetch(`/api/resume-sharing/generate/${resume.id}`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success === true && result.data && result.data.shareUrl) {
        setShareUrl(result.data.shareUrl);
        setIsModalOpen(true);
      } else {
        throw new Error('Invalid response format from server');
      }
      
    } catch (error) {
      console.error('❌ Error generating share link:', error);
      alert('Failed to generate share link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!shareUrl) {
      await generateAndShowModal();
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback to showing modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          onClick={generateAndShowModal}
          variant={variant}
          size={size}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Share'}
        </Button>
        
        {shareUrl && (
          <Button
            onClick={quickCopy}
            variant="ghost"
            size="sm"
            className="p-2"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      <SocialShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resume={resume}
        shareUrl={shareUrl}
      />
    </>
  );
};