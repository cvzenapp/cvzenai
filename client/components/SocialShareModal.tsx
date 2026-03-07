import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, X, Mail, Send } from 'lucide-react';
import { Resume } from '@shared/api';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume;
  shareUrl: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  resume,
  shareUrl
}) => {
  const [copied, setCopied] = useState(false);

  const shareTitle = `${resume.personalInfo.name}'s Professional Resume`;
  const jobTitle = resume.personalInfo.title || 'Professional';
  const coreSkills = (() => {
    if (!resume.skills) return [];
    
    // Handle new format: { skills: [...], categories: {...} }
    if (resume.skills && typeof resume.skills === 'object' && 'skills' in resume.skills) {
      const skillsArray = (resume.skills as any).skills || [];
      return Array.isArray(skillsArray) ? skillsArray
        .slice(0, 4)
        .map((skill: any) => typeof skill === 'string' ? skill : skill.name)
        .filter(Boolean) : [];
    }
    
    // Handle old format: just an array
    if (Array.isArray(resume.skills)) {
      return resume.skills
        .slice(0, 4)
        .map((skill: any) => typeof skill === 'string' ? skill : skill.name)
        .filter(Boolean);
    }
    
    return [];
  })();
  
  // Create a more dynamic description based on resume content
  const createShareDescription = () => {
    const parts = [];
    
    // Add job title
    if (jobTitle && jobTitle !== 'Professional') {
      parts.push(`${jobTitle}`);
    }
    
    // Add location if available
    if (resume.personalInfo.location) {
      parts.push(`based in ${resume.personalInfo.location}`);
    }
    
    // Add years of experience if calculable
    const yearsOfExperience = resume.experiences?.length > 0 ? 
      Math.max(...resume.experiences.map(exp => {
        const startYear = new Date(exp.startDate || '2020').getFullYear();
        const endYear = exp.endDate ? 
          new Date(exp.endDate).getFullYear() : 
          new Date().getFullYear();
        return Math.max(0, endYear - startYear);
      })) : 0;
    
    if (yearsOfExperience > 0) {
      parts.push(`${yearsOfExperience}+ years experience`);
    }
    
    // Add core skills
    if (coreSkills.length > 0) {
      parts.push(`Skills: ${coreSkills.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : `Check out ${resume.personalInfo.name}'s professional resume`;
  };
  
  const shareDescription = createShareDescription();
  const shareText = `${resume.personalInfo.name} - ${shareDescription}`;

  // Custom SVG icons for better brand representation
  const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
    </svg>
  );

  const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );

  const FacebookIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const RedditIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareViaLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareDescription)}`;
    window.open(linkedinUrl, '_blank');
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareViaReddit = () => {
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`;
    window.open(redditUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\nView the resume here: ${shareUrl}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl);
  };

  const shareViaTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Share Resume
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share URL Input */}
          <div className="flex items-center space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Share on social platforms:</p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="flex items-center gap-2 justify-start hover:bg-green-50 hover:border-green-500"
              >
                <WhatsAppIcon className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>

              <Button
                onClick={shareViaLinkedIn}
                variant="outline"
                className="flex items-center gap-2 justify-start hover:bg-blue-50 hover:border-blue-600"
              >
                <LinkedInIcon className="h-4 w-4 text-blue-600" />
                LinkedIn
              </Button>

              <Button
                onClick={shareViaFacebook}
                variant="outline"
                className="flex items-center gap-2 justify-start hover:bg-blue-50 hover:border-blue-700"
              >
                <FacebookIcon className="h-4 w-4 text-blue-700" />
                Facebook
              </Button>

              <Button
                onClick={shareViaTwitter}
                variant="outline"
                className="flex items-center gap-2 justify-start hover:bg-gray-50 hover:border-gray-900"
              >
                <TwitterIcon className="h-4 w-4 text-gray-900" />
                Twitter
              </Button>

              <Button
                onClick={shareViaReddit}
                variant="outline"
                className="flex items-center gap-2 justify-start hover:bg-orange-50 hover:border-orange-500"
              >
                <RedditIcon className="h-4 w-4 text-orange-500" />
                Reddit
              </Button>

              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="flex items-center gap-2 justify-start hover:bg-gray-50 hover:border-gray-600"
              >
                <Mail className="h-4 w-4 text-gray-600" />
                Email
              </Button>
            </div>

            <Button
              onClick={shareViaTelegram}
              variant="outline"
              className="w-full flex items-center gap-2 justify-center"
            >
              <Send className="h-4 w-4 text-blue-500" />
              Telegram
            </Button>
          </div>

          {/* Preview Card */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="space-y-1">
              <p className="font-medium text-sm">{shareTitle}</p>
              <p className="text-xs text-gray-600">{shareDescription}</p>
              {coreSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {coreSkills.map((skill, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {resume.personalInfo.location && (
                <p className="text-xs text-gray-500">📍 {resume.personalInfo.location}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};